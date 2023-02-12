const { validationResult } = require('express-validator')
const errors = require('./error')
const error = new errors.UserControllerError()
const utils = require('../../utils/utils')

function parseGetParams (req, res, next) {
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

module.exports = {
  parseGetParams,
  parseError
}
