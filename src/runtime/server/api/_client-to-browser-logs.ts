import Youch from 'youch'
import { defineWebSocketHandler } from 'h3'
import { createConsola } from 'consola'
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
    let log: Record<any, any> | undefined = undefined
    try {
      log = JSON.parse(message.text())
    }
    catch {
      // ignore this error for now not sure if this is a good idea :)
      // console.error('Failed to process log message:', error)
    }

    if (!log || !shouldLogMessage(log.message))
      return

    const cleanMessage = log.message.includes('%c') ? stripCSSStyles(log.message) : log.message
    const logData = {
      message: cleanMessage,
      // URL also can throw an error like JSON.parse, but if you sure its valid, then its ok
      url: log.url ? new URL(log.url).pathname : 'unknown',
      ...(log.filename && { file: `${log.filename}:${log.line}:${log.column}` }),
    }

    const proccessLogLevel = {
      log: () => clientLogger.log(logData),
      info: () => clientLogger.info(logData),
      warn: () => clientLogger.warn(logData),
      error: async () => {
        if (!log.stack)
          return clientLogger.error(logData)

        const error = new Error(log.message)
        const youch = new Youch(error, {})
        const formattedError = await youch.toJSON()
        clientLogger.error(JSON.stringify(formattedError))
      },
      debug: () => clientLogger.debug(logData),
      default: () => clientLogger.log(logData),
    }

    // add await if you'll do smth later on
    proccessLogLevel[log.level || 'default']()
  },
})