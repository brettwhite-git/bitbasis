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

  if (emailSent) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-2">
            <div className="flex justify-center mb-4">
              <Logo />
            </div>
            <CardTitle className="text-2xl text-center">Check your email</CardTitle>
            <CardDescription className="text-center">
              We've sent a magic link to <span className="font-medium">{email}</span>. 
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
            >
              Back to sign in
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2">
          <div className="flex justify-center mb-4">
            <Logo />
          </div>
          <CardTitle className="text-2xl text-center">Sign in to your account</CardTitle>
          <CardDescription className="text-center">
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
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="terms" 
                checked={termsAccepted}
                onCheckedChange={(checked) => setTermsAccepted(checked === true)}
                disabled={isLoading}
              />
              <Label 
                htmlFor="terms" 
                className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
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
              className="w-full bg-bitcoin-orange hover:bg-bitcoin-dark"
              disabled={isLoading || !captchaToken || !termsAccepted}
            >
              {isLoading ? "Sending..." : "Send Magic Link"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <div className="text-sm text-center">
            Don't have an account?{" "}
            <Link href="/auth/sign-up" className="text-bitcoin-orange hover:underline">
              Sign up
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
} 