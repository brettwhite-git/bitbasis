'use client'

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Turnstile } from "@marsidev/react-turnstile"
import Link from "next/link"
import Image from "next/image"

export default function ContactPage() {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const turnstileRef = useRef(null)

  const resetCaptcha = () => {
    // @ts-expect-error - Turnstile ref type not properly typed
    if (turnstileRef.current?.reset) {
      // @ts-expect-error - Turnstile reset method not properly typed
      turnstileRef.current.reset()
    }
    setCaptchaToken(null)
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    // SEC-006: Require CAPTCHA token before submission
    if (!captchaToken) {
      toast({
        title: "CAPTCHA Required",
        description: "Please complete the CAPTCHA verification",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const formData = new FormData(event.currentTarget)
      // Add Turnstile token to form data
      formData.append('cf-turnstile-response', captchaToken)

      const response = await fetch('/api/contact', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message')
      }

      toast({
        title: "Message Sent",
        description: "We'll get back to you as soon as possible.",
        variant: "default",
      })

      // Reset form and CAPTCHA
      ;(event.target as HTMLFormElement).reset()
      resetCaptcha()

    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send message",
        variant: "destructive",
      })
      resetCaptcha()
    } finally {
      setIsSubmitting(false)
    }
  }

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

      {/* Main Content */}
      <main className="flex-1 min-h-screen">
        <div className="grid grid-cols-1 md:grid-cols-2 min-h-screen">
          {/* Left Panel - Visual Placeholder */}
          <div className="relative flex flex-col items-center justify-center p-8 md:p-12 lg:p-16 bg-gradient-to-br from-gray-900/50 via-gray-800/30 to-gray-900/50 border-b md:border-b-0 md:border-r border-white/5 min-h-[400px] md:min-h-screen">
            {/* Back to website link */}
            <div className="absolute top-4 right-4 md:top-8 md:right-8">
              <Link 
                href="/"
                className="px-3 py-1.5 md:px-4 md:py-2 rounded-lg bg-gray-800/40 border border-white/10 text-white text-xs md:text-sm hover:bg-gray-800/60 transition-colors flex items-center gap-1 md:gap-2"
              >
                <span className="hidden sm:inline">Back to website</span>
                <span className="sm:hidden">Back</span>
                <span className="text-bitcoin-orange">→</span>
              </Link>
            </div>

            {/* Placeholder Content */}
            <div className="flex flex-col items-center text-center space-y-6 max-w-md">
              {/* Logo */}
              <div className="mb-4">
                <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-bitcoin-orange flex items-center justify-center shadow-lg shadow-bitcoin-orange/20">
                  <Image
                    src="/bitcoin_svg.svg"
                    alt="Bitcoin Logo"
                    width={94}
                    height={96}
                    className="brightness-0 w-20 h-20 md:w-24 md:h-24"
                  />
                </div>
              </div>
              
              <div className="space-y-3">
                <h2 className="text-3xl md:text-4xl font-bold text-white">
                  Get in Touch
                </h2>
                <p className="text-gray-400 text-lg">
                  We&apos;re here to help with any questions about BitBasis
                </p>
              </div>
            </div>
          </div>

          {/* Right Panel - Contact Form */}
          <div className="flex items-center justify-center p-4 md:p-8 lg:p-12">
            <div className="w-full max-w-lg">
              <Card className="relative group overflow-hidden rounded-xl bg-gradient-to-br from-gray-800/20 via-gray-900/30 to-gray-800/20 border border-white/10">
                <div className="absolute inset-0 border-2 border-bitcoin-orange/20 rounded-xl opacity-50 blur-[0.5px]"></div>
                <CardHeader className="relative z-10">
                  <CardTitle className="text-2xl text-white">Send us a Message</CardTitle>
                  <CardDescription className="text-gray-400">
                    Have questions about BitBasis? We&#39;re here to help. Fill out the form below and we&#39;ll get back to you as soon as possible.
                  </CardDescription>
                </CardHeader>
                <CardContent className="relative z-10">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-white">Name</Label>
                      <Input
                        id="name"
                        name="name"
                        placeholder="Your name"
                        required
                        className="bg-gray-800/40 border-white/10 text-white placeholder:text-gray-500 focus:border-bitcoin-orange/50 focus:ring-bitcoin-orange/50"
                        disabled={isSubmitting}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-white">Email</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="your@email.com"
                        required
                        className="bg-gray-800/40 border-white/10 text-white placeholder:text-gray-500 focus:border-bitcoin-orange/50 focus:ring-bitcoin-orange/50"
                        disabled={isSubmitting}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subject" className="text-white">Subject</Label>
                      <Input
                        id="subject"
                        name="subject"
                        placeholder="What is this regarding?"
                        required
                        className="bg-gray-800/40 border-white/10 text-white placeholder:text-gray-500 focus:border-bitcoin-orange/50 focus:ring-bitcoin-orange/50"
                        disabled={isSubmitting}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message" className="text-white">Message</Label>
                      <Textarea
                        id="message"
                        name="message"
                        placeholder="Your message..."
                        required
                        className="min-h-[150px] bg-gray-800/40 border-white/10 text-white placeholder:text-gray-500 focus:border-bitcoin-orange/50 focus:ring-bitcoin-orange/50"
                        disabled={isSubmitting}
                      />
                    </div>

                    {/* SEC-006: Turnstile CAPTCHA */}
                    <div className="flex justify-center">
                      <Turnstile
                        ref={turnstileRef}
                        siteKey={process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY || "1x00000000000000000000AA"}
                        onSuccess={(token) => setCaptchaToken(token)}
                        onError={() => {
                          toast({
                            title: "CAPTCHA Error",
                            description: "CAPTCHA validation failed. Please try again.",
                            variant: "destructive",
                          })
                          setCaptchaToken(null)
                        }}
                        onExpire={() => {
                          setCaptchaToken(null)
                          toast({
                            title: "CAPTCHA Expired",
                            description: "Please complete the CAPTCHA again",
                            variant: "default",
                          })
                        }}
                        options={{
                          theme: "dark",
                        }}
                      />
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full relative overflow-hidden bg-gradient-to-r from-bitcoin-orange to-[#D4A76A] text-white font-semibold shadow-lg hover:shadow-bitcoin-orange/30 transform hover:-translate-y-px transition-all duration-300 group"
                      disabled={isSubmitting || !captchaToken}
                    >
                      <span className="relative z-10">{isSubmitting ? "Sending..." : "Send Message"}</span>
                      <span className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 group-active:opacity-20 transition-opacity duration-300"></span>
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
} 