"use client"

import { useState, useRef } from "react"
import { useAuth } from "@/providers/supabase-auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import Link from "next/link"
import { Logo } from "@/components/logo"
import { Turnstile } from "@marsidev/react-turnstile"
import { validateTurnstileToken } from "@/lib/captcha"
import { Icons } from '../icons'

export function MagicLinkForm() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const turnstileRef = useRef(null)
  const { signInWithMagicLink } = useAuth()

  const resetCaptcha = () => {
    // @ts-ignore
    if (turnstileRef.current?.reset) {
      // @ts-ignore
      turnstileRef.current.reset()
    }
    setCaptchaToken(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    if (!email) {
      setError('Please enter your email')
      setIsLoading(false)
      return
    }

    if (!termsAccepted) {
      setError('You must accept the terms and conditions')
      setIsLoading(false)
      return
    }

    if (!captchaToken) {
      setError('Please complete the CAPTCHA')
      setIsLoading(false)
      return
    }

    try {
      // First validate the CAPTCHA token with our backend
      const isValid = await validateTurnstileToken(captchaToken);
      
      if (!isValid) {
        setError('CAPTCHA validation failed. Please try again.');
        resetCaptcha();
        setIsLoading(false);
        return;
      }
      
      // Then proceed with the magic link sign-in
      const { error: signInError } = await signInWithMagicLink(email, captchaToken)
      
      if (signInError) {
        console.error('Magic link sign in error:', signInError)
        setError(signInError.message || 'Failed to send magic link')
        resetCaptcha()
        setIsLoading(false)
        return
      }

      // Clear any existing errors on success
      setError(null)
      setEmailSent(true)
      setIsLoading(false)
    } catch (err) {
      console.error('Magic link sign in error:', err)
      setError('An unexpected error occurred. Please try again.')
      resetCaptcha()
      setIsLoading(false)
    }
  }

  const content = (
    <div className="flex min-h-screen flex-col text-gray-300 overflow-x-hidden relative isolate">
      {/* Global Background Gradient & Grid */}
      <div 
        className="fixed inset-0 z-[-2] bg-gradient-to-b from-[#0F1116] via-[#171923] to-[#13151D]"
      />
      <div 
        className="fixed inset-0 z-[-1] opacity-[0.07]"
        style={{
          backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
          backgroundSize: '30px 30px'
        }}
      />
      {/* Noise Texture Overlay */}
      <div 
        className="fixed inset-0 z-[-1] opacity-30 mix-blend-soft-light pointer-events-none"
        style={{ 
          backgroundImage: 'url(\'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800"><defs><filter id="noiseFilter"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch"/></filter></defs><rect width="100%" height="100%" filter="url(%23noiseFilter)"/></svg>\')',
        }} 
      />

      <div className="flex min-h-screen items-center justify-center p-4 relative z-10">
        <Card className="w-full max-w-md bg-gradient-to-br from-gray-800/30 via-[#171923]/50 to-gray-800/30 shadow-xl border border-white/10">
          <CardHeader className="space-y-2">
            <div className="flex justify-center mb-4">
              <Logo />
            </div>
            <CardTitle className="text-2xl text-center text-white">Sign in to your account</CardTitle>
            <CardDescription className="text-center text-gray-400">
              Enter your email and we'll send you a magic link to sign in
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-300">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  className="bg-gray-800/50 border-gray-700 text-gray-300 placeholder:text-gray-500 focus:border-bitcoin-orange focus:ring-bitcoin-orange"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="terms" 
                  checked={termsAccepted}
                  onCheckedChange={(checked) => setTermsAccepted(checked === true)}
                  disabled={isLoading}
                  className="border-gray-700 data-[state=checked]:bg-bitcoin-orange data-[state=checked]:border-bitcoin-orange"
                />
                <Label 
                  htmlFor="terms" 
                  className="text-sm leading-none text-gray-400 peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  I agree to the{" "}
                  <Link href="/terms" className="text-bitcoin-orange hover:underline">
                    terms and conditions
                  </Link>
                  {" "}and{" "}
                  <Link href="/privacy" className="text-bitcoin-orange hover:underline">
                    privacy policy
                  </Link>
                </Label>
              </div>
              
              <div className="flex justify-center my-4">
                <Turnstile
                  ref={turnstileRef}
                  siteKey={process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY || "1x00000000000000000000AA"}
                  onSuccess={(token) => setCaptchaToken(token)}
                  onError={() => {
                    setError("CAPTCHA validation failed. Please try again.")
                    setCaptchaToken(null)
                  }}
                  onExpire={() => setCaptchaToken(null)}
                  options={{
                    theme: "dark",
                  }}
                />
              </div>

              <Button
                type="submit"
                className="w-full relative overflow-hidden bg-gradient-to-r from-bitcoin-orange to-[#D4A76A] text-white font-semibold shadow-lg hover:shadow-bitcoin-orange/30 transform hover:-translate-y-px transition-all duration-300 group"
                disabled={isLoading || !captchaToken || !termsAccepted}
              >
                <span className="relative z-10">
                  {isLoading ? (
                    <>
                      <Icons.spinner className="mr-2 h-4 w-4 animate-spin inline" />
                      Sending...
                    </>
                  ) : (
                    "Send Magic Link"
                  )}
                </span>
                <span className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 group-active:opacity-20 transition-opacity duration-300"></span>
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <div className="text-sm text-center text-gray-400">
              Don't have an account?{" "}
              <Link href="/auth/sign-up" className="text-bitcoin-orange hover:underline">
                Sign up
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )

  if (emailSent) {
    return (
      <div className="flex min-h-screen flex-col text-gray-300 overflow-x-hidden relative isolate">
        {/* Global Background Gradient & Grid */}
        <div 
          className="fixed inset-0 z-[-2] bg-gradient-to-b from-[#0F1116] via-[#171923] to-[#13151D]"
        />
        <div 
          className="fixed inset-0 z-[-1] opacity-[0.07]"
          style={{
            backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '30px 30px'
          }}
        />
        {/* Noise Texture Overlay */}
        <div 
          className="fixed inset-0 z-[-1] opacity-30 mix-blend-soft-light pointer-events-none"
          style={{ 
            backgroundImage: 'url(\'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800"><defs><filter id="noiseFilter"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch"/></filter></defs><rect width="100%" height="100%" filter="url(%23noiseFilter)"/></svg>\')',
          }} 
        />

        <div className="flex min-h-screen items-center justify-center p-4 relative z-10">
          <Card className="w-full max-w-md bg-gradient-to-br from-gray-800/30 via-[#171923]/50 to-gray-800/30 shadow-xl border border-white/10">
            <CardHeader className="space-y-2">
              <div className="flex justify-center mb-4">
                <Logo />
              </div>
              <CardTitle className="text-2xl text-center text-white">Check your email</CardTitle>
              <CardDescription className="text-center text-gray-400">
                We've sent a magic link to <span className="font-medium text-white">{email}</span>. 
                Click the link in the email to sign in.
              </CardDescription>
            </CardHeader>
            <CardFooter className="flex justify-center">
              <Button 
                variant="outline" 
                onClick={() => {
                  setEmailSent(false)
                  setEmail("")
                  resetCaptcha()
                }}
                className="text-gray-300 border-gray-700 hover:bg-gray-800/50 hover:text-white hover:border-gray-600 transition-all duration-300"
              >
                Back to sign in
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    )
  }

  return content
} 