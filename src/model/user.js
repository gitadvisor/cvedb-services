const mongoose = require('mongoose')
const aggregatePaginate = require('mongoose-aggregate-paginate-v2')

const schema = {
  _id: false,
  username: String,
  org_UUID: String,
  secret: String,
  UUID: String,
  active: Boolean,
  authority: {
    active_roles: [String]
  },
  name: {
    first: String,
    last: String,
    middle: String,
    suffix: String
  },
  time: {
    created: Date,
    modified: Date
  }
}

const UserSchema = new mongoose.Schema(schema, { collection: 'User', timestamps: { createdAt: 'time.created', updatedAt: 'time.modified' } })

UserSchema.query.byUserName = function (username) {
  return this.where({ username: username })
}

UserSchema.query.byUUID = function (uuid) {
  return this.where({ UUID: uuid })
}

UserSchema.query.byUserNameAndOrgUUID = function (username, orgUUID) {
  return this.where({ username: username, org_UUID: orgUUID })
}

UserSchema.query.byUserUUIDAndOrgUUID = function (uuid, orgUUID) {
  return this.where({ UUID: uuid, org_UUID: orgUUID })
}

UserSchema.index({ UUID: 1 })

UserSchema.plugin(aggregatePaginate)
const User = mongoose.model('User', UserSchema)
module.exports = User
