const express = require('express')
const router = express.Router()
const controller = require('./schemas.controller')

// Schemas relating to CVE records
router.get('/cve/create-cve-record-response.json', controller.getCreateCveRecordResponseSchema)
router.get('/cve/create-cve-record-rejection-request.json', controller.getCreateCveRecordRejectionRequestSchema)
router.get('/cve/create-cve-record-rejection-response.json', controller.getCreateCveRecordRejectionResponseSchema)
router.get('/cve/update-cve-record-rejection-request.json', controller.getUpdateCveRecordRejectionRequestSchema)
router.get('/cve/update-cve-record-rejection-response.json', controller.getUpdateCveRecordRejectionResponseSchema)
router.get('/cve/cve-record-minimum-request.json', controller.getCveRecordMinimumSchema)
router.get('/cve/get-cve-record-response.json', controller.getCveRecordResponseSchema)
router.get('/cve/list-cve-records-response.json', controller.getListCveRecordsResponseSchema)
router.get('/cve/update-cve-record-response.json', controller.getUpdateCveRecordResponseSchema)
router.get('/cve/create-full-cve-record-request.json', controller.getFullCveRecordRequestSchema)
router.get('/cve/update-full-cve-record-response.json', controller.getFullUpdateCveRecordResponseSchema)

// Schemas relating to CVE IDs
router.get('/cve-id/create-cve-ids-response.json', controller.getCreateCveIdsResponseSchema)
router.get('/cve-id/create-cve-ids-partial-response.json', controller.getCreateCveIdsPartialResponseSchema)
router.get('/cve-id/get-cve-id-response.json', controller.getCveIdResponseSchema)
router.get('/cve-id/list-cve-ids-response.json', controller.getListCveIdsResponseSchema)
router.get('/cve-id/update-cve-id-response.json', controller.getUpdateCVEIdResponseSchema)

// Schemas relating to errors
router.get('/errors/bad-request.json', controller.getBadRequestSchema)
router.get('/errors/generic.json', controller.getGenericErrorSchema)

// Schemas relating to organizations
router.get('/org/create-org-request.json', controller.getCreateOrgRequestSchema)
router.get('/org/create-org-response.json', controller.getCreateOrgResponseSchema)
router.get('/org/get-org-response.json', controller.getOrgResponseSchema)
router.get('/org/list-orgs-response.json', controller.getListOrgsResponseSchema)
router.get('/org/get-org-quota-response.json', controller.getOrgQuotaResponseSchema)
router.get('/org/update-org-response.json', controller.getUpdateOrgResponseSchema)

// Schemas relating to users
router.get('/user/create-user-request.json', controller.getCreateUserRequestSchema)
router.get('/user/create-user-response.json', controller.getCreateUserResponseSchema)
router.get('/user/get-user-response.json', controller.getUserResponseSchema)
router.get('/user/list-users-response.json', controller.getListUsersSchema)
router.get('/user/reset-secret-response.json', controller.getResetSecretResponseSchema)
router.get('/user/update-user-response.json', controller.getUpdateUserResponseSchema)

module.exports = router
