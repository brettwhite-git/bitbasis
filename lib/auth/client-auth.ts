"use client"

import { createClient } from '@/lib/supabase/client'
import { redirect } from 'next/navigation'

export async function clientRequireAuth() {
  const supabase = createClient()
  
  // Fetch session and user
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()
  
  if (sessionError) {
    console.error('[clientRequireAuth] Error fetching session:', sessionError)
    redirect('/auth/sign-in')
  }

  if (!session) {
    redirect('/auth/sign-in')
  }

  // Fetch user directly for security
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    console.error('[clientRequireAuth] Error fetching user or user not found:', userError)
    redirect('/auth/sign-in')
  }
  
  return {
    supabase,
    user,
    session
  }
} 