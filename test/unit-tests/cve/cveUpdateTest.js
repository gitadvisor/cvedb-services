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
const cveIdRejected5 = 'CVE-2017-5835'
const cvePublishedPass5 = require('../../schemas/5.0/' + cveIdPublished5 + '_published.json')
const cveReservedPass5 = require('../../schemas/5.0/' + cveIdReserved5 + '_reserved.json')
const cveRejectedPass5 = require('../../schemas/5.0/' + cveIdRejected5 + '_rejected.json')
const errors = require('../../../src/controller/cve.controller/error')
const error = new errors.CveControllerError()

const cveFixtures = require('./mockObjects.cve')
const cveController = require('../../../src/controller/cve.controller/cve.controller')
const cveParams = require('../../../src/controller/cve.controller/cve.middleware')

describe('Testing the PUT /cve/:id endpoint in Cve Controller', () => {
  context('Negative Tests', () => {
    it('CVE record not updated when cve id doesnt match record', (done) => {
      class OrgRepo {
        async getOrgUUID () {
          return null
        }
      }
      class CveRepo {
        async updateByCveId (cveId, newCve) {
          return null
        }

        async findOneByCveId () {
          return null
        }
      }
      class CveIdRepo {
        async updateByCveId (cveId, newCve) {
          return null
        }

        async findOneByCveId () {
          return null
        }
      }
      class UserRepo {
        async getUserUUID () {
          return null
        }
      }
      app.route('/cve-not-updated-id-mismatch/:id')
        .put((req, res, next) => {
          const factory = {
            getCveIdRepository: () => { return new CveIdRepo() },
            getCveRepository: () => { return new CveRepo() },
            getOrgRepository: () => { return new OrgRepo() },
            getUserRepository: () => { return new UserRepo() }
          }
          req.ctx.repositories = factory
          next()
        }, cveParams.parsePostParams, cveController.CVE_UPDATE_SINGLE)

      chai.request(app)
        .put(`/cve-not-updated-id-mismatch/${nonExistentCveId}`)
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

    it('CVE record not updated when cve record doesnt exist', (done) => {
      const nonExistentCve = JSON.parse(JSON.stringify(cvePublishedPass5))
      nonExistentCve.cveMetadata.cveId = nonExistentCveId
      class OrgRepo {
        async getOrgUUID () {
          return null
        }
      }
      class CveRepo {
        async updateByCveId (cveId, newCve) {
          // test shouldn't reach here
          expect.fail()
          return null
        }

        async findOneByCveId () {
          return null
        }
      }
      class CveIdRepo {
        async updateByCveId (cveId, newCve) {
          expect.fail()
          return null
        }

        async findOneByCveId () {
          return true
        }
      }
      class UserRepo {
        async getUserUUID () {
          return null
        }
      }
      app.route('/cve-not-updated-cve-dne/:id')
        .put((req, res, next) => {
          const factory = {
            getCveIdRepository: () => { return new CveIdRepo() },
            getCveRepository: () => { return new CveRepo() },
            getOrgRepository: () => { return new OrgRepo() },
            getUserRepository: () => { return new UserRepo() }
          }
          req.ctx.repositories = factory
          next()
        }, cveParams.parsePostParams, cveController.CVE_UPDATE_SINGLE)

      chai.request(app)
        .put(`/cve-not-updated-cve-dne/${nonExistentCveId}`)
        .set(cveFixtures.secretariatHeader)
        .send(nonExistentCve)
        .end((err, res) => {
          if (err) {
            done(err)
          }

          expect(res).to.have.status(403)
          expect(res).to.have.property('body').and.to.be.a('object')
          const errObj = error.cveRecordDne()
          expect(res.body.error).to.equal(errObj.error)
          expect(res.body.message).to.equal(errObj.message)
          done()
        })
    })

    it('CVE record not updated when cve id doesnt exist', (done) => {
      const nonExistentCve = JSON.parse(JSON.stringify(cvePublishedPass5))
      nonExistentCve.cveMetadata.cveId = nonExistentCveId
      class OrgRepo {
        async getOrgUUID () {
          return null
        }
      }
      class CveRepo {
        async updateByCveId (cveId, newCve) {
          // test shouldn't reach here
          expect.fail()
          return null
        }

        async findOneByCveId () {
          // set to anything not false to pass the check
          return true
        }
      }
      class CveIdRepo {
        async updateByCveId (cveId, newCve) {
          expect.fail()
          return null
        }

        async findOneByCveId () {
          return null
        }
      }
      class UserRepo {
        async getUserUUID () {
          return null
        }
      }
      app.route('/cve-not-updated-cve-id-dne/:id')
        .put((req, res, next) => {
          const factory = {
            getCveIdRepository: () => { return new CveIdRepo() },
            getCveRepository: () => { return new CveRepo() },
            getOrgRepository: () => { return new OrgRepo() },
            getUserRepository: () => { return new UserRepo() }
          }
          req.ctx.repositories = factory
          next()
        }, cveParams.parsePostParams, cveController.CVE_UPDATE_SINGLE)

      chai.request(app)
        .put(`/cve-not-updated-cve-id-dne/${nonExistentCveId}`)
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

    it('CVE record not updated when cve record updated to RESERVED state', (done) => {
      class OrgRepo {
        async getOrgUUID () {
          return null
        }
      }
      class CveRepo {
        async updateByCveId (cveId, newCve) {
          return null
        }
      }
      class CveIdRepo {
        async updateByCveId (cveId, newCve) {
          return null
        }
      }
      class UserRepo {
        async getUserUUID () {
          return null
        }
      }
      app.route('/cve-not-updated-reserved-state/:id')
        .put((req, res, next) => {
          const factory = {
            getCveIdRepository: () => { return new CveIdRepo() },
            getCveRepository: () => { return new CveRepo() },
            getOrgRepository: () => { return new OrgRepo() },
            getUserRepository: () => { return new UserRepo() }
          }
          req.ctx.repositories = factory
          next()
        }, cveParams.parsePostParams, cveController.CVE_UPDATE_SINGLE)

      chai.request(app)
        .put(`/cve-not-updated-reserved-state/${cveIdReserved5}`)
        .set(cveFixtures.secretariatHeader)
        .send(cveReservedPass5)
        .end((err, res) => {
          if (err) {
            done(err)
          }

          expect(res).to.have.status(400)
          expect(res).to.have.property('body').and.to.be.a('object')
          const CONSTANTS = getConstants()
          const errObj = error.cveUpdateUnsupportedState(CONSTANTS.CVE_STATES.RESERVED)
          expect(res.body.error).to.equal(errObj.error)
          expect(res.body.message).to.equal(errObj.message)
          done()
        })
    })
  })

  context('Positive Tests', () => {
    it('Update CVE record when requestor is secretariat', (done) => {
      class OrgRepo {
        async getOrgUUID () {
          return null
        }
      }
      class CveRepo {
        async updateByCveId (cveId, newCve) {
          expect(cveId).to.equal(cveIdPublished5)
          expect(newCve).to.have.nested.property('cve.cveMetadata.state').and.to.equal('PUBLISHED')
          return null
        }

        async findOneByCveId () {
          return true
        }
      }
      class CveIdRepo {
        async updateByCveId (cveId, newCve) {
          expect(cveId).to.equal(cveIdPublished5)
          expect(newCve).to.have.property('state')
          return null
        }

        async findOneByCveId () {
          return true
        }
      }
      class UserRepo {
        async getUserUUID () {
          return null
        }
      }
      app.route('/cve-update-record/:id')
        .put((req, res, next) => {
          const factory = {
            getCveIdRepository: () => { return new CveIdRepo() },
            getCveRepository: () => { return new CveRepo() },
            getOrgRepository: () => { return new OrgRepo() },
            getUserRepository: () => { return new UserRepo() }
          }
          req.ctx.repositories = factory
          next()
        }, cveParams.parsePostParams, cveController.CVE_UPDATE_SINGLE)

      chai.request(app)
        .put(`/cve-update-record/${cveIdPublished5}`)
        .set(cveFixtures.secretariatHeader)
        .send(cvePublishedPass5)
        .end((err, res) => {
          if (err) {
            done(err)
          }

          expect(res).to.have.status(200)
          expect(res).to.have.property('body').and.to.be.a('object')
          expect(res.body).to.have.property('updated').and.to.be.a('object')
          expect(res.body.updated).to.have.nested.property('cveMetadata.cveId').and.to.equal(cveIdPublished5)
          expect(res.body.updated).to.have.nested.property('cveMetadata.state').and.to.equal('PUBLISHED')
          done()
        })
    })

    it('Update CVE record when requestor is secretariat and valid REJECTED JSON', (done) => {
      class OrgRepo {
        async getOrgUUID () {
          return null
        }
      }
      class CveRepo {
        async updateByCveId (cveId, newCve) {
          return null
        }

        async findOneByCveId () {
          return true
        }
      }
      class CveIdRepo {
        async updateByCveId (cveId, newCve) {
          return null
        }

        async findOneByCveId () {
          return true
        }
      }
      class UserRepo {
        async getUserUUID () {
          return null
        }
      }
      app.route('/cve-update-record-rejected/:id')
        .put((req, res, next) => {
          const factory = {
            getCveIdRepository: () => { return new CveIdRepo() },
            getCveRepository: () => { return new CveRepo() },
            getOrgRepository: () => { return new OrgRepo() },
            getUserRepository: () => { return new UserRepo() }
          }
          req.ctx.repositories = factory
          next()
        }, cveParams.parsePostParams, cveController.CVE_UPDATE_SINGLE)

      chai.request(app)
        .put(`/cve-update-record-rejected/${cveIdRejected5}`)
        .set(cveFixtures.secretariatHeader)
        .send(cveRejectedPass5)
        .end((err, res) => {
          if (err) {
            done(err)
          }

          expect(res).to.have.status(200)
          expect(res).to.have.property('body').and.to.be.a('object')
          expect(res.body).to.have.property('updated').and.to.be.a('object')
          expect(res.body.updated).to.have.nested.property('cveMetadata.cveId').and.to.equal(cveIdRejected5)
          expect(res.body.updated).to.have.nested.property('cveMetadata.state').and.to.equal('REJECTED')
          done()
        })
    })
  })
})
