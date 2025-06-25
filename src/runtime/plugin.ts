import { defineNuxtPlugin } from '#app'

interface LogExtra {
  filename?: string
  line?: number
  column?: number
  stack?: string
  [key: string]: unknown
}

type LogLevel = 'log' | 'warn' | 'error' | 'info'

interface LogPayload {
  level: LogLevel
  message: string
  timestamp: string
  url: string
}

export default defineNuxtPlugin((_nuxtApp) => {
  if (import.meta.client && import.meta.env.DEV) {
    const sendLog = async (level: LogLevel, message: string, extra: LogExtra = {}): Promise<void> => {
      try {
        const payload: LogPayload & LogExtra = {
          level,
          message,
          timestamp: new Date().toISOString(),
          url: window.location.href,
          ...extra,
        }

        await $fetch('/api/_browser-to-client-logs', {
          method: 'POST',
          body: payload,
        })
      }
      catch {
        // ignore for now
      }
    }

    const shouldLogMessage = (message: string): boolean => {
      const lowerMessage = message.toLowerCase()
      return !lowerMessage.startsWith('ssr') && !lowerMessage.includes('[ssr]')
    }

    const originalConsole = {
      log: console.log,
      warn: console.warn,
      error: console.error,
      info: console.info,
    }

    console.log = (...args: unknown[]): void => {
      const message = args.join(' ')
      if (shouldLogMessage(message)) {
        sendLog('log', message)
      }
      originalConsole.log.apply(console, args)
    }

    console.warn = (...args: unknown[]): void => {
      const message = args.join(' ')
      if (shouldLogMessage(message)) {
        sendLog('warn', message)
      }
      originalConsole.warn.apply(console, args)
    }

    console.error = (...args: unknown[]): void => {
      const message = args.join(' ')
      if (shouldLogMessage(message)) {
        sendLog('error', message)
      }
      originalConsole.error.apply(console, args)
    }

    console.info = (...args: unknown[]): void => {
      const message = args.join(' ')
      if (shouldLogMessage(message)) {
        sendLog('info', message)
      }
      originalConsole.info.apply(console, args)
    }

    window.addEventListener('error', (event: ErrorEvent): void => {
      const message = event.message
      if (shouldLogMessage(message)) {
        sendLog('error', message, {
          filename: event.filename,
          line: event.lineno,
          column: event.colno,
          stack: event.error?.stack,
        })
      }
    })

    window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent): void => {
      const message = `Unhandled promise rejection: ${event.reason}`
      if (shouldLogMessage(message)) {
        sendLog('error', message)
      }
    })
  }
})
