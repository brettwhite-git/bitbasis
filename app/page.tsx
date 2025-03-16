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
            <Link href="/dashboard">
              <Button variant="ghost" className="text-white">
                Login
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button className="bg-bitcoin-orange hover:bg-bitcoin-dark text-white">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <section className="py-20 md:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center gap-4 text-center">
              <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl text-white">
                Track Your <span className="text-bitcoin-orange">Bitcoin</span> Cost Basis
              </h1>
              <p className="max-w-[700px] text-muted-foreground md:text-xl">
                Simplify your Bitcoin accounting with our privacy-focused cost basis tracker. No exchange integrations,
                no data selling.
              </p>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                <Link href="/dashboard">
                  <Button className="bg-bitcoin-orange hover:bg-bitcoin-dark text-white">
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button
                    variant="outline"
                    className="border-bitcoin-orange text-bitcoin-orange hover:bg-bitcoin-orange/10"
                  >
                    View Demo
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
        <section className="py-12 md:py-24 bg-secondary/50">
          <div className="container px-4 md:px-6">
            <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-3">
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-bitcoin-orange/10">
                  <Shield className="h-8 w-8 text-bitcoin-orange" />
                </div>
                <h3 className="text-xl font-bold text-white">Privacy First</h3>
                <p className="text-muted-foreground">No exchange integrations. Your data stays with you.</p>
              </div>
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-bitcoin-orange/10">
                  <Lock className="h-8 w-8 text-bitcoin-orange" />
                </div>
                <h3 className="text-xl font-bold text-white">Secure Storage</h3>
                <p className="text-muted-foreground">End-to-end encryption for all your transaction data.</p>
              </div>
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-bitcoin-orange/10">
                  <TrendingUp className="h-8 w-8 text-bitcoin-orange" />
                </div>
                <h3 className="text-xl font-bold text-white">Accurate Calculations</h3>
                <p className="text-muted-foreground">FIFO, LIFO, and average cost methods for tax optimization.</p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t border-border/40 bg-background py-6">
        <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
          <Logo />
          <p className="text-sm text-muted-foreground">© 2024 BitBasis. All rights reserved.</p>
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

