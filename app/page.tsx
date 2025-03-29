import { Button } from "@/components/ui/button"
import { Logo } from "@/components/logo"
import Link from "next/link"
import { ArrowRight, Shield, Lock, TrendingUp } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Logo />
          <div className="flex items-center gap-4">
            <Link href="/auth/sign-in">
              <Button variant="ghost" className="text-white">
                Login
              </Button>
            </Link>
            <Link href="/auth/sign-up">
              <Button className="bg-bitcoin-orange hover:bg-bitcoin-dark text-white">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="space-y-6 pb-4 pt-6 md:pb-8 md:pt-10 lg:py-24">
          <div className="container flex max-w-[64rem] flex-col items-center gap-4 text-center">
            <h1 className="text-4xl font-bold tracking-tighter text-white sm:text-5xl md:text-6xl lg:text-7xl">
              Track Your Bitcoin Portfolio with Privacy & Precision
            </h1>
            <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
              Calculate your Bitcoin cost basis, track your portfolio performance, and manage your transactions
              with complete privacy. No exchange integrations required.
            </p>
            <div className="space-x-4">
              <Link href="/auth/sign-up">
                <Button className="bg-bitcoin-orange hover:bg-bitcoin-dark text-white">
                  Get Started <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="container space-y-6 py-4 md:py-8 lg:py-16">
          <div className="mx-auto grid justify-center gap-6 sm:grid-cols-2 md:max-w-[64rem] md:grid-cols-3">
            <div className="relative overflow-hidden rounded-lg border bg-background p-3">
              <div className="flex h-[280px] flex-col justify-between rounded-md p-8">
                <Shield className="h-16 w-16 text-bitcoin-orange" />
                <div className="space-y-3">
                  <h3 className="font-bold text-xl text-white">Privacy First</h3>
                  <p className="text-muted-foreground">
                    Your data stays private. No exchange integrations or API keys required.
                  </p>
                </div>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-lg border bg-background p-3">
              <div className="flex h-[280px] flex-col justify-between rounded-md p-8">
                <TrendingUp className="h-16 w-16 text-bitcoin-orange" />
                <div className="space-y-3">
                  <h3 className="font-bold text-xl text-white">Accurate Tracking</h3>
                  <p className="text-muted-foreground">
                    Calculate your cost basis and track your portfolio performance over time.
                  </p>
                </div>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-lg border bg-background p-3">
              <div className="flex h-[280px] flex-col justify-between rounded-md p-8">
                <Lock className="h-16 w-16 text-bitcoin-orange" />
                <div className="space-y-3">
                  <h3 className="font-bold text-xl text-white">Secure & Simple</h3>
                  <p className="text-muted-foreground">
                    Easy to use interface with enterprise-grade security.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t border-border/40 bg-background py-6">
        <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
          <Logo />
          <p className="text-sm text-muted-foreground">© 2025 BitBasis. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/privacy" className="text-sm text-muted-foreground hover:text-white">
              Privacy
            </Link>
            <Link href="/terms" className="text-sm text-muted-foreground hover:text-white">
              Terms
            </Link>
            <Link href="/contact" className="text-sm text-muted-foreground hover:text-white">
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

