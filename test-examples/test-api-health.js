var chai = require('chai')
var chaiHttp = require('chai-http')

chai.use(chaiHttp)
chai.should()

describe('API Health Check: ', () => {
  it('Api should be running', function (done) {
    chai.request('http://localhost:3000')
      .get('/health-check')
      .end((err, res) => {
        if (err) {
          console.log(err.stack)
        }

        res.should.have.status(200)
        res.should.be.json()
        res.body.should.be.a('object')
        res.body.should.have.property('isHealthy')
        res.body.isHealthy.should.equal(true)
        done()
      })
  })
})
