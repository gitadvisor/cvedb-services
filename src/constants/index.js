const fs = require('fs')
const cveSchemaV5 = JSON.parse(fs.readFileSync('src/middleware/5.0_bundled_schema.json'))

/**
 * Return default values.
 *
 * The object is created in this function to prevent accidental
 * value re-assignment and still allow IDE type-hints and compiled regex
 *
 * @return {defaults}
 */
function getConstants () {
  /**
  * @constant
  * @default
  * @lends defaults
  */
  const defaults = {
    MONGOOSE_VALIDATION: {
      Org_policies_id_quota_min: 0,
      Org_policies_id_quota_min_message: 'Org.policies.id_quota cannot be a negative number.',
      Org_policies_id_quota_max: 100000,
      Org_policies_id_quota_max_message: 'Org.policies.id_quota cannot exceed maximum threshold.'
    },
    DEFAULT_ID_QUOTA: 1000,
    DEFAULT_AVAILABLE_POOL: 100,
    NONSEQUENTIAL_MAX_AMOUNT: 10,
    CRYPTO_RANDOM_STRING_LENGTH: 36,
    AUTH_ROLE_ENUM: {
      SECRETARIAT: 'SECRETARIAT',
      CNA: 'CNA',
      BULK_DOWNLOAD: 'BULK_DOWNLOAD',
      ROOT_CNA: 'ROOT_CNA',
      ADP: 'ADP'
    },
    ORG_ROLES: [
      'CNA',
      'SECRETARIAT',
      'BULK_DOWNLOAD',
      'ROOT_CNA',
      'ADP'
    ],
    USER_ROLES: [
      'ADMIN'
    ],
    USER_ROLE_ENUM: {
      ADMIN: 'ADMIN'
    },
    AUTH_HEADERS: {
      ORG: 'CVE-API-ORG',
      USER: 'CVE-API-USER',
      KEY: 'CVE-API-KEY'
    },
    CVE_STATES: {
      PUBLISHED: 'PUBLISHED',
      RESERVED: 'RESERVED',
      REJECTED: 'REJECTED',
      AVAILABLE: 'AVAILABLE'
    },
    QUOTA_HEADER: 'CVE-API-REMAINING-QUOTA',
    DEFAULT_CVE_ID_RANGE: {
      cve_year: 2020,
      ranges: {
        priority: {
          top_id: 0,
          start: 0,
          end: 20000
        },
        general: {
          top_id: 20000,
          start: 20000,
          end: 50000000
        }
      }
    },
    PAGINATOR_HEADERS: {
      PAGE: 'PAGINATOR-PAGE'
    },
    PAGINATOR_PAGE: 1,
    PAGINATOR_OPTIONS: {
      limit: 500,
      useFacet: false,
      customLabels: {
        totalDocs: 'itemCount',
        docs: 'itemsList',
        limit: 'itemsPerPage',
        page: 'currentPage',
        totalPages: 'pageCount',
        useFacet: false
      }
    },
    MAX_SHORTNAME_LENGTH: 32,
    MIN_SHORTNAME_LENGTH: 2,
    CVE_ID_PATTERN: cveSchemaV5.definitions.cveId.pattern,
    // Ajv's pattern validation uses the "u" (unicode) flag:
    // https://ajv.js.org/json-schema.html#pattern
    CVE_ID_REGEX: new RegExp(cveSchemaV5.definitions.cveId.pattern, 'u')
  }

  return defaults
}

module.exports = {
  getConstants
}
