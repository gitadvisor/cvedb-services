const express = require('express')
const app = express()
const chai = require('chai')
const expect = chai.expect
chai.use(require('chai-http'))

// Body Parser Middleware
app.use(express.json()) // Allows us to handle raw JSON data
app.use(express.urlencoded({ extended: false })) // Allows us to handle url encoded data
const middleware = require('../../../src/middleware/middleware')
app.use(middleware.createCtxAndReqUUID)

const getConstants = require('../../../src/constants').getConstants
const nonExistentCveRecord = 'CVE-2020-1425'
const cveIdPublished5 = 'CVE-2017-4024'
const cveIdRejected5 = 'CVE-2017-5835'
const errors = require('../../../src/controller/cve.controller/error')
const error = new errors.CveControllerError()

const cveFixtures = require('./mockObjects.cve')
const cveController = require('../../../src/controller/cve.controller/cve.controller')
const cveParams = require('../../../src/controller/cve.controller/cve.middleware')

class MyCveNegativeTests {
  async findOneByCveId () {
    return null
  }
}

class MyCvePositiveTests {
  async findOneByCveId (id) {
    if (id === cveIdPublished5) {
      return cveFixtures.cveRecordPublished5
    } else if (id === cveIdRejected5) {
      return cveFixtures.cveRecordRejected5
    }
  }
}

app.route('/cve-get-record-negative-tests/:id')
  .get((req, res, next) => {
    const factory = {
      getCveRepository: () => { return new MyCveNegativeTests() }
    }
    req.ctx.repositories = factory
    next()
  }, cveParams.parseGetParams, cveController.CVE_GET_SINGLE)

app.route('/cve-get-record-positive-tests/:id')
  .get((req, res, next) => {
    const factory = {
      getCveRepository: () => { return new MyCvePositiveTests() }
    }
    req.ctx.repositories = factory
    next()
  }, cveParams.parseGetParams, cveController.CVE_GET_SINGLE)

describe('Testing the GET /cve/:id endpoint in Cve Controller', () => {
  context('Negative Tests', () => {
    it('CVE_RECORD_DNE returned: The cve record does not exist for the provided cve id', (done) => {
      chai.request(app)
        .get(`/cve-get-record-negative-tests/${nonExistentCveRecord}`)
        .set(cveFixtures.secretariatHeader)
        .end((err, res) => {
          if (err) {
            done(err)
          }

          expect(res).to.have.status(404)
          expect(res).to.have.property('body').and.to.be.a('object')
          const errObj = error.cveRecordDne()
          expect(res.body.error).to.equal(errObj.error)
          expect(res.body.message).to.equal(errObj.message)
          done()
        })
    })
  })

  context('Positive Tests', () => {
    it('JSON schema v5.0 returned: The secretariat gets a cve record in PUBLISHED state', (done) => {
      chai.request(app)
        .get(`/cve-get-record-positive-tests/${cveIdPublished5}`)
        .set(cveFixtures.secretariatHeader)
        .end((err, res) => {
          if (err) {
            done(err)
          }

          const CONSTANTS = getConstants()

          expect(res).to.have.status(200)
          expect(res).to.have.property('body').and.to.be.a('object')
          expect(res.body).to.have.nested.property('cveMetadata.cveId').and.to.equal(cveIdPublished5)
          expect(res.body).to.have.nested.property('cveMetadata.state').and.to.equal(CONSTANTS.CVE_STATES.PUBLISHED)
          done()
        })
    })

    it('JSON schema v5.0 returned: The secretariat gets a cve record in REJECTED state', (done) => {
      chai.request(app)
        .get(`/cve-get-record-positive-tests/${cveIdRejected5}`)
        .set(cveFixtures.secretariatHeader)
        .end((err, res) => {
          if (err) {
            done(err)
          }

          const CONSTANTS = getConstants()

          expect(res).to.have.status(200)
          expect(res).to.have.property('body').and.to.be.a('object')
          expect(res.body).to.have.nested.property('cveMetadata.cveId').and.to.equal(cveIdRejected5)
          expect(res.body).to.have.nested.property('cveMetadata.state').and.to.equal(CONSTANTS.CVE_STATES.REJECTED)
          done()
        })
    })

    it('Filter by assignerShortName', (done) => {
      chai.request(app)
        .get(`/cve-get-record-positive-tests/${cveIdPublished5}`)
        .set(cveFixtures.secretariatHeader)
        .end((err, res) => {
          if (err) {
            done(err)
          }

          expect(res).to.have.status(200)
          expect(res).to.have.property('body').and.to.be.a('object')
          expect(res.body).to.have.nested.property('cveMetadata.cveId').and.to.equal(cveIdPublished5)
          expect(res.body).to.have.nested.property('cveMetadata.assignerShortName').and.to.equal('cisco')
          done()
        })
    })

    it('Filter by assigner', (done) => {
      chai.request(app)
        .get(`/cve-get-record-positive-tests/${cveIdPublished5}`)
        .set(cveFixtures.secretariatHeader)
        .end((err, res) => {
          if (err) {
            done(err)
          }

          expect(res).to.have.status(200)
          expect(res).to.have.property('body').and.to.be.a('object')
          expect(res.body).to.have.nested.property('cveMetadata.cveId').and.to.equal(cveIdPublished5)
          expect(res.body).to.have.nested.property('cveMetadata.assignerOrgId').and.to.equal('88c02595-c8f7-4864-a0e7-e09b3e1da691')
          done()
        })
    })
  })
})
