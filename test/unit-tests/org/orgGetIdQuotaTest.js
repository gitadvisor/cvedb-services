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

const Org = require('../../../src/model/org')
const getConstants = require('../../../src/constants').getConstants
const errors = require('../../../src/controller/org.controller/error')
const error = new errors.OrgControllerError()

const orgFixtures = require('./mockObjects.org')
const orgController = require('../../../src/controller/org.controller/org.controller')
const orgParams = require('../../../src/controller/org.controller/org.middleware')

describe('Testing the GET /org/:shortname/id_quota endpoint in Org Controller', () => {
  context('Negative Tests', () => {
    it('Org with a negative id_quota was not saved', (done) => {
      const org = new Org(orgFixtures.orgWithNegativeIdQuota)

      org.validate((err) => {
        const CONSTANTS = getConstants()

        expect(err.errors['policies.id_quota'].message).to.equal(CONSTANTS.MONGOOSE_VALIDATION.Org_policies_id_quota_min_message)
        done()
      })
    })

    it('Org with an id_quota greater than the max was not saved', (done) => {
      const org = new Org(orgFixtures.orgExceedingMaxIdQuota)

      org.validate((err) => {
        const CONSTANTS = getConstants()

        expect(err.errors['policies.id_quota'].message).to.equal(CONSTANTS.MONGOOSE_VALIDATION.Org_policies_id_quota_max_message)
        done()
      })
    })

    it('Requestor is not secretariat or a user of the same org', (done) => {
      class OrgNotOwnerOrSecretariatIdQuota {
        async isSecretariat () {
          return false
        }
      }

      app.route('/org-id_quota-not-owning-secretariat-org/:shortname')
        .get((req, res, next) => {
          const factory = {
            getOrgRepository: () => { return new OrgNotOwnerOrSecretariatIdQuota() }
          }
          req.ctx.repositories = factory
          next()
        }, orgParams.parseGetParams, orgController.ORG_ID_QUOTA)

      chai.request(app)
        .get(`/org-id_quota-not-owning-secretariat-org/${orgFixtures.owningOrg.short_name}`)
        .set(orgFixtures.orgHeader)
        .end((err, res) => {
          if (err) {
            done(err)
          }

          expect(res).to.have.status(403)
          expect(res).to.have.property('body').and.to.be.a('object')
          const errObj = error.notSameOrgOrSecretariat()
          expect(res.body.error).to.equal(errObj.error)
          expect(res.body.message).to.equal(errObj.message)
          done()
        })
    })

    it('Org does not exist', (done) => {
      class OrgDoesNotExistIdQuota {
        async isSecretariat () {
          return true
        }

        async findOneByShortName () {
          return null
        }
      }

      app.route('/org-id_quota-org-does-not-exist/:shortname')
        .get((req, res, next) => {
          const factory = {
            getOrgRepository: () => { return new OrgDoesNotExistIdQuota() }
          }
          req.ctx.repositories = factory
          next()
        }, orgParams.parseGetParams, orgController.ORG_ID_QUOTA)

      chai.request(app)
        .get(`/org-id_quota-org-does-not-exist/${orgFixtures.nonExistentOrg.short_name}`)
        .set(orgFixtures.secretariatHeader)
        .end((err, res) => {
          if (err) {
            done(err)
          }

          expect(res).to.have.status(404)
          expect(res).to.have.property('body').and.to.be.a('object')
          const errObj = error.orgDneParam(orgFixtures.nonExistentOrg.short_name)
          expect(res.body.error).to.equal(errObj.error)
          expect(res.body.message).to.equal(errObj.message)
          done()
        })
    })
  })

  context('Positive Tests', () => {
    it('Requestor is secretariat', (done) => {
      class OrgSecretariatIdQuota {
        async isSecretariat () {
          return true
        }

        async findOneByShortName () {
          return orgFixtures.existentOrg
        }

        async getOrgUUID () {
          return orgFixtures.existentOrg.UUID
        }
      }

      class CveIdSecretariatIdQuota {
        async countDocuments () {
          return 0
        }
      }

      app.route('/org-id_quota-secretariat/:shortname')
        .get((req, res, next) => {
          const factory = {
            getOrgRepository: () => { return new OrgSecretariatIdQuota() },
            getCveIdRepository: () => { return new CveIdSecretariatIdQuota() }
          }
          req.ctx.repositories = factory
          next()
        }, orgParams.parseGetParams, orgController.ORG_ID_QUOTA)

      chai.request(app)
        .get(`/org-id_quota-secretariat/${orgFixtures.existentOrg.short_name}`)
        .set(orgFixtures.secretariatHeader)
        .end((err, res) => {
          if (err) {
            done(err)
          }

          expect(res).to.have.status(200)
          expect(res).to.have.property('body').and.to.be.a('object')
          expect(res.body.id_quota).to.equal(1000)
          expect(res.body.total_reserved).to.equal(0)
          expect(res.body.available).to.equal(1000)
          done()
        })
    })

    it('Requestor is a user of the same org', (done) => {
      class OrgOwnerIdQuota {
        async isSecretariat () {
          return false
        }

        async findOneByShortName () {
          return orgFixtures.owningOrg
        }

        async getOrgUUID () {
          return orgFixtures.owningOrg.UUID
        }
      }

      class CveIdOwnerIdQuota {
        async countDocuments () {
          return 0
        }
      }

      app.route('/org-id_quota-owning-org/:shortname')
        .get((req, res, next) => {
          const factory = {
            getOrgRepository: () => { return new OrgOwnerIdQuota() },
            getCveIdRepository: () => { return new CveIdOwnerIdQuota() }
          }
          req.ctx.repositories = factory
          next()
        }, orgParams.parseGetParams, orgController.ORG_ID_QUOTA)

      chai.request(app)
        .get(`/org-id_quota-owning-org/${orgFixtures.owningOrg.short_name}`)
        .set(orgFixtures.owningOrgHeader)
        .end((err, res) => {
          if (err) {
            done(err)
          }

          expect(res).to.have.status(200)
          expect(res).to.have.property('body').and.to.be.a('object')
          expect(res.body.id_quota).to.equal(5)
          expect(res.body.total_reserved).to.equal(0)
          expect(res.body.available).to.equal(5)
          done()
        })
    })

    it('Org id_quota exceeds min quota limit', (done) => {
      class OrgExceedsMinIdQuota {
        async isSecretariat () {
          return true
        }

        async findOneByShortName () {
          return orgFixtures.orgWithNegativeIdQuota
        }

        async getOrgUUID () {
          return orgFixtures.orgWithNegativeIdQuota.UUID
        }
      }

      class CveIdExceedsMinQuota {
        async countDocuments () {
          return 0
        }
      }

      app.route('/org-id_quota-exceeds-min-quota-limit/:shortname')
        .get((req, res, next) => {
          const factory = {
            getOrgRepository: () => { return new OrgExceedsMinIdQuota() },
            getCveIdRepository: () => { return new CveIdExceedsMinQuota() }
          }
          req.ctx.repositories = factory
          next()
        }, orgParams.parseGetParams, orgController.ORG_ID_QUOTA)

      chai.request(app)
        .get(`/org-id_quota-exceeds-min-quota-limit/${orgFixtures.orgWithNegativeIdQuota.short_name}`)
        .set(orgFixtures.secretariatHeader)
        .end((err, res) => {
          if (err) {
            done(err)
          }

          expect(res).to.have.status(200)
          expect(res).to.have.property('body').and.to.be.a('object')
          expect(res.body).to.have.property('id_quota').to.equal(-1)
          expect(res.body).to.have.property('total_reserved').to.equal(0)
          expect(res.body).to.have.property('available').to.equal(-1)
          done()
        })
    })

    it('Org id_quota exceeds max quota limit', (done) => {
      class OrgExceedsMaxIdQuota {
        async isSecretariat () {
          return true
        }

        async findOneByShortName () {
          return orgFixtures.orgExceedingMaxIdQuota
        }

        async getOrgUUID () {
          return orgFixtures.orgExceedingMaxIdQuota.UUID
        }
      }

      class CveIdExceedsMaxQuota {
        async countDocuments () {
          return 0
        }
      }

      app.route('/org-id_quota-exceeds-max-quota-limit/:shortname')
        .get((req, res, next) => {
          const factory = {
            getOrgRepository: () => { return new OrgExceedsMaxIdQuota() },
            getCveIdRepository: () => { return new CveIdExceedsMaxQuota() }
          }
          req.ctx.repositories = factory
          next()
        }, orgParams.parseGetParams, orgController.ORG_ID_QUOTA)

      chai.request(app)
        .get(`/org-id_quota-exceeds-max-quota-limit/${orgFixtures.orgExceedingMaxIdQuota.short_name}`)
        .set(orgFixtures.secretariatHeader)
        .end((err, res) => {
          if (err) {
            done(err)
          }

          expect(res).to.have.status(200)
          expect(res).to.have.property('body').and.to.be.a('object')
          expect(res.body).to.have.property('id_quota').to.equal(100500)
          expect(res.body).to.have.property('total_reserved').to.equal(0)
          expect(res.body).to.have.property('available').to.equal(100500)
          done()
        })
    })
  })
})
