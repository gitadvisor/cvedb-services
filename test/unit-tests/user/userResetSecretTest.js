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

class OrgUserSecretResetNotSecretariat {
  async isSecretariat () {
    return false
  }

  async getOrgUUID (shortname) {
    if (shortname === userFixtures.existentOrgDummy.short_name) {
      return userFixtures.existentOrgDummy.UUID
    }

    return userFixtures.owningOrg.UUID
  }
}

class UserSecretResetNotAdmin {
  async updateByUserNameAndOrgUUID () {
    return { n: 1, nModified: 1, ok: 1 }
  }

  async getUserUUID () {
    return null
  }

  async isAdmin () {
    return false
  }

  async findOneByUserNameAndOrgUUID () {
    return userFixtures.userC
  }
}

class UserSecretReset {
  async updateByUserNameAndOrgUUID () {
    return { n: 1, nModified: 1, ok: 1 }
  }

  async getUserUUID (userName, orgUUID) {
    if (userName === userFixtures.userC.username && orgUUID === userFixtures.userC.org_UUID) {
      return userFixtures.userC.UUID
    } else if (userName === userFixtures.userB.username && orgUUID === userFixtures.userB.org_UUID) {
      return userFixtures.userB.UUID
    }

    return userFixtures.userA.UUID
  }

  async isAdmin (username, shortname) {
    if (username === userFixtures.userD.username && shortname === userFixtures.existentOrgDummy.short_name) {
      return true
    } else if (username === userFixtures.userA.username && shortname === userFixtures.existentOrgDummy.short_name) {
      return true
    }

    return false
  }

  async findOneByUserNameAndOrgUUID (username, orgUUID) {
    if (username === userFixtures.userC.username && orgUUID === userFixtures.userC.org_UUID) {
      return userFixtures.userC
    } else if (username === userFixtures.userB.username && orgUUID === userFixtures.userB.org_UUID) {
      return userFixtures.userB
    }

    return userFixtures.userA
  }
}

class UserGetUser {
  async aggregate (aggregation) {
    if (aggregation[0].$match.username === userFixtures.existentUser.username &&
      aggregation[0].$match.org_UUID === userFixtures.existentUser.org_UUID) {
      return [userFixtures.existentUser]
    } else if (aggregation[0].$match.username === userFixtures.existentUserDummy.username &&
      aggregation[0].$match.org_UUID === userFixtures.existentUserDummy.org_UUID) {
      return [userFixtures.existentUserDummy]
    }

    return []
  }
}

class OrgGetUser {
  async isSecretariat (shortname) {
    return shortname === userFixtures.existentOrg.short_name
  }

  async getOrgUUID (shortname) {
    if (shortname === userFixtures.existentOrg.short_name) {
      return userFixtures.existentOrg.UUID
    } else if (shortname === userFixtures.owningOrg.short_name) {
      return userFixtures.owningOrg.UUID
    }

    return null
  }
}

