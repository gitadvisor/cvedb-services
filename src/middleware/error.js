const idrErr = require('../utils/error')
class MiddlewareError extends idrErr.IDRError {
  badRequest (header) { // mw
    const err = {}
    err.error = 'BAD_REQUEST'
    err.message = `${header} header field required.`
    return err
  }

  unauthorized () { // mw
    const err = {}
    err.error = 'UNAUTHORIZED'
    err.message = 'Unauthorized'
    return err
  }

  secretariatOnly () { // mw
    const err = {}
    err.error = 'SECRETARIAT_ONLY'
    err.message = 'This function is currently only allowed to the Secretariat. This will change for many functions as more administrative roles are implemented.'
    return err
  }

  cnaOnly () { // mw
    const err = {}
    err.error = 'CNA_ONLY'
    err.message = 'This function is currently only allowed to CNAs. This will change for many functions as more administrative roles are implemented.'
    return err
  }

  cnaDoesNotExist (shortname) { // mw
    const err = {}
    err.error = 'CNA_DOES_NOT_EXIST'
    err.message = `The '${shortname}' organization designated by the shortname parameter does not exist.`
    return err
  }

  orgDoesNotExist (shortname) { // mw
    const err = {}
    err.error = 'ORG_DOES_NOT_EXIST'
    err.message = `The '${shortname}' organization designated by the shortname parameter does not exist.`
    return err
  }

  orgHasNoRole (shortname) { // mw
    const err = {}
    err.error = 'ORG_HAS_NO_ROLE'
    err.message = `The '${shortname}' organization designated by the shortname parameter does not have any roles.`
    return err
  }

  orgDoesNotOwnId (org, id) {
    const err = {
      error: 'ORG_DOES_NOT_OWN_ID',
      message: `${org} does not own ${id}`
    }
    return err
  }

  invalidJsonSchema (errors) { // mw
    const err = {}
    err.error = 'INVALID_JSON_SCHEMA'
    err.message = 'CVE JSON schema validation FAILED.'
    err.details = {
      errors: errors
    }

    return err
  }

  invalidJsonSyntax (errors) { // mw
    const err = {}
    err.error = 'INVALID_JSON_SYNTAX'
    err.message = errors
    return err
  }

  genericBadRequest (errors) { // mw
    const err = {}
    err.error = 'BAD_REQUEST'
    err.message = errors
    return err
  }

  recordTooLarge () { // mw
    const err = {}
    err.error = 'RECORD_TOO_LARGE'
    err.message = 'Records must be less than 3.8MB.'
    return err
  }
}

module.exports = {
  MiddlewareError
}
