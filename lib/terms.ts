/**
 * Track user's acceptance of terms and privacy policy
 * This should be called after user has checked the terms checkbox and is authenticated
 */
export async function trackTermsAcceptance(method: 'checkbox' | 'button' = 'checkbox'): Promise<boolean> {
  try {
    // Get current versions - in production these would come from a config or database
    // These are hardcoded here for simplicity
    const termsVersion = 'v1.0';
    const privacyVersion = 'v1.0';
    
    const response = await fetch('/api/auth/track-terms-acceptance', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        terms_version: termsVersion,
        privacy_version: privacyVersion,
        acceptance_method: method
      })
    });

    const data = await response.json();
    return data.success === true;
  } catch (error) {
    console.error('Error tracking terms acceptance:', error);
    return false;
  }
} 