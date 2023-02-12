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

const mwFixtures = require('./mockObjects.middleware')
const cveId5 = 'CVE-2017-4024'
const cvePass5 = require('../../schemas/5.0/' + cveId5 + '_published.json')
const cveFail5 = require('../../schemas/5.0/' + cveId5 + '_fail.json')
const cveMetadataFail5 = require('../../schemas/5.0/' + cveId5 + '_fail_cveMetadata.json')
const cveRejectedFail5 = require('../../schemas/5.0/' + cveId5 + '_rejected_fail.json')
const cveReservedFail5 = require('../../schemas/5.0/' + cveId5 + '_reserved_fail.json')
const cvePublishedFail5 = require('../../schemas/5.0/' + cveId5 + '_published_fail.json')
const cveVersionFail5 = require('../../schemas/5.0/' + cveId5 + '_version_fail.json')

app.route('/api/test/mw/schema5')
  .post(middleware.validateCveJsonSchema, (req, res) => {
    return res.status(200).json({ message: 'Success! You have reached the target endpoint.' })
  })

describe('Test the JSON schema 5.0 validation middleware', () => {
  context('Negative Tests', () => {
    it('Json validator fails because the STATE is invalid', (done) => {
      chai.request(app)
        .post('/api/test/mw/schema5')
        .set(mwFixtures.secretariatHeaders)
        .send(cveFail5)
        .end((err, res) => {
          if (err) {
            done(err)
          }

          expect(res).to.have.status(400)
          expect(res).to.have.property('body').and.to.be.a('object')
          expect(res.body).to.have.property('message').and.to.be.a('string')
          expect(res.body.message).to.equal('CVE JSON schema validation FAILED.')
          expect(res.body.details).to.have.property('errors').and.to.be.an('array')
          expect(res.body.details.errors[0]).to.have.string('cveMetadata.state is not one of enum values')
          done()
        })
    })

    it('Json validator fails when cveMetadata is not present', (done) => {
      chai.request(app)
        .post('/api/test/mw/schema5')
        .set(mwFixtures.secretariatHeaders)
        .send(cveMetadataFail5)
        .end((err, res) => {
          if (err) {
            done(err)
          }

          expect(res).to.have.status(400)
          expect(res).to.have.property('body').and.to.be.a('object')
          expect(res.body).to.have.property('message').and.to.be.a('string')
          expect(res.body.message).to.equal('CVE JSON schema validation FAILED.')
          expect(res.body.details).to.have.property('errors').and.to.be.an('array')
          expect(res.body.details.errors[0]).to.have.string('instance.cveMetadata is not defined')
          done()
        })
    })

    it('Json validator fails in REJECTED state', (done) => {
      chai.request(app)
        .post('/api/test/mw/schema5')
        .set(mwFixtures.secretariatHeaders)
        .send(cveRejectedFail5)
        .end((err, res) => {
          if (err) {
            done(err)
          }

          expect(res).to.have.property('status', 400)
          expect(res).to.have.property('body').and.to.be.a('object')
          expect(res.body).to.have.property('message').and.to.be.a('string')
          expect(res.body.message).to.equal('CVE JSON schema validation FAILED.')
          expect(res.body.details).to.have.property('errors').to.be.an('array')
          done()
        })
    })

    it('Json validator fails in RESERVED state', (done) => {
      chai.request(app)
        .post('/api/test/mw/schema5')
        .set(mwFixtures.secretariatHeaders)
        .send(cveReservedFail5)
        .end((err, res) => {
          if (err) {
            done(err)
          }

          expect(res).to.have.property('status', 400)
          expect(res).to.have.property('body').and.to.be.a('object')
          expect(res.body).to.have.property('message').and.to.be.a('string')
          expect(res.body.message).to.equal('CVE JSON schema validation FAILED.')
          done()
        })
    })

    it('Json validator fails in PUBLISHED state', (done) => {
      chai.request(app)
        .post('/api/test/mw/schema5')
        .set(mwFixtures.secretariatHeaders)
        .send(cvePublishedFail5)
        .end((err, res) => {
          if (err) {
            done(err)
          }

          expect(res).to.have.status(400)
          expect(res).to.have.property('body').and.to.be.a('object')
          expect(res.body).to.have.property('message').and.to.be.a('string')
          expect(res.body.message).to.equal('CVE JSON schema validation FAILED.')
          expect(res.body.details).to.have.property('errors').and.to.be.an('array')
          expect(res.body.details.errors[0].message).to.have.string('must be string')
          expect(res.body.details.errors[0].instancePath).to.have.string('/containers/cna/providerMetadata/orgId')
          done()
        })
    })

    it('Json validator fails because invalid data version', (done) => {
      chai.request(app)
        .post('/api/test/mw/schema5')
        .set(mwFixtures.secretariatHeaders)
        .send(cveVersionFail5)
        .end((err, res) => {
          if (err) {
            done(err)
          }

          expect(res).to.have.status(400)
          expect(res).to.have.property('body').and.to.be.a('object')
          expect(res.body).to.have.property('message').and.to.be.a('string')
          expect(res.body.message).to.equal('CVE JSON schema validation FAILED.')
          expect(res.body.details).to.have.property('errors').and.to.be.an('array')
          expect(res.body.details.errors[0]).to.have.string('instance.dataVersion is not one of enum values')
          done()
        })
    })
  })

  context('Positive Tests', () => {
    it('Json validator pass', (done) => {
      chai.request(app)
        .post('/api/test/mw/schema5')
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
