const { body, validationResult } = require('express-validator')
const errors = require('./error')
const error = new errors.CveControllerError()
const utils = require('../../utils/utils')
const fs = require('fs')
const RejectedSchema = JSON.parse(fs.readFileSync('src/middleware/Reject_5.0_Schema.json'))
const cnaContainerSchema = JSON.parse(fs.readFileSync('src/controller/cve.controller/cna_container_schema.json'))
const logger = require('../../middleware/logger')
const Ajv = require('ajv')
const addFormats = require('ajv-formats')
const ajv = new Ajv({ allErrors: true })
addFormats(ajv)
const validateRejected = ajv.compile(RejectedSchema)
const validateCnaContainer = ajv.compile(cnaContainerSchema)

function parsePostParams (req, res, next) {
  utils.reqCtxMapping(req, 'body', [])
  utils.reqCtxMapping(req, 'params', ['id'])
  next()
}

function parseGetParams (req, res, next) {
  utils.reqCtxMapping(req, 'query', ['page', 'time_modified.lt', 'time_modified.gt', 'state', 'count_only', 'assigner_short_name', 'assigner'])
  utils.reqCtxMapping(req, 'params', ['id'])
  next()
}

function parseError (req, res, next) {
  const err = validationResult(req).formatWith(({ location, msg, param, value, nestedErrors }) => {
    return { msg: msg, param: param, location: location }
  })
  if (!err.isEmpty()) {
    return res.status(400).json(error.badInput(err.array()))
  }
  next()
}

/**
 * Custom body validation for unique English entries in the value of the array index passed.
 * (Schema validation checks a unique combination of lang + text value, so we don't here.)
 *
 * @param {String} langsIndex
 * @returns Result
 */
function validateUniqueEnglishEntry (langsIndex) {
  // The JSON format itself is enforced in the schema validation, so we only need
  // to check the fields if they were passed, so can use optional()
  return body(langsIndex).optional({ nullable: true }).isArray().custom((langsArr, { req, path }) => {
    // the passed in keys are ORs, not ANDs
    if (langsArr === undefined) {
      return true
    }

    if (hasSingleEnglishEntry(langsArr)) {
      return true
    } else {
      // duplicate found so send error
      throw new Error(`Cannot have more than one English language entry in '${path}'`)
    }
  })
}

/**
 * Check that the array passed contains only 1 unique English language code entry
 *
 *  - Pass: Duplicate non-English codes (fr and fr)
 *  - Pass: > 1 different English codes (en and en-ca)
 *  - Fail: > 1 same English codes (en & en, en-gb & en-gb)
 *
 * @param {Array} langsArr
 * @returns true
 * @throws Error
 */
function hasSingleEnglishEntry (langsArr) {
  const foundValues = new Set()

  for (const entry of langsArr) {
    const lang = entry.lang.toLowerCase()

    // ignore non-English
    if (!lang.startsWith('en')) {
      continue
    }

    // return early if a duplicate is found
    if (foundValues.has(lang)) {
      return false
    }

    // add each unique value to set
    foundValues.add(lang)
  }

  return true
}

function validateRejectBody (req, res, next) {
  const rejectBody = req.body
  const result = validateRejected(rejectBody) // validate function is based on custom schema

  if (!result) {
    const temp = validateRejected.errors
    const errors = []
    temp.forEach((error) => {
      if (error !== '') {
        errors.push(error)
      }
    })
    return res.status(400).json(error.invalidJsonSchema(errors))
  }
  next()
}

function validateCveCnaContainerJsonSchema (req, res, next) {
  const cnaContainer = req.body
  const result = validateCnaContainer(cnaContainer)
  if (!result) {
    logger.error(JSON.stringify({ uuid: req.ctx.uuid, message: 'CVE JSON schema validation FAILED.' }))
    const temp = validateCnaContainer.errors
    const errorsArray = []
    temp.forEach((error) => {
      if (error !== '') {
        errorsArray.push(error)
      }
    })
    return res.status(400).json(error.invalidCnaContainerJsonSchema(errorsArray))
  }
  logger.info(JSON.stringify({ uuid: req.ctx.uuid, message: 'SUCCESSFUL CVE JSON schema validation.' }))
  next()
}

module.exports = {
  parseGetParams,
  parsePostParams,
  parseError,
  validateCveCnaContainerJsonSchema,
  validateUniqueEnglishEntry,
  hasSingleEnglishEntry,
  validateRejectBody
}
