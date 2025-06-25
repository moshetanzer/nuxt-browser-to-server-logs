import { defineNuxtPlugin } from '#app'

interface LogExtra {
  filename?: string
  line?: number
  column?: number
  stack?: string
  [key: string]: unknown
}

type LogLevel = 'log' | 'warn' | 'error' | 'info'

export default defineNuxtPlugin((_nuxtApp) => {
  if (import.meta.client && import.meta.env.DEV) {
    const MAX_MESSAGE_LENGTH = 5000
    const MAX_STACK_LENGTH = 3000
    const MAX_URL_LENGTH = 1000

    const encodeHtmlEntities = (str: string): string => {
      return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;')
    }

    const sanitizeForXSS = (input: unknown): string => {
      if (input === null) return 'null'
      if (input === undefined) return 'undefined'

      let str = String(input)

      str = str
        // eslint-disable-next-line no-control-regex
        .replace(/[\x00-\x08\v\f\x0E-\x1F\x7F]/g, ' ')
        .replace(/javascript:/gi, 'js-protocol')
        .replace(/data:/gi, 'data-protocol')
        .replace(/vbscript:/gi, 'vbs-protocol')
        .replace(/on\w+\s*=/gi, 'event-handler')
        .replace(/<script/gi, 'script-tag')
        .replace(/<\/script/gi, 'end-script-tag')
        .replace(/<iframe/gi, 'iframe-tag')
        .replace(/<object/gi, 'object-tag')
        .replace(/<embed/gi, 'embed-tag')

      return encodeHtmlEntities(str).slice(0, MAX_MESSAGE_LENGTH)
    }

    const sanitizeUrl = (url: string): string => {
      try {
        const urlObj = new URL(url)
        if (!['http:', 'https:', 'file:'].includes(urlObj.protocol)) {
          return 'blocked-protocol'
        }
        const cleanUrl = urlObj.origin + urlObj.pathname
        return sanitizeForXSS(cleanUrl).slice(0, MAX_URL_LENGTH)
      }
      catch {
        return 'invalid-url'
      }
    }

    const sanitizeNumber = (num: unknown): number => {
      const parsed = Number(num)
      return Number.isFinite(parsed) && parsed >= 0 && parsed <= 999999 ? parsed : 0
    }

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
        const safeArgs = remainingArgs.map((arg) => {
          try {
            if (arg === null) return 'null'
            if (arg === undefined) return 'undefined'
            if (typeof arg === 'object') {
              try {
                const jsonStr = JSON.stringify(arg, null, 0)
                return jsonStr.length > 500 ? '[LargeObject]' : sanitizeForXSS(jsonStr)
              }
              catch {
                return '[CircularRef]'
              }
            }
            return sanitizeForXSS(arg)
          }
          catch {
            return '[ParseError]'
          }
        })

        message += ' ' + safeArgs.join(' ')
      }

      return sanitizeForXSS(message)
    }

    const sendLog = async (level: LogLevel, message: string, extra: LogExtra = {}): Promise<void> => {
      try {
        const safeExtra: Record<string, string | number> = {}

        for (const [key, value] of Object.entries(extra)) {
          const safeKey = sanitizeForXSS(key).slice(0, 50).replace(/\W/g, '')
          if (!safeKey) continue

          if (key === 'line' || key === 'column') {
            safeExtra[safeKey] = sanitizeNumber(value)
          }
          else if (key === 'filename') {
            safeExtra[safeKey] = sanitizeUrl(String(value))
          }
          else if (key === 'stack') {
            safeExtra[safeKey] = sanitizeForXSS(String(value)).slice(0, MAX_STACK_LENGTH)
          }
          else {
            safeExtra[safeKey] = sanitizeForXSS(String(value)).slice(0, 300)
          }
        }

        const payload = {
          level,
          message: sanitizeForXSS(message),
          timestamp: new Date().toISOString(),
          url: sanitizeUrl(window.location.href),
          ...safeExtra,
        }

        await $fetch('/api/_browser-to-client-logs', {
          method: 'POST',
          body: payload,
          headers: {
            'Content-Type': 'application/json',
          },
        })
      }
      catch {
        // Ignore errors in sending logs
      }
    }

    const shouldLogMessage = (message: string): boolean => {
      if (!message || message.length === 0 || message.length > MAX_MESSAGE_LENGTH) {
        return false
      }

      const lowerMessage = message.toLowerCase()
      const blockedPatterns = [
        'ssr',
        '[ssr]',
        'hydration',
        '[hydration]',
        // to avoid bugging chrome devtools not found maybe will get rid of this later
        'vue-router',
      ]

      return !blockedPatterns.some(pattern => lowerMessage.includes(pattern))
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
      const message = sanitizeForXSS(event.message || 'Unknown error')
      if (shouldLogMessage(message)) {
        sendLog('error', message, {
          filename: event.filename || '',
          line: event.lineno || 0,
          column: event.colno || 0,
          stack: event.error?.stack || '',
        })
      }
    })

    window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent): void => {
      const reason = sanitizeForXSS(String(event.reason || 'Unknown rejection'))
      const message = `Promise rejected: ${reason}`
      if (shouldLogMessage(message)) {
        sendLog('error', message)
      }
    })
  }
})
