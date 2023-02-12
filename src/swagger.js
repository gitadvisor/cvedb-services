const swaggerAutogen = require('swagger-autogen')({ openapi: '3.0.2' })
const outputFile = 'api-docs/openapi.json'
const endpointsFiles = [
  'src/controller/cve-id.controller/index.js',
  'src/controller/cve.controller/index.js',
  'src/controller/org.controller/index.js',
  'src/controller/user.controller/index.js',
  'src/controller/system.controller/index.js'
]
const publishedCVERecord = require('../schemas/cve/published-cve-example.json')
const rejectedCVERecord = require('../schemas/cve/rejected-cve-example.json')
const rejectedCreateCVERecord = require('../schemas/cve/rejected-create-cve-example.json')

/* eslint-disable no-multi-str */
const doc = {
  info: {
    version: '2.1.1',
    title: 'CVE Services API',
    description: "The CVE Services API supports automation tooling for the CVE Program. Credentials are \
    required for most service endpoints. Representatives of \
    <a href='https://www.cve.org/ProgramOrganization/CNAs'>CVE Numbering Authorities (CNAs)</a> should \
    use one of the methods below to obtain credentials:\
    <ul><li>If your organization already has an Organizational Administrator (OA) account for the CVE \
    Services, ask your admin for credentials</li> \
    <li>Contact your Root (<a href='https://www.cve.org/PartnerInformation/ListofPartners/partner/Google'>Google</a>, \
    <a href='https://www.cve.org/PartnerInformation/ListofPartners/partner/INCIBE'>INCIBE</a>, \
    <a href='https://www.cve.org/PartnerInformation/ListofPartners/partner/jpcert'>JPCERT/CC</a>, or \
    <a href='https://www.cve.org/PartnerInformation/ListofPartners/partner/redhat'>Red Hat</a>) or \
    Top-Level Root (<a href='https://www.cve.org/PartnerInformation/ListofPartners/partner/icscert'>CISA ICS</a> \
    or <a href='https://www.cve.org/PartnerInformation/ListofPartners/partner/mitre'>MITRE</a>) to request credentials \
    </ul> \
    <p>CVE data is to be in the JSON 5.0 CVE Record format. Details of the JSON 5.0 schema are \
    located <a href='https://github.com/CVEProject/cve-schema/tree/master/schema/v5.0' target='_blank'>here</a>.</p>\
    <a href='https://cveform.mitre.org/' class='link' target='_blank'>Contact the CVE Services team</a>",
    contact: {
      name: 'CVE Services Overview',
      url: 'https://cveproject.github.io/automation-cve-services#services-overview'

    }
  },
  servers: [
    {
      url: 'urlplaceholder'
    }
  ],
  basePath: '/api',
  host: 'localhost:3000',
  schemes: [
    'https'
  ],
  components: {
    parameters: {
      active: {
        in: 'query',
        name: 'active',
        description: 'The new active state for the user entry.  Accepted values are 1, true, or yes to indicate true, and 0, false, or no to indicate false',
        required: false,
        schema: {
          type: 'boolean'
        }
      },
      active_roles_add: {
        in: 'query',
        name: 'active_roles.add',
        description: 'Add an active role to the organization',
        required: false,
        schema: {
          type: 'string',
          enum: [
            'CNA',
            'SECRETARIAT',
            'ROOT_CNA',
            'ADP'
          ]
        }
      },
      active_roles_remove: {
        in: 'query',
        name: 'active_roles.remove',
        description: 'Remove an active role from the organization',
        required: false,
        schema: {
          type: 'string',
          enum: [
            'CNA',
            'SECRETARIAT',
            'ROOT_CNA',
            'ADP'
          ]
        }
      },
      activeUserRolesAdd: {
        in: 'query',
        name: 'active_roles.add',
        description: 'Add an active role to the user',
        required: false,
        schema: {
          type: 'string',
          enum: [
            'ADMIN'
          ]
        }
      },
      activeUserRolesRemove: {
        in: 'query',
        name: 'active_roles.remove',
        description: 'Remove an active role from the user',
        required: false,
        schema: {
          type: 'string',
          enum: [
            'ADMIN'
          ]
        }
      },
      apiEntityHeader: {
        in: 'header',
        name: 'CVE-API-ORG',
        description: 'The shortname for the organization associated with the user requesting authentication',
        required: true,
        schema: {
          type: 'string'
        }
      },
      apiUserHeader: {
        in: 'header',
        name: 'CVE-API-USER',
        description: 'The username for the account making the request',
        required: true,
        schema: {
          type: 'string'
        }
      },
      apiSecretHeader: {
        in: 'header',
        name: 'CVE-API-KEY',
        description: 'The user\'s API key',
        required: true,
        schema: {
          type: 'string'
        }
      },
      amount: {
        in: 'query',
        name: 'amount',
        description: 'Quantity of CVE IDs to reserve',
        required: true,
        schema: {
          type: 'integer',
          format: 'int32'
        }
      },
      assigner: {
        in: 'query',
        name: 'assigner',
        description: 'Filter by assigner org UUID',
        required: false,
        schema: {
          type: 'string'
        }
      },
      assignerShortName: {
        in: 'query',
        name: 'assigner_short_name',
        description: 'Filter by assignerShortName',
        required: false,
        schema: {
          type: 'string'
        }
      },
      batch_type: {
        in: 'query',
        name: 'batch_type',
        description: 'Required when amount is greater than one, determines whether the reserved CVE IDs should be sequential or non-sequential',
        required: false,
        schema: {
          type: 'string',
          enum: [
            'sequential',
            'non-sequential',
            'nonsequential'
          ]
        }
      },
      countOnly: {
        in: 'query',
        name: 'count_only',
        description: 'Get count of records that match query. Accepted values are 1, true, or yes to indicate true, and 0, false, or no to indicate false',
        required: false,
        schema: {
          type: 'boolean'
        }
      },
      cveState: {
        in: 'query',
        name: 'state',
        description: 'Filter by state',
        schema: {
          type: 'string',
          enum: [
            'PUBLISHED',
            'REJECTED'
          ]
        }
      },
      cve_year: {
        in: 'query',
        name: 'cve_year',
        description: 'The year the CVE IDs will be reserved for (i.e., 1999, ..., currentYear + 1)',
        required: true,
        schema: {
          type: 'integer',
          format: 'int32'
        }
      },
      cveIdGetFilteredState: {
        in: 'query',
        name: 'state',
        description: 'Filter by state [RESERVED, PUBLISHED, REJECTED]',
        required: false,
        schema: {
          type: 'string'
        }
      },
      cveIdGetFilteredCveIdYear: {
        in: 'query',
        name: 'cve_id_year',
        description: 'Filter by the year of the CVE IDs',
        required: false,
        schema: {
          type: 'string'

        }
      },
      cveIdGetFilteredTimeReservedLt: {
        in: 'query',
        name: 'time_reserved.lt',
        description: 'Most recent reserved timestamp to retrieve. Include with all requests potentially returning multiple pages of CVE IDs to avoid issues if new IDs are reserved during use.',
        required: false,
        schema: {
          type: 'string',
          format: 'date-time'
        }
      },
      cveIdGetFilteredTimeReservedGt: {
        in: 'query',
        name: 'time_reserved.gt',
        description: 'Earliest CVE ID reserved timestamp to retrieve',
        required: false,
        schema: {
          type: 'string',
          format: 'date-time'
        }
      },
      cveIdGetFilteredTimeModifiedLt: {
        in: 'query',
        name: 'time_modified.lt',
        description: 'Most recent modified timestamp to retrieve. Include with all requests using a time_modified.gt filter potentially returning multiple pages of CVE IDs. This will avoid issues if IDs are reserved or modified during use.',
        required: false,
        schema: {
          type: 'string',
          format: 'date-time'
        }
      },
      cveIdGetFilteredTimeModifiedGt: {
        in: 'query',
        name: 'time_modified.gt',
        description: 'Earliest CVE ID modified timestamp to retrieve',
        required: false,
        schema: {
          type: 'string',
          format: 'date-time'
        }
      },
      cveRecordFilteredTimeModifiedLt: {
        in: 'query',
        name: 'time_modified.lt',
        description: 'Most recent CVE record modified timestamp to retrieve',
        required: false,
        schema: {
          type: 'string',
          format: 'date-time'
        }
      },
      cveRecordFilteredTimeModifiedGt: {
        in: 'query',
        name: 'time_modified.gt',
        description: 'Earliest CVE record modified timestamp to retrieve',
        required: false,
        schema: {
          type: 'string',
          format: 'date-time'
        }
      },
      id_quota: {
        in: 'query',
        name: 'id_quota',
        description: 'The new number of CVE IDs the organization is allowed to have in the RESERVED state at one time',
        required: false,
        schema: {
          type: 'integer',
          format: 'int32',
          minimum: 0,
          maximum: 100000
        }
      },
      name: {
        in: 'query',
        name: 'name',
        description: 'The new name for the organization',
        required: false,
        schema: {
          type: 'string'
        }
      },
      nameFirst: {
        in: 'query',
        name: 'name.first',
        description: 'The new first name for the user entry',
        required: false,
        schema: {
          type: 'string'
        }
      },
      nameLast: {
        in: 'query',
        name: 'name.last',
        description: 'The new last name for the user entry',
        required: false,
        schema: {
          type: 'string'
        }
      },
      nameMiddle: {
        in: 'query',
        name: 'name.middle',
        description: 'The new middle name for the user entry',
        required: false,
        schema: {
          type: 'string'
        }
      },
      nameSuffix: {
        in: 'query',
        name: 'name.suffix',
        description: 'The new suffix for the user entry',
        required: false,
        schema: {
          type: 'string'
        }
      },
      newShortname: {
        in: 'query',
        name: 'new_short_name',
        description: 'The new shortname for the organization',
        required: false,
        schema: {
          type: 'string'
        }
      },
      newUsername: {
        in: 'query',
        name: 'new_username',
        description: 'The new username for the user, preferably the user\'s email address. Must be 3-50 characters in length; allowed characters are alphanumberic and -_@.',
        required: false,
        schema: {
          type: 'string'
        }
      },
      org: {
        in: 'query',
        name: 'org',
        description: 'The new owning_cna for the CVE ID',
        required: false,
        schema: {
          type: 'string'
        }
      },
      orgShortname: {
        in: 'query',
        name: 'org_short_name',
        description: 'The new organization for the user',
        required: false,
        schema: {
          type: 'string'
        }
      },
      pageQuery: {
        in: 'query',
        name: 'page',
        description: 'The current page in the paginator',
        required: false,
        schema: {
          type: 'integer',
          format: 'int32',
          minimum: 1
        }
      },
      short_name: {
        in: 'query',
        name: 'short_name',
        description: 'The CNA that will own the reserved CVE IDs',
        required: true,
        schema: {
          type: 'string'
        }
      },
      shortname: {
        in: 'query',
        name: 'shortname',
        description: 'The new shortname for the organization',
        required: false,
        schema: {
          type: 'string'
        }
      },
      state: {
        in: 'query',
        name: 'state',
        description: 'The new state for the CVE ID',
        required: false,
        schema: {
          type: 'string'
        }
      }
    },
    examples: {
      publishedRecord: publishedCVERecord,
      rejectedRecord: rejectedCVERecord,
      rejectedCreateCVERecord: rejectedCreateCVERecord
    }
  }
}

swaggerAutogen(outputFile, endpointsFiles, doc)
