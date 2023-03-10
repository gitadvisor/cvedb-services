const express = require('express')
const router = express.Router()
const mw = require('../../middleware/middleware')
const errorMsgs = require('../../middleware/errorMessages')
const controller = require('./org.controller')
const { body, param, query } = require('express-validator')
const { parseGetParams, parsePostParams, parseError, isOrgRole, isUserRole, isValidUsername } = require('./org.middleware')
const getConstants = require('../../../src/constants').getConstants
const CONSTANTS = getConstants()

router.get('/org',
  /*
  #swagger.tags = ['Organization']
  #swagger.operationId = 'orgAll'
  #swagger.summary = "Retrieves all organizations (accessible to Secretariat)"
  #swagger.description = "
        <h2>Access Control</h2>
        <p>User must belong to an organization with the <b>Secretariat</b> role</p>
        <h2>Expected Behavior</h2>
        <p><b>Secretariat:</b> Retrieves information about all organizations</p>"
  #swagger.parameters['$ref'] = [
    '#/components/parameters/pageQuery',
    '#/components/parameters/apiEntityHeader',
    '#/components/parameters/apiUserHeader',
    '#/components/parameters/apiSecretHeader'
  ]
  #swagger.responses[200] = {
    description: 'Returns information about all organizations, along with pagination fields if results span multiple pages of data',
    content: {
      "application/json": {
        schema: { $ref: '/schemas/org/list-orgs-response.json' }
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
  query().custom((query) => { return mw.validateQueryParameterNames(query, ['page']) }),
  query(['page']).optional().isInt({ min: CONSTANTS.PAGINATOR_PAGE }),
  parseError,
  parseGetParams,
  controller.ORG_ALL)
router.post('/org',
  /*
  #swagger.tags = ['Organization']
  #swagger.operationId = 'orgCreateSingle'
  #swagger.summary = "Creates an organization as specified in the request body (accessible to Secretariat)"
  #swagger.description = "
        <h2>Access Control</h2>
        <p>User must belong to an organization with the <b>Secretariat</b> role</p>
        <h2>Expected Behavior</h2>
        <p><b>Secretariat:</b> Creates an organization</p>
  "
  #swagger.parameters['$ref'] = [
    '#/components/parameters/apiEntityHeader',
    '#/components/parameters/apiUserHeader',
    '#/components/parameters/apiSecretHeader'
  ]
  #swagger.requestBody = {
    required: true,
    content: {
      'application/json': {
        schema: { $ref: '/schemas/org/create-org-request.json' }
      }
    }
  }
  #swagger.responses[200] = {
    description: 'Returns information about the organization created',
    content: {
      "application/json": {
        schema: { $ref: '/schemas/org/create-org-response.json' }
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
  body(['short_name']).isString().trim().escape().notEmpty().isLength({ min: CONSTANTS.MIN_SHORTNAME_LENGTH, max: CONSTANTS.MAX_SHORTNAME_LENGTH }),
  body(['name']).isString().trim().escape().notEmpty(),
  body(['authority.active_roles']).optional().customSanitizer(val => { return val.map(x => { return x.toUpperCase() }) }).custom(val => { return isOrgRole(val) }),
  body(['policies.id_quota']).optional().not().isArray().isInt({ min: CONSTANTS.MONGOOSE_VALIDATION.Org_policies_id_quota_min, max: CONSTANTS.MONGOOSE_VALIDATION.Org_policies_id_quota_max }).withMessage(errorMsgs.ID_QUOTA),
  parseError,
  parsePostParams,
  controller.ORG_CREATE_SINGLE)
router.get('/org/:identifier',
  /*
  #swagger.tags = ['Organization']
  #swagger.operationId = 'orgSingle'
  #swagger.summary = "Retrieves information about the organization specified by short name or UUID (accessible to all registered users)"
  #swagger.description = "
        <h2>Access Control</h2>
        <p>All registered users can access this endpoint</p>
        <h2>Expected Behavior</h2>
        <p><b>Regular, CNA & Admin Users:</b> Retrieves organization record for the specified shortname or UUID if it is the user's organization</p>
        <p><b>Secretariat:</b> Retrieves information about any organization</p>"
  #swagger.parameters['identifier'] = { description: 'The shortname or UUID of the organization' }
  #swagger.parameters['$ref'] = [
    '#/components/parameters/apiEntityHeader',
    '#/components/parameters/apiUserHeader',
    '#/components/parameters/apiSecretHeader'
  ]
  #swagger.responses[200] = {
    description: 'Returns the organization information',
    content: {
      "application/json": {
        schema: { $ref: '/schemas/org/get-org-response.json' }
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
  param(['identifier']).isString().trim().escape(),
  parseError,
  parseGetParams,
  controller.ORG_SINGLE)
router.put('/org/:shortname',
  /*
  #swagger.tags = ['Organization']
  #swagger.operationId = 'orgUpdateSingle'
  #swagger.summary = "Updates information about the organization specified by short name (accessible to Secretariat)"
  #swagger.description = "
        <h2>Access Control</h2>
        <p>User must belong to an organization with the <b>Secretariat</b> role</p>
        <h2>Expected Behavior</h2>
        <p><b>Secretariat:</b> Updates any organization's information</p>"
  #swagger.parameters['shortname'] = { description: 'The shortname of the organization' }
  #swagger.parameters['$ref'] = [
    '#/components/parameters/id_quota',
    '#/components/parameters/name',
    '#/components/parameters/newShortname',
    '#/components/parameters/active_roles_add',
    '#/components/parameters/active_roles_remove',
    '#/components/parameters/apiEntityHeader',
    '#/components/parameters/apiUserHeader',
    '#/components/parameters/apiSecretHeader'
  ]
  #swagger.responses[200] = {
    description: 'Returns information about the organization updated',
    content: {
      "application/json": {
        schema: { $ref: '/schemas/org/update-org-response.json' }
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
  query().custom((query) => { return mw.validateQueryParameterNames(query, ['new_short_name', 'id_quota', 'name', 'active_roles.add', 'active_roles.remove']) }),
  param(['shortname']).isString().trim().escape().isLength({ min: CONSTANTS.MIN_SHORTNAME_LENGTH, max: CONSTANTS.MAX_SHORTNAME_LENGTH }),
  query(['new_short_name']).optional().isString().trim().escape().notEmpty().isLength({ min: CONSTANTS.MIN_SHORTNAME_LENGTH, max: CONSTANTS.MAX_SHORTNAME_LENGTH }),
  query(['id_quota']).optional().not().isArray().isInt({ min: CONSTANTS.MONGOOSE_VALIDATION.Org_policies_id_quota_min, max: CONSTANTS.MONGOOSE_VALIDATION.Org_policies_id_quota_max }).withMessage(errorMsgs.ID_QUOTA),
  query(['name']).optional().isString().trim().escape().notEmpty(),
  query(['active_roles.add']).optional().toArray(),
  query(['active_roles.add']).optional().customSanitizer(val => { return val.map(x => { return x.toUpperCase() }) }).custom(val => { return isOrgRole(val) }),
  query(['active_roles.remove']).optional().toArray(),
  query(['active_roles.remove']).optional().customSanitizer(val => { return val.map(x => { return x.toUpperCase() }) }).custom(val => { return isOrgRole(val) }),
  parseError,
  parsePostParams,
  controller.ORG_UPDATE_SINGLE)
router.get('/org/:shortname/id_quota',
  /*
  #swagger.tags = ['Organization']
  #swagger.operationId = 'orgIdQuota'
  #swagger.summary = "Retrieves an organization's CVE ID quota (accessible to all registered users)"
  #swagger.description = "
        <h2>Access Control</h2>
        <p>All registered users can access this endpoint</p>
        <h2>Expected Behavior</h2>
        <p><b>Regular, CNA & Admin Users:</b> Retrieves the CVE ID quota for the user's organization</p>
        <p><b>Secretariat:</b> Retrieves the CVE ID quota for any organization</p>"
  #swagger.parameters['shortname'] = { description: 'The shortname of the organization' }
  #swagger.parameters['$ref'] = [
    '#/components/parameters/apiEntityHeader',
    '#/components/parameters/apiUserHeader',
    '#/components/parameters/apiSecretHeader'
  ]
  #swagger.responses[200] = {
    description: 'Returns the CVE ID quota for an organization',
    content: {
      "application/json": {
        schema: { $ref: '/schemas/org/get-org-quota-response.json' }
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
  param(['shortname']).isString().trim().escape().notEmpty().isLength({ min: CONSTANTS.MIN_SHORTNAME_LENGTH, max: CONSTANTS.MAX_SHORTNAME_LENGTH }),
  parseError,
  parseGetParams,
  controller.ORG_ID_QUOTA)
router.get('/org/:shortname/users',
  /*
  #swagger.tags = ['Users']
  #swagger.operationId = 'userOrgAll'
  #swagger.summary = "Retrieves all users for the organization with the specified short name (accessible to all registered users)"
  #swagger.description = "
        <h2>Access Control</h2>
        <p>All registered users can access this endpoint</p>
        <h2>Expected Behavior</h2>
        <p><b>Regular, CNA & Admin Users:</b> Retrieves information about users in the same organization</p>
        <p><b>Secretariat:</b> Retrieves all user information for any organization</p>"
  #swagger.parameters['shortname'] = { description: 'The shortname of the organization' }
  #swagger.parameters['$ref'] = [
    '#/components/parameters/pageQuery',
    '#/components/parameters/apiEntityHeader',
    '#/components/parameters/apiUserHeader',
    '#/components/parameters/apiSecretHeader'
  ]
  #swagger.responses[200] = {
    description: 'Returns all users for the organization, along with pagination fields if results span multiple pages of data',
    content: {
      "application/json": {
        schema: { $ref: '/schemas/user/list-users-response.json' }
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
  param(['shortname']).isString().trim().escape().notEmpty().isLength({ min: CONSTANTS.MIN_SHORTNAME_LENGTH, max: CONSTANTS.MAX_SHORTNAME_LENGTH }),
  query(['page']).optional().isInt({ min: CONSTANTS.PAGINATOR_PAGE }),
  parseError,
  parseGetParams,
  controller.USER_ALL)
router.post('/org/:shortname/user',
  /*
  #swagger.tags = ['Users']
  #swagger.operationId = 'userCreateSingle'
  #swagger.summary = "Create a user with the provided short name as the owning organization (accessible to Admins and Secretariats)"
  #swagger.description = "
        <h2>Access Control</h2>
        <p>User must belong to an organization with the <b>Secretariat</b> role or be an <b>Admin</b> of the organization</p>
        <h2>Expected Behavior</h2>
        <p><b>Admin User:</b> Creates a user for the Admin's organization</p>
        <p><b>Secretariat:</b> Creates a user for any organization</p>"
  #swagger.parameters['shortname'] = { description: 'The shortname of the organization' }
  #swagger.parameters['$ref'] = [
    '#/components/parameters/apiEntityHeader',
    '#/components/parameters/apiUserHeader',
    '#/components/parameters/apiSecretHeader'
  ]
  #swagger.requestBody = {
    required: true,
    content: {
      'application/json': {
        schema: { $ref: '/schemas/user/create-user-request.json' },
      }
    }
  }
  #swagger.responses[200] = {
    description: 'Returns the new user information (with the secret)',
    content: {
      "application/json": {
        schema: { $ref: '/schemas/user/create-user-response.json' },
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
  mw.onlySecretariatOrAdmin,
  mw.onlyOrgWithRole,
  param(['shortname']).isString().trim().escape().notEmpty().isLength({ min: CONSTANTS.MIN_SHORTNAME_LENGTH, max: CONSTANTS.MAX_SHORTNAME_LENGTH }),
  body(['username']).isString().trim().escape().notEmpty().custom(val => { return isValidUsername(val) }),
  body(['org_uuid']).optional().isString().trim().escape(),
  body(['uuid']).optional().isString().trim().escape(),
  body(['name.first']).optional().isString().trim().escape(),
  body(['name.last']).optional().isString().trim().escape(),
  body(['name.middle']).optional().isString().trim().escape(),
  body(['name.suffix']).optional().isString().trim().escape(),
  body(['authority.active_roles']).optional().customSanitizer(val => { return val.map(x => { return x.toUpperCase() }) }).custom(val => { return isUserRole(val) }),
  parseError,
  parsePostParams,
  controller.USER_CREATE_SINGLE)
router.get('/org/:shortname/user/:username',
  /*
  #swagger.tags = ['Users']
  #swagger.operationId = 'userSingle'
  #swagger.summary = "Retrieves information about a user for the specified username and organization short name (accessible to all registered users)"
  #swagger.description = "
        <h2>Access Control</h2>
        <p>All registered users can access this endpoint</p>
        <h2>Expected Behavior</h2>
        <p><b>Regular, CNA & Admin Users:</b> Retrieves information about a user in the same organization</p>
        <p><b>Secretariat:</b> Retrieves any user's information</p>"
  #swagger.parameters['shortname'] = { description: 'The shortname of the organization' }
  #swagger.parameters['username'] = { description: 'The username of the user' }
  #swagger.parameters['$ref'] = [
    '#/components/parameters/apiEntityHeader',
    '#/components/parameters/apiUserHeader',
    '#/components/parameters/apiSecretHeader'
  ]
  #swagger.responses[200] = {
    description: 'Returns information about the specified user',
    content: {
      "application/json": {
        schema: { $ref: '/schemas/user/get-user-response.json' }
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
  param(['shortname']).isString().trim().escape().notEmpty().isLength({ min: CONSTANTS.MIN_SHORTNAME_LENGTH, max: CONSTANTS.MAX_SHORTNAME_LENGTH }),
  param(['username']).isString().trim().escape().notEmpty().custom(val => { return isValidUsername(val) }),
  parseError,
  parseGetParams,
  controller.USER_SINGLE)
router.put('/org/:shortname/user/:username',
  /*
  #swagger.tags = ['Users']
   #swagger.operationId = 'userUpdateSingle'
  #swagger.summary = "Updates information about a user for the specified username and organization shortname (accessible to all registered users)"
  #swagger.description = "
        <h2>Access Control</h2>
        <p>All registered users can access this endpoint</p>
        <h2>Expected Behavior</h2>
        <p><b>Regular User:</b> Updates the user's own information. Only name fields may be changed.</p>
        <p><b>Admin User:</b> Updates information about a user in the Admin's organization. Allowed to change all fields except org_short_name. </p>
        <p><b>Secretariat:</b> Updates information about a user in any organization. Allowed to change all fields.</p>"
  #swagger.parameters['shortname'] = { description: 'The shortname of the organization' }
  #swagger.parameters['username'] = { description: 'The username of the user' }
  #swagger.parameters['$ref'] = [
    '#/components/parameters/active',
    '#/components/parameters/activeUserRolesAdd',
    '#/components/parameters/activeUserRolesRemove',
    '#/components/parameters/nameFirst',
    '#/components/parameters/nameLast',
    '#/components/parameters/nameMiddle',
    '#/components/parameters/nameSuffix',
    '#/components/parameters/newUsername',
    '#/components/parameters/orgShortname',
    '#/components/parameters/apiEntityHeader',
    '#/components/parameters/apiUserHeader',
    '#/components/parameters/apiSecretHeader'
  ]
  #swagger.responses[200] = {
    description: 'Returns the updated user information',
    content: {
      "application/json": {
        schema: { $ref: '/schemas/user/update-user-response.json' }
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
  mw.onlyOrgWithRole,
  query().custom((query) => {
    return mw.validateQueryParameterNames(query, ['active', 'new_username', 'org_short_name', 'name.first', 'name.last', 'name.middle',
      'name.suffix', 'active_roles.add', 'active_roles.remove'])
  }),
  param(['shortname']).isString().trim().escape().notEmpty().isLength({ min: CONSTANTS.MIN_SHORTNAME_LENGTH, max: CONSTANTS.MAX_SHORTNAME_LENGTH }),
  param(['username']).isString().trim().escape().notEmpty().custom(val => { return isValidUsername(val) }),
  query(['active']).optional().isBoolean({ loose: true }),
  query(['new_username']).optional().isString().trim().escape().notEmpty().custom(val => { return isValidUsername(val) }),
  query(['org_short_name']).optional().isString().trim().escape().notEmpty().isLength({ min: CONSTANTS.MIN_SHORTNAME_LENGTH, max: CONSTANTS.MAX_SHORTNAME_LENGTH }),
  query(['name.first']).optional().isString().trim().escape(),
  query(['name.last']).optional().isString().trim().escape(),
  query(['name.middle']).optional().isString().trim().escape(),
  query(['name.suffix']).optional().isString().trim().escape(),
  query(['active_roles.add']).optional().toArray(),
  query(['active_roles.add']).optional().customSanitizer(val => { return val.map(x => { return x.toUpperCase() }) }).custom(val => { return isUserRole(val) }),
  query(['active_roles.remove']).optional().toArray(),
  query(['active_roles.remove']).optional().customSanitizer(val => { return val.map(x => { return x.toUpperCase() }) }).custom(val => { return isUserRole(val) }),
  parseError,
  parsePostParams,
  controller.USER_UPDATE_SINGLE)
router.put('/org/:shortname/user/:username/reset_secret',
  /*
  #swagger.tags = ['Users']
  #swagger.operationId = 'userResetSecret'
  #swagger.summary = "Reset the API key for a user (accessible to all registered users)"
  #swagger.description = "
        <h2>Access Control</h2>
        <p>All registered users can access this endpoint</p>
        <h2>Expected Behavior</h2>
        <p><b>Regular User:</b> Resets user's own API secret</p>
        <p><b>Admin User:</b> Resets any user's API secret in the Admin's organization</p>
        <p><b>Secretariat:</b> Resets any user's API secret</p>"
  #swagger.parameters['shortname'] = { description: 'The shortname of the organization' }
  #swagger.parameters['username'] = { description: 'The username of the user' }
  #swagger.parameters['$ref'] = [
    '#/components/parameters/apiEntityHeader',
    '#/components/parameters/apiUserHeader',
    '#/components/parameters/apiSecretHeader'
  ]
  #swagger.responses[200] = {
    description: 'Returns the new API key',
    content: {
      "application/json": {
        schema: { $ref: '/schemas/user/reset-secret-response.json' }
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
  mw.onlyOrgWithRole,
  param(['shortname']).isString().trim().escape().notEmpty().isLength({ min: CONSTANTS.MIN_SHORTNAME_LENGTH, max: CONSTANTS.MAX_SHORTNAME_LENGTH }),
  param(['username']).isString().trim().escape().notEmpty().custom(val => { return isValidUsername(val) }),
  parseError,
  parsePostParams,
  controller.USER_RESET_SECRET)

module.exports = router
