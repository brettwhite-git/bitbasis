"use client"

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { redirect } from 'next/navigation'
import type { Database } from '@/types/supabase'

export async function clientRequireAuth() {
  const supabase = createClientComponentClient<Database>()
  
  // Fetch session and user
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()
  
  if (sessionError) {
    console.error('[clientRequireAuth] Error fetching session:', sessionError)
    redirect('/auth/signin')
  }

  if (!session) {
    redirect('/auth/signin')
  }

  // Fetch user directly for security
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
    console.error('[clientRequireAuth] Error fetching user or user not found:', userError)
    redirect('/auth/signin')
  }
  
  return {
    supabase,
    user,
    session
  }
} 