/*
 * A template for creating additional one-time-use scripts.
 * Example use-cases:
 * 1. migrating documents
 * 2. populating a new MongoDb-compatible database
 * 3. creating a database snapshot
 * 4. ...
 */

const mongoose = require('mongoose')

const dbUtils = require('../utils/db')
const errors = require('../utils/error')
const logger = require('../middleware/logger')

const error = new errors.IDRError()

const dbConnectionStr = dbUtils.getMongoConnectionString()
mongoose.connect(dbConnectionStr, {
  useNewUrlParser: true,
  useUnifiedTopology: false,
  useFindAndModify: false
})

const db = mongoose.connection

db.on('error', () => {
  console.error.bind(console, 'Connection Error: Something went wrong!')
  logger.error(error.connectionError())
})

db.once('open', async () => {
  logger.info('Successfully connected to database!')

  // do stuff here

  mongoose.connection.close()
})
