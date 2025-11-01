/**
 * SEC-010: Error Sanitization Utilities
 * 
 * Prevents information disclosure by sanitizing error messages before
 * returning them to clients. In production, only generic error messages
 * are returned, while detailed errors are logged server-side only.
 */

/**
 * Check if we're in production environment
 */
function isProduction(): boolean {
  return process.env.NODE_ENV === 'production'
}

/**
 * Sanitized error response for API routes
 */
export interface SanitizedError {
  error: string
  message: string
  code?: string
}

/**
 * Maps internal error types to user-friendly messages
 */
const ERROR_MESSAGE_MAP: Record<string, string> = {
  // Database errors
  'PGRST116': 'Record not found',
  '23505': 'Duplicate entry', // Unique constraint violation
  '23503': 'Referenced record does not exist', // Foreign key violation
  '42P01': 'Database table not found',
  
  // Stripe errors
  'card_declined': 'Your card was declined',
  'insufficient_funds': 'Insufficient funds',
  'expired_card': 'Your card has expired',
  'invalid_cvc': 'Invalid security code',
  'invalid_expiry_month': 'Invalid expiration month',
  'invalid_expiry_year': 'Invalid expiration year',
  
  // Authentication errors
  'Invalid JWT': 'Session expired. Please sign in again',
  'JWTExpired': 'Session expired. Please sign in again',
  'Invalid login credentials': 'Invalid email or password',
  
  // Rate limiting
  'Rate limit exceeded': 'Too many requests. Please try again later',
  
  // Generic errors
  'Unauthorized': 'Authentication required',
  'Forbidden': 'Access denied',
  'Not Found': 'Resource not found',
  'Bad Request': 'Invalid request data',
}

/**
 * Extracts error code from error if available
 */
function extractErrorCode(error: unknown): string | undefined {
  if (error && typeof error === 'object') {
    const err = error as Record<string, unknown>
    
    // Check for Supabase error code
    if ('code' in err && typeof err.code === 'string') {
      return err.code
    }
    
    // Check for Stripe error code
    if ('type' in err && typeof err.type === 'string') {
      return err.type
    }
    
    // Check for PostgreSQL error code
    if ('code' in err && typeof err.code === 'string' && /^[0-9A-Z]{5}$/.test(err.code)) {
      return err.code
    }
  }
  
  return undefined
}

/**
 * Checks if error message matches a known error pattern
 */
function getMappedMessage(error: unknown): string | null {
  if (error instanceof Error) {
    // Check error message
    for (const [key, message] of Object.entries(ERROR_MESSAGE_MAP)) {
      if (error.message.includes(key)) {
        return message
      }
    }
    
    // Check error name
    if (ERROR_MESSAGE_MAP[error.name]) {
      return ERROR_MESSAGE_MAP[error.name]
    }
  }
  
  // Check error code
  const code = extractErrorCode(error)
  if (code && ERROR_MESSAGE_MAP[code]) {
    return ERROR_MESSAGE_MAP[code]
  }
  
  return null
}

/**
 * Sanitizes an error for client response
 * 
 * In production:
 * - Returns generic user-friendly messages
 * - Never exposes internal error details
 * - Logs full error details server-side
 * 
 * In development:
 * - Returns detailed error messages for debugging
 * - Still logs full error details
 * 
 * @param error - The error to sanitize
 * @param defaultMessage - Default message if error can't be mapped
 * @param context - Optional context for logging (e.g., 'checkout session creation')
 * @returns Sanitized error response object
 * 
 * @example
 * try {
 *   // ... operation
 * } catch (error) {
 *   console.error('Operation failed:', error)
 *   const sanitized = sanitizeError(error, 'Failed to complete operation', 'operation')
 *   return NextResponse.json(sanitized, { status: 500 })
 * }
 */
export function sanitizeError(
  error: unknown,
  defaultMessage: string,
  context?: string
): SanitizedError {
  // Always log full error details server-side
  const errorContext = context ? ` [${context}]` : ''
  
  if (error instanceof Error) {
    console.error(`Error${errorContext}:`, {
      name: error.name,
      message: error.message,
      stack: isProduction() ? undefined : error.stack, // Don't log stack in prod (may contain sensitive paths)
    })
  } else {
    console.error(`Unknown error${errorContext}:`, error)
  }

  // Extract error code if available
  const code = extractErrorCode(error)

  // In production, never expose internal error details
  if (isProduction()) {
    // Try to map to user-friendly message
    const mappedMessage = getMappedMessage(error)
    if (mappedMessage) {
      return {
        error: 'OPERATION_FAILED',
        message: mappedMessage,
        code,
      }
    }

    // Fall back to generic message
    return {
      error: 'INTERNAL_ERROR',
      message: defaultMessage,
      code,
    }
  }

  // In development, include error details for debugging
  const errorMessage = error instanceof Error ? error.message : String(error)
  const mappedMessage = getMappedMessage(error)
  
  return {
    error: 'INTERNAL_ERROR',
    message: mappedMessage || errorMessage || defaultMessage,
    code,
  }
}

/**
 * Creates a sanitized error response for Next.js API routes
 * 
 * This is a convenience function that returns a properly formatted
 * NextResponse with sanitized error data.
 * 
 * @param error - The error to sanitize
 * @param defaultMessage - Default message if error can't be mapped
 * @param statusCode - HTTP status code (default: 500)
 * @param context - Optional context for logging
 * @returns NextResponse with sanitized error
 * 
 * @example
 * try {
 *   // ... operation
 * } catch (error) {
 *   return createSanitizedErrorResponse(
 *     error,
 *     'Failed to create checkout session',
 *     500,
 *     'checkout session creation'
 *   )
 * }
 */
export function createSanitizedErrorResponse(
  error: unknown,
  defaultMessage: string,
  statusCode: number = 500,
  context?: string
) {
  const sanitized = sanitizeError(error, defaultMessage, context)
  
  return {
    ...sanitized,
    status: statusCode,
  }
}

/**
 * Type guard to check if error has a Stripe-specific structure
 */
export function isStripeError(error: unknown): error is {
  type?: string
  code?: string
  decline_code?: string
  message?: string
} {
  return (
    error !== null &&
    typeof error === 'object' &&
    ('type' in error || 'code' in error)
  )
}

/**
 * Sanitizes Stripe errors with appropriate user-friendly messages
 * 
 * Stripe errors can contain sensitive information, so we sanitize
 * them while preserving useful error codes for the client.
 * 
 * @param error - Stripe error object
 * @param defaultMessage - Default message
 * @returns Sanitized error response
 */
export function sanitizeStripeError(
  error: unknown,
  defaultMessage: string = 'Payment processing failed'
): SanitizedError {
  if (isStripeError(error)) {
    // Log full Stripe error server-side
    console.error('Stripe error:', {
      type: error.type,
      code: error.code,
      decline_code: error.decline_code,
      message: error.message,
    })

    // Map Stripe error codes to user-friendly messages
    const code = error.code || error.type
    const mappedMessage = code && ERROR_MESSAGE_MAP[code]
      ? ERROR_MESSAGE_MAP[code]
      : defaultMessage

    // In production, return mapped message or default
    // In development, include more details
    const message = isProduction()
      ? mappedMessage
      : (error.message || mappedMessage)

    return {
      error: 'PAYMENT_ERROR',
      message,
      code: code || error.type,
    }
  }

  // Not a Stripe error, use standard sanitization
  return sanitizeError(error, defaultMessage, 'Stripe operation')
}

