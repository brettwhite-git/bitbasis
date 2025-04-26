import { Button } from "@/components/ui/button"
import Link from "next/link"
import { CheckCircle } from "lucide-react"

export function PricingSection() {
  return (
    <section id="pricing" className="py-16 md:py-24 relative">
      <div className="absolute inset-0 bg-[#171923]/0 z-[-1]"></div>
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-white mb-16">Simple, Transparent Pricing</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Tier */}
          <div className="relative group overflow-hidden rounded-xl bg-gradient-to-br from-gray-800/20 via-gray-900/30 to-gray-800/20 p-8 shadow-md transition-all duration-300">
            <h3 className="text-2xl font-semibold text-white mb-2">Free</h3>
            <p className="text-gray-400 mb-6">Get started with essential tracking features.</p>
            <p className="text-4xl font-bold text-white mb-6">$0 <span className="text-lg font-normal text-gray-400">/ month</span></p>
            <ul className="space-y-3 text-gray-300 mb-8">
              <li className="flex items-center"><CheckCircle className="w-5 h-5 mr-3 text-green-500" /> Up to 100 transactions</li>
              <li className="flex items-center"><CheckCircle className="w-5 h-5 mr-3 text-green-500" /> Basic Cost Basis (FIFO)</li>
              <li className="flex items-center"><CheckCircle className="w-5 h-5 mr-3 text-green-500" /> Portfolio Overview</li>
              <li className="flex items-center"><CheckCircle className="w-5 h-5 mr-3 text-green-500" /> Secure CSV Import</li>
            </ul>
            <Link href="/auth/sign-up">
              <Button size="lg" variant="outline" className="w-full text-gray-300 border-gray-700 hover:bg-gray-800/50 hover:text-white hover:border-gray-600 transition-all duration-300">
                Get Started for Free
              </Button>
            </Link>
          </div>
          {/* Pro Tier */}
          <div className="relative group overflow-hidden rounded-xl bg-gradient-to-br from-gray-800/30 via-[#171923]/50 to-gray-800/30 p-8 shadow-xl shadow-bitcoin-orange/5 transition-all duration-300 transform scale-105">
            <div className="absolute inset-0 border-2 border-bitcoin-orange/30 rounded-xl opacity-50 blur-[0.5px]"></div>
            <div className="absolute top-0 right-0 bg-bitcoin-orange text-black text-xs font-bold px-3 py-1 rounded-bl-lg">Most Popular</div>
            <h3 className="text-2xl font-semibold text-white mb-2">Pro</h3>
            <p className="text-gray-400 mb-6">Unlock advanced features and unlimited tracking.</p>
            <p className="text-4xl font-bold text-white mb-6">$9 <span className="text-lg font-normal text-gray-400">/ month</span></p>
            <ul className="space-y-3 text-gray-300 mb-8">
              <li className="flex items-center"><CheckCircle className="w-5 h-5 mr-3 text-bitcoin-orange" /> Unlimited transactions</li>
              <li className="flex items-center"><CheckCircle className="w-5 h-5 mr-3 text-bitcoin-orange" /> Advanced Cost Basis (FIFO, LIFO, HIFO - soon)</li>
              <li className="flex items-center"><CheckCircle className="w-5 h-5 mr-3 text-bitcoin-orange" /> Detailed Performance Analytics</li>
              <li className="flex items-center"><CheckCircle className="w-5 h-5 mr-3 text-bitcoin-orange" /> Tax Lot Identification (soon)</li>
              <li className="flex items-center"><CheckCircle className="w-5 h-5 mr-3 text-bitcoin-orange" /> Priority Support</li>
            </ul>
            <Link href="/auth/sign-up?plan=pro">
              <Button size="lg" className="w-full relative overflow-hidden bg-gradient-to-r from-bitcoin-orange to-[#D4A76A] text-white font-semibold shadow-lg hover:shadow-bitcoin-orange/30 transform hover:-translate-y-px transition-all duration-300 group">
                <span className="relative z-10">Go Pro</span>
                <span className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 group-active:opacity-20 transition-opacity duration-300"></span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
} 