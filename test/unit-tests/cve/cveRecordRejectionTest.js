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

const errors = require('../../../src/controller/cve.controller/error')
const error = new errors.CveControllerError()
const cveFixtures = require('./mockObjects.cve')
const cveController = require('../../../src/controller/cve.controller/cve.controller')
const cveMiddleware = require('../../../src/controller/cve.controller/cve.middleware')

const rejectedBody = require('../../../test-http/src/test/cve_tests/cve_record_fixtures/rejectBody.json')
const nonExistentId = 'CVE-1800-0001'
const cveIdReserved = 'CVE-2019-1421'

class MyOrg {
  async findOneByShortName (shortName) {
    if (shortName === cveFixtures.regularOrg.short_name) {
      return cveFixtures.regularOrg
    } else if (shortName === cveFixtures.secretariatOrg.short_name) {
      return cveFixtures.secretariatOrg
    }
    return null
  }

  async findOneByUUID (uuid) {
    if (uuid === cveFixtures.regularOrg.UUID) {
      return cveFixtures.regularOrg
    } else if (uuid === cveFixtures.secretariatOrg.UUID) {
      return cveFixtures.secretariatOrg
    }
    return null
  }

  async getOrgUUID (shortName) {
    if (shortName === cveFixtures.regularOrg.short_name) {
      return cveFixtures.regularOrg.UUID
    }
    return null
  }
}

class MyUser {
  async getUserUUID () {
    return null
  }
}

class MyCveIdNegativeTests {
  async findOneByCveId () {
    return null
  }

  async updateByCveId () {
    return null
  }
}

class MyCveNegativeTests {
  async findOneByCveId () {
    return null
  }

  async updateByCveId () {
    return null
  }
}

class MyCveIdPositiveTests {
  async findOneByCveId () {
    return cveFixtures.cveToReject
  }

  async updateByCveId () {
    return cveFixtures.cveToReject
  }
}

class MyCvePositiveTests {
  async findOneByCveId () {
    return null
  }

  async updateByCveId () {
    return cveFixtures.cveToReject
  }
}

app.route('/cve-reject-negative-tests/:id')
  .post((req, res, next) => {
    const factory = {
      getCveIdRepository: () => { return new MyCveIdNegativeTests() },
      getCveRepository: () => { return new MyCveNegativeTests() },
      getOrgRepository: () => { return new MyOrg() },
      getUserRepository: () => { return new MyUser() }
    }
    req.ctx.repositories = factory
    next()
  }, cveMiddleware.parsePostParams, cveController.CVE_REJECT_RECORD)

app.route('/cve-reject-positive-tests/:id')
  .post((req, res, next) => {
    const factory = {
      getCveIdRepository: () => { return new MyCveIdPositiveTests() },
      getCveRepository: () => { return new MyCvePositiveTests() },
      getOrgRepository: () => { return new MyOrg() },
      getUserRepository: () => { return new MyUser() }
    }
    req.ctx.repositories = factory
    next()
  }, cveMiddleware.parsePostParams, cveController.CVE_REJECT_RECORD)

describe('Testing the POST /cve/:id/reject endpoint in Cve Controller', () => {
  context('Negative Tests', () => {
    it('Submit a reject request for record that dne, returns 400', (done) => {
      chai.request(app)
        .post(`/cve-reject-negative-tests/${nonExistentId}`)
        .set(cveFixtures.secretariatHeader)
        .send(rejectedBody)
        .end((err, res) => {
          if (err) {
            done(err)
          }

          expect(res).to.have.status(400)
          expect(res).to.have.property('body').and.to.be.a('object')
          const errObj = error.cveDne()
          expect(res.body.error).to.equal(errObj.error)
          expect(res.body.message).to.equal(errObj.message)
          done()
        })
    })
  })

  context('Positive Tests', () => {
    it('Reject record as secretariat', (done) => {
      chai.request(app)
        .post(`/cve-reject-positive-tests/${cveIdReserved}`)
        .set(cveFixtures.secretariatHeader)
        .send(rejectedBody)
        .end((err, res) => {
          if (err) {
            done(err)
          }
          expect(res).to.have.status(200)
          expect(res).to.have.property('body').and.to.be.a('object')
          done()
        })
    })

    it('Reject record as user', (done) => {
      const headers = Object.assign({}, cveFixtures.secretariatHeader)
      headers['CVE-API-ORG'] = cveFixtures.regularOrg.short_name
      headers['CVE-API-USER'] = cveFixtures.regularUser.username
      chai.request(app)
        .post(`/cve-reject-positive-tests/${cveIdReserved}`)
        .set(headers)
        .send(rejectedBody)
        .end((err, res) => {
          if (err) {
            done(err)
          }
          expect(res).to.have.status(200)
          expect(res).to.have.property('body').and.to.be.a('object')
          done()
        })
    })
  })
})
