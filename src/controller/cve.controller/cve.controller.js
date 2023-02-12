const Cve = require('../../model/cve')
const logger = require('../../middleware/logger')
const errors = require('./error')
const getConstants = require('../../constants').getConstants
const error = new errors.CveControllerError()
const booleanIsTrue = require('../../utils/utils').booleanIsTrue
const url = process.env.NODE_ENV === 'staging' ? 'https://test.cve.org/' : 'https://cve.org/'

// Helper function to create providerMetadata object
function createProviderMetadata (orgId, shortName, updateDate) {
  return { orgId: orgId, shortName: shortName, dateUpdated: updateDate }
}

// Called by GET /cve/:id
async function getCve (req, res, next) {
  try {
    const id = req.ctx.params.id
    const cveRepo = req.ctx.repositories.getCveRepository()
    const result = await cveRepo.findOneByCveId(id)
    if (!result) {
      return res.status(404).json(error.cveRecordDne())
    }

    return res.status(200).json(result.cve)
  } catch (err) {
    next(err)
  }
}

// Called by GET /cve
async function getFilteredCves (req, res, next) {
  const CONSTANTS = getConstants()
  const options = CONSTANTS.PAGINATOR_OPTIONS

  // temporary measure to allow tests to work after fixing #920
  // tests required changing the global limit to force pagination
  if (req.TEST_PAGINATOR_LIMIT) {
    CONSTANTS.PAGINATOR_OPTIONS.limit = req.TEST_PAGINATOR_LIMIT
  }

  try {
    options.page = req.ctx.query.page ? parseInt(req.ctx.query.page) : CONSTANTS.PAGINATOR_PAGE // if 'page' query parameter is not defined, set 'page' to the default page value
    const cveRepo = req.ctx.repositories.getCveRepository()
    let state = null
    let assignerShortName = null
    let assigner = null
    const timeModified = {
      timeStamp: [],
      dateOperator: []
    }

    // if count_only is the only parameter, return estimated count of full set of records
    if ((Object.keys(req.ctx.query).length === 1) &&
        (req.ctx.query.count_only) &&
        (booleanIsTrue(req.ctx.query.count_only))) {
      const payload = {}
      payload.totalCount = await cveRepo.estimatedDocumentCount()
      logger.info({ uuid: req.ctx.uuid, message: 'The cve records estimated count was sent to the user.' })
      return res.status(200).json(payload) // only return estimated count, not the records
    }

    Object.keys(req.ctx.query).forEach(k => {
      const key = k.toLowerCase()
      if (key === 'time_modified.lt') {
        timeModified.dateOperator.push('lt')
        timeModified.timeStamp.push(req.ctx.query['time_modified.lt'])
      } else if (key === 'time_modified.gt') {
        timeModified.dateOperator.push('gt')
        timeModified.timeStamp.push(req.ctx.query['time_modified.gt'])
      } else if (key === 'state') {
        state = req.ctx.query.state
      } else if (key === 'assigner_short_name') { // the key is retrieved as lowercase
        assignerShortName = req.ctx.query.assigner_short_name
      } else if (key === 'assigner') {
        assigner = req.ctx.query.assigner
      }
    })

    const query = {}

    if (timeModified.timeStamp.length > 0) {
      query['time.modified'] = {}

      for (let i = 0; i < timeModified.timeStamp.length; i++) {
        if (timeModified.dateOperator[i] === 'lt') {
          query['time.modified'].$lt = timeModified.timeStamp[i]
        } else {
          query['time.modified'].$gt = timeModified.timeStamp[i]
        }
      }
    }

    if (state) {
      query['cve.cveMetadata.state'] = state
    }

    if (assignerShortName) {
      query['cve.cveMetadata.assignerShortName'] = assignerShortName
    }

    if (assigner) {
      query['cve.cveMetadata.assignerOrgId'] = assigner
    }

    const agt = [
      {
        $match: query
      },
      // sort before project so DocDB uses the cveId index.
      // aggregatePaginate accepts sort separately from the aggregate query
      // so need to explicitly specify it here and remove it from the options
      {
        $sort: {
          'cve.cveMetadata.cveId': 1
        }
      },
      {
        $project: {
          _id: false,
          time: false
        }
      }
    ]

    delete options.sort

    // check whether user requested count_only for filtered set of records
    if ((req.ctx.query.count_only) &&
        (booleanIsTrue(req.ctx.query.count_only))) {
      const payload = {}
      payload.totalCount = await cveRepo.countDocuments(query)
      logger.info({ uuid: req.ctx.uuid, message: 'The cve records count was sent to the user.' })
      return res.status(200).json(payload) // only return count number, not the records
    }

    const pg = await cveRepo.aggregatePaginate(agt, options)
    const payload = { cveRecords: pg.itemsList.map(val => { return val.cve }) }

    if (pg.itemCount >= CONSTANTS.PAGINATOR_OPTIONS.limit) {
      payload.totalCount = pg.itemCount
      payload.itemsPerPage = pg.itemsPerPage
      payload.pageCount = pg.pageCount
      payload.currentPage = pg.currentPage
      payload.prevPage = pg.prevPage
      payload.nextPage = pg.nextPage
    }
    logger.info({ uuid: req.ctx.uuid, message: 'The cve records were sent to the user.' })
    return res.status(200).json(payload)
  } catch (err) {
    next(err)
  }
}

