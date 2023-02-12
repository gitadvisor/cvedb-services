require('dotenv').config() // This enables us to read from the .env file
const winston = require('winston')

const myFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp(),
  winston.format.align(),
  winston.format.printf(info => {
    const { timestamp, level, message, ...args } = info
    const ts = timestamp.slice(0, 19).replace('T', ' ')
    const msg = JSON.stringify(message.trim()) // messages can only be strings (not executable objects)

    return `${ts} [${level}]: ${msg} ${
      Object.keys(args).length ? JSON.stringify(args) : ''
    }`
  })
)

const logger = winston.createLogger({
  level: 'info',
  format: myFormat
})

if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'integration' || process.env.NODE_ENV === 'prod-staging' || process.env.NODE_ENV === 'production') {
  // Write all logs with level 'info' and below ('warn' and 'error') to the console if we're in dev env
  logger.add(
    new winston.transports.Console()
  )
} else if (process.env.NODE_ENV === 'test') {
  // Silence the logs if we're in test env
  logger.add(
    new winston.transports.Console({
      silent: true
    })
  )
}

module.exports = logger
