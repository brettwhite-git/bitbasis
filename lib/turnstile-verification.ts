/**
 * Cloudflare Turnstile server-side verification
 * SEC-006: Verify CAPTCHA tokens before processing form submissions
 */

/**
 * Verify Turnstile token with Cloudflare API
 * @param token - The Turnstile token from client-side widget
 * @param remoteip - Optional: Client's IP address for additional verification
 * @returns Promise<boolean> - true if verification succeeds
 */
export async function verifyTurnstileToken(
  token: string,
  remoteip?: string
): Promise<boolean> {
  const secretKey = process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY

  if (!secretKey) {
    console.error('CLOUDFLARE_TURNSTILE_SECRET_KEY not configured')
    return false
  }

  if (!token) {
    console.error('Turnstile token is missing')
    return false
  }

  try {
    const formData = new URLSearchParams()
    formData.append('secret', secretKey)
    formData.append('response', token)
    if (remoteip) {
      formData.append('remoteip', remoteip)
    }

    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    })

    const result = await response.json()

    // Check if verification was successful
    if (result.success === true) {
      return true
    } else {
      console.error('Turnstile verification failed:', result['error-codes'])
      return false
    }
  } catch (error) {
    console.error('Error verifying Turnstile token:', error)
    return false
  }
}

