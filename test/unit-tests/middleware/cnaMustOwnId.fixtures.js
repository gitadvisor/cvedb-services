const getConstants = require('../../../src/constants').getConstants
const CONSTANTS = getConstants()

const owningOrgHeader = {
  'content-type': 'application/json',
  'CVE-API-ORG': 'cisco',
  'CVE-API-USER': 'alopez',
  'CVE-API-KEY': 'SVXPHM9-1VXM0A8-QMG8WN0-29MASSE'
}

const secretariatHeader = {
  'content-type': 'application/json',
  'CVE-API-ORG': 'mitre',
  'CVE-API-USER': 'cpadro',
  'CVE-API-KEY': 'S96E4QT-SMT4YE3-KX03X6K-4615CED'
}

const owningOrg = {
  UUID: '88c02595-c8f7-4864-a0e7-e09b3e1da691',
  authority: {
    active_roles: [CONSTANTS.AUTH_ROLE_ENUM.CNA]
  },
  name: 'Cisco',
  policies: {
    id_quota: 1000
  },
  short_name: 'cisco',
  inUse: false
}

const org = {
  UUID: 'c0a1d017-faa5-4608-92ff-5c938da17eff',
  authority: {
    active_roles: [CONSTANTS.AUTH_ROLE_ENUM.CNA]
  },
  name: 'Siemens',
  policies: {
    id_quota: 500
  },
  short_name: 'siemens',
  inUse: false
}

const cveDummy1 = {
  _id: 1,
  cve_id: 'CVE-2019-5012',
  cve_year: '2019',
  state: CONSTANTS.CVE_STATES.RESERVED,
  owning_cna: owningOrg.UUID,
  requested_by: {}
}

const cveDummy2 = {
  _id: 1,
  cve_id: 'CVE-2018-5111',
  cve_year: '2018',
  state: CONSTANTS.CVE_STATES.REJECTED,
  owning_cna: org.UUID,
  requested_by: {}
}

const secretariatOrg = {
  UUID: '15fd129f-af00-4d8c-8f7b-e19b0587223f',
  authority: {
    active_roles: [CONSTANTS.AUTH_ROLE_ENUM.CNA, CONSTANTS.AUTH_ROLE_ENUM.SECRETARIAT]
  },
  name: 'The MITRE Corporation',
  policies: {
    id_quota: 1000
  },
  short_name: 'mitre',
  inUse: false
}

const secretariatUser = {
  UUID: 'e13186d5-ce3d-4fd9-aecd-8698c26897f2',
  org_UUID: secretariatOrg.UUID,
  name: {
    first: 'Cristina',
    last: 'Padro'
  },
  authority: {
    active_roles: []
  },
  secret: '$argon2i$v=19$m=4096,t=3,p=1$+qGHEfH5h4/tk404iWBxFw$xV96/b4NvQVvlZIq57wTS8s7gfKzsfMXRiOyf3ffgcw',
  username: 'cpadro',
  active: true
}

module.exports = {
  owningOrgHeader,
  owningOrg,
  cveDummy1,
  cveDummy2,
  org,
  secretariatHeader,
  secretariatOrg,
  secretariatUser
}
