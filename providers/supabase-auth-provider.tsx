"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient, User } from "@supabase/auth-helpers-nextjs"
import { Database } from "@/types/supabase"

type SupabaseAuthProviderProps = {
  children: React.ReactNode
}

type AuthContextType = {
  user: User | null
  signUp: (email: string, password: string) => Promise<{ error: any }>
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: any }>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  signUp: async () => ({ error: null }),
  signIn: async () => ({ error: null }),
  signOut: async () => {},
  resetPassword: async () => ({ error: null }),
})

export const useAuth = () => {
  return useContext(AuthContext)
}

export function SupabaseAuthProvider({ children }: SupabaseAuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClientComponentClient<Database>()

  // Initialize the auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('Initializing auth state...')
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user) {
          console.log('Session found, setting user...')
          setUser(session.user)
          
          // If we're on an auth page and have a session, redirect to dashboard
          if (window.location.pathname.startsWith('/auth/')) {
            console.log('Redirecting authenticated user from auth page to dashboard...')
            router.push('/dashboard')
          }
        } else {
          console.log('No session found')
          setUser(null)
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    initializeAuth()

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event)
      if (session?.user) {
        setUser(session.user)
      } else {
        setUser(null)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, router])

  const signUp = async (email: string, password: string) => {
    try {
      console.log('Attempting sign up...')
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      return { error }
    } catch (error) {
      console.error('Sign up error:', error)
      return { error }
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      console.log('Attempting sign in...')
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (!error) {
        console.log('Sign in successful, redirecting...')
        router.push('/dashboard')
        router.refresh()
      }

      return { error }
    } catch (error) {
      console.error('Sign in error:', error)
      return { error }
    }
  }

  const signOut = async () => {
    try {
      console.log('Signing out...')
      await supabase.auth.signOut()
      router.push('/')
      router.refresh()
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  const resetPassword = async (email: string) => {
    try {
      console.log('Requesting password reset...')
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/auth/update-password`,
      })
      return { error }
    } catch (error) {
      console.error('Password reset error:', error)
      return { error }
    }
  }

  const value = {
    user,
    signUp,
    signIn,
    signOut,
    resetPassword,
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
} 