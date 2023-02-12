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

const errors = require('../../../src/controller/org.controller/error')
const error = new errors.OrgControllerError()

const orgFixtures = require('./mockObjects.org')
const orgController = require('../../../src/controller/org.controller/org.controller')
const orgParams = require('../../../src/controller/org.controller/org.middleware')

class OrgGet {
  async aggregate (aggregation) {
    if (aggregation[0].$match.short_name === orgFixtures.existentOrg.short_name) {
      return [orgFixtures.existentOrg]
    } else if (aggregation[0].$match.short_name === orgFixtures.owningOrg.short_name) {
      return [orgFixtures.owningOrg]
    } else if (aggregation[0].$match.UUID === orgFixtures.owningOrg.UUID) {
      return [orgFixtures.owningOrg]
    }

    return []
  }

  async isSecretariat (shortname) {
    if (shortname === orgFixtures.secretariatHeader['CVE-API-ORG']) {
      return true
    } else {
      return false
    }
  }

  async findOneByShortName (shortname) {
    return orgFixtures.owningOrg
  }
}

describe('Testing the GET /org/:identifier endpoint in Org Controller', () => {
  context('Negative Tests', () => {
    it('Org does not exists', async () => {
      app.route('/org-cant-get-doesnt-exist/:identifier')
        .get((req, res, next) => {
          const factory = {
            getOrgRepository: () => { return new OrgGet() }
          }
          req.ctx.repositories = factory
          next()
        }, orgParams.parseGetParams, orgController.ORG_SINGLE)

      const res = await chai.request(app)
        .get(`/org-cant-get-doesnt-exist/${orgFixtures.nonExistentOrg.short_name}`)
        .set(orgFixtures.secretariatHeader)

      expect(res).to.have.status(404)
      expect(res).to.have.property('body').and.to.be.a('object')
      const errObj = error.orgDneParam(orgFixtures.nonExistentOrg.short_name)
      expect(res.body.error).to.equal(errObj.error)
      expect(res.body.message).to.equal(errObj.message)
    })

    it('Org exists and requester is not a user of the same org or is secretariat', (done) => {
      app.route('/org-cant-get-user-not-secretariat-or-same-org/:identifier')
        .get((req, res, next) => {
          const factory = {
            getOrgRepository: () => { return new OrgGet() }
          }
          req.ctx.repositories = factory
          next()
        }, orgParams.parseGetParams, orgController.ORG_SINGLE)

      chai.request(app)
        .get(`/org-cant-get-user-not-secretariat-or-same-org/${orgFixtures.owningOrg.short_name}`)
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

    it('Invalid UUID requesting an org', (done) => {
      app.route('/org-get-org-by-invalid-uuid/:identifier')
        .get((req, res, next) => {
          const factory = {
            getOrgRepository: () => { return new OrgGet() }
          }
          req.ctx.repositories = factory
          next()
        }, orgParams.parseGetParams, orgController.ORG_SINGLE)

      chai.request(app)
        .get(`/org-get-org-by-uuid/${'nonexistent123'}`)
        .set(orgFixtures.owningOrgHeader)
        .end((err, res) => {
          if (err) {
            done(err)
          }
          expect(res).to.have.status(404)
          expect(res).to.have.property('body').and.to.be.a('object')
          done()
        })
    })
  })

  context('Positive Tests', () => {
    it('Org exists and requester is secretariat', (done) => {
      app.route('/org-get-does-exist/:identifier')
        .get((req, res, next) => {
          const factory = {
            getOrgRepository: () => { return new OrgGet() }
          }
          req.ctx.repositories = factory
          next()
        }, orgParams.parseGetParams, orgController.ORG_SINGLE)

      chai.request(app)
        .get(`/org-get-does-exist/${orgFixtures.existentOrg.short_name}`)
        .set(orgFixtures.secretariatHeader)
        .end((err, res) => {
          if (err) {
            done(err)
          }

          expect(res).to.have.status(200)
          expect(res).to.have.property('body').and.to.be.a('object')
          expect(res.body).to.have.property('short_name').and.to.equal(orgFixtures.existentOrg.short_name)
          done()
        })
    })

    it('Org exists and requester is a user of the same org', (done) => {
      app.route('/org-get-does-exist-user-same-org/:identifier')
        .get((req, res, next) => {
          const factory = {
            getOrgRepository: () => { return new OrgGet() }
          }
          req.ctx.repositories = factory
          next()
        }, orgParams.parseGetParams, orgController.ORG_SINGLE)

      chai.request(app)
        .get(`/org-get-does-exist-user-same-org/${orgFixtures.owningOrg.short_name}`)
        .set(orgFixtures.owningOrgHeader)
        .end((err, res) => {
          if (err) {
            done(err)
          }

          expect(res).to.have.status(200)
          expect(res).to.have.property('body').and.to.be.a('object')
          expect(res.body).to.have.property('short_name').and.to.equal(orgFixtures.owningOrg.short_name)
          done()
        })
    })

    it('Valid UUID requesting an org', (done) => {
      app.route('/org-get-org-by-uuid/:identifier')
        .get((req, res, next) => {
          const factory = {
            getOrgRepository: () => { return new OrgGet() }
          }
          req.ctx.repositories = factory
          next()
        }, orgParams.parseGetParams, orgController.ORG_SINGLE)

      chai.request(app)
        .get(`/org-get-org-by-uuid/${orgFixtures.owningOrg.UUID}`)
        .set(orgFixtures.owningOrgHeader)
        .end((err, res) => {
          if (err) {
            done(err)
          }

          expect(res).to.have.status(200)
          expect(res).to.have.property('body').and.to.be.a('object')
          expect(res.body).to.have.property('UUID').and.to.equal(orgFixtures.owningOrg.UUID)
          done()
        })
    })
  })
})
