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

const orgFixtures = require('./mockObjects.org')
const orgController = require('../../../src/controller/org.controller/org.controller')
const orgParams = require('../../../src/controller/org.controller/org.middleware')

describe('Testing the GET /org endpoint in Org Controller', () => {
  context('Positive Tests', () => {
    it('Page query param not provided: should list non-paginated orgs because orgs fit in one page', async () => {
      const itemsPerPage = 500

      class GetAllOrgs {
        async aggregatePaginate () {
          const res = {
            itemsList: orgFixtures.allOrgs,
            itemCount: orgFixtures.allOrgs.length,
            itemsPerPage: itemsPerPage,
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

      app.route('/org-all-cnas-non-paginated')
        .get((req, res, next) => {
          const factory = {
            getOrgRepository: () => { return new GetAllOrgs() }
          }
          req.ctx.repositories = factory
          next()
        }, orgParams.parseGetParams, orgController.ORG_ALL)

      const testSecretariatHeader = Object.assign({}, orgFixtures.secretariatHeader)
      const res = await chai.request(app)
        .get('/org-all-cnas-non-paginated')
        .set(testSecretariatHeader)

      expect(res).to.have.status(200)
      expect(res).to.have.property('body').and.to.be.a('object')
      expect(res.body).to.have.property('organizations').and.to.be.a('array').and.to.have.lengthOf(orgFixtures.allOrgs.length)
      expect(res.body).to.not.have.property('totalCount')
      expect(res.body).to.not.have.property('itemsPerPage')
      expect(res.body).to.not.have.property('pageCount')
      expect(res.body).to.not.have.property('currentPage')
      expect(res.body).to.not.have.property('prevPage')
      expect(res.body).to.not.have.property('nextPage')
    })

    it('Page query param not provided: should list the users in two pages (page 1/2)', async () => {
      const itemsPerPage = 5

      class GetAllOrgs {
        async aggregatePaginate () {
          const res = {
            itemsList: [orgFixtures.allOrgs[0], orgFixtures.allOrgs[1], orgFixtures.allOrgs[3], orgFixtures.allOrgs[3], orgFixtures.allOrgs[4]],
            itemCount: orgFixtures.allOrgs.length,
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

      app.route('/org-all-cnas-paginated')
        .get((req, res, next) => {
          const factory = {
            getOrgRepository: () => { return new GetAllOrgs() }
          }
          req.ctx.repositories = factory
          // temporary fix for #920: force pagnation
          req.TEST_PAGINATOR_LIMIT = itemsPerPage
          next()
        }, orgParams.parseGetParams, orgController.ORG_ALL)

      const testSecretariatHeader = Object.assign({}, orgFixtures.secretariatHeader)
      const res = await chai.request(app)
        .get('/org-all-cnas-paginated')
        .set(testSecretariatHeader)

      expect(res).to.have.status(200)
      expect(res).to.have.property('body').and.to.be.a('object')
      expect(res.body).to.have.property('organizations').and.to.be.a('array').and.to.have.lengthOf(5)
      expect(res.body).to.have.property('totalCount').and.to.equal(orgFixtures.allOrgs.length)
      expect(res.body).to.have.property('itemsPerPage').and.to.equal(itemsPerPage)
      expect(res.body).to.have.property('pageCount').and.to.equal(2)
      expect(res.body).to.have.property('currentPage').and.to.equal(1)
      expect(res.body).to.have.property('prevPage').and.to.equal(null)
      expect(res.body).to.have.property('nextPage').and.to.equal(2)
    })

    it('Page query param provided: should list the users in two pages (page 2/2)', async () => {
      const itemsPerPage = 5

      class GetAllOrgs {
        async aggregatePaginate () {
          const res = {
            itemsList: [orgFixtures.allOrgs[5], orgFixtures.allOrgs[6], orgFixtures.allOrgs[7], orgFixtures.allOrgs[8]],
            itemCount: orgFixtures.allOrgs.length,
            itemsPerPage: itemsPerPage,
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

      app.route('/org-all-cnas-paginated-2')
        .get((req, res, next) => {
          const factory = {
            getOrgRepository: () => { return new GetAllOrgs() }
          }
          req.ctx.repositories = factory
          // temporary fix for #920: force pagnation
          req.TEST_PAGINATOR_LIMIT = itemsPerPage
          next()
        }, orgParams.parseGetParams, orgController.ORG_ALL)

      const testSecretariatHeader = Object.assign({}, orgFixtures.secretariatHeader)
      const res = await chai.request(app)
        .get('/org-all-cnas-paginated-2?page=2')
        .set(testSecretariatHeader)

      expect(res).to.have.status(200)
      expect(res).to.have.property('body').and.to.be.a('object')
      expect(res.body).to.have.property('organizations').and.to.be.a('array').and.to.have.lengthOf(4)
      expect(res.body).to.have.property('totalCount').and.to.equal(orgFixtures.allOrgs.length)
      expect(res.body).to.have.property('itemsPerPage').and.to.equal(itemsPerPage)
      expect(res.body).to.have.property('pageCount').and.to.equal(2)
      expect(res.body).to.have.property('currentPage').and.to.equal(2)
      expect(res.body).to.have.property('prevPage').and.to.equal(1)
      expect(res.body).to.have.property('nextPage').and.to.equal(null)
    })

    it('Page query param provided: should return an empty list because no org exists', async () => {
      const itemsPerPage = 5

      class GetAllOrgs {
        async aggregatePaginate () {
          const res = {
            itemsList: [],
            itemCount: 0,
            itemsPerPage: itemsPerPage,
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

      app.route('/org-all-cnas-empty')
        .get((req, res, next) => {
          const factory = {
            getOrgRepository: () => { return new GetAllOrgs() }
          }
          req.ctx.repositories = factory
          next()
        }, orgParams.parseGetParams, orgController.ORG_ALL)

      const res = await chai.request(app)
        .get('/org-all-cnas-empty?page=1')
        .set(orgFixtures.secretariatHeader)

      expect(res).to.have.status(200)
      expect(res).to.have.property('body').and.to.be.a('object')
      expect(res.body).to.have.property('organizations').and.to.be.a('array').and.to.have.lengthOf(0)
      expect(res.body).to.not.have.property('totalCount')
      expect(res.body).to.not.have.property('itemsPerPage')
      expect(res.body).to.not.have.property('pageCount')
      expect(res.body).to.not.have.property('currentPage')
      expect(res.body).to.not.have.property('prevPage')
      expect(res.body).to.not.have.property('nextPage')
    })
  })
})
