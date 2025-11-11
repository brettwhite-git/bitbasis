import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { verifyTurnstileToken } from '@/lib/turnstile-verification'
import { sanitizeContactFormData } from '@/lib/email-sanitization'
import { checkRateLimit, getRateLimitHeaders, RateLimits } from '@/lib/rate-limiting'

// Lazy initialize Resend client
function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    throw new Error('RESEND_API_KEY environment variable is required')
  }
  
  return new Resend(apiKey)
}

export async function POST(request: NextRequest) {
  try {
    // SEC-006: Rate limiting - 5 requests per hour per IP
    const forwarded = request.headers.get('x-forwarded-for')
    let ip = 'unknown'
    if (forwarded) {
      const ips = forwarded.split(',')
      if (ips.length > 0 && ips[0]) {
        ip = ips[0].trim()
      }
    }
    if (ip === 'unknown') {
      ip = request.headers.get('x-real-ip') || 'unknown'
    }
    
    // Use IP for rate limiting (contact form is public, no user authentication)
    const rateLimitKey = `contact:${ip}`
    const rateLimitResult = checkRateLimit(
      rateLimitKey,
      RateLimits.CONTACT_FORM.limit,
      RateLimits.CONTACT_FORM.windowMs
    )

    if (!rateLimitResult.allowed) {
      const minutesUntilReset = Math.ceil((rateLimitResult.resetAt - Date.now()) / (60 * 1000))
      
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: `Too many contact form submissions. Please try again in ${minutesUntilReset} minute(s).`,
        },
        {
          status: 429,
          headers: getRateLimitHeaders(rateLimitResult),
        }
      )
    }

    const data = await request.formData()
    
    // SEC-006: Verify Turnstile CAPTCHA token
    const turnstileToken = data.get('cf-turnstile-response')?.toString()
    
    if (!turnstileToken) {
      return NextResponse.json(
        { error: 'CAPTCHA verification required' },
        { status: 400 }
      )
    }

    // Verify Turnstile token with Cloudflare
    const clientIp = ip !== 'unknown' ? ip : undefined
    const isValidCaptcha = await verifyTurnstileToken(turnstileToken, clientIp)
    
    if (!isValidCaptcha) {
      return NextResponse.json(
        { error: 'CAPTCHA verification failed. Please try again.' },
        { status: 400 }
      )
    }
    
    const name = data.get('name')?.toString()
    const email = data.get('email')?.toString()
    const subject = data.get('subject')?.toString()
    const message = data.get('message')?.toString()

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // SEC-006: Sanitize all form inputs to prevent XSS and email injection
    const sanitized = sanitizeContactFormData({
      name,
      email,
      subject,
      message,
    })

    // Prepare email data with sanitized content
    const recipientEmail = 'hello@bitbasis.io'
    const senderEmail = process.env.RESEND_FROM_EMAIL || 'BitBasis <hello@bitbasis.io>'
    
    const emailData = {
      from: senderEmail,
      to: recipientEmail,
      replyTo: sanitized.email, // Allow replying directly to the user
      subject: `BitBasis Contact Form: ${sanitized.subject}`,
      text: `
Name: ${sanitized.name}
Email: ${sanitized.email}
Subject: ${sanitized.subject}

Message:
${sanitized.message.replace(/<br>/g, '\n')}
      `,
      html: `
<h3>New Contact Form Submission</h3>
<p><strong>Name:</strong> ${sanitized.name}</p>
<p><strong>Email:</strong> <a href="mailto:${sanitized.email}">${sanitized.email}</a></p>
<p><strong>Subject:</strong> ${sanitized.subject}</p>
<p><strong>Message:</strong></p>
<p>${sanitized.message}</p>
      `
    }

    // Send email using Resend
    const resend = getResendClient()
    await resend.emails.send(emailData)

    // Return success with rate limit headers
    return NextResponse.json(
      { message: 'Message sent successfully' },
      {
        status: 200,
        headers: getRateLimitHeaders(rateLimitResult),
      }
    )

  } catch (error) {
    console.error('Contact form error:', error)
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    )
  }
} 