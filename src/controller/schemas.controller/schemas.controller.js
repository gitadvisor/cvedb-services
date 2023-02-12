
// Schemas relating to CVE records
async function getCreateCveRecordResponseSchema (req, res) {
  const createCveRecordResponseSchema = require('../../../schemas/cve/create-cve-record-response.json')
  res.json(createCveRecordResponseSchema)
  res.status(200)
}

async function getCreateCveRecordRejectionRequestSchema (req, res) {
  const createCveRecordRejectionRequestSchema = require('../../../schemas/cve/create-cve-record-rejection-request.json')
  res.json(createCveRecordRejectionRequestSchema)
  res.status(200)
}

async function getCreateCveRecordRejectionResponseSchema (req, res) {
  const createCveRecordRejectionResponseSchema = require('../../../schemas/cve/create-cve-record-rejection-response.json')
  res.json(createCveRecordRejectionResponseSchema)
  res.status(200)
}

async function getUpdateCveRecordRejectionRequestSchema (req, res) {
  const updateCveRecordRejectionRequestSchema = require('../../../schemas/cve/update-cve-record-rejection-request.json')
  res.json(updateCveRecordRejectionRequestSchema)
  res.status(200)
}

async function getUpdateCveRecordRejectionResponseSchema (req, res) {
  const updateCveRecordRejectionResponseSchema = require('../../../schemas/cve/update-cve-record-rejection-response.json')
  res.json(updateCveRecordRejectionResponseSchema)
  res.status(200)
}

async function getCveRecordMinimumSchema (req, res) {
  const cveRecordMinimumSchema = require('../../../schemas/cve/cve-record-minimum-request.json')
  res.json(cveRecordMinimumSchema)
  res.status(200)
}

async function getCveRecordResponseSchema (req, res) {
  const cveRecordSchema = require('../../../schemas/cve/get-cve-record-response.json')
  res.json(cveRecordSchema)
  res.status(200)
}

async function getFullCveRecordRequestSchema (req, res) {
  const getFullCveRecordRequestSchema = require('../../../schemas/cve/create-full-cve-record-request.json')
  res.json(getFullCveRecordRequestSchema)
  res.status(200)
}

async function getFullUpdateCveRecordResponseSchema (req, res) {
  const getFullUpdateCveRecordResponseSchema = require('../../../schemas/cve/update-full-cve-record-response.json')
  res.json(getFullUpdateCveRecordResponseSchema)
  res.status(200)
}

async function getListCveRecordsResponseSchema (req, res) {
  const listCveRecordsSchema = require('../../../schemas/cve/list-cve-records-response.json')
  res.json(listCveRecordsSchema)
  res.status(200)
}

async function getUpdateCveRecordResponseSchema (req, res) {
  const updateCveRecordResponseSchema = require('../../../schemas/cve/update-cve-record-response.json')
  res.json(updateCveRecordResponseSchema)
  res.status(200)
}

// Schemas relating to CVE IDs
async function getCreateCveIdsResponseSchema (req, res) {
  const createCveIdsResponseSchema = require('../../../schemas/cve-id/create-cve-ids-response.json')
  res.json(createCveIdsResponseSchema)
  res.status(200)
}

async function getCreateCveIdsPartialResponseSchema (req, res) {
  const createCveIdsPartialResponseSchema = require('../../../schemas/cve-id/create-cve-ids-partial-response.json')
  res.json(createCveIdsPartialResponseSchema)
  res.status(200)
}

async function getCveIdResponseSchema (req, res) {
  const getCveIdResponseSchema = require('../../../schemas/cve-id/get-cve-id-response.json')
  res.json(getCveIdResponseSchema)
  res.status(200)
}

async function getListCveIdsResponseSchema (req, res) {
  const listCveIdsResponseSchema = require('../../../schemas/cve-id/list-cve-ids-response.json')
  res.json(listCveIdsResponseSchema)
  res.status(200)
}

async function getUpdateCVEIdResponseSchema (req, res) {
  const updateCveIdsResponseSchema = require('../../../schemas/cve-id/update-cve-id-response.json')
  res.json(updateCveIdsResponseSchema)
  res.status(200)
}

// Schemas relating to errors
async function getBadRequestSchema (req, res) {
  const badRequestSchema = require('../../../schemas/errors/bad-request.json')
  res.json(badRequestSchema)
  res.status(200)
}

async function getGenericErrorSchema (req, res) {
  const genericErrorSchema = require('../../../schemas/errors/generic.json')
  res.json(genericErrorSchema)
  res.status(200)
}

// Schemas relating to organizations

async function getCreateOrgRequestSchema (req, res) {
  const createOrgRequestSchema = require('../../../schemas/org/create-org-request.json')
  res.json(createOrgRequestSchema)
  res.status(200)
}

