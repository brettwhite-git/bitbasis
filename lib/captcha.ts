/**
 * Validates a Cloudflare Turnstile token with our backend API
 */
export async function validateTurnstileToken(token: string): Promise<boolean> {
  try {
    const response = await fetch('/api/auth/verify-turnstile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ token })
    });

    const data = await response.json();
    return data.success === true;
  } catch (error) {
    console.error('Error validating Turnstile token:', error);
    return false;
  }
} 