describe('Testing the PUT /org/:shortname/user/:username/reset_secret endpoint in Org Controller', () => {
  context('Negative Tests', () => {
    it('User secret is not reset because org does not exists', (done) => {
      class OrgUserSecretNotResetOrgDoesntExist {
        async isSecretariat () {
          return true
        }

        async getOrgUUID () {
          return null
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

      app.route('/user-secret-not-reset-org-doesnt-exist/:shortname/:username')
        .put((req, res, next) => {
          const factory = {
            getOrgRepository: () => { return new OrgUserSecretNotResetOrgDoesntExist() },
            getUserRepository: () => { return new NullUserRepo() }
          }
          req.ctx.repositories = factory
          next()
        }, orgParams.parsePostParams, orgController.USER_RESET_SECRET)

      chai.request(app)
        .put(`/user-secret-not-reset-org-doesnt-exist/${userFixtures.nonExistentOrg.short_name}/${userFixtures.existentUser.username}`)
        .set(userFixtures.secretariatHeader)
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

    it('User secret is not reset because user does not exists', (done) => {
      class OrgUserSecretNotResetUserDoesntExist {
        async isSecretariat () {
          return true
        }

        async getOrgUUID () {
          return userFixtures.existentOrg.UUID
        }
      }

      class UserSecretNotResetUserDoesntExist {
        async updateByUserNameAndOrgUUID () {
          return { n: 0, nModified: 0, ok: 1 }
        }

        async isAdmin () {
          return false
        }

        async findOneByUserNameAndOrgUUID () {
          return null
        }
      }

      app.route('/user-secret-not-reset-user-doesnt-exist/:shortname/:username')
        .put((req, res, next) => {
          const factory = {
            getOrgRepository: () => { return new OrgUserSecretNotResetUserDoesntExist() },
            getUserRepository: () => { return new UserSecretNotResetUserDoesntExist() }
          }
          req.ctx.repositories = factory
          next()
        }, orgParams.parsePostParams, orgController.USER_RESET_SECRET)

      chai.request(app)
        .put(`/user-secret-not-reset-user-doesnt-exist/${userFixtures.existentOrg.short_name}/${userFixtures.nonExistentUser.username}`)
        .set(userFixtures.secretariatHeader)
        .end((err, res) => {
          if (err) {
            done(err)
          }

          expect(res).to.have.status(404)
          expect(res).to.have.property('body').and.to.be.a('object')
          const errObj = error.userDne(userFixtures.nonExistentUser.username)
          expect(res.body.error).to.equal(errObj.error)
          expect(res.body.message).to.equal(errObj.message)
          done()
        })
    })

    // requester is not the same user (same org but different username)
    it('Requester is from same org but has different username: User secret is not reset because requester is not the same user or is the secretariat or org admin', (done) => {
      app.route('/user-secret-reset-sameOrg/:shortname/:username')
        .put((req, res, next) => {
          const factory = {
            getOrgRepository: () => { return new OrgUserSecretResetNotSecretariat() },
            getUserRepository: () => { return new UserSecretResetNotAdmin() }
          }
          req.ctx.repositories = factory
          next()
        }, orgParams.parsePostParams, orgController.USER_RESET_SECRET)

      chai.request(app)
        .put(`/user-secret-reset-sameOrg/${userFixtures.existentOrgDummy.short_name}/${userFixtures.userC.username}`) // requester has same org as user but different username
        .set(userFixtures.userAHeader)
        .end((err, res) => {
          if (err) {
            done(err)
          }

          expect(res).to.have.status(403)
          expect(res).to.have.property('body').and.to.be.a('object')
          const errObj = error.notSameUserOrSecretariat()
          expect(res.body.error).to.equal(errObj.error)
          expect(res.body.message).to.equal(errObj.message)
          done()
        })
    })

    // requester is not the same user (same username but different org)
    it('Requester has same username but is from different org: User secret is not reset because requester is not the same user or is the secretariat or org admin', (done) => {
      app.route('/user-secret-reset-sameUsername/:shortname/:username')
        .put((req, res, next) => {
          const factory = {
            getOrgRepository: () => { return new OrgUserSecretResetNotSecretariat() },
            getUserRepository: () => { return new UserSecretReset() }
          }
          req.ctx.repositories = factory
          next()
        }, orgParams.parsePostParams, orgController.USER_RESET_SECRET)

      chai.request(app)
        .put(`/user-secret-reset-sameUsername/${userFixtures.owningOrg.short_name}/${userFixtures.userB.username}`) // requester has same username as user but different org
        .set(userFixtures.userAHeader)
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

    // requester is admin but does not belong to the same user's org
    it('Secret is not reset because requester is org admin but does not belong to the same org', (done) => {
      app.route('/user-secret-not-reset-userIsOrgAdminForDifferentOrg/:shortname/:username')
        .put((req, res, next) => {
          const factory = {
            getOrgRepository: () => { return new OrgUserSecretResetNotSecretariat() },
            getUserRepository: () => { return new UserSecretReset() }
          }
          req.ctx.repositories = factory
          next()
        }, orgParams.parsePostParams, orgController.USER_RESET_SECRET)

      chai.request(app)
        .put(`/user-secret-not-reset-userIsOrgAdminForDifferentOrg/${userFixtures.owningOrg.short_name}/${userFixtures.userB.username}`)
        .set(userFixtures.userDHeader)
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

    // requester is not a secretariat or an admin
    it('Secret is not reset because requester is not the user, a secretariat or an admin', (done) => {
      app.route('/user-secret-not-reset-userIsNotUserAdminOrSecretariat/:shortname/:username')
        .put((req, res, next) => {
          const factory = {
            getOrgRepository: () => { return new OrgUserSecretResetNotSecretariat() },
            getUserRepository: () => { return new UserSecretResetNotAdmin() }
          }
          req.ctx.repositories = factory
          next()
        }, orgParams.parsePostParams, orgController.USER_RESET_SECRET)

      chai.request(app)
        .put(`/user-secret-not-reset-userIsNotUserAdminOrSecretariat/${userFixtures.existentOrgDummy.short_name}/${userFixtures.userC.username}`)
        .set(userFixtures.owningOrgHeader)
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
  })

  context('Positive Tests', () => {
    let secret
    it('Secret is reset because requester is the user', (done) => {
      app.route('/user-secret-reset-notSameOrgOrSecretariat/:shortname/:username')
        .put((req, res, next) => {
          const factory = {
            getOrgRepository: () => { return new OrgUserSecretResetNotSecretariat() },
            getUserRepository: () => { return new UserSecretReset() }
          }
          req.ctx.repositories = factory
          next()
        }, orgParams.parsePostParams, orgController.USER_RESET_SECRET)

      chai.request(app)
        .put(`/user-secret-reset-notSameOrgOrSecretariat/${userFixtures.existentOrgDummy.short_name}/${userFixtures.userA.username}`)
        .set(userFixtures.userAHeader)
        .end((err, res) => {
          if (err) {
            done(err)
          }

          expect(res).to.have.status(200)
          expect(res).to.have.property('body').and.to.be.a('object')
          expect(res.body).to.have.property('API-secret').and.to.be.a('string')
          done()
        })
    })

    it('Secret is reset because requester is a secretariat', (done) => {
      class OrgUserSecretReset {
        async isSecretariat () {
          return true
        }

        async getOrgUUID () {
          return userFixtures.existentOrg.UUID
        }
      }

      app.route('/user-secret-reset-secretariat/:shortname/:username')
        .put((req, res, next) => {
          const factory = {
            getOrgRepository: () => { return new OrgUserSecretReset() },
            getUserRepository: () => { return new UserSecretReset() }
          }
          req.ctx.repositories = factory
          next()
        }, orgParams.parsePostParams, orgController.USER_RESET_SECRET)

      chai.request(app)
        .put(`/user-secret-reset-secretariat/${userFixtures.existentOrg.short_name}/${userFixtures.existentUser.username}`)
        .set(userFixtures.secretariatHeader)
        .end((err, res) => {
          if (err) {
            done(err)
          }

          expect(res).to.have.status(200)
          expect(res).to.have.property('body').and.to.be.a('object')
          expect(res.body).to.have.property('API-secret').and.to.be.a('string')
          done()
        })
    })

    it('Secret is reset because requester is an admin that belongs to the same org', (done) => {
      app.route('/user-secret-reset-userIsOrgAdmin/:shortname/:username')
        .put((req, res, next) => {
          const factory = {
            getOrgRepository: () => { return new OrgUserSecretResetNotSecretariat() },
            getUserRepository: () => { return new UserSecretReset() }
          }
          req.ctx.repositories = factory
          next()
        }, orgParams.parsePostParams, orgController.USER_RESET_SECRET)

      const CONSTANTS = getConstants()
      userFixtures.userA.authority.active_roles = [CONSTANTS.USER_ROLE_ENUM.ADMIN]

      chai.request(app)
        .put(`/user-secret-reset-userIsOrgAdmin/${userFixtures.existentOrgDummy.short_name}/${userFixtures.userC.username}`)
        .set(userFixtures.userAHeader)
        .end((err, res) => {
          if (err) {
            done(err)
          }

          expect(res).to.have.status(200)
          expect(res).to.have.property('body').and.to.be.a('object')
          expect(res.body).to.have.property('API-secret').and.to.be.a('string')
          secret = res.body['API-secret']
          userFixtures.userA.authority.active_roles = []
          done()
        })
    })

    it('Admin user role preserved after resetting secret', (done) => {
      app.route('/user-get-user/:shortname/:username')
        .get((req, res, next) => {
          const factory = {
            getOrgRepository: () => { return new OrgGetUser() },
            getUserRepository: () => { return new UserGetUser() }
          }
          req.ctx.repositories = factory
          next()
        }, orgParams.parseGetParams, orgController.USER_SINGLE)

      userFixtures.existentUser.secret = secret

      chai.request(app)
        .get(`/user-get-user/${userFixtures.existentOrg.short_name}/${userFixtures.existentUser.username}`)
        .set(userFixtures.secretariatHeader)
        .end((err, res) => {
          if (err) {
            done(err)
          }

          expect(res).to.have.status(200)
          expect(res).to.have.property('body').and.to.be.a('object')
          expect(res.body).to.have.property('username').and.to.equal(userFixtures.existentUser.username)
          expect(res.body).to.have.property('org_UUID').and.to.equal(userFixtures.existentUser.org_UUID)
          done()
        })
    })
  })
})
