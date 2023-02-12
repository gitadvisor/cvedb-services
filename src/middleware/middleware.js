const getConstants = require('../constants').getConstants
const fs = require('fs')
const cveSchemaV5 = JSON.parse(fs.readFileSync('src/middleware/5.0_bundled_schema.json'))
const argon2 = require('argon2')
const logger = require('./logger')
const Ajv = require('ajv')
const addFormats = require('ajv-formats')
const ajv = new Ajv({ allErrors: true })
addFormats(ajv)
const validate = ajv.compile(cveSchemaV5)
const uuid = require('uuid')
const errors = require('./error')
const error = new errors.MiddlewareError()
const RepositoryFactory = require('../repositories/repositoryFactory')
const rateLimit = require('express-rate-limit')

function setCacheControl (req, res, next) {
  res.set('Cache-Control', 'no-store')
  next()
}

function createCtxAndReqUUID (req, res, next) {
  const CONSTANTS = getConstants()

  try {
    req.ctx = {
      authenticated: false,
      uuid: uuid.v4(),
      org: req.header(CONSTANTS.AUTH_HEADERS.ORG),
      user: req.header(CONSTANTS.AUTH_HEADERS.USER),
      key: req.header(CONSTANTS.AUTH_HEADERS.KEY),
      repositories: new RepositoryFactory()
    }

    logger.info(JSON.stringify({ uuid: req.ctx.uuid, path: req.path }))
    next()
  } catch (err) {
    next(err)
  }
}

// Sets parameter indicating whether user is authenticated
async function optionallyValidateUser (req, res, next) {
  const org = req.ctx.org
  const user = req.ctx.user
  const key = req.ctx.key
  const userRepo = req.ctx.repositories.getUserRepository()
  const orgRepo = req.ctx.repositories.getOrgRepository()
  let authenticated = true

  try {
    if (!org || !user || !key) {
      authenticated = false
    } else {
      let orgUUID = null
      let result = null

      logger.info({ uuid: req.ctx.uuid, message: 'Authenticating user: ' + user }) // userUUID may be null if user does not exist
      orgUUID = await orgRepo.getOrgUUID(org)
      if (!orgUUID) {
        authenticated = false
      } else {
        result = await userRepo.findOneByUserNameAndOrgUUID(user, orgUUID)
        if (!result || !result.active) {
          authenticated = false
        } else {
          const isPwd = await argon2.verify(result.secret, key)
          if (!isPwd) {
            authenticated = false
          }
        }
      }
    }

    req.ctx.authenticated = authenticated
    if (authenticated) {
      logger.info({ uuid: req.ctx.uuid, message: 'SUCCESSFUL user authentication for ' + user })
    }

    next()
  } catch (err) {
    next(err)
  }
}

async function validateUser (req, res, next) {
  const org = req.ctx.org
  const user = req.ctx.user
  const key = req.ctx.key
  const userRepo = req.ctx.repositories.getUserRepository()
  const orgRepo = req.ctx.repositories.getOrgRepository()
  const CONSTANTS = getConstants()

  try {
    if (!org) {
      return res.status(400).json(error.badRequest(CONSTANTS.AUTH_HEADERS.ORG))
    }

    if (!user) {
      return res.status(400).json(error.badRequest(CONSTANTS.AUTH_HEADERS.USER))
    }

    if (!key) {
      return res.status(400).json(error.badRequest(CONSTANTS.AUTH_HEADERS.KEY))
    }

    logger.info({ uuid: req.ctx.uuid, message: 'Authenticating user: ' + user }) // userUUID may be null if user does not exist
    const orgUUID = await orgRepo.getOrgUUID(org)
    if (!orgUUID) {
      logger.info({ uuid: req.ctx.uuid, message: org + ' organization does not exist. User authentication FAILED for ' + user })
      return res.status(401).json(error.unauthorized())
    }

    const result = await userRepo.findOneByUserNameAndOrgUUID(user, orgUUID)
    if (!result) {
      logger.warn(JSON.stringify({ uuid: req.ctx.uuid, message: 'User not found. User authentication FAILED for ' + user }))
      return res.status(401).json(error.unauthorized())
    }

    if (!result.active) {
      logger.warn(JSON.stringify({ uuid: req.ctx.uuid, message: 'User deactivated. Authentication failed for ' + user }))
      return res.status(401).json(error.unauthorized())
    }

    const isPwd = await argon2.verify(result.secret, key)
    if (!isPwd) {
      logger.warn(JSON.stringify({ uuid: req.ctx.uuid, message: 'Incorrect apikey. User authentication FAILED for ' + user }))
      return res.status(401).json(error.unauthorized())
    }

    logger.info({ uuid: req.ctx.uuid, message: 'SUCCESSFUL user authentication for ' + user })
    next()
  } catch (err) {
    next(err)
  }
}

