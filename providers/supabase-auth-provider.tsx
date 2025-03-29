"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { User, Session, AuthChangeEvent } from "@supabase/supabase-js"
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
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClientComponentClient<Database>()

  useEffect(() => {
    // Initialize auth state
    const initAuth = async () => {
      try {
        // Get initial session
        const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession()
        if (sessionError) {
          console.error('Failed to get initial session:', sessionError)
          return
        }

        if (initialSession) {
          setSession(initialSession)
          setUser(initialSession.user)
        }

        // Set up auth state change listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event: AuthChangeEvent, currentSession: Session | null) => {
            console.log('Auth state changed:', { event, userId: currentSession?.user?.id })
            
            if (currentSession) {
              setSession(currentSession)
              setUser(currentSession.user)
              
              // Only refresh and redirect on new sign in
              if (event === 'SIGNED_IN') {
                await router.refresh()
                router.push('/dashboard')
              }
            } else {
              setSession(null)
              setUser(null)
              
              if (event === 'SIGNED_OUT') {
                await router.refresh()
                router.push('/auth/signin')
              }
            }
          }
        )

        setLoading(false)

        return () => {
          subscription.unsubscribe()
        }
      } catch (error) {
        console.error('Auth initialization failed:', error)
        setLoading(false)
      }
    }

    initAuth()
  }, [router, supabase])

  const signUp = async (email: string, password: string) => {
    try {
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
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error('Sign in error:', error)
        return { error }
      }

      return { error: null }
    } catch (error) {
      console.error('Sign in error:', error)
      return { error }
    }
  }

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      await router.refresh()
      router.push('/')
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  const resetPassword = async (email: string) => {
    try {
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