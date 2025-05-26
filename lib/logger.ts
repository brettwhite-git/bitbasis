import { createClient } from '@supabase/supabase-js'

// Log levels
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug'
}

// Log entry interface
interface LogEntry {
  level: LogLevel
  message: string
  context?: Record<string, any>
  timestamp: string
  userId?: string
  sessionId?: string
  error?: Error
}

// Configuration
const isDevelopment = process.env.NODE_ENV === 'development'
const isProduction = process.env.NODE_ENV === 'production'

class Logger {
  private supabase: any = null

  constructor() {
    // Only initialize Supabase client for server-side logging in production
    if (isProduction && typeof window === 'undefined') {
      try {
        this.supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        )
      } catch (error) {
        // Fallback to console if Supabase fails
        console.error('Failed to initialize logging service:', error)
      }
    }
  }

  private formatMessage(level: LogLevel, message: string, context?: Record<string, any>): string {
    const timestamp = new Date().toISOString()
    const contextStr = context ? ` | Context: ${JSON.stringify(context)}` : ''
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`
  }

  private async logToDatabase(entry: LogEntry): Promise<void> {
    if (!this.supabase || !isProduction) return

    try {
      await this.supabase
        .from('application_logs')
        .insert({
          level: entry.level,
          message: entry.message,
          context: entry.context,
          user_id: entry.userId,
          session_id: entry.sessionId,
          error_stack: entry.error?.stack,
          created_at: entry.timestamp
        })
    } catch (error) {
      // Fallback to console if database logging fails
      console.error('Failed to log to database:', error)
    }
  }

  private shouldLog(level: LogLevel): boolean {
    if (isDevelopment) return true
    
    // In production, only log warnings and errors
    return level === LogLevel.ERROR || level === LogLevel.WARN
  }

  private log(level: LogLevel, message: string, context?: Record<string, any>, error?: Error): void {
    if (!this.shouldLog(level)) return

    const entry: LogEntry = {
      level,
      message,
      context: this.sanitizeContext(context),
      timestamp: new Date().toISOString(),
      error
    }

    // Always log to console in development
    if (isDevelopment) {
      const formattedMessage = this.formatMessage(level, message, context)
      
      switch (level) {
        case LogLevel.ERROR:
          console.error(formattedMessage, error)
          break
        case LogLevel.WARN:
          console.warn(formattedMessage)
          break
        case LogLevel.INFO:
          console.info(formattedMessage)
          break
        case LogLevel.DEBUG:
          console.log(formattedMessage)
          break
      }
    }

    // Log to database in production (server-side only)
    if (isProduction && typeof window === 'undefined') {
      this.logToDatabase(entry).catch(console.error)
    }

    // In production client-side, only show user-friendly messages
    if (isProduction && typeof window !== 'undefined' && level === LogLevel.ERROR) {
      console.error('An error occurred. Please try again or contact support.')
    }
  }

  private sanitizeContext(context?: Record<string, any>): Record<string, any> | undefined {
    if (!context) return undefined

    // Remove sensitive data in production
    if (isProduction) {
      const sanitized = { ...context }
      
      // Remove sensitive keys
      const sensitiveKeys = [
        'password', 'token', 'secret', 'key', 'auth', 'session',
        'stripe_secret', 'api_key', 'private_key'
      ]
      
      sensitiveKeys.forEach(key => {
        Object.keys(sanitized).forEach(contextKey => {
          if (contextKey.toLowerCase().includes(key)) {
            sanitized[contextKey] = '[REDACTED]'
          }
        })
      })
      
      return sanitized
    }

    return context
  }

  // Public logging methods
  error(message: string, context?: Record<string, any>, error?: Error): void {
    this.log(LogLevel.ERROR, message, context, error)
  }

  warn(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, context)
  }

  info(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, context)
  }

  debug(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, context)
  }

  // Specialized logging methods
  apiRequest(method: string, url: string, context?: Record<string, any>): void {
    this.debug(`API Request: ${method} ${url}`, context)
  }

  apiResponse(method: string, url: string, status: number, context?: Record<string, any>): void {
    const level = status >= 400 ? LogLevel.ERROR : LogLevel.DEBUG
    this.log(level, `API Response: ${method} ${url} - ${status}`, context)
  }

  userAction(action: string, userId?: string, context?: Record<string, any>): void {
    this.info(`User Action: ${action}`, { ...context, userId })
  }

  subscription(action: string, context?: Record<string, any>): void {
    this.info(`Subscription: ${action}`, context)
  }

  payment(action: string, context?: Record<string, any>): void {
    this.info(`Payment: ${action}`, this.sanitizeContext(context))
  }
}

// Export singleton instance
export const logger = new Logger()

// Convenience exports
export const logError = (message: string, context?: Record<string, any>, error?: Error) => 
  logger.error(message, context, error)

export const logWarn = (message: string, context?: Record<string, any>) => 
  logger.warn(message, context)

export const logInfo = (message: string, context?: Record<string, any>) => 
  logger.info(message, context)

export const logDebug = (message: string, context?: Record<string, any>) => 
  logger.debug(message, context) 