// Called by POST /cve/:id
// Creates a new CVE only if it does not exists for the specified CVE ID in the request body. If it exists, it does not
// update the CVE.
async function submitCve (req, res, next) {
  const CONSTANTS = getConstants()

  try {
    const newCve = new Cve({ cve: req.ctx.body })
    const id = req.ctx.params.id
    const cveId = newCve.cve.cveMetadata.cveId
    const state = newCve.cve.cveMetadata.state
    const cveRepo = req.ctx.repositories.getCveRepository()
    const cveIdRepo = req.ctx.repositories.getCveIdRepository()
    const orgRepo = req.ctx.repositories.getOrgRepository()

    // the cve id provided in the body must match the cve id provided in the URL params
    if (id !== cveId) {
      return res.status(400).json(error.cveIdMismatch())
    }

    // check that cve does not have status 'RESERVED'
    if (state === CONSTANTS.CVE_STATES.RESERVED) {
      return res.status(400).json(error.cveCreateUnsupportedState(CONSTANTS.CVE_STATES.RESERVED))
    }

    // check that cve id exists
    let result = await cveIdRepo.findOneByCveId(id)
    if (!result || result.state === CONSTANTS.CVE_STATES.AVAILABLE) {
      return res.status(403).json(error.cveDne())
    }

    // check that cve record does not exist
    result = await cveRepo.findOneByCveId(id)
    if (result) {
      return res.status(400).json(error.cveRecordExists())
    }

    await cveRepo.updateByCveId(cveId, newCve, { upsert: true })
    await cveIdRepo.updateByCveId(cveId, { state: state })

    const responseMessage = {
      message: cveId + ' record was successfully created.',
      created: newCve.cve
    }

    const payload = {
      action: 'create_cve_record',
      change: cveId + ' record was successfully created.',
      req_UUID: req.ctx.uuid,
      org_UUID: await orgRepo.getOrgUUID(req.ctx.org),
      cve: cveId
    }
    const userRepo = req.ctx.repositories.getUserRepository()
    payload.user_UUID = await userRepo.getUserUUID(req.ctx.user, payload.org_UUID)
    logger.info(JSON.stringify(payload))
    return res.status(200).json(responseMessage)
  } catch (err) {
    next(err)
  }
}

// Called by PUT /cve/:id
// Updates a CVE if one exists for the specified CVE ID
async function updateCve (req, res, next) {
  const CONSTANTS = getConstants()

  try {
    const newCve = new Cve({ cve: req.ctx.body })
    const cveId = req.ctx.params.id
    const cveRepo = req.ctx.repositories.getCveRepository()
    const cveIdRepo = req.ctx.repositories.getCveIdRepository()
    const orgRepo = req.ctx.repositories.getOrgRepository()
    const newCveMetaData = newCve.cve.cveMetadata
    const newCveId = newCveMetaData.cveId
    const newCveState = newCveMetaData.state

    if (cveId !== newCveId) {
      return res.status(400).json(error.cveIdMismatch())
    }

    if (newCveState === CONSTANTS.CVE_STATES.RESERVED) {
      return res.status(400).json(error.cveUpdateUnsupportedState(CONSTANTS.CVE_STATES.RESERVED))
    }

    let result = await cveIdRepo.findOneByCveId(cveId)
    if (!result) {
      logger.info(cveId + ' does not exist.')
      return res.status(403).json(error.cveDne())
    }

    result = await cveRepo.findOneByCveId(cveId)
    if (!result) {
      logger.info(cveId + ' does not exist.')
      return res.status(403).json(error.cveRecordDne())
    }

    await cveRepo.updateByCveId(cveId, newCve)
    await cveIdRepo.updateByCveId(cveId, { state: newCveState })

    const responseMessage = {
      message: cveId + ' record was successfully updated.',
      updated: newCve.cve
    }

    const payload = {
      action: 'update_cve_record',
      change: cveId + ' record was successfully updated.',
      req_UUID: req.ctx.uuid,
      org_UUID: await orgRepo.getOrgUUID(req.ctx.org),
      cve: cveId
    }

    const userRepo = req.ctx.repositories.getUserRepository()
    payload.user_UUID = await userRepo.getUserUUID(req.ctx.user, payload.org_UUID)
    logger.info(JSON.stringify(payload))
    return res.status(200).json(responseMessage)
  } catch (err) {
    next(err)
  }
}

