/*
 * used to populate or re-populate a MongoDB-compatible document
 * database with static fixtures at `cve-services/datadump/pre-population`
 */

const express = require('express')
const app = express()
const mongoose = require('mongoose')

const dataUtils = require('../utils/data')
const dbUtils = require('../utils/db')
const errors = require('../utils/error')
const logger = require('../middleware/logger')
const CveIdRange = require('../model/cve-id-range')
const CveId = require('../model/cve-id')
const Cve = require('../model/cve')
const Org = require('../model/org')
const User = require('../model/user')

const error = new errors.IDRError()

const populateTheseCollections = {
  Cve: Cve,
  'Cve-Id-Range': CveIdRange,
  'Cve-Id': CveId,
  User: User,
  Org: Org
}

const indexesToCreate = {
  Cve: [{ 'cve.cveMetadata.cveId': 1 }, { 'cve.cveMetadata.dateUpdated': 1 }],
  'Cve-Id': [{ cve_id: 1 }, { owning_cna: 1, state: 1 }, { reserved: 1 }],
  User: [{ UUID: 1 }],
  Org: [{ UUID: 1 }, { 'authority.active_roles': 1 }]
}

// Body Parser Middleware
app.use(express.json()) // Allows us to handle raw JSON data
app.use(express.urlencoded({ extended: false })) // Allows us to handle url encoded data
// Make mongoose connection available globally
global.mongoose = mongoose

// Connect to MongoDB database
const dbConnectionStr = dbUtils.getMongoConnectionString()
mongoose.connect(dbConnectionStr, {
  useNewUrlParser: true,
  useUnifiedTopology: false,
  useFindAndModify: false,
  autoIndex: false
})

const db = mongoose.connection

db.on('error', () => {
  console.error.bind(console, 'Connection Error: Something went wrong!')
  logger.error(error.connectionError())
})

db.once('open', async () => {
  logger.info('Successfully connected to database!')

  let userInput
  if (process.argv.length > 2 && process.argv.slice(2)[0] === 'y') {
    userInput = process.argv.slice(2)[0]
  } else {
    // script runner (currently) needs to agree to an action that drops collections
    userInput = dataUtils.getUserPopulateInput(Object.keys(populateTheseCollections))
  }

  // drops and re-populates collections
  if (userInput.toLowerCase() === 'y') {
    let names = []
    let collections = await db.db.listCollections().toArray()
    collections.forEach(collection => {
      names.push(collection.name)
    })

    for (const name in populateTheseCollections) {
      if (names.includes(name)) {
        logger.info(`Dropping ${name} collection indexes!!!`)
        await db.collections[name].dropIndexes()
        logger.info(`Dropping ${name} collection !!!`)
        await db.dropCollection(name)
      }
    }

    names = []
    collections = await db.db.listCollections().toArray()
    collections.forEach(collection => {
      names.push(collection.name)
    })

    if (!names.includes('Cve-Id-Range') && !names.includes('Cve-Id') && !names.includes('Cve') &&
        !names.includes('Org') && !names.includes('User')) {
      // Org
      await dataUtils.populateCollection(
        './datadump/pre-population/orgs.json',
        Org, dataUtils.newOrgTransform
      )

      // User, depends on Org
      const hash = await dataUtils.preprocessUserSecrets()
      await dataUtils.populateCollection(
        './datadump/pre-population/users.json',
        User, dataUtils.newUserTransform, hash
      )

      const populatePromises = []

      // CVE ID Range
      populatePromises.push(dataUtils.populateCollection(
        './datadump/pre-population/cve-ids-range.json',
        CveIdRange
      ))

      // CVE
      if (process.env.NODE_ENV === 'development') {
        populatePromises.push(dataUtils.populateCollection(
          './datadump/pre-population/cves.json',
          Cve, dataUtils.newCveTransform
        ))
      }

      // CVE ID, depends on User and Org
      populatePromises.push(dataUtils.populateCollection(
        './datadump/pre-population/cve-ids.json',
        CveId, dataUtils.newCveIdTransform
      ))

      // don't close database connection until all remaining populate
      // promises are resolved
      Promise.all(populatePromises).then(function () {
        logger.info('Successfully populated the database!')

        Object.keys(indexesToCreate).forEach(col => {
          indexesToCreate[col].forEach(index => {
            db.collections[col].createIndex(index)
          })
        })
        mongoose.connection.close()
      })
    } else {
      logger.error(
        'The database was not populated because ' +
        'some of the collections were not deleted.'
      )
      mongoose.connection.close()
    }
  } else {
    mongoose.connection.close()
  }
})
