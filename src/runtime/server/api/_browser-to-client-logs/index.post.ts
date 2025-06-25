import { defineEventHandler, readBody } from 'h3'
import { createConsola } from 'consola'
import Youch from 'youch'

const clientLogger = createConsola({
  formatOptions: {
    colors: true,
    compact: false,
    date: true,
  },
}).withTag('BROWSER')

export default defineEventHandler(async (event) => {
  try {
    const log = await readBody(event)

    const logData = {
      message: log.message,
      url: log.url ? new URL(log.url).pathname : 'unknown',
      ...(log.filename && { file: `${log.filename}:${log.line}:${log.column}` }),
    }

    switch (log.level) {
      case 'log':
        clientLogger.log(logData)
        break
      case 'info':
        clientLogger.info(logData)
        break
      case 'warn':
        clientLogger.warn(logData)
        break
      case 'error':
        if (log.stack) {
          const error = new Error(log.message)
          error.stack = log.stack
          const youch = new Youch(error, {})
          const formattedError = await youch.toJSON()
          clientLogger.error(JSON.stringify(formattedError, null, 2))
        }
        else {
          clientLogger.error(logData)
        }
        break
      case 'debug':
        clientLogger.debug(logData)
        break
      default:
        clientLogger.log(logData)
    }

    return { success: true }
  }
  catch {
    // dont log errors
  }
})
