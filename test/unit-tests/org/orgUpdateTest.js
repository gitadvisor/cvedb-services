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

class OrgUpdatedAddingRole {
  async findOneByShortName () {
    return orgFixtures.owningOrg
  }

  async aggregate () {
    return [orgFixtures.owningOrg]
  }

  async updateByOrgUUID () {
    return { n: 1 }
  }

  async getOrgUUID () {
    return null
  }
}

class OrgUpdatedRemovingRole {
  async findOneByShortName () {
    return orgFixtures.owningOrg
  }

  async aggregate () {
    return [orgFixtures.owningOrg]
  }

  async updateByOrgUUID () {
    return { n: 1 }
  }

  async getOrgUUID () {
    return null
  }
}

describe('Testing the PUT /org/:shortname endpoint in Org Controller', () => {
  context('Negative Tests', () => {
    it('Org is not updated because it does not exists', async () => {
      class OrgNotUpdatedDoesNotExist {
        async findOneByShortName () {
          return null
        }
      }

      app.route('/org-not-updated-doesnt-exists/:shortname')
        .put((req, res, next) => {
          const factory = {
            getOrgRepository: () => { return new OrgNotUpdatedDoesNotExist() }
          }
          req.ctx.repositories = factory
          next()
        }, orgParams.parsePostParams, orgController.ORG_UPDATE_SINGLE)

      const res = await chai.request(app)
        .put(`/org-not-updated-doesnt-exists/${orgFixtures.nonExistentOrg.short_name}`)
        .set(orgFixtures.secretariatHeader)

      expect(res).to.have.status(404)
      expect(res).to.have.property('body').and.to.be.a('object')
      const errObj = error.orgDneParam(orgFixtures.nonExistentOrg.short_name)
      expect(res.body.error).to.equal(errObj.error)
      expect(res.body.message).to.equal(errObj.message)
    })

    it('Org is not updated because the new shortname already exists', (done) => {
      class OrgNotUpdatedShortNameExists {
        async findOneByShortName () {
          return orgFixtures.existentOrg
        }
      }

      app.route('/org-not-updated-shortname-exists/:shortname')
        .put((req, res, next) => {
          const factory = {
            getOrgRepository: () => { return new OrgNotUpdatedShortNameExists() }
          }
          req.ctx.repositories = factory
          next()
        }, orgParams.parsePostParams, orgController.ORG_UPDATE_SINGLE)

      chai.request(app)
        .put(`/org-not-updated-shortname-exists/${orgFixtures.existentOrg.short_name}?new_short_name=cisco`)
        .set(orgFixtures.secretariatHeader)
        .end((err, res) => {
          if (err) {
            done(err)
          }

          expect(res).to.have.status(403)
          expect(res).to.have.property('body').and.to.be.a('object')
          const errObj = error.duplicateShortname('cisco')
          expect(res.body.error).to.equal(errObj.error)
          expect(res.body.message).to.equal(errObj.message)
          done()
        })
    })
  })

  context('Positive Tests', () => {
    it('Org is updated: Adding a role', (done) => {
      const CONSTANTS = getConstants()

      app.route('/org-updated-adding-role-1/:shortname')
        .put((req, res, next) => {
          const factory = {
            getOrgRepository: () => { return new OrgUpdatedAddingRole() },
            getUserRepository: () => { return new NullUserRepo() }
          }
          req.ctx.repositories = factory
          next()
        }, orgParams.parsePostParams, orgController.ORG_UPDATE_SINGLE)

      chai.request(app)
        .put(`/org-updated-adding-role-1/${orgFixtures.owningOrg.short_name}?active_roles.add=${CONSTANTS.AUTH_ROLE_ENUM.ROOT_CNA}&active_roles.add=${CONSTANTS.AUTH_ROLE_ENUM.ROOT_CNA}`)
        .set(orgFixtures.secretariatHeader)
        .end((err, res) => {
          if (err) {
            done(err)
          }

          expect(res).to.have.status(200)
          expect(res).to.have.property('body').and.to.be.a('object')
          expect(res.body).to.have.property('updated').and.to.be.a('object')
          expect(res.body.updated.authority.active_roles).to.have.lengthOf(2)
          expect(res.body.updated.authority.active_roles[0]).to.equal(CONSTANTS.AUTH_ROLE_ENUM.CNA)
          expect(res.body.updated.authority.active_roles[1]).to.equal(CONSTANTS.AUTH_ROLE_ENUM.ROOT_CNA)
          expect(res.body.updated.short_name).to.equal(orgFixtures.owningOrg.short_name)
          expect(res.body.updated.name).to.equal(orgFixtures.owningOrg.name)
          expect(res.body.updated.UUID).to.equal(orgFixtures.owningOrg.UUID)
          expect(res.body.updated.policies.id_quota).to.equal(orgFixtures.owningOrg.policies.id_quota)
          done()
        })
    })

    it('Org is unchanged: Adding a role that the org already have', (done) => {
      const CONSTANTS = getConstants()

      app.route('/org-updated-adding-role-2/:shortname')
        .put((req, res, next) => {
          const factory = {
            getOrgRepository: () => { return new OrgUpdatedAddingRole() },
            getUserRepository: () => { return new NullUserRepo() }
          }
          req.ctx.repositories = factory
          next()
        }, orgParams.parsePostParams, orgController.ORG_UPDATE_SINGLE)

      chai.request(app)
        .put(`/org-updated-adding-role-2/${orgFixtures.owningOrg.short_name}?active_roles.add=${CONSTANTS.AUTH_ROLE_ENUM.ROOT_CNA}&active_roles.add=${CONSTANTS.AUTH_ROLE_ENUM.ROOT_CNA}`)
        .set(orgFixtures.secretariatHeader)
        .end((err, res) => {
          if (err) {
            done(err)
          }

          expect(res).to.have.status(200)
          expect(res).to.have.property('body').and.to.be.a('object')
          expect(res.body).to.have.property('updated').and.to.be.a('object')
          expect(res.body.updated.authority.active_roles).to.have.lengthOf(2)
          expect(res.body.updated.authority.active_roles[0]).to.equal(CONSTANTS.AUTH_ROLE_ENUM.CNA)
          expect(res.body.updated.authority.active_roles[1]).to.equal(CONSTANTS.AUTH_ROLE_ENUM.ROOT_CNA)
          expect(res.body.updated.short_name).to.equal(orgFixtures.owningOrg.short_name)
          expect(res.body.updated.name).to.equal(orgFixtures.owningOrg.name)
          expect(res.body.updated.UUID).to.equal(orgFixtures.owningOrg.UUID)
          expect(res.body.updated.policies.id_quota).to.equal(orgFixtures.owningOrg.policies.id_quota)
          done()
        })
    })

    it('Org is updated: Removing a role', (done) => {
      const CONSTANTS = getConstants()

      app.route('/org-updated-removing-role-1/:shortname')
        .put((req, res, next) => {
          const factory = {
            getOrgRepository: () => { return new OrgUpdatedRemovingRole() },
            getUserRepository: () => { return new NullUserRepo() }
          }
          req.ctx.repositories = factory
          next()
        }, orgParams.parsePostParams, orgController.ORG_UPDATE_SINGLE)

      chai.request(app)
        .put(`/org-updated-removing-role-1/${orgFixtures.owningOrg.short_name}?active_roles.remove=${CONSTANTS.AUTH_ROLE_ENUM.ROOT_CNA}&active_roles.remove=${CONSTANTS.AUTH_ROLE_ENUM.ROOT_CNA}`)
        .set(orgFixtures.secretariatHeader)
        .end((err, res) => {
          if (err) {
            done(err)
          }

          expect(res).to.have.status(200)
          expect(res).to.have.property('body').and.to.be.a('object')
          expect(res.body).to.have.property('updated').and.to.be.a('object')
          expect(res.body.updated.authority.active_roles).to.have.lengthOf(1)
          expect(res.body.updated.authority.active_roles[0]).to.equal(CONSTANTS.AUTH_ROLE_ENUM.CNA)
          expect(res.body.updated.short_name).to.equal(orgFixtures.owningOrg.short_name)
          expect(res.body.updated.name).to.equal(orgFixtures.owningOrg.name)
          expect(res.body.updated.UUID).to.equal(orgFixtures.owningOrg.UUID)
          expect(res.body.updated.policies.id_quota).to.equal(orgFixtures.owningOrg.policies.id_quota)
          done()
        })
    })

    it('Org is unchanged: Removing a role that the org does not have', (done) => {
      const CONSTANTS = getConstants()

      app.route('/org-updated-removing-role-2/:shortname')
        .put((req, res, next) => {
          const factory = {
            getOrgRepository: () => { return new OrgUpdatedRemovingRole() },
            getUserRepository: () => { return new NullUserRepo() }
          }
          req.ctx.repositories = factory
          next()
        }, orgParams.parsePostParams, orgController.ORG_UPDATE_SINGLE)

      chai.request(app)
        .put(`/org-updated-removing-role-2/${orgFixtures.owningOrg.short_name}?active_roles.remove=${CONSTANTS.AUTH_ROLE_ENUM.ROOT_CNA}&active_roles.remove=${CONSTANTS.AUTH_ROLE_ENUM.ROOT_CNA}`)
        .set(orgFixtures.secretariatHeader)
        .end((err, res) => {
          if (err) {
            done(err)
          }

          expect(res).to.have.status(200)
          expect(res).to.have.property('body').and.to.be.a('object')
          expect(res.body).to.have.property('updated').and.to.be.a('object')
          expect(res.body.updated.authority.active_roles).to.have.lengthOf(1)
          expect(res.body.updated.authority.active_roles[0]).to.equal(CONSTANTS.AUTH_ROLE_ENUM.CNA)
          expect(res.body.updated.short_name).to.equal(orgFixtures.owningOrg.short_name)
          expect(res.body.updated.name).to.equal(orgFixtures.owningOrg.name)
          expect(res.body.updated.UUID).to.equal(orgFixtures.owningOrg.UUID)
          expect(res.body.updated.policies.id_quota).to.equal(orgFixtures.owningOrg.policies.id_quota)
          done()
        })
    })

    // check that the org is unchanged
    it('No query parameters are provided', async () => {
      class OrgNotUpdatedNoQueryParameters {
        async findOneByShortName () {
          return orgFixtures.existentOrg
        }

        async updateByOrgUUID () {
          return { n: 1 }
        }

        async getOrgUUID () {
          return null
        }

        async aggregate () {
          return [orgFixtures.existentOrg]
        }
      }

      app.route('/org-not-updated-no-query-parameters/:shortname')
        .put((req, res, next) => {
          const factory = {
            getOrgRepository: () => { return new OrgNotUpdatedNoQueryParameters() },
            getUserRepository: () => { return new NullUserRepo() }
          }
          req.ctx.repositories = factory
          next()
        }, orgParams.parsePostParams, orgController.ORG_UPDATE_SINGLE)

      const res = await chai.request(app)
        .put(`/org-not-updated-no-query-parameters/${orgFixtures.existentOrg.short_name}`)
        .set(orgFixtures.secretariatHeader)

      expect(res).to.have.status(200)
      expect(res).to.have.property('body').and.to.be.a('object')
      expect(res.body).to.have.property('updated').and.to.be.a('object')
      expect(res.body.updated.authority.active_roles[0]).to.equal(orgFixtures.existentOrg.authority.active_roles[0])
      expect(res.body.updated.authority.active_roles[1]).to.equal(orgFixtures.existentOrg.authority.active_roles[1])
      expect(res.body.updated.authority.active_roles).to.have.lengthOf(2)
      expect(res.body.updated.policies.id_quota).to.equal(orgFixtures.existentOrg.policies.id_quota)
      expect(res.body.updated.policies.id_quota).to.equal(orgFixtures.existentOrg.policies.id_quota)
      expect(res.body.updated.name).to.equal(orgFixtures.existentOrg.name)
      expect(res.body.updated.short_name).to.equal(orgFixtures.existentOrg.short_name)
      expect(res.body.updated.UUID).to.equal(orgFixtures.existentOrg.UUID)
    })
  })
})
