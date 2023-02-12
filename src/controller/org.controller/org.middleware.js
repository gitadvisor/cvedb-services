const getConstants = require('../../constants').getConstants
const { validationResult } = require('express-validator')
const errors = require('./error')
const error = new errors.OrgControllerError()
const utils = require('../../utils/utils')

function isOrgRole (val) {
  const CONSTANTS = getConstants()

  val.forEach(role => {
    if (!CONSTANTS.ORG_ROLES.includes(role)) {
      throw new Error('Organization role does not exist.')
    }
  })

  return true
}

function isUserRole (val) {
  const CONSTANTS = getConstants()

  val.forEach(role => {
    if (!CONSTANTS.USER_ROLES.includes(role)) {
      throw new Error('User role does not exist.')
    }
  })

  return true
}

function parsePostParams (req, res, next) {
  utils.reqCtxMapping(req, 'body', [])
  utils.reqCtxMapping(req, 'query', [
    'new_short_name', 'name', 'id_quota', 'active',
    'active_roles.add', 'active_roles.remove',
    'new_username', 'org_short_name',
    'name.first', 'name.last', 'name.middle', 'name.suffix'
  ])
  utils.reqCtxMapping(req, 'params', ['shortname', 'username'])
  next()
}

function parseGetParams (req, res, next) {
  utils.reqCtxMapping(req, 'params', ['shortname', 'username', 'identifier'])
  utils.reqCtxMapping(req, 'query', ['page'])
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

function isValidUsername (val) {
  const value = val.match(/^[A-Za-z0-9\-_@.]{3,128}$/)
  if (value == null) {
    throw new Error('Username should be 3-128 characters. Allowed characters are alphanumberic and -_@.')
  }
  return true
}

module.exports = {
  parsePostParams,
  parseGetParams,
  parseError,
  isOrgRole,
  isUserRole,
  isValidUsername
}
