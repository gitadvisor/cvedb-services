var chai = require('chai')
var chaiHttp = require('chai-http')
var assertArrays = require('chai-arrays')
chai.use(assertArrays)
chai.use(require('chai-like'))
chai.use(require('chai-things')) // Don't swap these two
chai.use(require('chai-string'))
chai.use(chaiHttp)
chai.should()

var { TEST_USER_UUID, TEST_CVE_STATUS, TEST_CVE_ID } = require('../test/constants')

describe('User Request CVE ID Operations:', () => {
  it('Should Request 2 CVE IDs', function (done) {
    chai.request('http://localhost:3000')
      .post('/get-cve-id')
      .set(
        'signature',
        '0303e5dd1a65426e3565614692d2f6cd8fc279dfbb1c7148104431645641f5e084155cce00879252488d0d68c483996f36701345068b0fa0b8cc0509cf00aa068adb65fa43b871e6a026a936230d10364f286cec22334868cba5c1e8e8b0ac8be4f28ecbe9f4b99ba8803fa04570fae1dd5b16d7c90cc066ac461fdc84980f00'
      )
      .send({ payload: { count: '2' }, userUUID: TEST_USER_UUID })
      .end((err, res) => {
        if (err) {
          console.log(err.stack)
        }

        res.should.have.status(200)
        res.should.be.an('array')
        res.body.should.be.ofSize(2)
        res.body.should.be.an('array').that.contains.something.like({ status: 'Disputed' })
        done()
      })
  })

  it('Should Overide Default Status', function (done) {
    chai.request('http://localhost:3000')
      .post('/get-cve-id')
      .set(
        'signature',
        '485acc0cd2efb4c9f055614f578c1ce080626521f887bb188cd65a0dee17159e217c2c0c5e1add4902d05e5a0b575953a79ea030522c411b77b119152654b4009a55fc7117299463f14f11edf142e10dced4794491a2e138bd1e5b474fb0c60f60a7f8a5a2fb921f67f81de718b441d5ebe87d77c3fec9a117fd40b30e6d8d9d'
      )
      .send({ payload: { status: 'Free' }, userUUID: TEST_USER_UUID })
      .end((err, res) => {
        if (err) {
          console.log(err.stack)
        }

        res.should.have.status(200)
        res.should.be.an('array')
        res.body.should.be.ofSize(1)
        res.body.should.be.an('array').that.contains.something.like({ status: 'Free' })
        done()
      })
  })

  it('Should Overide Current Year', function (done) {
    chai.request('http://localhost:3000')
      .post('/get-cve-id')
      .set(
        'signature',
        '302ce4dc7a2ffe20fae3b0a0874f130cac0e82f16238170b2f7645298aa372f3fcb5a677cf4bb07a7130c5fa43718f6a4493aeaef2a5e3b588119d123ee8a504c73ae3ab7255adf3cec0c4f7b0459aaa80d3ee8e346072d39dd2a916636733ec3f4e7616ce762944ace8dd90922cd82e9c017282cd676c532f7a3704c4bbd8b9'
      )
      .send({ payload: { year: '1991' }, userUUID: TEST_USER_UUID })
      .end((err, res) => {
        if (err) {
          console.log(err.stack)
        }

        res.should.have.status(200)
        res.should.be.an('array')
        res.body.should.be.ofSize(1)
        res.body[0].cve_id.should.have.entriesCount('1991', 1)
        done()
      })
  })
})

describe('User Request CVE Info:', () => {
  it('Should Request Info from CVE with ID', function (done) {
    chai.request('http://localhost:3000')
      .post('/get-cvs-info')
      .set(
        'signature',
        '0452d6c781d07c2346766cc88984fe93fc2061b1d7846c949c35ea76aca85274cab23b2d7cc789b5cd6191ef3235c26ab434c5e36f7c60d023da27bec6e203863eeaff9e6fa949193c15989c0e3215c443fcd776e6cd4c7ef03df7cf5304092e19bbabd67dbdc8d797e1831d197cc878c865e756017f2b18f79bdca5dff9c2e3'
      )
      .send({ payload: { ids: [TEST_CVE_ID] }, userUUID: TEST_USER_UUID })
      .end((err, res) => {
        if (err) {
          console.log(err.stack)
        }

        res.should.have.status(200)
        res.should.be.an('array')
        res.body.should.be.an('array').that.contains.something.like({ cve_id: TEST_CVE_ID })
        done()
      })
  })

  it('Should Request Info from CVE with Status Filter', function (done) {
    chai.request('http://localhost:3000')
      .post('/get-cvs-info')
      .set(
        'signature',
        '4db4d366e23992f30f2770c8f1f8fc532d740ba7228561ef9e4853f80bd9252cbcc76432827277d486d9b608fa7ba946ed244a86ab12d11b67f3342b8ecde8b7a33882db120e2a4d8a01f057449dfa81fb5007783311474c6f8e79ca15596801ff45b88cb7c13cf39b524abfaafbd4ce6c6d86f953ff94239fe017d93c61ff1c'
      )
      .send({ payload: { filter: TEST_CVE_STATUS }, userUUID: TEST_USER_UUID })
      .end((err, res) => {
        if (err) {
          console.log(err.stack)
        }

        res.should.have.status(200)
        res.should.be.an('array')
        res.body.should.be.an('array').that.contains.something.like({ status: TEST_CVE_STATUS })
        done()
      })
  })
})

describe('User Modify CVE Status:', () => {
  it('Should Set CVE With Populated Status ', function (done) {
    chai.request('http://localhost:3000')
      .post('/set-cve-status')
      .set(
        'signature',
        '1f9089ecf145e254c427c7856c7a5c2141f19176777530142398fb67ebb30c5e98d472320e443cb6bc0c93a2c1606a48f0a9557c528e5f6c98397e61191ad11a64aa81b82a6a8af86ba5898d1feafc4f1eecc860808e359656686e17a127fc4bf9207f2416b333e9e95fdf9aebf2c42a47338bb8c53f738fbeb611f2ff990fa9'
      )
      .send({
        payload: {
          ids: [TEST_CVE_ID],
          status: 'Populated'
        },
        userUUID: TEST_USER_UUID
      })
      .end((err, res) => {
        if (err) {
          console.log(err.stack)
        }

        res.should.have.status(200)
        res.body.should.be.a('object')
        res.body.should.have.property('Success')
        res.body.Success.should.equal(true)
        done()
      })
  })
})
