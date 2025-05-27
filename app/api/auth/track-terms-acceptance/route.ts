import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { terms_version, privacy_version, acceptance_method, acceptance_type = 'signup' } = await request.json();
    const userAgent = request.headers.get('user-agent') || '';
    
    // Get client IP - this is just a basic implementation
    // For production, you might need more sophisticated IP detection
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : '127.0.0.1';
    
    // Get authenticated user
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    // Insert record into terms_acceptance table
    const { error: insertError } = await supabase
      .from('terms_acceptance')
      .insert({
        user_id: user.id,
        terms_version,
        privacy_version,
        acceptance_method,
        ip_address: ip,
        user_agent: userAgent,
        acceptance_type,
      });

    if (insertError) {
      console.error('Failed to track terms acceptance:', insertError);
      return NextResponse.json(
        { success: false, error: 'Failed to record terms acceptance' }, 
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error tracking terms acceptance:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' }, 
      { status: 500 }
    );
  }
} 