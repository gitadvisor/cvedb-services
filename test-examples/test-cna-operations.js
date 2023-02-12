var chai = require('chai')
var chaiHttp = require('chai-http')
chai.use(require('chai-uuid'))
chai.use(chaiHttp)
chai.should()

var { TEST_CNA_UUID, TEST_USER_PUBLICKEY } = require('../test/constants')

describe('CNA Operations:', () => {
  it('Should Register User', function (done) {
    chai.request('http://localhost:3000')
      .post('/register-user')
      .set(
        'signature',
        'e3fac5295e9b95746b51d849bf6ede74b5df981e18048e48fb2c14c79852c488c9f8bf6ed50be0188cf89f07a47ceeb777f450b5ed898432b90cecca8ed25ae199ce95ee811d5e69b2b560b109016e43be6f1fad43faf4b1179276d0fa41125b990f8f7caf42ae20942876caff65fc8cf5e4759c9fe515ac45a8deb7ad1eb67e'
      )
      .send({
        payload: {
          userPublicKey: TEST_USER_PUBLICKEY,
          userType: 'VENDOR',
          userHardQuota: 100,
          userSoftQuota: 50,
          userDescription: 'user description',
          userGithubID: 'rotsen91',
          userFName: 'Nestor',
          userLName: 'Mora',
          userEmail: 'nestor@test.com',
          userURL: 'Optional userURL',
          userGPGKeys: 'Optional userGPGKeys'
        },
        userUUID: TEST_CNA_UUID
      })
      .end((err, res) => {
        if (err) {
          console.log(err.stack)
        }

        res.should.have.status(200)
        res.should.be.json()
        res.body.should.be.a('object')
        res.body.should.have.property('userUUID')
        res.body.should.have.property('message')
        res.body.message.should.equal('user created')
        res.body.userUUID.should.be.a.uuid('v4')
        done()
      })
  })
})
