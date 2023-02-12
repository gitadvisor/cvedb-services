require('dotenv').config() // This enables us to read from the .env file.
const cors = require('cors')
const config = require('config')
const express = require('express')
const app = express()
const helmet = require('helmet')
const mongoose = require('mongoose')
const morgan = require('morgan')

const configureRoutes = require('./routes.config')
const dbUtils = require('./utils/db')
const errors = require('./utils/error')
const logger = require('./middleware/logger')
const mw = require('./middleware/middleware')

const error = new errors.IDRError()

if (process.env.NODE_ENV === 'development') {
  // Concise output colored by response status for development use.
  app.use(morgan('dev'))
  app.use((req, res, next) => {
    res.set({
      'X-Server': 'CVE-Services-Dev-REST-API',
      'X-Server-Type': 'REST'
    })
    next()
  })
} else {
  // Standard Apache common log output.
  app.use(morgan('combined'))
}

app.use(cors())
app.use(helmet()) // Provides standard security <https://www.npmjs.com/package/helmet>
app.use(mw.setCacheControl)
app.use(express.json({ limit: '3.8mb', inflate: false })) // Limit request body size and disable compressed bodies
app.use(express.urlencoded({ extended: true, inflate: false })) // Allows us to handle url encoded dat
app.use('/api/', mw.createCtxAndReqUUID)
global.mongoose = mongoose // Make mongoose connection available globally
configureRoutes(app) // Define api routes
app.use(mw.validateJsonSyntax) // error handler for large input and JSON syntax
app.use(mw.errorHandler) // error handler middleware

// Handle 404 - Keep this as a last route
app.use((req, res, next) => {
  res.status(404).json(error.notFound())
})

// Connect to MongoDB database
const dbConnectionStr = dbUtils.getMongoConnectionString()
mongoose.connect(dbConnectionStr, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
  useCreateIndex: true
})

// database connection
const db = mongoose.connection

db.on('error', () => {
  console.error.bind(console, 'Connection Error: Something went wrong!')
  logger.error(error.connectionError())
})

db.once('open', () => {
  // we're connected!
  logger.info('Successfully connected to database!')

  const port = process.env.PORT || config.get('port')
  app.listen(port, () => logger.info(`Serving on port ${port}`))
})
