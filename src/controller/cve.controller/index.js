const express = require('express')
const router = express.Router()
const mw = require('../../middleware/middleware')
const errorMsgs = require('../../middleware/errorMessages')
const controller = require('./cve.controller')
const { body, param, query } = require('express-validator')
const { parseGetParams, parsePostParams, parseError, validateCveCnaContainerJsonSchema, validateRejectBody, validateUniqueEnglishEntry } = require('./cve.middleware')
const getConstants = require('../../constants').getConstants
const CONSTANTS = getConstants()
const CHOICES = [CONSTANTS.CVE_STATES.REJECTED, CONSTANTS.CVE_STATES.PUBLISHED]
const toDate = require('../../utils/utils').toDate

router.get('/cve/:id',
  /*
  #swagger.tags = ['CVE Record']
  #swagger.operationId = 'cveGetSingle'
  #swagger.summary = "Returns a CVE Record by CVE ID (accessible to all users)"
  #swagger.description = "
        <h2>Access Control</h2>
        <p>Endpoint is accessible to all</p>
        <h2>Expected Behavior</h2>
        <p><b>All users:</b> Retrieves the CVE Record specified</p>"
  #swagger.parameters['id'] = { description: 'The CVE ID for the Record to be retrieved' }
  #swagger.responses[200] = {
    description: 'The requested CVE Record',
    content: {
      "application/json": {
        schema: {
            oneOf: [
                { $ref: '/schemas/cve/get-cve-record-response.json' },
                {$ref: '/schemas/cve/create-cve-record-rejection-response.json'}
            ]
        },
        examples: {
            'Published Record': {$ref: '#/components/examples/publishedRecord'},
            'Rejected Record': {$ref: '#/components/examples/rejectedRecord'}
        }
      }
    }
  }

  #swagger.responses[400] = {
    description: 'Bad Request',
    content: {
      "application/json": {
        schema: { $ref: '/schemas/errors/bad-request.json' }
      }
    }
  }
  #swagger.responses[403] = {
    description: 'Forbidden',
    content: {
      "application/json": {
        schema: { $ref: '/schemas/errors/generic.json' }
      }
    }
  }
  #swagger.responses[404] = {
    description: 'Not Found',
    content: {
      "application/json": {
        schema: { $ref: '/schemas/errors/generic.json' }
      }
    }
  }
  #swagger.responses[429] = {
    description: 'Too Many Requests',
    content: {
      "application/json": {
        schema: { $ref: '/schemas/errors/generic.json' }
      }
    }
  }
  #swagger.responses[500] = {
    description: 'Internal Server Error',
    content: {
      "application/json": {
        schema: { $ref: '/schemas/errors/generic.json' }
      }
    }
  }
  */
  mw.rateLimiter,
  param(['id']).isString().matches(CONSTANTS.CVE_ID_REGEX),
  parseError,
  parseGetParams,
  controller.CVE_GET_SINGLE)