// Checks that the requester belongs to an org that has the 'BULK_DOWNLOAD' role
async function onlySecretariatOrBulkDownload (req, res, next) {
  const org = req.ctx.org
  const orgRepo = req.ctx.repositories.getOrgRepository()
  const CONSTANTS = getConstants()

  try {
    const isSec = await orgRepo.isSecretariat(org)
    const isBulkDownload = await orgRepo.isBulkDownload(org)
    if (!(isSec || isBulkDownload)) { // error message should only mention Secretariat
      logger.info({ uuid: req.ctx.uuid, message: org + ' is NOT a ' + CONSTANTS.AUTH_ROLE_ENUM.SECRETARIAT })
      return res.status(403).json(error.secretariatOnly())
    }

    logger.info({
      uuid: req.ctx.uuid,
      message: 'Confirmed ' + org + ' as a ' + CONSTANTS.AUTH_ROLE_ENUM.SECRETARIAT +
                ' or as a ' + CONSTANTS.AUTH_ROLE_ENUM.BULK_DOWNLOAD
    })
    next()
  } catch (err) {
    next(err)
  }
}

// Checks that the requester belongs to an org that has the 'SECREATARIAT' role
async function onlySecretariat (req, res, next) {
  const org = req.ctx.org
  const orgRepo = req.ctx.repositories.getOrgRepository()
  const CONSTANTS = getConstants()

  try {
    const isSec = await orgRepo.isSecretariat(org)
    if (!isSec) {
      logger.info({ uuid: req.ctx.uuid, message: org + ' is NOT a ' + CONSTANTS.AUTH_ROLE_ENUM.SECRETARIAT })
      return res.status(403).json(error.secretariatOnly())
    }

    logger.info({ uuid: req.ctx.uuid, message: 'Confirmed ' + org + ' as a ' + CONSTANTS.AUTH_ROLE_ENUM.SECRETARIAT })
    next()
  } catch (err) {
    next(err)
  }
}

// Checks that the requester belongs to an org that has the 'SECRETARIAT' role or is a user with the 'ADMIN' role
async function onlySecretariatOrAdmin (req, res, next) {
  const org = req.ctx.org
  const username = req.ctx.user
  const orgRepo = req.ctx.repositories.getOrgRepository()
  const userRepo = req.ctx.repositories.getUserRepository()
  const CONSTANTS = getConstants()

  try {
    const isSec = await orgRepo.isSecretariat(org)
    const isAdmin = await userRepo.isAdmin(username, org)
    if (!isSec && !isAdmin) {
      logger.info({ uuid: req.ctx.uuid, message: 'Request denied because \'' + org + '\' is NOT a ' + CONSTANTS.AUTH_ROLE_ENUM.SECRETARIAT + ' and \'' + username + '\' is not an ' + CONSTANTS.USER_ROLE_ENUM.ADMIN + ' user.' })
      return res.status(403).json(error.notOrgAdminOrSecretariat())
    }

    logger.info({ uuid: req.ctx.uuid, message: 'Confirmed ' + org + ' as a ' + CONSTANTS.AUTH_ROLE_ENUM.SECRETARIAT + ' or an ' + CONSTANTS.USER_ROLE_ENUM.ADMIN + ' user.' })
    next()
  } catch (err) {
    next(err)
  }
}

