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

const decodeHtmlEntities = (str: string) => {
  if (typeof str !== 'string') return str

  let decoded = str
  let previousDecoded = ''

  while (decoded !== previousDecoded) {
    previousDecoded = decoded
    decoded = decoded
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#x27;/g, '\'')
      .replace(/&#39;/g, '\'')
      .replace(/&#x2F;/g, '/')
      .replace(/&#47;/g, '/')
      .replace(/&nbsp;/g, ' ')
  }

  return decoded
}

export default defineEventHandler(async (event) => {
  try {
    const log = await readBody(event)

    const logData = {
      message: decodeHtmlEntities(log.message),
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
          const error = new Error(decodeHtmlEntities(log.message))
          error.stack = decodeHtmlEntities(log.stack)
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
    // siilent ignore
  }
})