router.get('/cve',
  /*
  #swagger.tags = ['CVE Record']
  #swagger.operationId = 'cveGetFiltered'
  #swagger.summary = "Retrieves all CVE Records after applying the query parameters as filters (accessible to Secretariat)"
  #swagger.description = "
        <h2>Access Control</h2>
        <p>User must belong to an organization with the <b>Secretariat</b> role</p>
        <h2>Expected Behavior</h2>
        <p><b>Secretariat:</b> Retrieves all CVE records for all organizations</p>"
  #swagger.parameters['$ref'] = [
    '#/components/parameters/cveRecordFilteredTimeModifiedLt',
    '#/components/parameters/cveRecordFilteredTimeModifiedGt',
    '#/components/parameters/cveState',
    '#/components/parameters/countOnly',
    '#/components/parameters/assignerShortName',
    '#/components/parameters/assigner',
    '#/components/parameters/pageQuery'
  ]
  #swagger.responses[200] = {
    description: 'A filtered list of CVE Records, along with pagination fields if results span multiple pages of data',
    content: {
      "application/json": {
        schema: {
            oneOf: [
                { $ref: '/schemas/cve/list-cve-records-response.json' },
                {$ref: '/schemas/cve/create-cve-record-rejection-response.json'}
            ]
        },
      }
    }
  }

  #swagger.responses[400] = {
    description: 'Bad Request',
    content: {
      "application/json": {
        schema: { $ref: '/schemas/errors/bad-request.json' }
      }
    }
  }
  #swagger.responses[403] = {
    description: 'Forbidden',
    content: {
      "application/json": {
        schema: { $ref: '/schemas/errors/generic.json' }
      }
    }
  }
  #swagger.responses[404] = {
    description: 'Not Found',
    content: {
      "application/json": {
        schema: { $ref: '/schemas/errors/generic.json' }
      }
    }
  }
  #swagger.responses[500] = {
    description: 'Internal Server Error',
    content: {
      "application/json": {
        schema: { $ref: '/schemas/errors/generic.json' }
      }
    }
  }
  */
  mw.validateUser,
  mw.onlySecretariatOrBulkDownload,
  query().custom((query) => { return mw.validateQueryParameterNames(query, ['page', 'time_modified.lt', 'time_modified.gt', 'state', 'count_only', 'assigner_short_name', 'assigner']) }),
  query(['page']).optional().isInt({ min: CONSTANTS.PAGINATOR_PAGE }),
  query(['time_modified.lt']).optional().isString().trim().escape().customSanitizer(val => { return toDate(val) }).not().isEmpty().withMessage(errorMsgs.TIMESTAMP_FORMAT),
  query(['time_modified.gt']).optional().isString().trim().escape().customSanitizer(val => { return toDate(val) }).not().isEmpty().withMessage(errorMsgs.TIMESTAMP_FORMAT),
  query(['state']).optional().isString().trim().escape().customSanitizer(val => { return val.toUpperCase() }).isIn(CHOICES),
  query(['count_only']).optional().isBoolean({ loose: true }),
  query(['assigner_short_name']).optional().isString().trim().escape().notEmpty().isLength({ min: CONSTANTS.MIN_SHORTNAME_LENGTH, max: CONSTANTS.MAX_SHORTNAME_LENGTH }),
  query(['assigner']).optional().isString().trim().escape().notEmpty(),
  parseError,
  parseGetParams,
  controller.CVE_GET_FILTERED)

router.post('/cve/:id',
  /*
  #swagger.tags = ['CVE Record']
  #swagger.operationId = 'cveSubmit'
  #swagger.summary = "Creates a CVE Record from full CVE Record JSON for the specified ID (accessible to Secretariat.)"
  #swagger.description = "
          <h2>Access Control</h2>
        <p>User must belong to an organization with the <b>Secretariat</b> role</p>
        <h2>Expected Behavior</h2>
        <p><b>Secretariat:</b> Creates a CVE Record for any organization</p>"
  #swagger.parameters['id'] = { description: 'The CVE ID for the record being submitted' }
  #swagger.parameters['$ref'] = [
    '#/components/parameters/apiEntityHeader',
    '#/components/parameters/apiUserHeader',
    '#/components/parameters/apiSecretHeader'
  ]
  #swagger.requestBody = {
    required: true,
    content: {
      "application/json": {
        schema:{ $ref: '/schemas/cve/create-full-cve-record-request.json' }
      }
    }
  }
  #swagger.responses[200] = {
    description: 'The CVE Record created',
    content: {
      "application/json": {
        schema: {$ref: '/schemas/cve/create-cve-record-response.json'}
      }
    }
  }
  #swagger.responses[400] = {
    description: 'Bad Request',
    content: {
      "application/json": {
        schema: { $ref: '/schemas/errors/bad-request.json' }
      }
    }
  }
  #swagger.responses[401] = {
    description: 'Not Authenticated',
    content: {
      "application/json": {
        schema: { $ref: '/schemas/errors/generic.json' }
      }
    }
  }
  #swagger.responses[403] = {
    description: 'Forbidden',
    content: {
      "application/json": {
        schema: { $ref: '/schemas/errors/generic.json' }
      }
    }
  }
  #swagger.responses[404] = {
    description: 'Not Found',
    content: {
      "application/json": {
        schema: { $ref: '/schemas/errors/generic.json' }
      }
    }
  }
  #swagger.responses[500] = {
    description: 'Internal Server Error',
    content: {
      "application/json": {
        schema: { $ref: '/schemas/errors/generic.json' }
      }
    }
  }
  */
  mw.validateUser,
  mw.onlySecretariat,
  mw.validateCveJsonSchema,
  // the lang key to check depends on the state, so pass both
  validateUniqueEnglishEntry(['containers.cna.descriptions', 'containers.cna.rejectedReasons']),
  param(['id']).isString().matches(CONSTANTS.CVE_ID_REGEX),
  parseError,
  parsePostParams,
  controller.CVE_SUBMIT)

