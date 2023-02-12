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
const errors = require('../../../src/middleware/error')
const error = new errors.MiddlewareError()

const mwFixtures = require('./mockObjects.middleware')
const cveId5 = 'CVE-2017-4024'
const cvePass5 = require('../../schemas/5.0/' + cveId5 + '_published.json')

class OrgValidateUserSuccess {
  async getOrgUUID () {
    return mwFixtures.existentOrg.UUID
  }
}

class UserValidateUserSuccess {
  async findOneByUserNameAndOrgUUID () {
    return mwFixtures.existentUser
  }
}

class NullOrgRepo {
  async findOneByShortName () {
    return null
  }

  async updateByOrgUUID () {
    return null
  }

  async getOrgUUID () {
    return null
  }

  async isSecretariat () {
    return null
  }

  async isSecretariatUUID () {
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

describe('Testing the user validation middleware', () => {
  context('Negative Tests', () => {
    it('Org does not exist', (done) => {
      app.route('/validate-user-org-doesnt-exist')
        .post((req, res, next) => {
          const factory = {
            getOrgRepository: () => { return new NullOrgRepo() },
            getUserRepository: () => { return new NullUserRepo() }
          }
          req.ctx.repositories = factory
          next()
        }, middleware.validateUser, (req, res) => {
          return res.status(200).json({ message: 'Success! You have reached the target endpoint.' })
        })

      const CONSTANTS = getConstants()
      const testHeaders = Object.assign({}, mwFixtures.secretariatHeaders)
      testHeaders[CONSTANTS.AUTH_HEADERS.ORG] = 'jpmorgan'

      chai.request(app)
        .post('/validate-user-org-doesnt-exist')
        .set(testHeaders)
        .send(cvePass5)
        .end((err, res) => {
          if (err) {
            done(err)
          }

          expect(res).to.have.status(401)
          expect(res).to.have.property('body').and.to.be.a('object')
          const errObj = error.unauthorized()
          expect(res.body.error).to.equal(errObj.error)
          expect(res.body.message).to.equal(errObj.message)
          done()
        })
    })

    it('User is not found', (done) => {
      app.route('/validate-user-user-not-found')
        .post((req, res, next) => {
          const factory = {
            getOrgRepository: () => { return new NullOrgRepo() },
            getUserRepository: () => { return new NullUserRepo() }
          }
          req.ctx.repositories = factory
          next()
        }, middleware.validateUser, (req, res) => {
          return res.status(200).json({ message: 'Success! You have reached the target endpoint.' })
        })

      const CONSTANTS = getConstants()
      const testHeaders = Object.assign({}, mwFixtures.secretariatHeaders)
      testHeaders[CONSTANTS.AUTH_HEADERS.USER] = 'morgan'

      chai.request(app)
        .post('/validate-user-user-not-found')
        .set(testHeaders)
        .send(cvePass5)
        .end((err, res) => {
          if (err) {
            done(err)
          }

          expect(res).to.have.status(401)
          expect(res).to.have.property('body').and.to.be.a('object')
          const errObj = error.unauthorized()
          expect(res.body.error).to.equal(errObj.error)
          expect(res.body.message).to.equal(errObj.message)
          done()
        })
    })

    it('Secret apikey is incorrect', (done) => {
      app.route('/validate-user-key-incorrect')
        .post((req, res, next) => {
          const factory = {
            getOrgRepository: () => { return new OrgValidateUserSuccess() },
            getUserRepository: () => { return new UserValidateUserSuccess() }
          }
          req.ctx.repositories = factory
          next()
        }, middleware.validateUser, (req, res) => {
          return res.status(200).json({ message: 'Success! You have reached the target endpoint.' })
        })

      const CONSTANTS = getConstants()
      const testHeaders = Object.assign({}, mwFixtures.secretariatHeaders)
      testHeaders[CONSTANTS.AUTH_HEADERS.KEY] = 'wrong secret'

      chai.request(app)
        .post('/validate-user-key-incorrect')
        .set(testHeaders)
        .send(cvePass5)
        .end((err, res) => {
          if (err) {
            done(err)
          }

          expect(res).to.have.status(401)
          expect(res).to.have.property('body').and.to.be.a('object')
          const errObj = error.unauthorized()
          expect(res.body.error).to.equal(errObj.error)
          expect(res.body.message).to.equal(errObj.message)
          done()
        })
    })

    it('User is deactivated', (done) => {
      class UserValidateUserDeactivated {
        async findOneByUserNameAndOrgUUID () {
          return mwFixtures.deactivatedUser
        }
      }

      app.route('/validate-user-deactivated')
        .post((req, res, next) => {
          const factory = {
            getOrgRepository: () => { return new OrgValidateUserSuccess() },
            getUserRepository: () => { return new UserValidateUserDeactivated() }
          }
          req.ctx.repositories = factory
          next()
        }, middleware.validateUser, (req, res) => {
          return res.status(200).json({ message: 'Success! You have reached the target endpoint.' })
        })

      const CONSTANTS = getConstants()
      const deactivatedHeaders = {}
      deactivatedHeaders[CONSTANTS.AUTH_HEADERS.ORG] = 'mitre'
      deactivatedHeaders[CONSTANTS.AUTH_HEADERS.KEY] = 'S96E4QT-SMT4YE3-KX03X6K-4615CED'
      deactivatedHeaders[CONSTANTS.AUTH_HEADERS.USER] = 'flast'
      deactivatedHeaders['content-type'] = 'application/json'

      chai.request(app)
        .post('/validate-user-deactivated')
        .set(deactivatedHeaders)
        .send()
        .end((err, res) => {
          if (err) {
            done(err)
          }

          expect(res).to.have.status(401)
          expect(res).to.have.property('body').and.to.be.a('object')
          const errObj = error.unauthorized()
          expect(res.body.error).to.equal(errObj.error)
          expect(res.body.message).to.equal(errObj.message)
          done()
        })
    })

    it('Org is undefined', (done) => {
      app.route('/validate-user-org-undefined')
        .post((req, res, next) => {
          const factory = {
            getOrgRepository: () => { return new NullOrgRepo() },
            getUserRepository: () => { return new NullUserRepo() }
          }
          req.ctx.repositories = factory
          next()
        }, middleware.validateUser, (req, res) => {
          return res.status(200).json({ message: 'Success! You have reached the target endpoint.' })
        })

      const CONSTANTS = getConstants()
      const testHeaders = Object.assign({}, mwFixtures.secretariatHeaders)
      delete testHeaders[CONSTANTS.AUTH_HEADERS.ORG]

      chai.request(app)
        .post('/validate-user-org-undefined')
        .set(testHeaders)
        .send(cvePass5)
        .end((err, res) => {
          if (err) {
            done(err)
          }

          expect(res).to.have.status(400)
          expect(res).to.have.property('body').and.to.be.a('object')
          const errObj = error.badRequest(CONSTANTS.AUTH_HEADERS.ORG)
          expect(res.body.error).to.equal(errObj.error)
          expect(res.body.message).to.equal(errObj.message)
          done()
        })
    })

    it('Requester is undefined', (done) => {
      app.route('/validate-user-submitter-undefined')
        .post((req, res, next) => {
          const factory = {
            getOrgRepository: () => { return new NullOrgRepo() },
            getUserRepository: () => { return new NullUserRepo() }
          }
          req.ctx.repositories = factory
          next()
        }, middleware.validateUser, (req, res) => {
          return res.status(200).json({ message: 'Success! You have reached the target endpoint.' })
        })

      const CONSTANTS = getConstants()
      const testHeaders = Object.assign({}, mwFixtures.secretariatHeaders)
      delete testHeaders[CONSTANTS.AUTH_HEADERS.USER]

      chai.request(app)
        .post('/validate-user-submitter-undefined')
        .set(testHeaders)
        .send(cvePass5)
        .end((err, res) => {
          if (err) {
            done(err)
          }

          expect(res).to.have.status(400)
          expect(res).to.have.property('body').and.to.be.a('object')
          const errObj = error.badRequest(CONSTANTS.AUTH_HEADERS.USER)
          expect(res.body.error).to.equal(errObj.error)
          expect(res.body.message).to.equal(errObj.message)
          done()
        })
    })

    it('Secret apikey is undefined', (done) => {
      app.route('/validate-user-secret-undefined')
        .post((req, res, next) => {
          const factory = {
            getOrgRepository: () => { return new NullOrgRepo() },
            getUserRepository: () => { return new NullUserRepo() }
          }
          req.ctx.repositories = factory
          next()
        }, middleware.validateUser, (req, res) => {
          return res.status(200).json({ message: 'Success! You have reached the target endpoint.' })
        })

      const CONSTANTS = getConstants()
      const testHeaders = Object.assign({}, mwFixtures.secretariatHeaders)
      delete testHeaders[CONSTANTS.AUTH_HEADERS.KEY]

      chai.request(app)
        .post('/validate-user-secret-undefined')
        .set(testHeaders)
        .send(cvePass5)
        .end((err, res) => {
          if (err) {
            done(err)
          }

          expect(res).to.have.status(400)
          expect(res).to.have.property('body').and.to.be.a('object')
          const errObj = error.badRequest(CONSTANTS.AUTH_HEADERS.KEY)
          expect(res.body.error).to.equal(errObj.error)
          expect(res.body.message).to.equal(errObj.message)
          done()
        })
    })
  })

  context('Positive Tests', () => {
    it('User is successfully validated', (done) => {
      app.route('/validate-user-successful')
        .post((req, res, next) => {
          const factory = {
            getOrgRepository: () => { return new OrgValidateUserSuccess() },
            getUserRepository: () => { return new UserValidateUserSuccess() }
          }
          req.ctx.repositories = factory
          next()
        }, middleware.validateUser, (req, res) => {
          return res.status(200).json({ message: 'Success! You have reached the target endpoint.' })
        })

      chai.request(app)
        .post('/validate-user-successful')
        .set(mwFixtures.secretariatHeaders)
        .send(cvePass5)
        .end((err, res) => {
          if (err) {
            done(err)
          }

          expect(res).to.have.status(200)
          expect(res).to.have.property('body').and.to.be.a('object')
          expect(res.body).to.have.property('message').and.to.be.a('string')
          expect(res.body.message).to.equal('Success! You have reached the target endpoint.')
          done()
        })
    })
  })
})
