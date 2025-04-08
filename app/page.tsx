import { Button } from "@/components/ui/button"
import { Logo } from "@/components/logo"
import Link from "next/link"
import { ArrowRight, Shield, Lock, TrendingUp } from "lucide-react"
import HeroChart from "@/components/landing/HeroChart"

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#171923] text-gray-300">
      <div className="fixed inset-0 bg-gradient-to-br from-blue-500/5 via-blue-400/3 to-transparent" />
      <div className="fixed inset-0 bg-gradient-to-b from-blue-500/2 via-blue-400/3 to-blue-500/2" />
      <div className="fixed inset-0 bg-gradient-to-r from-blue-500/3 via-transparent to-blue-500/3" />
      
      <header className="border-b border-blue-500/20 bg-[#171923]/95 backdrop-blur supports-[backdrop-filter]:bg-[#171923]/60 sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <Logo />
          <nav className="hidden md:flex items-center gap-8 text-sm">
            <Link href="/" className="text-white font-medium">Home</Link>
            <Link href="/features" className="text-gray-400 hover:text-white">Features</Link>
            <Link href="/pricing" className="text-gray-400 hover:text-white">Pricing</Link>
            <Link href="/about" className="text-gray-400 hover:text-white">About</Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/auth/sign-in">
              <Button variant="ghost" className="text-gray-300 hover:text-white">
                Log in
              </Button>
            </Link>
            <Link href="/auth/sign-up">
              <Button className="bg-bitcoin-orange hover:bg-bitcoin-dark text-white font-semibold">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 relative">
        <section className="relative overflow-hidden">
          <div className="container mx-auto py-16 md:py-20 lg:py-24 relative">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
              <div className="flex flex-col space-y-8 lg:col-span-5">
                <div className="inline-block w-fit rounded-full bg-bitcoin-orange/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-bitcoin-orange border border-bitcoin-orange/30">
                  Smart Portfolio Management
                </div>
                
                <div className="space-y-2">
                  <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white">
                    Track Your Investments
                  </h1>
                  <h2 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-[#D4A76A]">
                    All In One Place
                  </h2>
                </div>
                
                <p className="text-lg leading-relaxed text-gray-400 max-w-xl">
                  Take control of your financial future with real-time portfolio tracking, advanced 
                  analytics, and personalized insights to maximize your returns.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link href="/auth/sign-up">
                    <Button size="lg" className="w-full sm:w-auto bg-bitcoin-orange hover:bg-bitcoin-dark text-white font-semibold px-8 py-3">
                      Start Tracking Free
                    </Button>
                  </Link>
                  <Button size="lg" variant="outline" className="w-full sm:w-auto text-gray-300 border-gray-700 hover:bg-gray-800 hover:text-white px-8 py-3">
                    View Demo
                  </Button>
                </div>
                
                <div className="flex items-center gap-3 pt-4">
                  <div className="flex -space-x-2">
                    <span className="h-7 w-7 rounded-full bg-blue-500 ring-2 ring-[#171923]"></span>
                    <span className="h-7 w-7 rounded-full bg-green-500 ring-2 ring-[#171923]"></span>
                    <span className="h-7 w-7 rounded-full bg-yellow-500 ring-2 ring-[#171923]"></span>
                    <span className="h-7 w-7 rounded-full bg-purple-500 ring-2 ring-[#171923]"></span>
                  </div>
                  <span className="text-sm text-gray-400">
                    Trusted by <span className="font-semibold text-white">10,000+</span> investors
                  </span>
                </div>
              </div>
              
              <div className="w-full h-full lg:col-span-7 lg:min-h-[600px] flex items-center justify-center">
                <div className="w-full max-w-3xl">
                  <HeroChart />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="container space-y-6 py-16 mb-16">
          <h2 className="text-center text-3xl font-bold text-white mb-10">Why Choose BitBasis?</h2>
          <div className="mx-auto grid justify-center gap-6 sm:grid-cols-2 md:max-w-[64rem] md:grid-cols-3">
            <div className="relative overflow-hidden rounded-lg border border-gray-800/50 bg-gray-800/40 p-2 shadow-lg hover:shadow-bitcoin-orange/10 transition-shadow duration-300">
              <div className="flex h-[280px] flex-col justify-between rounded-md p-6">
                <Shield className="h-16 w-16 text-bitcoin-orange" />
                <div className="space-y-3">
                  <h3 className="font-bold text-xl text-white">Privacy First</h3>
                  <p className="text-gray-400">
                    Your data stays private. No exchange integrations or API keys required.
                  </p>
                </div>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-lg border border-gray-800/50 bg-gray-800/40 p-2 shadow-lg hover:shadow-bitcoin-orange/10 transition-shadow duration-300">
              <div className="flex h-[280px] flex-col justify-between rounded-md p-6">
                <TrendingUp className="h-16 w-16 text-bitcoin-orange" />
                <div className="space-y-3">
                  <h3 className="font-bold text-xl text-white">Accurate Tracking</h3>
                  <p className="text-gray-400">
                    Calculate your cost basis and track your portfolio performance over time.
                  </p>
                </div>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-lg border border-gray-800/50 bg-gray-800/40 p-2 shadow-lg hover:shadow-bitcoin-orange/10 transition-shadow duration-300">
              <div className="flex h-[280px] flex-col justify-between rounded-md p-6">
                <Lock className="h-16 w-16 text-bitcoin-orange" />
                <div className="space-y-3">
                  <h3 className="font-bold text-xl text-white">Secure & Simple</h3>
                  <p className="text-gray-400">
                    Easy to use interface with enterprise-grade security.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t border-blue-500/20 bg-[#171923] py-6">
        <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
          <Logo />
          <p className="text-sm text-gray-500">© 2025 BitBasis. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/privacy" className="text-sm text-gray-500 hover:text-white">
              Privacy
            </Link>
            <Link href="/terms" className="text-sm text-gray-500 hover:text-white">
              Terms
            </Link>
            <Link href="/contact" className="text-sm text-gray-500 hover:text-white">
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

