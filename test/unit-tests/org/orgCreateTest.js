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
const errors = require('../../../src/controller/org.controller/error')
const error = new errors.OrgControllerError()

const orgFixtures = require('./mockObjects.org')
const orgController = require('../../../src/controller/org.controller/org.controller')
const orgParams = require('../../../src/controller/org.controller/org.middleware')

class OrgNotCreatedAlreadyExists {
  async findOneByShortName () {
    return orgFixtures.existentOrg
  }
}

class OrgCreated {
  async findOneByShortName () {
    return null
  }

  async updateByOrgUUID () {
    return null
  }

  async getOrgUUID () {
    return null
  }

  async aggregate (aggregation) {
    if (aggregation[0].$match.short_name === orgFixtures.existentOrg.short_name) {
      return [orgFixtures.existentOrg]
    } else if (aggregation[0].$match.short_name === orgFixtures.nonExistentOrg.short_name) {
      return [orgFixtures.nonExistentOrg]
    }

    return []
  }
}

class NullUserRepo {
  async getUserUUID () {
    return null
  }

  async findOneByUserNameAndOrgUUID () {
    return null
  }

  async isAdmin () {
    return null
  }
}

class OrgCreatedWhenRolesDefined {
  async findOneByShortName () {
    return null
  }

  async updateByOrgUUID () {
    return null
  }

  async getOrgUUID () {
    return null
  }

  async aggregate () {
    return [orgFixtures.existentOrg]
  }
}

class OrgCreatedIdQuotaNullUndefined {
  async findOneByShortName () {
    return null
  }

  async updateByOrgUUID () {
    return null
  }

  async getOrgUUID () {
    return null
  }

  async aggregate () {
    const CONSTANTS = getConstants()

    this.testRes1 = JSON.parse(JSON.stringify(orgFixtures.nonExistentOrg))
    this.testRes1.policies.id_quota = CONSTANTS.DEFAULT_ID_QUOTA

    return [this.testRes1]
  }
}