// Called by POST /cve/:id/cna
async function submitCna (req, res, next) {
  const CONSTANTS = getConstants()

  try {
    const id = req.ctx.params.id
    const cveRepo = req.ctx.repositories.getCveRepository()
    const cveIdRepo = req.ctx.repositories.getCveIdRepository()
    const orgRepo = req.ctx.repositories.getOrgRepository()
    const userRepo = req.ctx.repositories.getUserRepository()
    const orgUuid = await orgRepo.getOrgUUID(req.ctx.org)
    const userUuid = await userRepo.getUserUUID(req.ctx.user, orgUuid)

    // check that cve id exists
    let result = await cveIdRepo.findOneByCveId(id)
    if (!result || result.state === CONSTANTS.CVE_STATES.AVAILABLE) {
      return res.status(400).json(error.cveDne())
    }

    // check that cveId org matches user org
    const cveId = result
    const isSecretariat = await orgRepo.isSecretariat(req.ctx.org)
    if ((cveId.owning_cna !== orgUuid) && !isSecretariat) {
      return res.status(403).json(error.owningOrgDoesNotMatch())
    }

    // check that cve record does not exist
    result = await cveRepo.findOneByCveId(id)
    if (result) {
      return res.status(403).json(error.cveRecordExists())
    }

    // create full cve record here
    const owningCna = await orgRepo.findOneByUUID(cveId.owning_cna)
    const assignerShortName = owningCna?.short_name
    const cnaContainer = req.ctx.body.cnaContainer
    const dateUpdated = (new Date()).toISOString()
    const additionalCveMetadataFields = {
      assignerShortName: assignerShortName,
      dateReserved: (cveId.reserved).toISOString(),
      datePublished: dateUpdated,
      dateUpdated: dateUpdated
    }

    const providerMetadata = createProviderMetadata(orgUuid, req.ctx.org, dateUpdated)
    const cveRecord = Cve.newPublishedCve(id, cveId.owning_cna, cnaContainer, additionalCveMetadataFields, providerMetadata)
    const cveModel = new Cve({ cve: cveRecord })

    result = Cve.validateCveRecord(cveModel.cve)

    if (!result.isValid) {
      logger.error(JSON.stringify({ uuid: req.ctx.uuid, message: 'CVE JSON schema validation FAILED.' }))
      return res.status(400).json(error.invalidCnaContainerJsonSchema(result.errors))
    }

    try {
      await cveRepo.updateByCveId(id, cveModel, { upsert: true })
      // change cve id state to publish after saving CVE Record in case above call fails
      await cveIdRepo.updateByCveId(id, { state: CONSTANTS.CVE_STATES.PUBLISHED })
    } catch (err) {
      return res.status(400).json(error.unableToStoreCveRecord())
    }

    const responseMessage = {
      message: id + ' record was successfully created. This submission should appear on ' + url + ' within 15 minutes.',
      created: cveModel.cve
    }

    const payload = {
      action: 'create_cve_record_from_cna',
      change: id + ' record was successfully created.',
      req_UUID: req.ctx.uuid,
      org_UUID: orgUuid,
      user_UUID: userUuid,
      cve: id
    }
    logger.info(JSON.stringify(payload))
    return res.status(200).json(responseMessage)
  } catch (err) {
    next(err)
  }
}

