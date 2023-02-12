const express = require('express')
const router = express.Router()
const mw = require('../../middleware/middleware')
const { query } = require('express-validator')
const controller = require('./user.controller')
const { parseGetParams, parseError } = require('./user.middleware')
const getConstants = require('../../constants').getConstants
const CONSTANTS = getConstants()

router.get('/users',
  /*
  #swagger.tags = ['Users']
  #swagger.operationId = 'userAll'
  #swagger.summary = "Retrieves information about all registered users (accessible to Secretariat)"
  #swagger.description = "
        <h2>Access Control</h2>
        <p> User must belong to an organization with the <b>Secretariat</b> role</p>
        <h2>Expected Behavior</h2>
        <p><b>Secretariat:</b> Retrieves information about all users for all organizations</p>"
  #swagger.parameters['$ref'] = [
    '#/components/parameters/pageQuery',
    '#/components/parameters/apiEntityHeader',
    '#/components/parameters/apiUserHeader',
    '#/components/parameters/apiSecretHeader'
  ]
  #swagger.responses[200] = {
    description: 'Returns all users, along with pagination fields if results span multiple pages of data.',
    content:{
      "application/json":{
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
        schema: { $ref: '/schemas/errors/generic.json' },
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
  query(['page']).optional().isInt({ min: CONSTANTS.PAGINATOR_PAGE }),
  parseError,
  parseGetParams,
  controller.ALL_USERS)

module.exports = router
