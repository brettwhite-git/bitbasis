import { redirect } from 'next/navigation'
import type { Database } from '@/types/supabase'
import { createClient } from '@/lib/supabase/server'

export async function getServerClient() {
  return createClient()
}

export async function getServerSession() {
  const supabase = await getServerClient()
  
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('Server session error:', error)
      return null
    }
    
    return session
  } catch (error) {
    console.error('Failed to get server session:', error)
    return null
  }
}

export async function getServerUser() {
  // This function might return a slightly stale user from the session.
  // Prefer using requireUser or requireAuth which fetch fresh data.
  const session = await getServerSession()
  return session?.user ?? null
}

export async function requireUser() {
  // Get the server client first
  const supabase = await getServerClient()
  // Directly fetch the user for this request
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    console.error("Error fetching user in requireUser or user not found:", error)
    redirect('/auth/sign-in')
  }
  
  return user // Return the freshly fetched, non-null user
}

export async function requireAuth() {
  // Revert back to original secure implementation
  const supabase = await getServerClient()

  // Debug: Check what cookies we have
  const { cookies: cookiesFn } = await import('next/headers')
  const allCookies = (await cookiesFn()).getAll()
  console.log(`[requireAuth] Found ${allCookies.length} cookies:`, allCookies.map(c => c.name).join(', '))

  // Fetch session and user securely
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()

  if (sessionError) {
    // Keep generic error log
    console.error('[requireAuth] Error fetching session:', sessionError)
    redirect('/auth/sign-in')
  }

  if (!session) {
    console.log('[requireAuth] No session found, redirecting to sign-in')
    redirect('/auth/sign-in')
  }

  // Fetch user directly for security
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    // Keep generic error log
    console.error('[requireAuth] Error fetching user or user not found:', userError)
    redirect('/auth/sign-in')
  }
  
  return {
    supabase,
    user, // Return the securely fetched user
    session // Still return session if needed elsewhere, but user is preferred
  }
} 