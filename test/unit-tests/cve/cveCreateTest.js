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
const nonExistentCveId = 'CVE-2020-1425'
const cveIdPublished5 = 'CVE-2017-4024'
const cveIdReserved5 = 'CVE-2017-5833'
const cveIdAvailable5 = 'CVE-2017-5834'
const cveIdRejected5 = 'CVE-2017-5835'
const cvePublishedPass5 = require('../../schemas/5.0/' + cveIdPublished5 + '_published.json')
const cveReservedPass5 = require('../../schemas/5.0/' + cveIdReserved5 + '_reserved.json')
const cveRejectedPass5 = require('../../schemas/5.0/' + cveIdRejected5 + '_rejected.json')
const errors = require('../../../src/controller/cve.controller/error')
const error = new errors.CveControllerError()

const cveFixtures = require('./mockObjects.cve')
const cveController = require('../../../src/controller/cve.controller/cve.controller')
const cveParams = require('../../../src/controller/cve.controller/cve.middleware')

class MyOrg {
  async getOrgUUID () {
    return null
  }
}

class MyUser {
  async getUserUUID () {
    return null
  }
}

class MyCveIdNegativeTests {
  async findOneByCveId (id) {
    if (id === cveIdAvailable5) {
      return cveFixtures.cveAvailable5
    } else if (id === cveIdPublished5) {
      return cveFixtures.cvePublished5
    }

    return null
  }

  async updateByCveId () {
    return null
  }
}

class MyCveNegativeTests {
  async findOneByCveId (id) {
    if (id === cveIdPublished5) {
      return cvePublishedPass5
    }

    return null
  }

  async updateByCveId () {
    return null
  }
}

class MyCveIdPositiveTests {
  constructor () {
    this.publishedDoc = cveFixtures.cvePublished5
    this.rejectedDoc = cveFixtures.cveRejected5
  }

  getCveIdPublished () {
    return this.publishedDoc
  }

  getCveIdRejected () {
    return this.rejectedDoc
  }

  async findOneByCveId (id) {
    if (id === cveIdPublished5) {
      return cveFixtures.cvePublished5
    }

    return cveFixtures.cveRejected5
  }

  async updateByCveId (id, cveId) {
    if (id === cveIdPublished5) {
      this.publishedDoc.state = cveId.state
    } else {
      this.rejectedDoc.state = cveId.state
    }

    return null
  }
}

class MyCvePositiveTests {
  async findOneByCveId () {
    return null
  }

  async updateByCveId () {
    return null
  }
}

app.route('/cve-create-record-negative-tests/:id')
  .post((req, res, next) => {
    const factory = {
      getCveRepository: () => { return new MyCveNegativeTests() },
      getCveIdRepository: () => { return new MyCveIdNegativeTests() },
      getOrgRepository: () => { return new MyOrg() },
      getUserRepository: () => { return new MyUser() }
    }
    req.ctx.repositories = factory
    next()
  }, cveParams.parsePostParams, cveController.CVE_SUBMIT)

app.route('/cve-create-record-positive-tests/:id')
  .post((req, res, next) => {
    const factory = {
      getCveRepository: () => { return new MyCvePositiveTests() },
      getCveIdRepository: () => { return new MyCveIdPositiveTests() },
      getOrgRepository: () => { return new MyOrg() },
      getUserRepository: () => { return new MyUser() }
    }
    req.ctx.repositories = factory
    next()
  }, cveParams.parsePostParams, cveController.CVE_SUBMIT)

