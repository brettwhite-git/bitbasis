/**
 * SEC-009: URL Validation Utilities
 * 
 * Prevents open redirect attacks by validating that redirect URLs:
 * - Are same-origin only
 * - Are relative paths
 * - Don't contain path traversal
 * - Don't contain protocol-relative URLs
 */

/**
 * Validates and sanitizes a redirect URL
 * 
 * @param url - The URL to validate (can be null, undefined, or string)
 * @param defaultPath - Default relative path if URL is invalid (e.g., '/dashboard')
 * @param origin - The expected origin (from request.nextUrl.origin)
 * @returns A validated, safe URL string
 * 
 * @example
 * const safeUrl = validateRedirectUrl(
 *   request.body.successUrl,
 *   '/dashboard/success',
 *   request.nextUrl.origin
 * )
 */
export function validateRedirectUrl(
  url: string | null | undefined,
  defaultPath: string,
  origin: string
): string {
  // If no URL provided, use default
  if (!url || typeof url !== 'string') {
    return `${origin}${defaultPath}`
  }

  try {
    // Parse URL - this will throw if invalid format
    const urlObj = new URL(url, origin)

    // SECURITY CHECK 1: Must be same origin
    // Prevents redirects to external domains
    if (urlObj.origin !== origin) {
      console.warn(`[URL Validation] Blocked external redirect: ${url} (expected origin: ${origin})`)
      return `${origin}${defaultPath}`
    }

    // SECURITY CHECK 2: Must be relative path starting with /
    // Prevents protocol-relative URLs like //evil.com
    if (!urlObj.pathname.startsWith('/')) {
      console.warn(`[URL Validation] Blocked non-relative path: ${url}`)
      return `${origin}${defaultPath}`
    }

    // SECURITY CHECK 3: No path traversal
    // Prevents ../.. attacks
    if (urlObj.pathname.includes('..')) {
      console.warn(`[URL Validation] Blocked path traversal attempt: ${url}`)
      return `${origin}${defaultPath}`
    }

    // SECURITY CHECK 4: No protocol-relative URLs in the original string
    // Catch cases like //evil.com before URL parsing normalizes them
    if (url.trim().startsWith('//')) {
      console.warn(`[URL Validation] Blocked protocol-relative URL: ${url}`)
      return `${origin}${defaultPath}`
    }

    // SECURITY CHECK 5: No javascript: or data: schemes
    // Extra protection against XSS via redirect
    const trimmedUrl = url.trim().toLowerCase()
    if (trimmedUrl.startsWith('javascript:') || trimmedUrl.startsWith('data:')) {
      console.warn(`[URL Validation] Blocked dangerous scheme: ${url}`)
      return `${origin}${defaultPath}`
    }

    // URL is safe - return the full validated URL
    return urlObj.toString()
  } catch (error) {
    // Invalid URL format - use default
    console.warn(`[URL Validation] Invalid URL format: ${url}`, error)
    return `${origin}${defaultPath}`
  }
}

/**
 * Validates a redirect URL against a whitelist of allowed paths
 * 
 * Use this when you want to restrict redirects to specific known paths
 * (more restrictive than validateRedirectUrl)
 * 
 * @param url - The URL to validate
 * @param allowedPaths - Array of allowed relative paths (e.g., ['/dashboard', '/dashboard/settings'])
 * @param defaultPath - Default path if URL is invalid
 * @param origin - The expected origin
 * @returns A validated, safe URL string
 * 
 * @example
 * const safeUrl = validateRedirectUrlWithWhitelist(
 *   request.body.next,
 *   ['/dashboard', '/dashboard/settings', '/dashboard/subscription'],
 *   '/dashboard',
 *   request.nextUrl.origin
 * )
 */
export function validateRedirectUrlWithWhitelist(
  url: string | null | undefined,
  allowedPaths: string[],
  defaultPath: string,
  origin: string
): string {
  // If no URL provided, use default
  if (!url || typeof url !== 'string') {
    return `${origin}${defaultPath}`
  }

  try {
    const urlObj = new URL(url, origin)

    // Must be same origin
    if (urlObj.origin !== origin) {
      console.warn(`[URL Validation] Blocked external redirect: ${url}`)
      return `${origin}${defaultPath}`
    }

    // Check if pathname is in whitelist
    if (!allowedPaths.includes(urlObj.pathname)) {
      console.warn(`[URL Validation] Blocked redirect to non-whitelisted path: ${urlObj.pathname}`)
      return `${origin}${defaultPath}`
    }

    // Additional security checks
    if (urlObj.pathname.includes('..') || url.trim().startsWith('//')) {
      console.warn(`[URL Validation] Blocked suspicious redirect: ${url}`)
      return `${origin}${defaultPath}`
    }

    return urlObj.toString()
  } catch (error) {
    console.warn(`[URL Validation] Invalid URL format: ${url}`, error)
    return `${origin}${defaultPath}`
  }
}

