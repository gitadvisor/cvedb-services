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

const userFixtures = require('./mockObjects.user')
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

class OrgCreatedUserOrgUndefined {
  async isSecretariatUUID () {
    return true
  }

  async getOrgUUID () {
    return userFixtures.existentOrg.UUID
  }

  async findOneByUUID () {
    return userFixtures.existentOrg
  }
}

class UserCreatedOrgUndefined {
  async findOneByUserNameAndOrgUUID () {
    return null
  }

  async updateByUserNameAndOrgUUID () {
    return null
  }

  async getUserUUID () {
    return null
  }

  async isAdminUUID () {
    return false
  }
}

class OrgCreatedUserWithRole {
  async isSecretariatUUID () {
    return true
  }

  async getOrgUUID () {
    return userFixtures.existentOrgDummy.UUID
  }

  async findOneByUUID () {
    return userFixtures.existentOrgDummy
  }
}

class UserCreatedAdminWithRole {
  constructor () {
    const CONSTANTS = getConstants()

    this.testRes1 = JSON.parse(JSON.stringify(userFixtures.userC))
    this.testRes1.authority.active_roles[0] = CONSTANTS.USER_ROLE_ENUM.ADMIN
  }

  async findOneByUserNameAndOrgUUID () {
    return null
  }

  async isAdminUUID () {
    return true
  }

  async updateByUserNameAndOrgUUID () {
    return null
  }

  async getUserUUID () {
    return null
  }

  async aggregate () {
    return [this.testRes1]
  }
}

class OrgCantCreateUserOrgDoesNotMatch {
  async getOrgUUID () {
    return userFixtures.existentOrg.UUID
  }
}