router.put('/cve/:id',
  /*
  #swagger.tags = ['CVE Record']
  #swagger.operationId = 'cveUpdateSingle'
  #swagger.summary = "Updates a CVE Record from full CVE Record JSON for the specified ID (accessible to Secretariat.)"
  #swagger.description = "
        <h2>Access Control</h2>
        <p>User must belong to an organization with the <b>Secretariat</b> role</p>
        <h2>Expected Behavior</h2>
        <p><b>Secretariat:</b> Updates a CVE Record for any organization</p>"
  #swagger.parameters['id'] = { description: 'The CVE ID for the record being updated' }
  #swagger.parameters['$ref'] = [
    '#/components/parameters/apiEntityHeader',
    '#/components/parameters/apiUserHeader',
    '#/components/parameters/apiSecretHeader'
  ]
  #swagger.requestBody = {
    required: true,
    content: {
      "application/json": {
        schema:{ $ref: '/schemas/cve/create-full-cve-record-request.json' }
      }
    }
  }
  #swagger.responses[200] = {
    description: 'The updated CVE Record',
    content: {
      "application/json": {
        schema: { $ref: '/schemas/cve/update-full-cve-record-response.json' }
      }
    }
  }
  #swagger.responses[400] = {
    description: 'Bad Request',
    content: {
      "application/json": {
        schema: { $ref: '/schemas/errors/bad-request.json' }
      }
    }
  }
  #swagger.responses[401] = {
    description: 'Not Authenticated',
    content: {
      "application/json": {
        schema: { $ref: '/schemas/errors/generic.json' }
      }
    }
  }
  #swagger.responses[403] = {
    description: 'Forbidden',
    content: {
      "application/json": {
        schema: { $ref: '/schemas/errors/generic.json' }
      }
    }
  }
  #swagger.responses[404] = {
    description: 'Not Found',
    content: {
      "application/json": {
        schema: { $ref: '/schemas/errors/generic.json' }
      }
    }
  }
  #swagger.responses[500] = {
    description: 'Internal Server Error',
    content: {
      "application/json": {
        schema: { $ref: '/schemas/errors/generic.json' }
      }
    }
  }
  */
  mw.validateUser,
  mw.onlySecretariat,
  mw.validateCveJsonSchema,
  // the lang key to check depends on the state, so pass both
  validateUniqueEnglishEntry(['containers.cna.descriptions', 'containers.cna.rejectedReasons']),
  param(['id']).isString().matches(CONSTANTS.CVE_ID_REGEX),
  parseError,
  parsePostParams,
  controller.CVE_UPDATE_SINGLE)

router.post('/cve/:id/cna',
  /*
  #swagger.tags = ['CVE Record']
  #swagger.operationId = 'cveCnaCreateSingle'
  #swagger.summary = "Creates a CVE Record from CNA Container JSON for the specified ID (accessible to CNAs and Secretariat)"
  #swagger.description = "
        <h2>Access Control</h2>
        <p>User must belong to an organization with the <b>CNA</b> or <b>Secretariat</b> role</p>
        <h2>Expected Behavior</h2>
        <p><b>CNA:</b> Creates CVE Record for a CVE ID owned by their organization</p>
        <p><b>Secretariat:</b> Creates CVE Record for CVE IDs owned by any organization</p>"
  #swagger.parameters['id'] = { description: 'The CVE ID for the record being created' }
  #swagger.parameters['$ref'] = [
    '#/components/parameters/apiEntityHeader',
    '#/components/parameters/apiUserHeader',
    '#/components/parameters/apiSecretHeader'
  ]
  #swagger.requestBody = {
    required: true,
    content: {
      "application/json": {
        schema:{ $ref: '/schemas/cve/cve-record-minimum-request.json' }
      }
    }
  }
  #swagger.responses[200] = {
    description: 'The CVE Record created',
    content: {
      "application/json": {
        schema: { $ref: '/schemas/cve/create-cve-record-response.json' }
      }
    }
  }
  #swagger.responses[400] = {
    description: 'Bad Request',
    content: {
      "application/json": {
        schema: { $ref: '/schemas/errors/bad-request.json' }
      }
    }
  }
  #swagger.responses[401] = {
    description: 'Not Authenticated',
    content: {
      "application/json": {
        schema: { $ref: '/schemas/errors/generic.json' }
      }
    }
  }
  #swagger.responses[403] = {
    description: 'Forbidden',
    content: {
      "application/json": {
        schema: { $ref: '/schemas/errors/generic.json' }
      }
    }
  }
  #swagger.responses[404] = {
    description: 'Not Found',
    content: {
      "application/json": {
        schema: { $ref: '/schemas/errors/generic.json' }
      }
    }
  }
  #swagger.responses[500] = {
    description: 'Internal Server Error',
    content: {
      "application/json": {
        schema: { $ref: '/schemas/errors/generic.json' }
      }
    }
  }
  */
  mw.validateUser,
  mw.onlyCnas,
  validateCveCnaContainerJsonSchema,
  validateUniqueEnglishEntry('cnaContainer.descriptions'),
  param(['id']).isString().matches(CONSTANTS.CVE_ID_REGEX),
  parseError,
  parsePostParams,
  mw.cnaMustOwnID,
  controller.CVE_SUBMIT_CNA)

