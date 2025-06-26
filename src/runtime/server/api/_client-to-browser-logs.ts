import { defineWebSocketHandler } from 'h3'
import { createConsola } from 'consola'
import Youch from 'youch'
import { stripCSSStyles, shouldLogMessage } from '../utils/parse'

const clientLogger = createConsola({
  formatOptions: {
    colors: true,
    compact: false,
    date: true,
  },
}).withTag('BROWSER')

export default defineWebSocketHandler({
  error(peer, error) {
    console.log('[NUXT-BROWSER-LOGS-IN-SERVER] WebSocket error', peer.id, error)
  },
  async message(peer, message) {
    try {
      const log = JSON.parse(message.text())
      if (!shouldLogMessage(log.message)) {
        return
      }
      let cleanMessage
      if (log.message.includes('%c')) {
        cleanMessage = stripCSSStyles(log.message)
      }
      else {
        cleanMessage = log.message
      }
      const logData = {
        message: cleanMessage,
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
            const youch = new Youch(error, {})
            const formattedError = await youch.toJSON()
            clientLogger.error(JSON.stringify(formattedError))
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
    }
    catch {
      // ignore this error for now not sure if this is a good idea :)
    ///  console.error('Failed to process log message:', error)
    }
  },
})
