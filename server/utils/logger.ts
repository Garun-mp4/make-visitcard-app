interface LogContext {
  requestId?: string
  route?: string
  code?: string
  status?: number
  [key: string]: unknown
}

function safeContext(context: LogContext) {
  const blocked = new Set(['authorization', 'token', 'initData', 'hash', 'privateKey'])
  return Object.fromEntries(Object.entries(context).filter(([key]) => !blocked.has(key)))
}

export const logger = {
  info(message: string, context: LogContext = {}) {
    console.info(JSON.stringify({ level: 'info', message, ...safeContext(context) }))
  },
  warn(message: string, context: LogContext = {}) {
    console.warn(JSON.stringify({ level: 'warn', message, ...safeContext(context) }))
  },
  error(message: string, context: LogContext = {}) {
    console.error(JSON.stringify({ level: 'error', message, ...safeContext(context) }))
  },
}
