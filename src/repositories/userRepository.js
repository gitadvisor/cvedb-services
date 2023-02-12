const BaseRepository = require('./baseRepository')
const User = require('../model/user')
const utils = require('../utils/utils')

class UserRepository extends BaseRepository {
  constructor () {
    super(User)
  }

  async getUserUUID (userName, orgUUID) {
    return utils.getUserUUID(userName, orgUUID)
  }

  async isAdmin (username, shortname) {
    return utils.isAdmin(username, shortname)
  }

  async isAdminUUID (username, orgUUID) {
    return utils.isAdminUUID(username, orgUUID)
  }

  async findOneByUUID (UUID) {
    return this.collection.findOne().byUUID(UUID)
  }

  async findOneByUserNameAndOrgUUID (userName, orgUUID) {
    return this.collection.findOne().byUserNameAndOrgUUID(userName, orgUUID)
  }

  async updateByUserNameAndOrgUUID (username, orgUUID, user, options = {}) {
    return this.collection.findOneAndUpdate().byUserNameAndOrgUUID(username, orgUUID).updateOne(user).setOptions(options)
  }
}

module.exports = UserRepository
