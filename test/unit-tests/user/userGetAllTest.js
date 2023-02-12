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

const orgFixtures = require('./mockObjects.user')
const orgController = require('../../../src/controller/org.controller/org.controller')
const orgParams = require('../../../src/controller/org.controller/org.middleware')

describe('Testing the GET /org/:shortname/users endpoint in Org Controller', () => {
  context('Negative Tests', () => {
    it('should return 404 not found because org does not exist', (done) => {
      class NoOrg {
        async getOrgUUID () {
          return null
        }

        async isSecretariat () {
          return false
        }
      }

      class Blank {
        async aggregate () {
          return []
        }
      }

      app.route('/org-does-not-exist/:shortname/users')
        .get((req, res, next) => {
          const factory = {
            getOrgRepository: () => { return new NoOrg() },
            getUserRepository: () => { return new Blank() }
          }
          req.ctx.repositories = factory
          next()
        }, orgParams.parseGetParams, orgController.USER_ALL)

      chai.request(app)
        .get(`/org-does-not-exist/${orgFixtures.nonExistentOrg.short_name}/users`)
        .set(orgFixtures.owningOrgHeader)
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

    it('should return 403 forbidden because requester does not belong to the same org', (done) => {
      class NotSameOrg {
        async getOrgUUID () {
          return 'not-an-org'
        }

        async isSecretariat () {
          return false
        }
      }

      class Blank {
        async aggregate () {
          return []
        }
      }

      app.route('/requester-does-not-belong/:shortname/users')
        .get((req, res, next) => {
          const factory = {
            getOrgRepository: () => { return new NotSameOrg() },
            getUserRepository: () => { return new Blank() }
          }
          req.ctx.repositories = factory
          next()
        }, orgParams.parseGetParams, orgController.USER_ALL)

      chai.request(app)
        .get(`/requester-does-not-belong/${orgFixtures.owningOrg.short_name}/users`)
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
  })

  context('Positive Tests', () => {
    it('should list the users for cisco org because requester belongs to the same org', (done) => {
      class GetOrgUUID {
        async getOrgUUID () {
          return orgFixtures.owningOrg.UUID
        }

        async isSecretariat () {
          return false
        }
      }

      class GetAllOrgUsers {
        async aggregatePaginate () {
          const res = {
            itemsList: [orgFixtures.existentUserDummy],
            itemCount: 1,
            itemsPerPage: 1000,
            currentPage: 1,
            pageCount: 1,
            pagingCounter: 1,
            hasPrevPage: false,
            hasNextPage: false,
            prevPage: null,
            nextPage: null
          }
          return res
        }
      }

      app.route('/user-list-returned-same-org/:shortname/users')
        .get((req, res, next) => {
          const factory = {
            getOrgRepository: () => { return new GetOrgUUID() },
            getUserRepository: () => { return new GetAllOrgUsers() }
          }
          req.ctx.repositories = factory
          next()
        }, orgParams.parseGetParams, orgController.USER_ALL)

      chai.request(app)
        .get(`/user-list-returned-same-org/${orgFixtures.owningOrg.short_name}/users`)
        .set(orgFixtures.owningOrgHeader)
        .end((err, res) => {
          if (err) {
            done(err)
          }

          expect(res).to.have.status(200)
          expect(res).to.have.property('body').and.to.be.a('object')
          expect(res.body).to.have.property('users').and.to.be.a('array').and.to.have.lengthOf(1)
          expect(res.body.users[0]).to.have.property('org_UUID').and.to.equal(orgFixtures.owningOrg.UUID)
          done()
        })
    })

    it('should list the users for cisco org because requester is the secretariat', (done) => {
      class GetOrgUUID {
        async getOrgUUID () {
          return orgFixtures.owningOrg.UUID
        }

        async isSecretariat () {
          return true
        }
      }

      class GetAllOrgUsers {
        async aggregatePaginate () {
          const res = {
            itemsList: [orgFixtures.existentUserDummy],
            itemCount: 1,
            itemsPerPage: 1000,
            currentPage: 1,
            pageCount: 1,
            pagingCounter: 1,
            hasPrevPage: false,
            hasNextPage: false,
            prevPage: null,
            nextPage: null
          }
          return res
        }
      }

      app.route('/user-list-returned-secretariat/:shortname/users')
        .get((req, res, next) => {
          const factory = {
            getOrgRepository: () => { return new GetOrgUUID() },
            getUserRepository: () => { return new GetAllOrgUsers() }
          }
          req.ctx.repositories = factory
          next()
        }, orgParams.parseGetParams, orgController.USER_ALL)

      chai.request(app)
        .get(`/user-list-returned-secretariat/${orgFixtures.owningOrg.short_name}/users`)
        .set(orgFixtures.secretariatHeader)
        .end((err, res) => {
          if (err) {
            done(err)
          }

          expect(res).to.have.status(200)
          expect(res).to.have.property('body').and.to.be.a('object')
          expect(res.body).to.have.property('users').and.to.be.a('array').and.to.have.lengthOf(1)
          expect(res.body.users[0]).to.have.property('org_UUID').and.to.equal(orgFixtures.owningOrg.UUID)
          done()
        })
    })

    it('Page query param not provided: should list non-paginated users because users fit in one page', async () => {
      class GetOrgUUID {
        async getOrgUUID () {
          return orgFixtures.owningOrg.UUID
        }

        async isSecretariat () {
          return false
        }
      }

      class GetAllOrgUsers {
        async aggregatePaginate () {
          const res = {
            itemsList: orgFixtures.allOwningOrgUsers,
            itemCount: orgFixtures.allOwningOrgUsers.length,
            itemsPerPage: 500,
            currentPage: 1,
            pageCount: 1,
            pagingCounter: 1,
            hasPrevPage: false,
            hasNextPage: false,
            prevPage: null,
            nextPage: null
          }
          return res
        }
      }

      app.route('/user-list-returned-not-secretariat-limit-default/:shortname/users')
        .get((req, res, next) => {
          const factory = {
            getOrgRepository: () => { return new GetOrgUUID() },
            getUserRepository: () => { return new GetAllOrgUsers() }
          }
          req.ctx.repositories = factory
          next()
        }, orgParams.parseGetParams, orgController.USER_ALL)

      const testOwningOrgHeader = Object.assign({}, orgFixtures.owningOrgHeader)
      const res = await chai.request(app)
        .get(`/user-list-returned-not-secretariat-limit-default/${orgFixtures.owningOrg.short_name}/users`)
        .set(testOwningOrgHeader)

      expect(res).to.have.status(200)
      expect(res).to.have.property('body').and.to.be.a('object')
      expect(res.body).to.have.property('users').and.to.be.a('array').and.to.have.lengthOf(orgFixtures.allOwningOrgUsers.length)
      expect(res.body).to.not.have.property('totalCount')
      expect(res.body).to.not.have.property('itemsPerPage')
      expect(res.body).to.not.have.property('pageCount')
      expect(res.body).to.not.have.property('currentPage')
      expect(res.body).to.not.have.property('prevPage')
      expect(res.body).to.not.have.property('nextPage')
    })

    it('Page query param not provided: should list the users for cisco org in two pages (page 1/2)', async () => {
      const itemsPerPage = 3

      class GetOrgUUID {
        async getOrgUUID () {
          return orgFixtures.owningOrg.UUID
        }

        async isSecretariat () {
          return false
        }
      }

      class GetAllOrgUsers {
        async aggregatePaginate () {
          const res = {
            itemsList: [orgFixtures.allOwningOrgUsers[0], orgFixtures.allOwningOrgUsers[1], orgFixtures.allOwningOrgUsers[2]],
            itemCount: orgFixtures.allOwningOrgUsers.length,
            itemsPerPage: itemsPerPage,
            currentPage: 1,
            pageCount: 2,
            pagingCounter: 1,
            hasPrevPage: false,
            hasNextPage: true,
            prevPage: null,
            nextPage: 2
          }
          return res
        }
      }

      app.route('/user-list-returned-not-secretariat-limit-3-1/:shortname/users')
        .get((req, res, next) => {
          const factory = {
            getOrgRepository: () => { return new GetOrgUUID() },
            getUserRepository: () => { return new GetAllOrgUsers() }
          }
          req.ctx.repositories = factory
          // temporary fix for #920: force pagnation
          req.TEST_PAGINATOR_LIMIT = itemsPerPage
          next()
        }, orgParams.parseGetParams, orgController.USER_ALL)

      const testOwningOrgHeader = Object.assign({}, orgFixtures.owningOrgHeader)
      const res = await chai.request(app)
        .get(`/user-list-returned-not-secretariat-limit-3-1/${orgFixtures.owningOrg.short_name}/users`)
        .set(testOwningOrgHeader)

      expect(res).to.have.status(200)
      expect(res).to.have.property('body').and.to.be.a('object')
      expect(res.body).to.have.property('users').and.to.be.a('array').and.to.have.lengthOf(3)
      expect(res.body).to.have.property('totalCount').and.to.equal(orgFixtures.allOwningOrgUsers.length)
      expect(res.body).to.have.property('itemsPerPage').and.to.equal(itemsPerPage)
      expect(res.body).to.have.property('pageCount').and.to.equal(2)
      expect(res.body).to.have.property('currentPage').and.to.equal(1)
      expect(res.body).to.have.property('prevPage').and.to.equal(null)
      expect(res.body).to.have.property('nextPage').and.to.equal(2)
    })

    it('Page query param provided: should list the users for cisco org in two pages (page 2/2)', async () => {
      class GetOrgUUID {
        async getOrgUUID () {
          return orgFixtures.owningOrg.UUID
        }

        async isSecretariat () {
          return false
        }
      }

      class GetAllOrgUsers {
        async aggregatePaginate () {
          const res = {
            itemsList: [orgFixtures.allOwningOrgUsers[3], orgFixtures.allOwningOrgUsers[4]],
            itemCount: orgFixtures.allOwningOrgUsers.length,
            itemsPerPage: 3,
            currentPage: 2,
            pageCount: 2,
            pagingCounter: 1,
            hasPrevPage: true,
            hasNextPage: false,
            prevPage: 1,
            nextPage: null
          }
          return res
        }
      }

      app.route('/user-list-returned-not-secretariat-limit-3-2/:shortname/users')
        .get((req, res, next) => {
          const factory = {
            getOrgRepository: () => { return new GetOrgUUID() },
            getUserRepository: () => { return new GetAllOrgUsers() }
          }
          req.ctx.repositories = factory
          // temporary fix for #920: force pagnation
          req.TEST_PAGINATOR_LIMIT = 3
          next()
        }, orgParams.parseGetParams, orgController.USER_ALL)

      const testOwningOrgHeader = Object.assign({}, orgFixtures.owningOrgHeader)
      const res = await chai.request(app)
        .get(`/user-list-returned-not-secretariat-limit-3-2/${orgFixtures.owningOrg.short_name}/users?page=2`)
        .set(testOwningOrgHeader)

      expect(res).to.have.status(200)
      expect(res).to.have.property('body').and.to.be.a('object')
      expect(res.body).to.have.property('users').and.to.be.a('array').and.to.have.lengthOf(2)
      expect(res.body).to.have.property('totalCount').and.to.equal(orgFixtures.allOwningOrgUsers.length)
      expect(res.body).to.have.property('itemsPerPage').and.to.equal(3)
      expect(res.body).to.have.property('pageCount').and.to.equal(2)
      expect(res.body).to.have.property('currentPage').and.to.equal(2)
      expect(res.body).to.have.property('prevPage').and.to.equal(1)
      expect(res.body).to.have.property('nextPage').and.to.equal(null)
    })

    it('Page query param provided: should return an empty list because no user exist for stark org', async () => {
      class GetOrgUUID {
        async getOrgUUID () {
          return orgFixtures.owningOrg.UUID
        }

        async isSecretariat () {
          return false
        }
      }

      class GetAllOrgUsers {
        async aggregatePaginate () {
          const res = {
            itemsList: [],
            itemCount: 0,
            itemsPerPage: 500,
            currentPage: 1,
            pageCount: 1,
            pagingCounter: 1,
            hasPrevPage: false,
            hasNextPage: false,
            prevPage: null,
            nextPage: null
          }
          return res
        }
      }

      app.route('/user-list-no-users/:shortname/users')
        .get((req, res, next) => {
          const factory = {
            getOrgRepository: () => { return new GetOrgUUID() },
            getUserRepository: () => { return new GetAllOrgUsers() }
          }
          req.ctx.repositories = factory
          next()
        }, orgParams.parseGetParams, orgController.USER_ALL)

      const testOwningOrgHeader = Object.assign({}, orgFixtures.owningOrgHeader)
      const res = await chai.request(app)
        .get(`/user-list-no-users/${orgFixtures.owningOrg.short_name}/users?page=1`)
        .set(testOwningOrgHeader)

      expect(res).to.have.status(200)
      expect(res).to.have.property('body').and.to.be.a('object')
      expect(res.body).to.have.property('users').and.to.be.a('array').and.to.have.lengthOf(0)
      expect(res.body).to.not.have.property('totalCount')
      expect(res.body).to.not.have.property('itemsPerPage')
      expect(res.body).to.not.have.property('pageCount')
      expect(res.body).to.not.have.property('currentPage')
      expect(res.body).to.not.have.property('prevPage')
      expect(res.body).to.not.have.property('nextPage')
    })
  })
})