router.put('/cve/:id/cna',
  /*
  #swagger.tags = ['CVE Record']
  #swagger.operationId = 'cveCnaUpdateSingle'
  #swagger.summary = "Updates the CVE Record from CNA Container JSON for the specified ID (accessible to CNAs and Secretariat)"
  #swagger.description = "
        <h2>Access Control</h2>
        <p>User must belong to an organization with the <b>CNA</b> or <b>Secretariat</b> role</p>
        <h2>Expected Behavior</h2>
        <p><b>CNA:</b> Updates a CVE Record for records that are owned by their organization</p>
        <p><b>Secretariat:</b> Updates a CVE Record for records that are owned by any organization</p>"
  #swagger.parameters['id'] = { description: 'The CVE ID for which the record is being updated' }
  #swagger.parameters['$ref'] = [
    '#/components/parameters/apiEntityHeader',
    '#/components/parameters/apiUserHeader',
    '#/components/parameters/apiSecretHeader'
  ]
  #swagger.requestBody = {
    required: true,
    content: {
      "application/json": {
        schema:{ $ref: '/schemas/cve/cve-record-minimum-request.json' }
      }
    }
  }
  #swagger.responses[200] = {
    description: 'The updated CVE Record',
    content: {
      "application/json": {
        schema: { $ref: '/schemas/cve/update-full-cve-record-response.json' }
      }
    }
  }
  #swagger.responses[400] = {
    description: 'Bad Request',
    content: {
      "application/json": {
        schema: { $ref: '/schemas/errors/bad-request.json' }
      }
    }
  }
  #swagger.responses[401] = {
    description: 'Not Authenticated',
    content: {
      "application/json": {
        schema: { $ref: '/schemas/errors/generic.json' }
      }
    }
  }
  #swagger.responses[403] = {
    description: 'Forbidden',
    content: {
      "application/json": {
        schema: { $ref: '/schemas/errors/generic.json' }
      }
    }
  }
  #swagger.responses[404] = {
    description: 'Not Found',
    content: {
      "application/json": {
        schema: { $ref: '/schemas/errors/generic.json' }
      }
    }
  }
  #swagger.responses[500] = {
    description: 'Internal Server Error',
    content: {
      "application/json": {
        schema: { $ref: '/schemas/errors/generic.json' }
      }
    }
  }
  */
  mw.validateUser,
  mw.onlyCnas,
  validateCveCnaContainerJsonSchema,
  validateUniqueEnglishEntry('cnaContainer.descriptions'),
  param(['id']).isString().matches(CONSTANTS.CVE_ID_REGEX),
  parseError,
  parsePostParams,
  mw.cnaMustOwnID,
  controller.CVE_UPDATE_CNA)

