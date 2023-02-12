const getConstants = require('../../../src/constants').getConstants
const CONSTANTS = getConstants()

const secretariatHeaders = {
  'content-type': 'application/json',
  'CVE-API-ORG': 'secretariat',
  'CVE-API-USER': 'secretariat_user',
  'CVE-API-KEY': 'S96E4QT-SMT4YE3-KX03X6K-4615CED'
}

const secretariatOrg = {
  UUID: '11kd129f-af00-4d8c-8f7b-e19b0587223f',
  authority: {
    active_roles: [CONSTANTS.AUTH_ROLE_ENUM.SECRETARIAT]
  },
  name: 'The Sec',
  policies: {
    id_quota: 5
  },
  short_name: 'secretariat'
}

const secretariatUser = {
  UUID: 'b34186d5-ce3d-4fd9-aecd-8698c26897f2',
  org_UUID: secretariatOrg.UUID,
  name: {
    first: 'Secretariat',
    last: 'User'
  },
  authority: {
    active_roles: []
  },
  secret: '$argon2i$v=19$m=4096,t=3,p=1$+qGHEfH5h4/tk404iWBxFw$xV96/b4NvQVvlZIq57wTS8s7gfKzsfMXRiOyf3ffgcw',
  username: 'secretariat_user',
  active: true
}

const secretariatAndCnaHeaders = {
  'content-type': 'application/json',
  'CVE-API-ORG': 'secretariatAndCna',
  'CVE-API-USER': 'secretariatAndCna_user',
  'CVE-API-KEY': 'S96E4QT-SMT4YE3-KX03X6K-4615CED'
}

const secretariatAndCnaOrg = {
  UUID: '15fd129f-af00-4d8c-8f7b-e19b0587223f',
  authority: {
    active_roles: [CONSTANTS.AUTH_ROLE_ENUM.CNA, CONSTANTS.AUTH_ROLE_ENUM.SECRETARIAT]
  },
  name: 'The Sec and CNA',
  policies: {
    id_quota: 5
  },
  short_name: 'secretariatAndCna'
}

const secretariatAndCnaUser = {
  UUID: 'h34186d5-ce3d-4fd9-aecd-8698c26897f2',
  org_UUID: secretariatAndCnaOrg.UUID,
  name: {
    first: 'SecretariatAndCna',
    last: 'User'
  },
  authority: {
    active_roles: []
  },
  secret: '$argon2i$v=19$m=4096,t=3,p=1$+qGHEfH5h4/tk404iWBxFw$xV96/b4NvQVvlZIq57wTS8s7gfKzsfMXRiOyf3ffgcw',
  username: 'secretariatAndCna_user',
  active: true
}

const notCnaHeaders = {
  'content-type': 'application/json',
  'CVE-API-ORG': 'not_CNA',
  'CVE-API-USER': 'not_cna_user',
  'CVE-API-KEY': 'S96E4QT-SMT4YE3-KX03X6K-4615CED'
}

const notCnaOrg = {
  UUID: '25bd129f-af00-4d8c-8f7b-e19b0587223f',
  authority: {
    active_roles: ['']
  },
  name: 'Not a CNA',
  policies: {
    id_quota: 5
  },
  short_name: 'not_CNA'
}

const notCnaUser = {
  UUID: 'z13186d5-ce3d-4fd9-aecd-8698c26897f2',
  org_UUID: notCnaOrg.UUID,
  name: {
    first: 'Not',
    last: 'CNA_User'
  },
  authority: {
    active_roles: []
  },
  secret: '$argon2i$v=19$m=4096,t=3,p=1$+qGHEfH5h4/tk404iWBxFw$xV96/b4NvQVvlZIq57wTS8s7gfKzsfMXRiOyf3ffgcw',
  username: 'not_cna_user',
  active: true
}

const cnaHeaders = {
  'content-type': 'application/json',
  'CVE-API-ORG': 'CNA',
  'CVE-API-USER': 'cna_user',
  'CVE-API-KEY': 'S96E4QT-SMT4YE3-KX03X6K-4615CED'
}

const cnaOrg = {
  UUID: '87yd129f-af00-4d8c-8f7b-e19b0587223f',
  authority: {
    active_roles: [CONSTANTS.AUTH_ROLE_ENUM.CNA]
  },
  name: 'CNA',
  policies: {
    id_quota: 5
  },
  short_name: 'CNA'
}

const cnaUser = {
  UUID: 'f98186d5-ce3d-4fd9-aecd-8698c26897f2',
  org_UUID: cnaOrg.UUID,
  name: {
    first: 'CNA',
    last: 'User'
  },
  authority: {
    active_roles: []
  },
  secret: '$argon2i$v=19$m=4096,t=3,p=1$+qGHEfH5h4/tk404iWBxFw$xV96/b4NvQVvlZIq57wTS8s7gfKzsfMXRiOyf3ffgcw',
  username: 'cna_user',
  active: true
}

module.exports = {
  secretariatHeaders,
  secretariatUser,
  secretariatOrg,
  secretariatAndCnaHeaders,
  secretariatAndCnaUser,
  secretariatAndCnaOrg,
  notCnaHeaders,
  notCnaUser,
  notCnaOrg,
  cnaHeaders,
  cnaUser,
  cnaOrg
}