// Checks that the requester belongs to an org that has the 'CNA' role
async function onlyCnas (req, res, next) {
  const shortName = req.ctx.org
  const orgRepo = req.ctx.repositories.getOrgRepository()
  const CONSTANTS = getConstants()

  try {
    const org = await orgRepo.findOneByShortName(shortName) // org exists
    if (org === null) {
      logger.info({ uuid: req.ctx.uuid, message: shortName + ' is NOT a ' + CONSTANTS.AUTH_ROLE_ENUM.CNA })
      return res.status(404).json(error.cnaDoesNotExist(shortName))
    } else if (org.authority.active_roles.includes(CONSTANTS.AUTH_ROLE_ENUM.SECRETARIAT)) {
      logger.info({ uuid: req.ctx.uuid, message: org.short_name + ' is a ' + CONSTANTS.AUTH_ROLE_ENUM.SECRETARIAT + ' so until Root organizations are implemented this role is allowed.' })
      next()
    } else if (org.authority.active_roles.includes(CONSTANTS.AUTH_ROLE_ENUM.CNA)) { // the org is a CNA
      logger.info({ uuid: req.ctx.uuid, message: 'Confirmed ' + org.short_name + ' as a ' + CONSTANTS.AUTH_ROLE_ENUM.CNA })
      next()
    } else {
      logger.info({ uuid: req.ctx.uuid, message: org.short_name + ' is NOT a ' + CONSTANTS.AUTH_ROLE_ENUM.CNA })
      return res.status(403).json(error.cnaOnly())
    }
  } catch (err) {
    next(err)
  }
}

// Checks that an org has a role or any sort
async function onlyOrgWithRole (req, res, next) {
  const shortName = req.ctx.org
  const orgRepo = req.ctx.repositories.getOrgRepository()

  try {
    const org = await orgRepo.findOneByShortName(shortName)
    if (org === null) {
      logger.info({ uuid: req.ctx.uuid, message: shortName + ' does NOT exist ' })
      return res.status(404).json(error.orgDoesNotExist(shortName))
    } else if (org.authority.active_roles.length > 0) {
      logger.info({ uuid: req.ctx.uuid, message: org.short_name + ' has a role ' })
      next()
    } else {
      logger.info({ uuid: req.ctx.uuid, message: org.short_name + ' does NOT have a role ' })
      return res.status(403).json(error.orgHasNoRole(shortName))
    }
  } catch (err) {
    next(err)
  }
}

function validateQueryParameterNames (queryParamNames, validNames) {
  Object.keys(queryParamNames).forEach(k => {
    if (!validNames.includes(k)) {
      const filteredMessage = k.replace(/[^A-Z0-9_ -]+/gi, ' ')
      throw new Error("'" + filteredMessage.trim() + "'" + ' is not a valid parameter name.')
    }
  })
  return true
}

async function cnaMustOwnID (req, res, next) {
  try {
    const requestingOrg = req.ctx.org
    const orgRepo = req.ctx.repositories.getOrgRepository()
    const isSecretariat = await orgRepo.isSecretariat(requestingOrg)
    const requestingOrgInfo = await orgRepo.findOneByShortName(requestingOrg)
    const id = req.ctx.params.id
    const cveIdRepo = req.ctx.repositories.getCveIdRepository()

    const cveId = await cveIdRepo.findOneByCveId(id)
    if (!cveId || ((cveId.owning_cna !== requestingOrgInfo.UUID) && !isSecretariat)) {
      return res.status(403).json(error.orgDoesNotOwnId(requestingOrg, id))
    }
    next()
  } catch (err) {
    next(err)
  }
}