// Called by PUT /cve/:id/cna
async function updateCna (req, res, next) {
  const CONSTANTS = getConstants()

  try {
    const id = req.ctx.params.id
    const cveRepo = req.ctx.repositories.getCveRepository()
    const cveIdRepo = req.ctx.repositories.getCveIdRepository()
    const orgRepo = req.ctx.repositories.getOrgRepository()
    const userRepo = req.ctx.repositories.getUserRepository()
    const orgUuid = await orgRepo.getOrgUUID(req.ctx.org)
    const userUuid = await userRepo.getUserUUID(req.ctx.user, orgUuid)

    // check that cve id exists
    let result = await cveIdRepo.findOneByCveId(id)
    if (!result || result.state === CONSTANTS.CVE_STATES.AVAILABLE) {
      return res.status(400).json(error.cveDne())
    }

    // check that cveId org matches user org
    const cveId = result
    const isSecretariat = await orgRepo.isSecretariat(req.ctx.org)
    if ((cveId.owning_cna !== orgUuid) && !isSecretariat) {
      return res.status(403).json(error.owningOrgDoesNotMatch())
    }

    // check that cve record does exist
    result = await cveRepo.findOneByCveId(id)
    if (!result) {
      return res.status(403).json(error.cveRecordDne())
    }

    // update cve record here
    const cveRecord = result.cve
    const cnaContainer = req.ctx.body.cnaContainer
    const dateUpdated = (new Date()).toISOString()
    cveRecord.cveMetadata.dateUpdated = dateUpdated

    if (cveRecord.cveMetadata.state === CONSTANTS.CVE_STATES.REJECTED) {
      delete cveRecord.cveMetadata.dateRejected
      if (!cveRecord.cveMetadata.datePublished) {
        cveRecord.cveMetadata.datePublished = dateUpdated
      }
    }

    if (cveRecord.cveMetadata.state !== CONSTANTS.CVE_STATES.PUBLISHED) {
      cveRecord.cveMetadata.state = CONSTANTS.CVE_STATES.PUBLISHED
    }

    const providerMetadata = createProviderMetadata(orgUuid, req.ctx.org, dateUpdated)
    cnaContainer.providerMetadata = providerMetadata
    cveRecord.containers.cna = cnaContainer
    const cveModel = new Cve({ cve: cveRecord })
    result = Cve.validateCveRecord(cveModel.cve)

    if (!result.isValid) {
      logger.error(JSON.stringify({ uuid: req.ctx.uuid, message: 'CVE JSON schema validation FAILED.' }))
      return res.status(400).json(error.invalidCnaContainerJsonSchema(result.errors))
    }

    await cveRepo.updateByCveId(id, cveModel)
    // change cve id state to publish
    if (cveId.state === CONSTANTS.CVE_STATES.REJECTED) {
      result = await cveIdRepo.updateByCveId(id, { state: CONSTANTS.CVE_STATES.PUBLISHED })
      if (!result) {
        return res.status(500).json(error.serverError())
      }
    }

    const responseMessage = {
      message: id + ' record was successfully updated. This submission should appear on ' + url + ' within 15 minutes.',
      updated: cveModel.cve
    }

    const payload = {
      action: 'update_cve_record_from_cna',
      change: id + ' record was successfully updated.',
      req_UUID: req.ctx.uuid,
      org_UUID: orgUuid,
      user_UUID: userUuid,
      cve: id
    }
    logger.info(JSON.stringify(payload))
    return res.status(200).json(responseMessage)
  } catch (err) {
    next(err)
  }
}

