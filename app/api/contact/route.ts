import { NextResponse } from 'next/server'
import FormData from 'form-data'
import Mailgun from 'mailgun.js'

// Lazy initialize Mailgun client
function getMailgunClient() {
  const apiKey = process.env.MAILGUN_API_KEY
  if (!apiKey) {
    throw new Error('MAILGUN_API_KEY environment variable is required')
  }
  
  const mailgun = new Mailgun(FormData)
  return mailgun.client({
    username: 'api',
    key: apiKey,
    url: "https://api.mailgun.net",
  })
}

export async function POST(request: Request) {
  try {
    const data = await request.formData()
    
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

    // Prepare email data
    const emailData = {
      from: `${name} <${email}>`,
      to: process.env.CONTACT_EMAIL_TO,
      subject: `BitBasis Contact Form: ${subject}`,
      text: `
Name: ${name}
Email: ${email}
Subject: ${subject}

Message:
${message}
      `,
      html: `
<h3>New Contact Form Submission</h3>
<p><strong>Name:</strong> ${name}</p>
<p><strong>Email:</strong> ${email}</p>
<p><strong>Subject:</strong> ${subject}</p>
<p><strong>Message:</strong></p>
<p>${message.replace(/\n/g, '<br>')}</p>
      `
    }

    // Send email using Mailgun
    const mg = getMailgunClient()
    await mg.messages.create(process.env.MAILGUN_DOMAIN || '', emailData)

    return NextResponse.json(
      { message: 'Message sent successfully' },
      { status: 200 }
    )

  } catch (error) {
    console.error('Contact form error:', error)
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    )
  }
} 