router.post('/cve/:id/reject',
  /*
  #swagger.tags = ['CVE Record']
  #swagger.operationId = 'cveCnaCreateReject'
  #swagger.summary = "Creates a reject CVE Record for the specified ID if no record yet exists (accessible to CNAs and Secretariat)"
  #swagger.description = "
        <h2>Access Control</h2>
        <p>User must belong to an organization with the <b>CNA</b> or <b>Secretariat</b> role</p>
        <h2>Expected Behavior</h2>
        <p><b>CNA:</b> Creates a reject CVE Record for a record owned by their organization</p>
        <p><b>Secretariat:</b> Creates a reject CVE Record for a record owned by any organization</p>"
  #swagger.parameters['id'] = { description: 'The CVE ID for the record being rejected' }
  #swagger.parameters['$ref'] = [
    '#/components/parameters/apiEntityHeader',
    '#/components/parameters/apiUserHeader',
    '#/components/parameters/apiSecretHeader'
  ]
  #swagger.requestBody = {
    required: true,
    content: {
      "application/json": {
        schema:{ $ref: '/schemas/cve/create-cve-record-rejection-request.json' }
      }
    }
  }
  #swagger.responses[200] = {
    description: 'The rejected CVE Record',
    content: {
      "application/json": {
        schema: { $ref: '/schemas/cve/create-cve-record-rejection-response.json' }
      }
    }
  }
  #swagger.responses[400] = {
    description: 'Bad Request',
    content: {
      "application/json": {
        schema: { $ref: '/schemas/errors/bad-request.json' }
      }
    }
  }
  #swagger.responses[401] = {
    description: 'Not Authenticated',
    content: {
      "application/json": {
        schema: { $ref: '/schemas/errors/generic.json' }
      }
    }
  }
  #swagger.responses[403] = {
    description: 'Forbidden',
    content: {
      "application/json": {
        schema: { $ref: '/schemas/errors/generic.json' }
      }
    }
  }
  #swagger.responses[404] = {
    description: 'Not Found',
    content: {
      "application/json": {
        schema: { $ref: '/schemas/errors/generic.json' }
      }
    }
  }
  #swagger.responses[500] = {
    description: 'Internal Server Error',
    content: {
      "application/json": {
        schema: { $ref: '/schemas/errors/generic.json' }
      }
    }
  }
  */
  mw.validateUser,
  mw.onlyCnas,
  validateRejectBody,
  validateUniqueEnglishEntry(['cnaContainer.rejectedReasons']),
  param(['id']).isString().matches(CONSTANTS.CVE_ID_REGEX),
  body(['cnaContainer.replacedBy']).optional().isArray(),
  parseError,
  parsePostParams,
  mw.cnaMustOwnID,
  controller.CVE_REJECT_RECORD)

router.put('/cve/:id/reject',
  /*
  #swagger.tags = ['CVE Record']
  #swagger.operationId = 'cveCnaUpdateReject'
  #swagger.summary = "Updates an existing CVE Record with a reject record for the specified ID (accessible to CNAs and Secretariat)"
  #swagger.description = "
        <h2>Access Control</h2>
        <p>User must belong to an organization with the <b>CNA</b> or <b>Secretariat</b> role</p>
        <h2>Expected Behavior</h2>
        <p><b>CNA:</b> Updates a reject CVE Record for a record owned by their organization</p>
        <p><b>Secretariat:</b> Updates a reject CVE Record for a record owned by any organization</p>"
  #swagger.parameters['id'] = { description: 'The CVE ID for the record being rejected' }
  #swagger.parameters['$ref'] = [
    '#/components/parameters/apiEntityHeader',
    '#/components/parameters/apiUserHeader',
    '#/components/parameters/apiSecretHeader'
  ]
  #swagger.requestBody = {
    required: true,
    content: {
      "application/json": {
        schema:{ $ref: '/schemas/cve/update-cve-record-rejection-request.json' }
      }
    }
  }
  #swagger.responses[200] = {
    description: 'The rejected CVE Record',
    content: {
      "application/json": {
        schema: { $ref: '/schemas/cve/update-cve-record-rejection-response.json' }
      }
    }
  }
  #swagger.responses[400] = {
    description: 'Bad Request',
    content: {
      "application/json": {
        schema: { $ref: '/schemas/errors/bad-request.json' }
      }
    }
  }
  #swagger.responses[401] = {
    description: 'Not Authenticated',
    content: {
      "application/json": {
        schema: { $ref: '/schemas/errors/generic.json' }
      }
    }
  }
  #swagger.responses[403] = {
    description: 'Forbidden',
    content: {
      "application/json": {
        schema: { $ref: '/schemas/errors/generic.json' }
      }
    }
  }
  #swagger.responses[404] = {
    description: 'Not Found',
    content: {
      "application/json": {
        schema: { $ref: '/schemas/errors/generic.json' }
      }
    }
  }
  #swagger.responses[500] = {
    description: 'Internal Server Error',
    content: {
      "application/json": {
        schema: { $ref: '/schemas/errors/generic.json' }
      }
    }
  }
  */
  mw.validateUser,
  mw.onlyCnas,
  validateRejectBody,
  validateUniqueEnglishEntry('cnaContainer.rejectedReasons'),
  param(['id']).isString().matches(CONSTANTS.CVE_ID_REGEX),
  body(['cnaContainer.replacedBy']).optional().isArray(),
  parseError,
  parsePostParams,
  mw.cnaMustOwnID,
  controller.CVE_REJECT_EXISTING_CVE)

module.exports = router
