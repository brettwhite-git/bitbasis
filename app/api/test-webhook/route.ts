import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  console.log('🔔 Test webhook endpoint called!')
  
  try {
    const body = await request.text()
    const headers = Object.fromEntries(request.headers.entries())
    
    console.log('Headers:', headers)
    console.log('Body length:', body.length)
    console.log('Body preview:', body.substring(0, 200))
    
    return NextResponse.json({ 
      success: true, 
      message: 'Test webhook received',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Test webhook error:', error)
    return NextResponse.json({ error: 'Test webhook failed' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Test webhook endpoint is accessible',
    timestamp: new Date().toISOString()
  })
} 