describe('Testing the POST /org endpoint in Org Controller', () => {
  context('Negative Tests', () => {
    it('Org is not created because the UUID is provided', (done) => {
      app.route('/org-created-when-uuid-undefined')
        .post((req, res, next) => {
          const factory = {
            getOrgRepository: () => { return new OrgCreated() },
            getUserRepository: () => { return new NullUserRepo() }
          }
          req.ctx.repositories = factory
          next()
        }, orgParams.parsePostParams, orgController.ORG_CREATE_SINGLE)

      chai.request(app)
        .post('/org-created-when-uuid-undefined')
        .set(orgFixtures.secretariatHeader)
        .send(orgFixtures.existentOrg)
        .end((err, res) => {
          if (err) {
            done(err)
          }

          expect(res).to.have.status(400)
          expect(res).to.have.property('body').and.to.be.a('object')
          const errObj = error.uuidProvided('org')
          expect(res.body.error).to.equal(errObj.error)
          expect(res.body.message).to.equal(errObj.message)
          done()
        })

      // check that it really didn't create the org
      // https://github.com/CVEProject/cve-services/issues/887

      chai.request(app)
        .get('/')
    })

    it('Org is not created because it already exists', (done) => {
      app.route('/org-not-created-already-exists')
        .post((req, res, next) => {
          const factory = {
            getOrgRepository: () => { return new OrgNotCreatedAlreadyExists() }
          }
          req.ctx.repositories = factory
          next()
        }, orgParams.parsePostParams, orgController.ORG_CREATE_SINGLE)

      const testOrg = JSON.parse(JSON.stringify(orgFixtures.existentOrg))
      delete testOrg.UUID

      chai.request(app)
        .post('/org-not-created-already-exists')
        .set(orgFixtures.secretariatHeader)
        .send(testOrg)
        .end((err, res) => {
          if (err) {
            done(err)
          }

          expect(res).to.have.status(400)
          expect(res).to.have.property('body').and.to.be.a('object')
          const errObj = error.orgExists(orgFixtures.existentOrg.short_name)
          expect(res.body.error).to.equal(errObj.error)
          expect(res.body.message).to.equal(errObj.message)
          done()
        })
    })
  })

  context('Positive Tests', () => {
    it('Org is created', async () => {
      app.route('/org-created-when-uuid-not-provided')
        .post((req, res, next) => {
          const factory = {
            getOrgRepository: () => { return new OrgCreated() },
            getUserRepository: () => { return new NullUserRepo() }
          }
          req.ctx.repositories = factory
          next()
        }, orgParams.parsePostParams, orgController.ORG_CREATE_SINGLE)

      const testOrg = JSON.parse(JSON.stringify(orgFixtures.existentOrg))
      delete testOrg.UUID

      const res = await chai.request(app)
        .post('/org-created-when-uuid-not-provided')
        .set(orgFixtures.secretariatHeader)
        .send(testOrg)

      expect(res).to.have.status(200)
      expect(res).to.have.property('body').and.to.be.a('object')
      expect(res.body).to.have.property('message').and.to.be.a('string')
      expect(res.body.message).to.equal(orgFixtures.existentOrg.short_name + ' organization was successfully created.')
      expect(res.body).to.have.property('created').and.to.be.a('object')
      expect(res.body.created).to.have.property('short_name').to.equal(orgFixtures.existentOrg.short_name)
    })

    it('Org is Secretariat and is created when roles are defined', async () => {
      app.route('/org-created-when-roles-defined')
        .post((req, res, next) => {
          const factory = {
            getOrgRepository: () => { return new OrgCreatedWhenRolesDefined() },
            getUserRepository: () => { return new NullUserRepo() }
          }
          req.ctx.repositories = factory
          next()
        }, orgParams.parsePostParams, orgController.ORG_CREATE_SINGLE)

      const CONSTANTS = getConstants()
      const testOrg = JSON.parse(JSON.stringify(orgFixtures.existentOrg))
      delete testOrg.UUID

      const res = await chai.request(app)
        .post('/org-created-when-roles-defined')
        .set(orgFixtures.secretariatHeader)
        .send(testOrg)

      expect(res).to.have.status(200)
      expect(res).to.have.property('body').and.to.be.a('object')
      expect(res.body).to.have.property('message').and.to.be.a('string')
      expect(res.body.message).to.equal(orgFixtures.existentOrg.short_name + ' organization was successfully created.')
      expect(res.body).to.have.property('created').and.to.be.a('object')
      expect(res.body.created).to.have.property('short_name').to.equal(orgFixtures.existentOrg.short_name)
      expect(res.body.created).to.have.nested.property('policies.id_quota').to.equal(orgFixtures.existentOrg.policies.id_quota)
      expect(res.body.created).to.have.nested.property('authority.active_roles').to.include(CONSTANTS.AUTH_ROLE_ENUM.CNA).and.to.include(CONSTANTS.AUTH_ROLE_ENUM.SECRETARIAT)
      expect(res.body.created).to.have.nested.property('authority.active_roles').to.have.lengthOf(2)
    })

    it('Org is not secretariat and is created when roles are undefined and id_quota is defined', (done) => {
      app.route('/org-created-when-roles-undefined-id_quota-defined')
        .post((req, res, next) => {
          const factory = {
            getOrgRepository: () => { return new OrgCreated() },
            getUserRepository: () => { return new NullUserRepo() }
          }
          req.ctx.repositories = factory
          next()
        }, orgParams.parsePostParams, orgController.ORG_CREATE_SINGLE)

      const CONSTANTS = getConstants()
      const testOrg = JSON.parse(JSON.stringify(orgFixtures.nonExistentOrg))
      delete testOrg.UUID
      delete testOrg.authority.active_roles

      chai.request(app)
        .post('/org-created-when-roles-undefined-id_quota-defined')
        .set(orgFixtures.secretariatHeader)
        .send(testOrg)
        .end((err, res) => {
          if (err) {
            done(err)
          }

          expect(res).to.have.status(200)
          expect(res).to.have.property('body').and.to.be.a('object')
          expect(res.body).to.have.property('message').and.to.be.a('string')
          expect(res.body.message).to.equal(testOrg.short_name + ' organization was successfully created.')
          expect(res.body).to.have.property('created').and.to.be.a('object')
          expect(res.body.created).to.have.property('short_name').to.equal(testOrg.short_name)
          expect(res.body.created).to.have.nested.property('policies.id_quota').to.equal(testOrg.policies.id_quota)
          expect(res.body.created).to.have.nested.property('authority.active_roles').to.include(CONSTANTS.AUTH_ROLE_ENUM.CNA)
          expect(res.body.created).to.have.nested.property('authority.active_roles').to.have.lengthOf(1)
          done()
        })
    })

    it('Org is created when id_quota is undefined', async () => {
      app.route('/org-created-when-id_quota-undefined')
        .post((req, res, next) => {
          const factory = {
            getOrgRepository: () => { return new OrgCreatedIdQuotaNullUndefined() },
            getUserRepository: () => { return new NullUserRepo() }
          }
          req.ctx.repositories = factory
          next()
        }, orgParams.parsePostParams, orgController.ORG_CREATE_SINGLE)

      const CONSTANTS = getConstants()
      const testOrg = JSON.parse(JSON.stringify(orgFixtures.nonExistentOrg))
      delete testOrg.UUID
      delete testOrg.policies.id_quota

      const res = await chai.request(app)
        .post('/org-created-when-id_quota-undefined')
        .set(orgFixtures.secretariatHeader)
        .send(testOrg)

      expect(res).to.have.status(200)
      expect(res).to.have.property('body').and.to.be.a('object')
      expect(res.body).to.have.property('message').and.to.be.a('string')
      expect(res.body.message).to.equal(testOrg.short_name + ' organization was successfully created.')
      expect(res.body).to.have.property('created').and.to.be.a('object')
      expect(res.body.created).to.have.property('short_name').to.equal(testOrg.short_name)
      expect(res.body.created).to.have.nested.property('policies.id_quota').to.equal(CONSTANTS.DEFAULT_ID_QUOTA)
      expect(res.body.created).to.have.nested.property('authority.active_roles').to.include(CONSTANTS.AUTH_ROLE_ENUM.CNA)
      expect(res.body.created).to.have.nested.property('authority.active_roles').to.have.lengthOf(1)
    })

    it('Org is created when id_quota is null', async () => {
      app.route('/org-created-when-id_quota-null')
        .post((req, res, next) => {
          const factory = {
            getOrgRepository: () => { return new OrgCreatedIdQuotaNullUndefined() },
            getUserRepository: () => { return new NullUserRepo() }
          }
          req.ctx.repositories = factory
          next()
        }, orgParams.parsePostParams, orgController.ORG_CREATE_SINGLE)

      const CONSTANTS = getConstants()
      const testOrg = JSON.parse(JSON.stringify(orgFixtures.nonExistentOrg))
      delete testOrg.UUID
      testOrg.policies.id_quota = null

      const res = await chai.request(app)
        .post('/org-created-when-id_quota-null')
        .set(orgFixtures.secretariatHeader)
        .send(testOrg)

      expect(res).to.have.status(200)
      expect(res).to.have.property('body').and.to.be.a('object')
      expect(res.body).to.have.property('message').and.to.be.a('string')
      expect(res.body.message).to.equal(testOrg.short_name + ' organization was successfully created.')
      expect(res.body).to.have.property('created').and.to.be.a('object')
      expect(res.body.created).to.have.property('short_name').to.equal(testOrg.short_name)
      expect(res.body.created).to.have.nested.property('policies.id_quota').to.equal(CONSTANTS.DEFAULT_ID_QUOTA)
      expect(res.body.created).to.have.nested.property('authority.active_roles').to.include(CONSTANTS.AUTH_ROLE_ENUM.CNA)
      expect(res.body.created).to.have.nested.property('authority.active_roles').to.have.lengthOf(1)
    })
  })
})
