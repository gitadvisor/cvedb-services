/* eslint-disable no-unused-expressions */
// https://github.com/standard/standard/issues/690#issuecomment-278533482
const chai = require('chai')
const expect = chai.expect

const cveMiddleware = require('../../../src/controller/cve.controller/cve.middleware')
const rejectedBody = require('../../../test-http/src/test/cve_tests/cve_record_fixtures/rejectBody.json')
const multipleEngDescriptions = require('../../../test-http/src/test/cve_tests/cve_record_fixtures/rejectBodyMultipleSameEngValues.json')

describe('Testing the uniqueEnglishDescription middleware', () => {
  context('Negative Tests', () => {
    it('Submit a reject request with multiple English descriptions', () => {
      const result = cveMiddleware.hasSingleEnglishEntry(multipleEngDescriptions.cnaContainer.rejectedReasons)
      expect(result).to.be.false
    })
  })

  context('Positive Tests', () => {
    it('Submit a reject request with single English descriptions', () => {
      const result = cveMiddleware.hasSingleEnglishEntry(rejectedBody.cnaContainer.rejectedReasons)
      expect(result).to.be.true
    })
  })
})
