import { NextRequest } from 'next/server';
import { logger } from '@/lib/logger';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store for rate limiting (use Redis in production)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Rate limit configurations
export const RATE_LIMITS = {
  // API routes
  api: { requests: 100, window: 60 * 1000 }, // 100 requests per minute
  auth: { requests: 5, window: 60 * 1000 }, // 5 auth attempts per minute
  subscription: { requests: 10, window: 60 * 1000 }, // 10 subscription actions per minute
  upload: { requests: 5, window: 60 * 1000 }, // 5 uploads per minute
  
  // Strict limits for sensitive operations
  payment: { requests: 3, window: 60 * 1000 }, // 3 payment attempts per minute
  webhook: { requests: 1000, window: 60 * 1000 }, // 1000 webhooks per minute (for Stripe)
  
  // Development bypass
  development: { requests: 1000, window: 1000 }, // Essentially unlimited in dev
} as const;

/**
 * Get client identifier for rate limiting
 */
function getClientId(request: NextRequest): string {
  // Try to get real IP from headers (for production behind proxy)
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwardedFor?.split(',')[0] || realIp || request.ip || 'unknown';
  
  // In development, use a more permissive identifier
  if (process.env.NODE_ENV === 'development') {
    return `dev-${ip}`;
  }
  
  return ip;
}

/**
 * Clean up expired entries from the rate limit store
 */
function cleanupExpiredEntries(): void {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Check if request is within rate limit
 */
export function checkRateLimit(
  request: NextRequest,
  limitType: keyof typeof RATE_LIMITS = 'api'
): {
  success: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
} {
  // Bypass rate limiting in development if DEV_BYPASS_LIMITS is set
  if (process.env.NODE_ENV === 'development' && process.env.DEV_BYPASS_LIMITS === 'true') {
    return {
      success: true,
      limit: 1000,
      remaining: 999,
      resetTime: Date.now() + 60000
    };
  }
  
  const clientId = getClientId(request);
  const config = RATE_LIMITS[limitType];
  const now = Date.now();
  // const windowStart = now - config.window; // Not used currently
  
  // Clean up expired entries periodically
  if (Math.random() < 0.01) { // 1% chance to cleanup
    cleanupExpiredEntries();
  }
  
  const key = `${limitType}:${clientId}`;
  const entry = rateLimitStore.get(key);
  
  // If no entry exists or it's expired, create a new one
  if (!entry || now > entry.resetTime) {
    const newEntry: RateLimitEntry = {
      count: 1,
      resetTime: now + config.window
    };
    rateLimitStore.set(key, newEntry);
    
    logger.debug('Rate limit: New window started', {
      clientId,
      limitType,
      count: 1,
      limit: config.requests
    });
    
    return {
      success: true,
      limit: config.requests,
      remaining: config.requests - 1,
      resetTime: newEntry.resetTime
    };
  }
  
  // Check if limit is exceeded
  if (entry.count >= config.requests) {
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
    
    logger.warn('Rate limit exceeded', {
      clientId,
      limitType,
      count: entry.count,
      limit: config.requests,
      retryAfter
    });
    
    return {
      success: false,
      limit: config.requests,
      remaining: 0,
      resetTime: entry.resetTime,
      retryAfter
    };
  }
  
  // Increment counter
  entry.count++;
  rateLimitStore.set(key, entry);
  
  logger.debug('Rate limit: Request counted', {
    clientId,
    limitType,
    count: entry.count,
    limit: config.requests
  });
  
  return {
    success: true,
    limit: config.requests,
    remaining: config.requests - entry.count,
    resetTime: entry.resetTime
  };
}

/**
 * Create rate limit response headers
 */
export function createRateLimitHeaders(result: ReturnType<typeof checkRateLimit>): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.resetTime.toString(),
    ...(result.retryAfter && { 'Retry-After': result.retryAfter.toString() })
  };
}

/**
 * Middleware helper for rate limiting
 */
export function withRateLimit(
  limitType: keyof typeof RATE_LIMITS = 'api'
) {
  return (request: NextRequest) => {
    const result = checkRateLimit(request, limitType);
    const headers = createRateLimitHeaders(result);
    
    if (!result.success) {
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
          message: `Too many requests. Try again in ${result.retryAfter} seconds.`,
          retryAfter: result.retryAfter
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            ...headers
          }
        }
      );
    }
    
    return { headers };
  };
}

/**
 * Reset rate limit for a specific client and limit type
 * Useful for testing or administrative purposes
 */
export function resetRateLimit(
  clientId: string,
  limitType: keyof typeof RATE_LIMITS
): void {
  const key = `${limitType}:${clientId}`;
  rateLimitStore.delete(key);
  
  logger.info('Rate limit reset', { clientId, limitType });
}

/**
 * Get current rate limit status for a client
 */
export function getRateLimitStatus(
  clientId: string,
  limitType: keyof typeof RATE_LIMITS
): RateLimitEntry | null {
  const key = `${limitType}:${clientId}`;
  return rateLimitStore.get(key) || null;
}

/**
 * Get rate limit statistics
 */
export function getRateLimitStats(): {
  totalEntries: number;
  entriesByType: Record<string, number>;
  oldestEntry: number | null;
  newestEntry: number | null;
} {
  const entries = Array.from(rateLimitStore.entries());
  const entriesByType: Record<string, number> = {};
  let oldestEntry: number | null = null;
  let newestEntry: number | null = null;
  
  for (const [key, entry] of entries) {
    const [type] = key.split(':');
    entriesByType[type] = (entriesByType[type] || 0) + 1;
    
    if (oldestEntry === null || entry.resetTime < oldestEntry) {
      oldestEntry = entry.resetTime;
    }
    
    if (newestEntry === null || entry.resetTime > newestEntry) {
      newestEntry = entry.resetTime;
    }
  }
  
  return {
    totalEntries: entries.length,
    entriesByType,
    oldestEntry,
    newestEntry
  };
} 