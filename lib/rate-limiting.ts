/**
 * Simple in-memory rate limiting for API routes
 * 
 * This is a basic implementation suitable for:
 * - Low to medium traffic
 * - Single-region deployments
 * - Per-user rate limiting
 * 
 * For production scale or multi-region, consider:
 * - Upstash Redis for distributed rate limiting
 * - Vercel Edge Middleware for edge-level limiting
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory store: user_id -> RateLimitEntry
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes to prevent memory leaks
const CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes

function cleanupExpiredEntries() {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key);
    }
  }
}

// Start cleanup interval
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupExpiredEntries, CLEANUP_INTERVAL);
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  limit: number;
}

/**
 * Check if a request should be rate limited
 * 
 * @param key - Unique identifier for rate limiting (user ID or IP address or custom key)
 * @param limit - Maximum number of requests allowed
 * @param windowMs - Time window in milliseconds
 * @returns RateLimitResult indicating if request is allowed
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();

  // Cleanup expired entries occasionally
  if (Math.random() < 0.1) {
    cleanupExpiredEntries();
  }

  const entry = rateLimitStore.get(key);

  // No entry or expired - allow request
  if (!entry || entry.resetAt < now) {
    const newEntry: RateLimitEntry = {
      count: 1,
      resetAt: now + windowMs,
    };
    rateLimitStore.set(key, newEntry);

    return {
      allowed: true,
      remaining: limit - 1,
      resetAt: newEntry.resetAt,
      limit,
    };
  }

  // Entry exists and is active
  if (entry.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
      limit,
    };
  }

  // Increment count
  entry.count += 1;
  rateLimitStore.set(key, entry);

  return {
    allowed: true,
    remaining: limit - entry.count,
    resetAt: entry.resetAt,
    limit,
  };
}

/**
 * Get rate limit headers for HTTP response
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': new Date(result.resetAt).toISOString(),
  };
}

/**
 * Predefined rate limit configurations for different endpoint types
 */
export const RateLimits = {
  // Bulk transaction uploads: 15 requests per hour
  BULK_TRANSACTIONS: {
    limit: 15,
    windowMs: 60 * 60 * 1000, // 1 hour
  },
  
  // Contact form: 5 requests per hour
  CONTACT_FORM: {
    limit: 5,
    windowMs: 60 * 60 * 1000, // 1 hour
  },
  
  // Terms acceptance tracking: 10 requests per minute
  TERMS_ACCEPTANCE: {
    limit: 10,
    windowMs: 60 * 1000, // 1 minute
  },
  
  // General API endpoints: 100 requests per minute
  GENERAL_API: {
    limit: 100,
    windowMs: 60 * 1000, // 1 minute
  },
} as const;

