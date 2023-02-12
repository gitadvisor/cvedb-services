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

const cveFixtures = require('./mockObjects.cve')
const cnaPass = require('../../schemas/cna-container/cna-container_pass.json')
const cnaFail = require('../../schemas/cna-container/cna-container-missing-container.json')
const cveMw = require('../../../src/controller/cve.controller/cve.middleware')

app.route('/api/test/mw/cnaschema')
  .post(cveMw.validateCveCnaContainerJsonSchema, (req, res) => {
    return res.status(200).json({ message: 'Success! You have reached the target endpoint.' })
  })

describe('Test the JSON schema cna container validation middleware', () => {
  context('Negative Tests', () => {
    it('Json validator fails because missing cnaContainer object', (done) => {
      chai.request(app)
        .post('/api/test/mw/cnaschema')
        .set(cveFixtures.secretariatHeader)
        .send(cnaFail)
        .end((err, res) => {
          if (err) {
            done(err)
          }

          expect(res).to.have.status(400)
          expect(res).to.have.property('body').and.to.be.a('object')
          expect(res.body).to.have.property('message').and.to.be.a('string')
          expect(res.body.message).to.equal('CVE cnaContainer JSON schema validation FAILED.')
          expect(res.body.details).to.have.property('errors').and.to.be.an('array')
          expect(res.body.details.errors[0].message).to.have.string("must have required property 'cnaContainer'")
          done()
        })
    })
  })

  context('Positive Tests', () => {
    it('Json validator pass with all required elements', (done) => {
      chai.request(app)
        .post('/api/test/mw/cnaschema')
        .set(cveFixtures.secretariatHeader)
        .send(cnaPass)
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
