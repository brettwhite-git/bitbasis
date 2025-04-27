import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowRight, Lock } from "lucide-react"

export function HeroSection() {
  return (
    <section className="relative overflow-hidden py-24 md:py-32 lg:py-40 text-center">
      {/* Optional: Add subtle background grid */}
      <div className="absolute inset-0 z-[-1] opacity-[0.07]" style={{backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '20px 20px'}}></div>

      <div className="container mx-auto px-4 relative">
        {/* Simple background accent that matches other sections */}
        <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-bitcoin-orange/[0.04] rounded-full filter blur-[100px]" />
        <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-blue-500/[0.02] rounded-full filter blur-[100px]" />

        <div className="max-w-3xl mx-auto animate-fade-in-up duration-500">
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white leading-tight">
              Privacy focused cost basis tracking for <span className="text-transparent bg-clip-text bg-gradient-to-r from-bitcoin-orange to-[#D4A76A]">long-term Bitcoin holders</span>
            </h1>
          </div>
          
          <p className="mt-6 text-lg md:text-xl leading-relaxed text-gray-400 max-w-2xl mx-auto">
            Keep your investment data private while gaining valuable insights without connecting to exchanges.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
            <Link href="/auth/sign-up">
              <Button size="lg" className="relative overflow-hidden w-full sm:w-auto bg-gradient-to-r from-bitcoin-orange to-[#D4A76A] text-white font-semibold px-8 py-3 shadow-lg hover:shadow-bitcoin-orange/30 transform hover:-translate-y-1 transition-all duration-300 group">
                 <Lock className="w-4 h-4 mr-2 relative z-10" />
                 <span className="relative z-10">Start tracking privately</span>
                 <span className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 group-active:opacity-20 transition-opacity duration-300"></span>
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="group w-full sm:w-auto text-gray-300 border-gray-700 hover:bg-gray-800/50 hover:text-white hover:border-gray-600 transform hover:-translate-y-1 transition-all duration-300 px-8 py-3">
              Learn how it works
              <ArrowRight className="w-4 h-4 ml-2 transition-transform duration-300 group-hover:translate-x-1" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
} 