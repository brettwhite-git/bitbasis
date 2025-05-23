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
  signUp: (email: string) => Promise<{ error: any }>
  signInWithMagicLink: (email: string, captchaToken?: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  signUp: async () => ({ error: null }),
  signInWithMagicLink: async () => ({ error: null }),
  signOut: async () => {},
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
                router.push('/auth/sign-in')
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

  const signUp = async (email: string) => {
    try {
      // Direct redirect to dashboard is more reliable
      const redirectUrl = `${window.location.origin}/dashboard`;
      
      console.log('Signup redirect URL:', redirectUrl);
      
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectUrl,
        },
      })
      return { error }
    } catch (error) {
      console.error('Sign up error:', error)
      return { error }
    }
  }

  const signInWithMagicLink = async (email: string, captchaToken?: string) => {
    try {
      // Determine if we're in local development or production
      const isLocalhost = window.location.hostname === 'localhost' || 
                         window.location.hostname === '127.0.0.1';
      
      // Direct redirect to dashboard is more reliable for magic links
      // This works in both local and production environments
      const redirectUrl = `${window.location.origin}/dashboard`;
      
      console.log('Magic link redirect URL:', redirectUrl);
      
      const options: any = {
        emailRedirectTo: redirectUrl,
      }
      
      // Add captcha token if provided
      if (captchaToken) {
        options.captchaToken = captchaToken
      }
      
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options,
      })

      if (error) {
        console.error('Magic link sign in error:', error)
        return { error }
      }

      return { error: null }
    } catch (error) {
      console.error('Magic link sign in error:', error)
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

  const value = {
    user,
    signUp,
    signInWithMagicLink,
    signOut,
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
} 