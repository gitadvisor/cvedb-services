const getConstants = require('../../../src/constants').getConstants
const CONSTANTS = getConstants()

const secretariatHeaders = {
  'content-type': 'application/json',
  'CVE-API-ORG': 'mitre',
  'CVE-API-USER': 'cpadro',
  'CVE-API-KEY': 'S96E4QT-SMT4YE3-KX03X6K-4615CED',
  'PAGINATOR-PAGE': CONSTANTS.PAGINATOR_PAGE
}

const existentOrg = {
  UUID: '15fd129f-af00-4d8c-8f7b-e19b0587223f',
  authority: {
    active_roles: [CONSTANTS.AUTH_ROLE_ENUM.CNA, CONSTANTS.AUTH_ROLE_ENUM.SECRETARIAT]
  },
  name: 'The MITRE Corporation',
  policies: {
    id_quota: 5
  },
  short_name: 'mitre',
  active: true
}

const existentUser = {
  UUID: 'e13186d5-ce3d-4fd9-aecd-8698c26897f2',
  org_UUID: existentOrg.UUID,
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

const deactivatedUser = {
  UUID: 'a32386d5-ce3d-4fd9-aecd-8698c26897f2',
  org_UUID: existentOrg.UUID,
  name: {
    first: 'First',
    last: 'Last'
  },
  authority: {
    active_roles: []
  },
  secret: '$argon2i$v=19$m=4096,t=3,p=1$+qGHEfH5h4/tk404iWBxFw$xV96/b4NvQVvlZIq57wTS8s7gfKzsfMXRiOyf3ffgcw',
  username: 'flast',
  active: false
}

module.exports = {
  secretariatHeaders,
  existentOrg,
  existentUser,
  deactivatedUser
}
