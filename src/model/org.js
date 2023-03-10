require('dotenv').config()
const mongoose = require('mongoose')
const aggregatePaginate = require('mongoose-aggregate-paginate-v2')
const getConstants = require('../constants').getConstants
const CONSTANTS = getConstants()

const schema = {
  _id: false,
  name: String,
  short_name: String,
  UUID: String,
  authority: {
    active_roles: [String]
  },
  policies: {
    id_quota: {
      type: Number,
      min: [CONSTANTS.MONGOOSE_VALIDATION.Org_policies_id_quota_min, CONSTANTS.MONGOOSE_VALIDATION.Org_policies_id_quota_min_message],
      max: [CONSTANTS.MONGOOSE_VALIDATION.Org_policies_id_quota_max, CONSTANTS.MONGOOSE_VALIDATION.Org_policies_id_quota_max_message]
    }
  },
  time: {
    created: Date,
    modified: Date
  },
  inUse: Boolean
}

const OrgSchema = new mongoose.Schema(schema, { collection: 'Org', timestamps: { createdAt: 'time.created', updatedAt: 'time.modified' } })

OrgSchema.query.byShortName = function (shortName) {
  return this.where({ short_name: shortName })
}

OrgSchema.query.byUUID = function (uuid) {
  return this.where({ UUID: uuid })
}

OrgSchema.index({ UUID: 1 })
OrgSchema.index({ 'authority.active_roles': 1 })

OrgSchema.plugin(aggregatePaginate)
const Org = mongoose.model('Org', OrgSchema)
module.exports = Org
