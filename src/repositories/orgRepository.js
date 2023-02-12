const BaseRepository = require('./baseRepository')
const Org = require('../model/org')
const utils = require('../utils/utils')

class OrgRepository extends BaseRepository {
  constructor () {
    super(Org)
  }

  async findOneByShortName (shortName) {
    return this.collection.findOne().byShortName(shortName)
  }

  async findOneByUUID (UUID) {
    return this.collection.findOne().byUUID(UUID)
  }

  async getOrgUUID (shortName) {
    return utils.getOrgUUID(shortName)
  }

  async updateByOrgUUID (orgUUID, org, options = {}) {
    return this.collection.findOneAndUpdate().byUUID(orgUUID).updateOne(org).setOptions(options)
  }

  async isSecretariat (shortName) {
    return utils.isSecretariat(shortName)
  }

  async isSecretariatUUID (shortName) {
    return utils.isSecretariatUUID(shortName)
  }

  async isBulkDownload (shortName) {
    return utils.isBulkDownload(shortName)
  }
}

module.exports = OrgRepository