describe('Testing the POST /cve/:id endpoint in Cve Controller', () => {
  context('Negative Tests', () => {
    it('should return 400 bad request because the cve id in the parameter does not match the cve id in the JSON body', (done) => {
      chai.request(app)
        .post(`/cve-create-record-negative-tests/${nonExistentCveId}`)
        .set(cveFixtures.secretariatHeader)
        .send(cvePublishedPass5)
        .end((err, res) => {
          if (err) {
            done(err)
          }

          expect(res).to.have.status(400)
          expect(res).to.have.property('body').and.to.be.a('object')
          const errObj = error.cveIdMismatch()
          expect(res.body.error).to.equal(errObj.error)
          expect(res.body.message).to.equal(errObj.message)
          done()
        })
    })

    it('should return 400 bad request because the cve record cannot be created in the RESERVED state', (done) => {
      const CONSTANTS = getConstants()

      chai.request(app)
        .post(`/cve-create-record-negative-tests/${cveIdReserved5}`)
        .set(cveFixtures.secretariatHeader)
        .send(cveReservedPass5)
        .end((err, res) => {
          if (err) {
            done(err)
          }

          expect(res).to.have.status(400)
          expect(res).to.have.property('body').and.to.be.a('object')
          const errObj = error.cveCreateUnsupportedState(CONSTANTS.CVE_STATES.RESERVED)
          expect(res.body.error).to.equal(errObj.error)
          expect(res.body.message).to.equal(errObj.message)
          done()
        })
    })

    it('should return 403 forbidden because the cve id does not exist', (done) => {
      const nonExistentCve = JSON.parse(JSON.stringify(cvePublishedPass5))
      nonExistentCve.cveMetadata.cveId = nonExistentCveId

      chai.request(app)
        .post(`/cve-create-record-negative-tests/${nonExistentCveId}`)
        .set(cveFixtures.secretariatHeader)
        .send(nonExistentCve)
        .end((err, res) => {
          if (err) {
            done(err)
          }

          expect(res).to.have.status(403)
          expect(res).to.have.property('body').and.to.be.a('object')
          const errObj = error.cveDne()
          expect(res.body.error).to.equal(errObj.error)
          expect(res.body.message).to.equal(errObj.message)
          done()
        })
    })

    it('should return 403 forbidden because the cve id has state AVAILABLE', (done) => {
      const testCve = JSON.parse(JSON.stringify(cvePublishedPass5))
      testCve.cveMetadata.cveId = cveIdAvailable5

      chai.request(app)
        .post(`/cve-create-record-negative-tests/${cveIdAvailable5}`)
        .set(cveFixtures.secretariatHeader)
        .send(testCve)
        .end((err, res) => {
          if (err) {
            done(err)
          }

          expect(res).to.have.status(403)
          expect(res).to.have.property('body').and.to.be.a('object')
          const errObj = error.cveDne()
          expect(res.body.error).to.equal(errObj.error)
          expect(res.body.message).to.equal(errObj.message)
          done()
        })
    })

    it('should return 400 bad request because the cve record already exist', (done) => {
      chai.request(app)
        .post(`/cve-create-record-negative-tests/${cveIdPublished5}`)
        .set(cveFixtures.secretariatHeader)
        .send(cvePublishedPass5)
        .end((err, res) => {
          if (err) {
            done(err)
          }

          expect(res).to.have.status(400)
          expect(res).to.have.property('body').and.to.be.a('object')
          const errObj = error.cveRecordExists()
          expect(res.body.error).to.equal(errObj.error)
          expect(res.body.message).to.equal(errObj.message)
          done()
        })
    })
  })

  context('Positive Tests', () => {
    it('State PUBLISHED: should return the cve record because the cve record was created', (done) => {
      const CONSTANTS = getConstants()
      const cveIdTestRepo = new MyCveIdPositiveTests()
      const doc = cveIdTestRepo.getCveIdPublished() // get internal state of cveId document
      expect(doc).to.have.property('cve_id').and.to.equal(cveIdPublished5)
      expect(doc).to.have.property('state').and.to.equal(CONSTANTS.CVE_STATES.RESERVED)

      chai.request(app)
        .post(`/cve-create-record-positive-tests/${cveIdPublished5}`)
        .set(cveFixtures.secretariatHeader)
        .send(cvePublishedPass5)
        .end((err, res) => {
          if (err) {
            done(err)
          }

          expect(res).to.have.status(200)
          expect(res).to.have.property('body').and.to.be.a('object')
          expect(res.body).to.have.property('created').and.to.be.a('object')
          expect(res.body.created).to.have.nested.property('cveMetadata.cveId').and.to.equal(cveIdPublished5)
          expect(res.body.created).to.have.nested.property('cveMetadata.state').and.to.equal(CONSTANTS.CVE_STATES.PUBLISHED)
          expect(doc).to.have.property('cve_id').and.to.equal(cveIdPublished5)
          expect(doc).to.have.property('state').and.to.equal(CONSTANTS.CVE_STATES.PUBLISHED)
          done()
        })
    })

    it('STATE REJECTED: should return the cve record because the cve record was created', (done) => {
      const CONSTANTS = getConstants()
      const cveIdTestRepo = new MyCveIdPositiveTests()
      const doc = cveIdTestRepo.getCveIdRejected() // get internal state of cveId document
      expect(doc).to.have.property('cve_id').and.to.equal(cveIdRejected5)
      expect(doc).to.have.property('state').and.to.equal(CONSTANTS.CVE_STATES.RESERVED)

      chai.request(app)
        .post(`/cve-create-record-positive-tests/${cveIdRejected5}`)
        .set(cveFixtures.secretariatHeader)
        .send(cveRejectedPass5)
        .end((err, res) => {
          if (err) {
            done(err)
          }

          expect(res).to.have.status(200)
          expect(res).to.have.property('body').and.to.be.a('object')
          expect(res.body).to.have.property('created').and.to.be.a('object')
          expect(res.body.created).to.have.nested.property('cveMetadata.cveId').and.to.equal(cveIdRejected5)
          expect(res.body.created).to.have.nested.property('cveMetadata.state').and.to.equal(CONSTANTS.CVE_STATES.REJECTED)
          expect(doc).to.have.property('cve_id').and.to.equal(cveIdRejected5)
          expect(doc).to.have.property('state').and.to.equal(CONSTANTS.CVE_STATES.REJECTED)
          done()
        })
    })
  })
})
