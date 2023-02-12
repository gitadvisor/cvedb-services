/*
 * used to populate the Cve collection without dropping/updating any other
 * collection
 */

const express = require('express')
const app = express()
const mongoose = require('mongoose')

const dataUtils = require('../utils/data')
const dbUtils = require('../utils/db')
const errors = require('../utils/error')
const logger = require('../middleware/logger')
const Cve = require('../model/cve')

const error = new errors.IDRError()

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
  useFindAndModify: false
})

// database connection
const db = mongoose.connection

db.on('error', () => {
  console.error.bind(console, 'Connection Error: Something went wrong!')
  logger.error(error.connectionError())
})

db.once('open', async () => {
  logger.info('Successfully connected to database!')

  // user needs to agree to an action that drops collections
  const userInput = dataUtils.getUserPopulateInput(['Cve'])

  // dropping Cve collection
  // this may be more complex than necessary, but is kept similar to `src/scripts/populate.js`
  if (userInput.toLowerCase() === 'y') {
    let names = []
    let collections = await db.db.listCollections().toArray()
    collections.forEach(collection => {
      names.push(collection.name)
    })

    if (names.includes('Cve')) {
      await db.dropCollection('Cve')
    }

    names = []
    collections = await db.db.listCollections().toArray()
    collections.forEach(collection => {
      names.push(collection.name)
    })

    if (!names.includes('Cve')) {
      await dataUtils.populateCollection(
        './datadump/pre-population/cves.json',
        Cve
      )
      logger.info('Successfully populated CVE records!')
    } else {
      logger.error(
        'The database was not populated because ' +
        'some of the collections were not deleted.'
      )
    }
  }

  mongoose.connection.close()
})