// Called by POST /cve/:id/reject
async function rejectCVE (req, res, next) {
  const CONSTANTS = getConstants()

  try {
    const id = req.ctx.params.id
    const cveIdRepo = req.ctx.repositories.getCveIdRepository()

    // check that cve id exists
    const cveIdObj = await cveIdRepo.findOneByCveId(id)
    if (!cveIdObj || cveIdObj.state === CONSTANTS.CVE_STATES.AVAILABLE) {
      return res.status(400).json(error.cveDne())
    }

    // check that cve record does not exist
    const cveRepo = req.ctx.repositories.getCveRepository()
    let result = await cveRepo.findOneByCveId(id)
    if (result) {
      return res.status(400).json(error.cveRecordExists())
    }

    // Both orgs below should exist since they passed validation
    const orgRepo = req.ctx.repositories.getOrgRepository()
    const providerOrgObj = await orgRepo.findOneByShortName(req.ctx.org)
    const owningCnaObj = await orgRepo.findOneByUUID(cveIdObj.owning_cna)

    const owningCnaShortName = owningCnaObj?.short_name

    const providerMetadata = createProviderMetadata(providerOrgObj.UUID, req.ctx.org, (new Date()).toISOString())
    const rejectedCve = Cve.newRejectedCve(cveIdObj, req.ctx.body, owningCnaShortName, providerMetadata)
    const newCveObj = new Cve({ cve: rejectedCve })

    result = Cve.validateCveRecord(newCveObj.cve)
    if (!result.isValid) {
      logger.error(JSON.stringify({ uuid: req.ctx.uuid, message: 'CVE JSON schema validation FAILED.' }))
      return res.status(400).json(error.invalidCnaContainerJsonSchema(result.errors))
    }

    // Save rejected CVE record object
    result = await cveRepo.updateByCveId(id, newCveObj, { upsert: true })
    if (!result) {
      return res.status(500).json(error.serverError())
    }

    // Update state of CVE ID
    result = await cveIdRepo.updateByCveId(id, { state: CONSTANTS.CVE_STATES.REJECTED })
    if (!result) {
      return res.status(500).json(error.serverError())
    }

    const responseMessage = {
      message: id + ' record was successfully submitted.',
      created: newCveObj.cve
    }

    const payload = {
      action: 'submit_rejected_cve_record',
      change: id + ' record was successfully submitted.',
      req_UUID: req.ctx.uuid,
      org_UUID: await orgRepo.getOrgUUID(req.ctx.org),
      cve: id
    }
    const userRepo = req.ctx.repositories.getUserRepository()
    payload.user_UUID = await userRepo.getUserUUID(req.ctx.user, payload.org_UUID)
    logger.info(JSON.stringify(payload))
    return res.status(200).json(responseMessage)
  } catch (err) {
    next(err)
  }
}

// Called by PUT /cve/:id/reject
async function rejectExistingCve (req, res, next) {
  const CONSTANTS = getConstants()

  try {
    const id = req.ctx.params.id
    const cveIdRepo = req.ctx.repositories.getCveIdRepository()
    const cveRepo = req.ctx.repositories.getCveRepository()
    const orgRepo = req.ctx.repositories.getOrgRepository()
    const providerOrgObj = await orgRepo.findOneByShortName(req.ctx.org)

    // check that cve id exists
    const cveIdObj = await cveIdRepo.findOneByCveId(id)
    if (!cveIdObj || cveIdObj.state === CONSTANTS.CVE_STATES.AVAILABLE) {
      return res.status(400).json(error.cveDne())
    }

    // check that cve record exists
    let result = await cveRepo.findOneByCveId(id)
    if (!result) {
      return res.status(400).json(error.cveRecordDne())
    }

    const providerMetadata = createProviderMetadata(providerOrgObj.UUID, req.ctx.org, (new Date()).toISOString())

    // update CVE record to rejected
    const updatedRecord = Cve.updateCveToRejected(id, providerMetadata, result.cve, req.ctx.body)
    const updatedCve = new Cve({ cve: updatedRecord })
    result = Cve.validateCveRecord(updatedCve.cve)
    if (!result.isValid) {
      logger.error(JSON.stringify({ uuid: req.ctx.uuid, message: 'CVE JSON schema validation FAILED.' }))
      return res.status(400).json(error.invalidCnaContainerJsonSchema(result.errors))
    }
    result = await cveRepo.updateByCveId(id, updatedCve)
    if (!result) {
      return res.status(500).json(error.unableToUpdateByCveID())
    }

    // update cveID to rejected
    result = await cveIdRepo.updateByCveId(id, { state: CONSTANTS.CVE_STATES.REJECTED })
    if (!result) {
      return res.status(500).json(error.serverError())
    }

    const responseMessage = {
      message: id + ' record was successfully submitted.',
      updated: updatedCve.cve
    }

    const payload = {
      action: 'update_rejected_cve_record',
      change: id + ' record was successfully submitted.',
      req_UUID: req.ctx.uuid,
      org_UUID: providerOrgObj.UUID,
      cve: id
    }
    const userRepo = req.ctx.repositories.getUserRepository()
    payload.user_UUID = await userRepo.getUserUUID(req.ctx.user, payload.org_UUID)
    logger.info(JSON.stringify(payload))
    return res.status(200).json(responseMessage)
  } catch (err) {
    next(err)
  }
}

module.exports = {
  CVE_GET_SINGLE: getCve,
  CVE_GET_FILTERED: getFilteredCves,
  CVE_SUBMIT: submitCve,
  CVE_UPDATE_SINGLE: updateCve,
  CVE_SUBMIT_CNA: submitCna,
  CVE_UPDATE_CNA: updateCna,
  CVE_REJECT_RECORD: rejectCVE,
  CVE_REJECT_EXISTING_CVE: rejectExistingCve
}
