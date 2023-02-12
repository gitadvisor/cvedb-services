const express = require('express')
const router = express.Router()
const controller = require('./system.controller')

router.get('/health-check',
/*
  #swagger.tags = ['Utilities']
  #swagger.operationId = 'healthCheck'
  #swagger.summary = "Checks that the system is running (accessible to all users)"
  #swagger.description = "
        <h2>Access Control</h2>
        <p>Endpoint is accessible to all</p>
        <h2>Expected Behavior</h2>
        <p>Returns a 200 response code when CVE Services are running</p>"
  #swagger.responses[200] = {
    description: 'Returns a 200 response code'
  }
*/
  controller.health_check)

module.exports = router
