const getConstants = require('../../../src/constants').getConstants
const CONSTANTS = getConstants()
const cveIdPublished5 = 'CVE-2017-4024'
const cveIdRejected5 = 'CVE-2017-5835'
const cvePublishedPass5 = require('../../schemas/5.0/' + cveIdPublished5 + '_published.json')
const cveRejectedPass5 = require('../../schemas/5.0/' + cveIdRejected5 + '_rejected.json')

const secretariatHeader = {
  'content-type': 'application/json',
  'CVE-API-ORG': 'mitre',
  'CVE-API-USER': 'cpadro',
  'CVE-API-KEY': 'S96E4QT-SMT4YE3-KX03X6K-4615CED'
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
  short_name: 'mitre'
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

const regularOrg = {
  UUID: '16fd129f-af00-4d8c-8f7b-e19b0587223a',
  authority: {
    active_roles: [
      CONSTANTS.AUTH_ROLE_ENUM.CNA
    ]
  },
  name: 'Booker LLC',
  short_name: 'window_1',
  time: {
    modified: '2021-05-11T15:07:19.468216Z',
    created: '2021-05-11T15:07:19.468216Z'
  },
  policies: {
    id_quota: 1251
  }
}

const regularUser = {
  UUID: 'f13186d5-ce3d-4fd9-aecd-8698c26897f3',
  org_UUID: regularOrg.UUID,
  name: {
    first: 'Robert',
    last: 'Petal'
  },
  authority: {
    active_roles: []
  },
  secret: '$argon2i$v=19$m=4096,t=3,p=1$+qGHEfH5h4/tk404iWBxFw$xV96/b4NvQVvlZIq57wTS8s7gfKzsfMXRiOyf3ffgcw',
  username: 'rpetal',
  active: true
}

const cveAvailable5 = {
  cve_id: 'CVE-2017-5834',
  cve_year: '2017',
  state: CONSTANTS.CVE_STATES.AVAILABLE,
  owning_cna: 'N/A',
  reserved: Date.now(),
  requested_by: {
    cna: 'N/A',
    user: 'N/A'
  }
}

const cvePublished5 = {
  cve_id: 'CVE-2017-4024',
  cve_year: '2017',
  state: CONSTANTS.CVE_STATES.RESERVED,
  owning_cna: secretariatOrg.UUID,
  reserved: Date.now(),
  requested_by: {
    cna: secretariatUser.org_UUID,
    user: secretariatUser.UUID
  }
}

const cveRejected5 = {
  cve_id: 'CVE-2017-5835',
  cve_year: '2017',
  state: CONSTANTS.CVE_STATES.RESERVED,
  owning_cna: secretariatOrg.UUID,
  reserved: Date.now(),
  requested_by: {
    cna: secretariatUser.org_UUID,
    user: secretariatUser.UUID
  }
}

const cveToReject = {
  cve_id: 'CVE-2019-1421',
  cve_year: '2019',
  state: CONSTANTS.CVE_STATES.RESERVED,
  owning_cna: secretariatOrg.UUID,
  reserved: Date.now(),
  requested_by: {
    cna: secretariatUser.org_UUID,
    user: secretariatUser.UUID
  }
}

const cveRecordPublished5 = {
  time: {
    created: Date.now(),
    modified: Date.now()
  },
  cve: cvePublishedPass5
}

const cveRecordRejected5 = {
  time: {
    created: Date.now(),
    modified: Date.now()
  },
  cve: cveRejectedPass5
}

module.exports = {
  secretariatHeader,
  secretariatOrg,
  secretariatUser,
  regularOrg,
  regularUser,
  cveAvailable5,
  cvePublished5,
  cveRejected5,
  cveToReject,
  cveRecordPublished5,
  cveRecordRejected5
}
