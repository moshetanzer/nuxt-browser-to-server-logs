import { useWebSocket } from '@vueuse/core'
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
  const { send } = useWebSocket(`ws://${location.host}/api/_client-to-browser-logs`, {
    autoConnect: true,
    autoReconnect: true,
  })

  const sendLog = (level: LogLevel, message: string, extra: LogExtra = {}) => {
    const payload = {
      level,
      message,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      ...extra,
    }
    send(JSON.stringify(payload))
  }

  const safeStringify = (obj: unknown, maxDepth = 3, currentDepth = 0): string => {
    if (currentDepth > maxDepth) return '[Max Depth Reached]'

    if (obj === null) return 'null'
    if (obj === undefined) return 'undefined'

    const objType = typeof obj
    if (objType === 'string' || objType === 'number' || objType === 'boolean') {
      return String(obj)
    }

    if (objType === 'function') return '[Function]'
    if (obj instanceof Date) return obj.toISOString()
    if (obj instanceof Error) return `Error: ${obj.message}`

    if (objType === 'object') {
      if (obj instanceof Node) return '[DOM Element]'

      try {
        const seen = new WeakSet()
        return JSON.stringify(obj, (key, value) => {
          if (typeof value === 'object' && value !== null) {
            if (seen.has(value)) return '[Circular Reference]'
            seen.add(value)
          }
          if (typeof value === 'function') return '[Function]'
          if (value instanceof Node) return '[DOM Element]'
          return value
        })
      }
      catch {
        return '[Unserializable Object]'
      }
    }

    return String(obj)
  }

  const formatMessage = (args: unknown[]): string => {
    return args.map(arg => safeStringify(arg)).join(' ')
  }

  const originalConsole = {
    log: console.log,
    warn: console.warn,
    error: console.error,
    info: console.info,
  }

  console.log = (...args: unknown[]) => {
    sendLog('log', formatMessage(args))
    originalConsole.log.apply(console, args)
  }

  console.warn = (...args: unknown[]) => {
    sendLog('warn', formatMessage(args))
    originalConsole.warn.apply(console, args)
  }

  console.error = (...args: unknown[]) => {
    sendLog('error', formatMessage(args))
    originalConsole.error.apply(console, args)
  }

  console.info = (...args: unknown[]) => {
    sendLog('info', formatMessage(args))
    originalConsole.info.apply(console, args)
  }

  window.addEventListener('error', (event: ErrorEvent) => {
    sendLog('error', event.message || 'Unknown error', {
      filename: event.filename,
      line: event.lineno,
      column: event.colno,
      stack: event.error?.stack,
    })
  })

  window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
    sendLog('error', `Promise rejected: ${event.reason}`)
  })
})