async function getCreateOrgResponseSchema (req, res) {
  const createOrgResponseSchema = require('../../../schemas/org/create-org-response.json')
  res.json(createOrgResponseSchema)
  res.status(200)
}

async function getListOrgsResponseSchema (req, res) {
  const listOrgsResponseSchema = require('../../../schemas/org/list-orgs-response.json')
  res.json(listOrgsResponseSchema)
  res.status(200)
}

async function getOrgResponseSchema (req, res) {
  const getOrgResponseSchema = require('../../../schemas/org/get-org-response.json')
  res.json(getOrgResponseSchema)
  res.status(200)
}

async function getOrgQuotaResponseSchema (req, res) {
  const getOrgQuotaResponseSchema = require('../../../schemas/org/get-org-quota-response.json')
  res.json(getOrgQuotaResponseSchema)
  res.status(200)
}

async function getUpdateOrgResponseSchema (req, res) {
  const updateOrgResponseSchema = require('../../../schemas/org/update-org-response.json')
  res.json(updateOrgResponseSchema)
  res.status(200)
}

// Schemas relating to users

async function getCreateUserRequestSchema (req, res) {
  const createUserRequestSchema = require('../../../schemas/user/create-user-request.json')
  res.json(createUserRequestSchema)
  res.status(200)
}

async function getCreateUserResponseSchema (req, res) {
  const createUserResponseSchema = require('../../../schemas/user/create-user-response.json')
  res.json(createUserResponseSchema)
  res.status(200)
}

async function getListUsersSchema (req, res) {
  const listUsersResponseSchema = require('../../../schemas/user/list-users-response.json')
  res.json(listUsersResponseSchema)
  res.status(200)
}

async function getUserResponseSchema (req, res) {
  const getUserResponseSchema = require('../../../schemas/user/get-user-response.json')
  res.json(getUserResponseSchema)
  res.status(200)
}

async function getResetSecretResponseSchema (req, res) {
  const resetSecretResponseSchema = require('../../../schemas/user/reset-secret-response.json')
  res.json(resetSecretResponseSchema)
  res.status(200)
}

async function getUpdateUserResponseSchema (req, res) {
  const updateUserResponseSchema = require('../../../schemas/user/update-user-response.json')
  res.json(updateUserResponseSchema)
  res.status(200)
}

module.exports = {
  getBadRequestSchema: getBadRequestSchema,
  getCreateCveRecordResponseSchema: getCreateCveRecordResponseSchema,
  getCreateCveRecordRejectionRequestSchema: getCreateCveRecordRejectionRequestSchema,
  getCreateCveRecordRejectionResponseSchema: getCreateCveRecordRejectionResponseSchema,
  getUpdateCveRecordRejectionRequestSchema: getUpdateCveRecordRejectionRequestSchema,
  getUpdateCveRecordRejectionResponseSchema: getUpdateCveRecordRejectionResponseSchema,
  getCveRecordMinimumSchema: getCveRecordMinimumSchema,
  getCveRecordResponseSchema: getCveRecordResponseSchema,
  getFullCveRecordRequestSchema: getFullCveRecordRequestSchema,
  getFullUpdateCveRecordResponseSchema: getFullUpdateCveRecordResponseSchema,
  getListCveRecordsResponseSchema: getListCveRecordsResponseSchema,
  getUpdateCveRecordResponseSchema: getUpdateCveRecordResponseSchema,
  getCreateCveIdsResponseSchema: getCreateCveIdsResponseSchema,
  getCreateCveIdsPartialResponseSchema: getCreateCveIdsPartialResponseSchema,
  getCveIdResponseSchema: getCveIdResponseSchema,
  getListCveIdsResponseSchema: getListCveIdsResponseSchema,
  getGenericErrorSchema: getGenericErrorSchema,
  getCreateOrgRequestSchema: getCreateOrgRequestSchema,
  getCreateOrgResponseSchema: getCreateOrgResponseSchema,
  getListOrgsResponseSchema: getListOrgsResponseSchema,
  getOrgResponseSchema: getOrgResponseSchema,
  getOrgQuotaResponseSchema: getOrgQuotaResponseSchema,
  getUpdateOrgResponseSchema: getUpdateOrgResponseSchema,
  getCreateUserRequestSchema: getCreateUserRequestSchema,
  getCreateUserResponseSchema: getCreateUserResponseSchema,
  getListUsersSchema: getListUsersSchema,
  getUserResponseSchema: getUserResponseSchema,
  getResetSecretResponseSchema: getResetSecretResponseSchema,
  getUpdateUserResponseSchema: getUpdateUserResponseSchema,
  getUpdateCVEIdResponseSchema: getUpdateCVEIdResponseSchema
}
