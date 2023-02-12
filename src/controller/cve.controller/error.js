const idrErr = require('../../utils/error')

class CveControllerError extends idrErr.IDRError {
  cveIdMismatch () { // cve
    const err = {}
    err.error = 'CVEID_MISMATCH'
    err.message = 'The cve id parameter does not match the cve id in the JSON body.'
    return err
  }

  cveRecordExists () { // cve
    const err = {}
    err.error = 'CVE_RECORD_EXISTS'
    err.message = 'The cve record for the cve id already exists.'
    return err
  }

  cveRecordDne () { // cve
    const err = {}
    err.error = 'CVE_RECORD_DNE'
    err.message = 'The cve record for the cve id does not exist.'
    return err
  }

  cveDne () { // cve
    const err = {}
    err.error = 'CVEID_DNE'
    err.message = 'The cve id does not exist.'
    return err
  }

  cveCreateUnsupportedState (state) { // cve
    const err = {}
    err.error = 'CVE_UNSUPPORTED_RECORD_STATE'
    err.message = `Cannot create cve record in state ${state}.`
    return err
  }

  cveUpdateUnsupportedState (state) { // cve
    const err = {}
    err.error = 'CVE_UNSUPPORTED_RECORD_STATE'
    err.message = `Cannot update cve record in state ${state}.`
    return err
  }

  invalidCnaContainerJsonSchema (errors) { // cve
    const err = {}
    err.error = 'INVALID_JSON_SCHEMA'
    err.message = 'CVE cnaContainer JSON schema validation FAILED.'
    err.details = {
      errors: errors
    }
    return err
  }

  owningOrgDoesNotMatch () { // cve
    const err = {}
    err.error = 'CVEID_ORG_DOES_NOT_MATCH'
    err.message = 'The cve id owning org does not match user org.'
    return err
  }

  unableToUpdateByCveID () { // cve
    const err = {}
    err.error = 'UNABLE_TO_UPDATE_BY_CVE_ID'
    err.message = 'Could not update by CVE id.'
    return err
  }

  unableToStoreCveRecord () { // cve
    const err = {}
    err.error = 'UNABLE_TO_STORE_CVE_RECORD'
    err.message = 'A problem occurred while saving the CVE Record, ensure that x_ values do not start with $'
    return err
  }

  paramDne (param) { // cve
    const err = {}
    err.error = 'BAD_PARAMETER_NAME'
    err.message = `'${param}' is not a valid parameter.`
    return err
  }
}

module.exports = {
  CveControllerError
}
