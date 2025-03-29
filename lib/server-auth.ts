import { cookies } from 'next/headers'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { redirect } from 'next/navigation'
import type { Database } from '@/types/supabase'

export async function getServerClient() {
  const cookieStore = cookies()
  return createServerComponentClient<Database>({ cookies: () => cookieStore })
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
  const session = await getServerSession()
  return session?.user ?? null
}

export async function requireUser() {
  const user = await getServerUser()
  if (!user) {
    redirect('/auth/signin')
  }
  return user
}

export async function requireAuth() {
  const supabase = await getServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    redirect('/auth/signin')
  }
  
  return {
    supabase,
    user: session.user,
    session
  }
} 