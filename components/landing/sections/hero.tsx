import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowRight, Lock } from "lucide-react"
import { DashboardImage } from "../dashboard-image"

export function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-24 md:pt-32 lg:pt-40 pb-8 md:pb-12 text-center">
      {/* Subtle background grid - position above animation but below content */}
      <div
        className="absolute inset-0 z-[1] opacity-[0.07]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
          backgroundSize: '20px 20px'
        }}
      />

      <div className="container mx-auto px-4 relative z-10">
        {/* Simple background accent that matches other sections */}

        <div className="max-w-3xl mx-auto">
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white leading-tight drop-shadow-sm animate-fade-in-up" style={{ animationDelay: '0s' }}>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-bitcoin-orange to-[#D4A76A]">Bitcoin</span> portfolio tracking designed for <span className="text-transparent bg-clip-text bg-gradient-to-r from-bitcoin-orange to-[#D4A76A]">hodlers</span>
            </h1>
          </div>

          <p className="mt-6 text-lg md:text-xl leading-relaxed text-gray-400 max-w-2xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            Source of truth for your Bitcoin portfolio while gaining valuable insights without connecting to exchanges.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10 px-8 sm:px-0 max-w-md sm:max-w-none mx-auto animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            <Link href="/auth/sign-up" className="w-full sm:w-auto">
              <Button size="lg" className="relative overflow-hidden w-full bg-gradient-to-r from-bitcoin-orange to-[#D4A76A] text-white font-semibold px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg shadow-lg hover:shadow-bitcoin-orange/30 transform hover:-translate-y-1 transition-all duration-300 group">
                 <Lock className="w-4 h-4 mr-2 relative z-10" />
                 <span className="relative z-10">Start tracking</span>
                 <span className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 group-active:opacity-20 transition-opacity duration-300"></span>
              </Button>
            </Link>
            <Link href="#features" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="group w-full text-gray-300 border-gray-700 hover:bg-gray-800/50 hover:text-white hover:border-gray-600 transform hover:-translate-y-1 transition-all duration-300 px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg">
                Learn how it works
                <ArrowRight className="w-4 h-4 ml-2 transition-transform duration-300 group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Dashboard Mockup */}
        <div className="mt-12 md:mt-16 lg:mt-20 relative animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
          <div className="relative mx-auto max-w-[95vw] sm:max-w-[90vw] lg:max-w-[1600px] xl:max-w-[2000px] px-4 sm:px-6 lg:px-8">
            {/* Gradient background glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-bitcoin-orange/20 via-transparent to-bitcoin-orange/20 blur-3xl opacity-30 -z-10"></div>

            {/* Main mockup container */}
            <div className="relative">
              {/* Enhanced border with gradient glow */}
              <div className="absolute inset-0 bg-gradient-to-r from-bitcoin-orange/50 via-gray-600/30 to-bitcoin-orange/50 rounded-xl blur-sm opacity-85"></div>

              {/* Gradient border that fades from top to bottom */}
              <div className="absolute inset-0 rounded-xl p-1 bg-gradient-to-b from-bitcoin-orange via-bitcoin-orange/40 to-transparent">
                <div className="h-full w-full bg-gray-900/80 rounded-[calc(0.75rem-4px)]"></div>
              </div>

              {/* Inner container with top and side borders only */}
              <div className="relative bg-gray-900/80 backdrop-blur-sm rounded-xl overflow-hidden shadow-2xl border-2 border-bitcoin-orange/50 border-b-0">
                {/* Top border accent */}
                <div className="h-px bg-gradient-to-r from-transparent via-bitcoin-orange/60 to-transparent"></div>

                {/* Optimized dashboard image with overlays */}
                <div className="relative">
                  <DashboardImage />

                  {/* Bottom fade gradient overlay */}
                  <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-gray-900 via-gray-900/70 to-transparent opacity-60"></div>

                  {/* Subtle inner glow */}
                  <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-bitcoin-orange/5 opacity-20"></div>
                </div>
              </div>
            </div>

            {/* Additional context text */}
            <div className="mt-8 text-center">

            </div>
          </div>
        </div>
      </div>
    </section>
  )
} 