function validateCveJsonSchema (req, res, next) {
  const cve = req.body
  const cveVersion = cve.dataVersion
  let cveState = cve.cveMetadata
  if (cveState === undefined) {
    logger.error(JSON.stringify({ uuid: req.ctx.uuid, message: 'CVE JSON schema validation FAILED.' }))
    return res.status(400).json(error.invalidJsonSchema(['instance.cveMetadata is not defined']))
  }
  cveState = cveState.state

  logger.info({ uuid: req.ctx.uuid, message: 'Validating CVE JSON schema.' })
  let result

  if (cveVersion === '5.0') {
    if (['PUBLISHED', 'RESERVED', 'REJECTED'].includes(cveState)) {
      result = validate(cve)
    } else {
      logger.error(JSON.stringify({ uuid: req.ctx.uuid, message: 'CVE JSON schema validation FAILED.' }))
      return res.status(400).json(error.invalidJsonSchema(['instance.cveMetadata.state is not one of enum values']))
    }
  } else {
    logger.error(JSON.stringify({ uuid: req.ctx.uuid, message: 'CVE JSON schema validation FAILED.' }))
    return res.status(400).json(error.invalidJsonSchema(['instance.dataVersion is not one of enum values']))
  }

  if (result) {
    logger.info(JSON.stringify({ uuid: req.ctx.uuid, message: 'SUCCESSFUL CVE JSON schema validation.' }))
    next()
  } else {
    logger.error(JSON.stringify({ uuid: req.ctx.uuid, message: 'CVE JSON schema validation FAILED.' }))
    const temp = validate.errors
    const errors = []
    temp.forEach((error) => {
      if (error !== '') {
        errors.push(error)
      }
    })

    return res.status(400).json(error.invalidJsonSchema(errors))
  }
}

function validateJsonSyntax (err, req, res, next) {
  if (err.status && err.message) {
    if (err.message.includes('request entity too large')) {
      console.warn('Request failed validation because entity too large')
      console.info((JSON.stringify(err)))
      return res.status(413).json(error.recordTooLarge(errors))
    } else if (err.status === 400) {
      console.warn('Request failed validation because JSON syntax is incorrect')
      console.info((JSON.stringify(err)))
      let filteredMessage = err.message
      if (filteredMessage.includes('Failed to decode param')) {
        filteredMessage = filteredMessage.replace(/[^A-Z0-9_ -]+/gi, '')
      }
      return res.status(400).json(error.invalidJsonSyntax(filteredMessage))
    } else {
      console.warn('Request failed')
      console.info((JSON.stringify(err)))
      return res.status(400).json(error.genericBadRequest(err.message))
    }
  } else {
    next(err)
  }
}

function errorHandler (err, req, res, next) {
  logger.error(JSON.stringify({ error: err.stack }))
  return res.status(500).json(error.serviceNotAvailable())
}

const limiter = rateLimit({
  // over 1 second, allow a max of 1000 requests
  // can configure by setting env vars
  windowMs: 1000 * parseInt((process.env.RATE_LIMIT_WINDOW_SECONDS || 1)),
  max: parseInt(process.env.RATE_LIMIT_MAX_CONNECTIONS || 1000),
  // apply to all requests this middleware is used, so always return the same key
  keyGenerator: (req, res) => '*',
  standardHeaders: true,
  legacyHeaders: false,
  message: error.tooManyRequests()
})

module.exports = {
  setCacheControl,
  optionallyValidateUser,
  validateUser,
  onlySecretariat,
  onlySecretariatOrBulkDownload,
  onlySecretariatOrAdmin,
  onlyCnas,
  onlyOrgWithRole,
  validateQueryParameterNames,
  cnaMustOwnID,
  createCtxAndReqUUID,
  validateCveJsonSchema,
  errorHandler,
  validateJsonSyntax,
  rateLimiter: limiter
}
