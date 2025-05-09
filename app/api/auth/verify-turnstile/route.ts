import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { token } = await request.json();

  // Ensure token was provided
  if (!token) {
    return NextResponse.json({ success: false, error: 'Missing token' }, { status: 400 });
  }

  try {
    // Get secret key from environment variable
    const secretKey = process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY;
    
    if (!secretKey) {
      console.error('Missing Cloudflare Turnstile secret key');
      return NextResponse.json(
        { success: false, error: 'Server configuration error' }, 
        { status: 500 }
      );
    }

    // Verify the token with Cloudflare
    const formData = new FormData();
    formData.append('secret', secretKey);
    formData.append('response', token);
    
    const url = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
    const result = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    const outcome = await result.json();
    
    if (outcome.success) {
      return NextResponse.json({ success: true });
    } else {
      console.error('Turnstile verification failed:', outcome);
      return NextResponse.json(
        { success: false, error: 'CAPTCHA verification failed' }, 
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error verifying Turnstile token:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' }, 
      { status: 500 }
    );
  }
} 