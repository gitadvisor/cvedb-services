const getConstants = require('../../../src/constants').getConstants
const CONSTANTS = getConstants()

const secretariatHeaders = {
  'content-type': 'application/json',
  'CVE-API-ORG': 'secretariat',
  'CVE-API-USER': 'secretariat_user',
  'CVE-API-KEY': 'S96E4QT-SMT4YE3-KX03X6K-4615CED'
}

const secretariatOrg = {
  UUID: '15fd129f-af00-4d8c-8f7b-e19b0587223f',
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
  UUID: 'h34186d5-ce3d-4fd9-aecd-8698c26897f2',
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

const notSecretariatOrg = {
  UUID: '24ad129f-af00-4d8c-8f7b-e19b0587223f',
  authority: {
    active_roles: [CONSTANTS.AUTH_ROLE_ENUM.CNA]
  },
  name: 'Not a Secretariat',
  policies: {
    id_quota: 5
  },
  short_name: 'not_secretariat'
}

const notSecretariatUser = {
  UUID: 'a11186d5-ce3d-4fd9-aecd-8698c26897f2',
  org_UUID: notSecretariatOrg.UUID,
  name: {
    first: 'Not',
    last: 'Secretariat_User'
  },
  authority: {
    active_roles: []
  },
  secret: '$argon2i$v=19$m=4096,t=3,p=1$+qGHEfH5h4/tk404iWBxFw$xV96/b4NvQVvlZIq57wTS8s7gfKzsfMXRiOyf3ffgcw',
  username: 'not_secretariat_user',
  active: true
}

module.exports = {
  secretariatHeaders,
  secretariatUser,
  secretariatOrg,
  notSecretariatUser,
  notSecretariatOrg
}
