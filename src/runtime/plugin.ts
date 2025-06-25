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
    const cleanConsoleMessage = (args: unknown[]): string => {
      if (args.length === 0) return ''

      let message = args[0]?.toString() || ''
      let argIndex = 1

      message = message.replace(/%c/g, () => {
        if (argIndex < args.length) {
          argIndex++
        }
        return ''
      })

      const remainingArgs = args.slice(argIndex)
      if (remainingArgs.length > 0) {
        // Safely convert each argument to string
        const safeArgs = remainingArgs.map((arg) => {
          try {
            if (arg === null) return 'null'
            if (arg === undefined) return 'undefined'
            if (typeof arg === 'object') {
              // Try JSON.stringify first for objects
              try {
                return JSON.stringify(arg)
              }
              catch {
                // If JSON.stringify fails (circular reference, etc.), use toString
                try {
                  return String(arg)
                }
                catch {
                  // If toString also fails, return a safe fallback
                  return '[object Object]'
                }
              }
            }
            return String(arg)
          }
          catch {
            // Ultimate fallback
            return '[Unprintable Object]'
          }
        })

        message += ' ' + safeArgs.join(' ')
      }

      return message.trim()
    }

    const sendLog = async (level: LogLevel, message: string, extra: LogExtra = {}): Promise<void> => {
      try {
        // Safely serialize extra data
        const safeExtra: LogExtra = {}
        for (const [key, value] of Object.entries(extra)) {
          try {
            // Test if the value can be JSON serialized
            JSON.stringify(value)
            safeExtra[key] = value
          }
          catch {
            // If not serializable, convert to string
            safeExtra[key] = String(value)
          }
        }

        const payload: LogPayload & LogExtra = {
          level,
          message,
          timestamp: new Date().toISOString(),
          url: window.location.href,
          ...safeExtra,
        }

        await $fetch('/api/_browser-to-client-logs', {
          method: 'POST',
          body: payload,
        })
      }
      catch {
        // Ignore errors in sending logs
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
      const message = cleanConsoleMessage(args)
      if (shouldLogMessage(message)) {
        sendLog('log', message)
      }
      originalConsole.log.apply(console, args)
    }

    console.warn = (...args: unknown[]): void => {
      const message = cleanConsoleMessage(args)
      if (shouldLogMessage(message)) {
        sendLog('warn', message)
      }
      originalConsole.warn.apply(console, args)
    }

    console.error = (...args: unknown[]): void => {
      const message = cleanConsoleMessage(args)
      if (shouldLogMessage(message)) {
        sendLog('error', message)
      }
      originalConsole.error.apply(console, args)
    }

    console.info = (...args: unknown[]): void => {
      const message = cleanConsoleMessage(args)
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
          stack: event.error?.stack?.toString(),
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
