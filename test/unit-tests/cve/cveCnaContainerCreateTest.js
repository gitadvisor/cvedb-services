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

const nonExistentCveId = 'CVE-2020-1425'
const cveIdPublished5 = 'CVE-2017-4024'
const cveIdReserved = 'CVE-2017-5835'
const url = process.env.NODE_ENV === 'staging' ? 'https://test.cve.org/' : 'https://cve.org/' // Used in submitCna response messages
const cveCnaContainerFail = require('../../schemas/cna-container/cna-container_fail.json')
const cveCnaContainerPass = require('../../schemas/cna-container/cna-container_pass.json')
const errors = require('../../../src/controller/cve.controller/error')
const error = new errors.CveControllerError()

const cveFixtures = require('./mockObjects.cve')
const cveController = require('../../../src/controller/cve.controller/cve.controller')
const cveParams = require('../../../src/controller/cve.controller/cve.middleware')

class MyOrg {
  async getOrgUUID (shortName) {
    if (shortName === cveFixtures.regularOrg.short_name) {
      return cveFixtures.regularOrg.UUID
    } else if (shortName === cveFixtures.secretariatOrg.short_name) {
      return cveFixtures.secretariatOrg.UUID
    }
    return null
  }

  async isSecretariat (org) {
    if (org === cveFixtures.secretariatHeader['CVE-API-ORG']) {
      return true
    }
    return null
  }

  async findOneByUUID () {
    return cveFixtures.secretariatOrg
  }
}

class MyUser {
  async getUserUUID () {
    return null
  }
}

class MyCveIdNegativeTests {
  async findOneByCveId (id) {
    if (id === cveIdPublished5) {
      const fixture = cveFixtures.cvePublished5
      fixture.owning_cna = 'random'
      return fixture
    }
    if (id === cveIdReserved) {
      const fixture = cveFixtures.cveRejected5
      fixture.reserved = new Date()
      return fixture
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
      return true
    }
    return null
  }

  async updateByCveId () {
    return null
  }
}

class MyCveIdPositiveTests {
  async findOneByCveId (id) {
    if (id === cveIdPublished5) {
      return cveFixtures.cvePublished5
    }
    if (id === cveIdReserved) {
      const cveId = Object.assign({}, cveFixtures.cveRejected5)
      cveId.owning_cna = cveFixtures.regularOrg.UUID
      return cveId
    }
    return cveFixtures.cveRejected5
  }

  async updateByCveId (id, cveId) {
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

app.route('/cve-cna-negative-tests/:id')
  .post((req, res, next) => {
    const factory = {
      getCveIdRepository: () => { return new MyCveIdNegativeTests() },
      getCveRepository: () => { return new MyCveNegativeTests() },
      getOrgRepository: () => { return new MyOrg() },
      getUserRepository: () => { return new MyUser() }
    }
    req.ctx.repositories = factory
    next()
  }, cveParams.parsePostParams, cveController.CVE_SUBMIT_CNA)

app.route('/cve-cna-positive-tests/:id')
  .post((req, res, next) => {
    const factory = {
      getCveIdRepository: () => { return new MyCveIdPositiveTests() },
      getCveRepository: () => { return new MyCvePositiveTests() },
      getOrgRepository: () => { return new MyOrg() },
      getUserRepository: () => { return new MyUser() }
    }
    req.ctx.repositories = factory
    next()
  }, cveParams.parsePostParams, cveController.CVE_SUBMIT_CNA)

describe('Testing the POST /cve/:id/cna endpoint in Cve Controller', () => {
  context('Negative Tests', () => {
    it('should return 400 when cveId does not exist', (done) => {
      chai.request(app)
        .post(`/cve-cna-negative-tests/${nonExistentCveId}`)
        .set(cveFixtures.secretariatHeader)
        .send(cveCnaContainerFail)
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

    it('should return 403 when cveId does not belong to cveId owning org', (done) => {
      const headers = Object.assign({}, cveFixtures.secretariatHeader)
      headers['CVE-API-ORG'] = 'cisco'
      chai.request(app)
        .post(`/cve-cna-negative-tests/${cveIdPublished5}`)
        .set(headers)
        .send(cveCnaContainerFail)
        .end((err, res) => {
          if (err) {
            done(err)
          }

          expect(res).to.have.status(403)
          expect(res).to.have.property('body').and.to.be.a('object')
          const errObj = error.owningOrgDoesNotMatch()
          expect(res.body.error).to.equal(errObj.error)
          expect(res.body.message).to.equal(errObj.message)
          done()
        })
    })

    it('should return 403 when cve record does exist', (done) => {
      chai.request(app)
        .post(`/cve-cna-negative-tests/${cveIdPublished5}`)
        .set(cveFixtures.secretariatHeader)
        .send(cveCnaContainerFail)
        .end((err, res) => {
          if (err) {
            done(err)
          }

          expect(res).to.have.status(403)
          expect(res).to.have.property('body').and.to.be.a('object')
          const errObj = error.cveRecordExists()
          expect(res.body.error).to.equal(errObj.error)
          expect(res.body.message).to.equal(errObj.message)
          done()
        })
    })

    it('should return 400 when cve record is not valid', (done) => {
      chai.request(app)
        .post(`/cve-cna-negative-tests/${cveIdReserved}`)
        .set(cveFixtures.secretariatHeader)
        .send(cveCnaContainerFail)
        .end((err, res) => {
          if (err) {
            done(err)
          }

          expect(res).to.have.status(400)
          expect(res).to.have.property('body').and.to.be.a('object')
          const errObj = error.invalidCnaContainerJsonSchema()
          expect(res.body.error).to.equal(errObj.error)
          expect(res.body.message).to.equal(errObj.message)
          done()
        })
    })
  })

  context('Positive Tests', () => {
    it('Post cna container as secretariat', (done) => {
      chai.request(app)
        .post(`/cve-cna-positive-tests/${cveIdReserved}`)
        .set(cveFixtures.secretariatHeader)
        .send(cveCnaContainerPass)
        .end((err, res) => {
          if (err) {
            done(err)
          }

          expect(res).to.have.status(200)
          expect(res).to.have.property('body').and.to.be.a('object')
          expect(res.body.message).to.equal(`${cveIdReserved} record was successfully created. This submission should appear on ${url} within 15 minutes.`)
          done()
        })
    })

    it('Post cna container as user', (done) => {
      const headers = Object.assign({}, cveFixtures.secretariatHeader)
      headers['CVE-API-ORG'] = cveFixtures.regularOrg.short_name
      headers['CVE-API-USER'] = cveFixtures.regularUser.username
      chai.request(app)
        .post(`/cve-cna-positive-tests/${cveIdReserved}`)
        .set(headers)
        .send(cveCnaContainerPass)
        .end((err, res) => {
          if (err) {
            done(err)
          }

          expect(res).to.have.status(200)
          expect(res).to.have.property('body').and.to.be.a('object')
          expect(res.body.message).to.equal(`${cveIdReserved} record was successfully created. This submission should appear on ${url} within 15 minutes.`)
          done()
        })
    })
  })
})
