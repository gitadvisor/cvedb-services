const mongoose = require('mongoose')
const aggregatePaginate = require('mongoose-aggregate-paginate-v2')
const fs = require('fs')
const cveSchemaV5 = JSON.parse(fs.readFileSync('src/middleware/5.0_bundled_schema.json'))
const Ajv = require('ajv')
const addFormats = require('ajv-formats')
const ajv = new Ajv({ allErrors: true })
addFormats(ajv)
const validate = ajv.compile(cveSchemaV5)
const getConstants = require('../constants').getConstants

const schema = {
  _id: false,
  time: {
    created: Date,
    modified: Date
  },
  cve: Object
}

const CveSchema = new mongoose.Schema(schema, { collection: 'Cve', timestamps: { createdAt: 'time.created', updatedAt: 'time.modified' } })

CveSchema.query.byCveId = function (id) {
  return this.where({ 'cve.cveMetadata.cveId': id })
}

CveSchema.index({ 'cve.cveMetadata.cveId': 1 })
CveSchema.index({ 'cve.cveMetadata.dateUpdated': 1 })

CveSchema.statics.validateCveRecord = function (record) {
  const validateObject = {}
  validateObject.isValid = validate(record)

  if (!validateObject.isValid) {
    validateObject.errors = validate.errors
  }
  return validateObject
}

function createBaseCveMetadata (id, assignerOrgId, state) {
  const baseRecord = {
    dataType: 'CVE_RECORD',
    dataVersion: '5.0',
    cveMetadata: {
      cveId: id,
      assignerOrgId: assignerOrgId,
      state: state
    }
  }
  return baseRecord
}

CveSchema.statics.newPublishedCve = function (id, assignerOrgId, cnaContainer, sysProvidedCveMetadata = {}, sysProvidedProviderMetadata = {}) {
  const CONSTANTS = getConstants()
  const baseRecord = createBaseCveMetadata(id, assignerOrgId, CONSTANTS.CVE_STATES.PUBLISHED)

  const newCveMetadata = {
    ...baseRecord.cveMetadata,
    ...sysProvidedCveMetadata
  }

  baseRecord.cveMetadata = newCveMetadata

  cnaContainer.providerMetadata = sysProvidedProviderMetadata

  baseRecord.containers = { cna: cnaContainer }

  return baseRecord
}

function createCnaRejectContainer (providerMetadata, rejectedReasons, replacedBy = []) {
  const cnaContainer = {
    providerMetadata: providerMetadata,
    rejectedReasons: rejectedReasons
  }
  if (replacedBy.length > 0) {
    cnaContainer.replacedBy = replacedBy
  }
  return cnaContainer
}

CveSchema.statics.newRejectedCve = function (cveIdObj, reqBody, owningCnaShortName, providerMetadata) {
  const CONSTANTS = getConstants()
  const rejectedRecord = createBaseCveMetadata(cveIdObj.cve_id, cveIdObj.owning_cna, CONSTANTS.CVE_STATES.REJECTED)
  // Might be able to move these into createBaseCveMetadata, but will need to update other calling functions
  rejectedRecord.cveMetadata.dateReserved = new Date(cveIdObj.reserved).toISOString()
  rejectedRecord.cveMetadata.dateUpdated = providerMetadata.dateUpdated
  rejectedRecord.cveMetadata.dateRejected = providerMetadata.dateUpdated
  rejectedRecord.cveMetadata.assignerShortName = owningCnaShortName || null

  const cnaRejectedContainer = createCnaRejectContainer(providerMetadata, reqBody.cnaContainer.rejectedReasons, reqBody.cnaContainer.replacedBy)

  rejectedRecord.containers = { cna: cnaRejectedContainer }

  return rejectedRecord
}

CveSchema.statics.updateCveToRejected = function (id, providerMetadata, record, newCnaContainer) {
  const CONSTANTS = getConstants()

  record.containers.cna = newCnaContainer.cnaContainer // replace cna field on existing record
  record.cveMetadata.dateUpdated = providerMetadata.dateUpdated
  record.containers.cna.providerMetadata = providerMetadata

  // If record is not already rejected, update state and dateRejected
  if (record.cveMetadata.state !== CONSTANTS.CVE_STATES.REJECTED) {
    record.cveMetadata.state = CONSTANTS.CVE_STATES.REJECTED // update state
    record.cveMetadata.dateRejected = providerMetadata.dateUpdated // update dateRejected to dateUpdated, since they're both the same
  }

  if (record.containers.adp) { // check if adp field exists
    delete record.containers.adp
  }
  return record
}

CveSchema.plugin(aggregatePaginate)
const Cve = mongoose.model('Cve', CveSchema)

module.exports = Cve