describe('Testing the POST /org/:shortname/user endpoint in Org Controller', () => {
  context('Negative Tests', () => {
    it('User is not created because org does not exist', (done) => {
      class OrgCantCreateUserOrgDoesNotExist {
        async getOrgUUID () {
          return null
        }
      }

      app.route('/user-not-created-org-does-not-exist/:shortname')
        .post((req, res, next) => {
          const factory = {
            getOrgRepository: () => { return new OrgCantCreateUserOrgDoesNotExist() },
            getUserRepository: () => { return new NullUserRepo() }
          }
          req.ctx.repositories = factory
          next()
        }, orgParams.parsePostParams, orgController.USER_CREATE_SINGLE)

      chai.request(app)
        .post(`/user-not-created-org-does-not-exist/${userFixtures.nonExistentOrg.short_name}`)
        .set(userFixtures.secretariatHeader)
        .send(userFixtures.nonExistentUser)
        .end((err, res) => {
          if (err) {
            done(err)
          }

          expect(res).to.have.status(404)
          expect(res).to.have.property('body').and.to.be.a('object')
          const errObj = error.orgDneParam(userFixtures.nonExistentOrg.short_name)
          expect(res.body.error).to.equal(errObj.error)
          expect(res.body.message).to.equal(errObj.message)
          done()
        })
    })

    it('Param org\'s UUID is provided', (done) => {
      app.route('/user-not-created-org-uuid-provided/:shortname')
        .post((req, res, next) => {
          const factory = {
            getOrgRepository: () => { return new OrgCantCreateUserOrgDoesNotMatch() },
            getUserRepository: () => { return new NullUserRepo() }
          }
          req.ctx.repositories = factory
          next()
        }, orgParams.parsePostParams, orgController.USER_CREATE_SINGLE)

      chai.request(app)
        .post(`/user-not-created-org-uuid-provided/${userFixtures.existentOrg.short_name}`)
        .set(userFixtures.secretariatHeader)
        .send(userFixtures.existentUser)
        .end((err, res) => {
          if (err) {
            done(err)
          }

          expect(res).to.have.status(400)
          expect(res).to.have.property('body').and.to.be.a('object')
          const errObj = error.uuidProvided('user')
          expect(res.body.error).to.equal(errObj.error)
          expect(res.body.message).to.equal(errObj.message)
          done()
        })
    })

    it('Param user\'s UUID is provided', (done) => {
      app.route('/user-not-created-user-uuid-provided/:shortname')
        .post((req, res, next) => {
          const factory = {
            getOrgRepository: () => { return new OrgCantCreateUserOrgDoesNotMatch() },
            getUserRepository: () => { return new UserCreatedOrgUndefined() }
          }
          req.ctx.repositories = factory
          next()
        }, orgParams.parsePostParams, orgController.USER_CREATE_SINGLE)

      chai.request(app)
        .post(`/user-not-created-user-uuid-provided/${userFixtures.existentOrg.short_name}`)
        .set(userFixtures.secretariatHeader)
        .send(userFixtures.nonExistentUser)
        .end((err, res) => {
          if (err) {
            done(err)
          }

          expect(res).to.have.status(400)
          expect(res).to.have.property('body').and.to.be.a('object')
          const errObj = error.uuidProvided('user')
          expect(res.body.error).to.equal(errObj.error)
          expect(res.body.message).to.equal(errObj.message)
          done()
        })
    })

    it('User is not created because it already exists', (done) => {
      class UserNotCreatedAlreadyExists {
        async findOneByUserNameAndOrgUUID () {
          return userFixtures.existentUser
        }

        async isAdminUUID () {
          return false
        }
      }

      app.route('/user-not-created-already-exists/:shortname')
        .post((req, res, next) => {
          const factory = {
            getOrgRepository: () => { return new OrgCreatedUserOrgUndefined() },
            getUserRepository: () => { return new UserNotCreatedAlreadyExists() }
          }
          req.ctx.repositories = factory
          next()
        }, orgParams.parsePostParams, orgController.USER_CREATE_SINGLE)

      const testUser = Object.assign({}, userFixtures.existentUser)
      delete testUser.UUID
      delete testUser.org_UUID

      chai.request(app)
        .post(`/user-not-created-already-exists/${userFixtures.existentOrg.short_name}`)
        .set(userFixtures.secretariatHeader)
        .send(testUser)
        .end((err, res) => {
          if (err) {
            done(err)
          }

          expect(res).to.have.status(400)
          expect(res).to.have.property('body').and.to.be.a('object')
          const errObj = error.userExists(userFixtures.existentUser.username)
          expect(res.body.error).to.equal(errObj.error)
          expect(res.body.message).to.equal(errObj.message)
          done()
        })
    })

    it('User is not created because the requester is not an Org Admin user from the same org and is not the secretariat', done => {
      class UserNotCreated {
        async isAdminUUID () {
          return true
        }
      }

      class OrgCantCreateUserNotSecretariatOrAdmin {
        async isSecretariatUUID () {
          return false
        }

        async getOrgUUID (shortname) {
          if (shortname === userFixtures.existentOrgDummy.short_name) {
            return userFixtures.existentOrgDummy.UUID
          }

          return userFixtures.owningOrg.UUID
        }

        async findOneByUUID (orgUUID) {
          if (orgUUID === userFixtures.existentOrgDummy.UUID) {
            return userFixtures.existentOrgDummy
          }

          return userFixtures.owningOrg
        }
      }

      app.route('/user-not-created-not-secretariat-not-same-org-admin/:shortname')
        .post((req, res, next) => {
          const factory = {
            getOrgRepository: () => { return new OrgCantCreateUserNotSecretariatOrAdmin() },
            getUserRepository: () => { return new UserNotCreated() }
          }
          req.ctx.repositories = factory
          next()
        }, orgParams.parsePostParams, orgController.USER_CREATE_SINGLE)

      const testUser = Object.assign({}, userFixtures.userA)
      delete testUser.UUID
      delete testUser.org_UUID
      testUser.authority = {
        active_roles: ['ADMIN']
      }

      chai.request(app)
        .post(`/user-not-created-not-secretariat-not-same-org-admin/${userFixtures.existentOrgDummy.short_name}`)
        .set(userFixtures.owningOrgHeader)
        .send(testUser)
        .end((err, res) => {
          if (err) {
            done(err)
          }

          expect(res).to.have.status(403)
          expect(res).to.have.property('body').and.to.be.a('object')
          const errObj = error.notOrgAdminOrSecretariat()
          expect(res.body.error).to.equal(errObj.error)
          expect(res.body.message).to.equal(errObj.message)
          done()
        })
    })
  })

  context('Positive Tests', () => {
    it('Requester is secretariat and not Admin: User is created with the "ADMIN" role', done => {
      class UserCreatedWithRole {
        constructor () {
          const CONSTANTS = getConstants()

          this.testRes1 = JSON.parse(JSON.stringify(userFixtures.userA))
          this.testRes1.authority.active_roles[0] = CONSTANTS.USER_ROLE_ENUM.ADMIN
        }

        async findOneByUserNameAndOrgUUID () {
          return null
        }

        async isAdminUUID () {
          return false
        }

        async updateByUserNameAndOrgUUID () {
          return null
        }

        async getUserUUID () {
          return null
        }

        async aggregate () {
          return [this.testRes1]
        }
      }

      app.route('/user-created-secretariat-not-admin/:shortname')
        .post((req, res, next) => {
          const factory = {
            getOrgRepository: () => { return new OrgCreatedUserWithRole() },
            getUserRepository: () => { return new UserCreatedWithRole() }
          }
          req.ctx.repositories = factory
          next()
        }, orgParams.parsePostParams, orgController.USER_CREATE_SINGLE)

      const testUser = JSON.parse(JSON.stringify(userFixtures.userA))
      delete testUser.UUID
      delete testUser.org_UUID
      testUser.authority = {
        active_roles: ['ADMIN']
      }

      chai.request(app)
        .post(`/user-created-secretariat-not-admin/${userFixtures.existentOrgDummy.short_name}`)
        .set(userFixtures.secretariatHeader)
        .send(testUser)
        .end((err, res) => {
          if (err) {
            done(err)
          }

          expect(res).to.have.status(200)
          expect(res).to.have.property('body').and.to.be.a('object')
          expect(res.body).to.have.property('message').and.to.be.a('string')
          expect(res.body.message).to.equal(testUser.username + ' was successfully created.')
          expect(res.body).to.have.property('created').and.to.be.a('object')
          expect(res.body.created).to.have.property('org_UUID').and.to.equal(userFixtures.existentOrgDummy.UUID)
          expect(res.body.created).to.have.property('username').and.to.equal(testUser.username)
          expect(res.body.created).to.have.nested.property('authority.active_roles').and.to.have.lengthOf(1)
          expect(res.body.created.authority.active_roles[0]).to.equal(testUser.authority.active_roles[0])
          done()
        })
    })

    it('Requester is Admin and is not secretariat: User is created with the "ADMIN" role', done => {
      class OrgCreatedUserAdminWithRole {
        async isSecretariatUUID () {
          return false
        }

        async getOrgUUID () {
          return userFixtures.existentOrgDummy.UUID
        }

        async findOneByUUID () {
          return userFixtures.existentOrgDummy
        }
      }

      app.route('/user-created-not-secretariat-same-org-admin/:shortname')
        .post((req, res, next) => {
          const factory = {
            getOrgRepository: () => { return new OrgCreatedUserAdminWithRole() },
            getUserRepository: () => { return new UserCreatedAdminWithRole() }
          }
          req.ctx.repositories = factory
          next()
        }, orgParams.parsePostParams, orgController.USER_CREATE_SINGLE)

      userFixtures.userA.authority.active_roles = ['ADMIN']

      const testUser = JSON.parse(JSON.stringify(userFixtures.userC))
      delete testUser.UUID
      delete testUser.org_UUID
      testUser.authority = {
        active_roles: ['ADMIN']
      }

      chai.request(app)
        .post(`/user-created-not-secretariat-same-org-admin/${userFixtures.existentOrgDummy.short_name}`)
        .set(userFixtures.userAHeader)
        .send(testUser)
        .end((err, res) => {
          if (err) {
            done(err)
          }

          expect(res).to.have.status(200)
          expect(res).to.have.property('body').and.to.be.a('object')
          expect(res.body).to.have.property('message').and.to.be.a('string')
          expect(res.body.message).to.equal(testUser.username + ' was successfully created.')
          expect(res.body).to.have.property('created').and.to.be.a('object')
          expect(res.body.created).to.have.property('org_UUID').and.to.equal(userFixtures.existentOrgDummy.UUID)
          expect(res.body.created).to.have.property('username').and.to.equal(testUser.username)
          expect(res.body.created).to.have.nested.property('authority.active_roles').and.to.have.lengthOf(1)
          expect(res.body.created.authority.active_roles[0]).to.equal(testUser.authority.active_roles[0])
          userFixtures.userA.authority.active_roles = []
          done()
        })
    })

    it('Requester is secretariat and Admin: User is created without a user role', done => {
      class UserCreatedAdminWithoutRole {
        async findOneByUserNameAndOrgUUID () {
          return null
        }

        async isAdminUUID () {
          return true
        }

        async updateByUserNameAndOrgUUID () {
          return null
        }

        async getUserUUID () {
          return null
        }

        async aggregate () {
          return [userFixtures.userA]
        }
      }

      app.route('/user-created-secretariat-same-org-admin/:shortname')
        .post((req, res, next) => {
          const factory = {
            getOrgRepository: () => { return new OrgCreatedUserWithRole() },
            getUserRepository: () => { return new UserCreatedAdminWithoutRole() }
          }
          req.ctx.repositories = factory
          next()
        }, orgParams.parsePostParams, orgController.USER_CREATE_SINGLE)

      userFixtures.existentUser.authority.active_roles = ['ADMIN']
      const testUser = JSON.parse(JSON.stringify(userFixtures.userA))
      delete testUser.UUID
      delete testUser.org_UUID

      chai.request(app)
        .post(`/user-created-secretariat-same-org-admin/${userFixtures.existentOrgDummy.short_name}`)
        .set(userFixtures.secretariatHeader)
        .send(testUser)
        .end((err, res) => {
          if (err) {
            done(err)
          }

          expect(res).to.have.status(200)
          expect(res).to.have.property('body').and.to.be.a('object')
          expect(res.body).to.have.property('message').and.to.be.a('string')
          expect(res.body.message).to.equal(userFixtures.userA.username + ' was successfully created.')
          expect(res.body).to.have.property('created').and.to.be.a('object')
          expect(res.body.created).to.have.property('org_UUID').and.to.equal(userFixtures.existentOrgDummy.UUID)
          expect(res.body.created).to.have.property('username').and.to.equal(userFixtures.userA.username)
          expect(res.body.created).to.have.nested.property('authority.active_roles').and.to.have.lengthOf(0)
          userFixtures.existentUser.authority.active_roles = []
          done()
        })
    })
  })
})
