import { Shield, TrendingUp, Lock, CircleChevronRight } from "lucide-react"

export function BenefitsSection() {
  return (
    <section id="benefits" className="py-16 md:py-24 relative">
      <div className="absolute inset-0 bg-[#171923]/0 z-[-1]"></div>
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-white mb-16">What You Gain with BitBasis</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {/* Benefit Card 1 */}
          <div className="relative group overflow-hidden rounded-xl bg-gradient-to-br from-gray-800/20 via-gray-900/30 to-gray-800/20 p-6 shadow-md backdrop-blur-sm transition-all duration-300 hover:shadow-bitcoin-orange/10 hover:bg-gradient-to-br hover:from-gray-800/25 hover:via-gray-900/35 hover:to-gray-800/25 transform hover:-translate-y-2">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-bitcoin-orange/[0.07] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative z-10 flex flex-col h-full">
              <Shield className="h-12 w-12 mb-6 text-bitcoin-orange" />
              <h3 className="font-bold text-xl text-white mb-3">Data Minimalism</h3>
              <ul className="text-gray-400 text-sm leading-relaxed flex-grow space-y-2">
                <li className="flex items-start">
                  <CircleChevronRight className="h-5 w-5 mr-2 text-bitcoin-orange shrink-0 mt-0.5" />
                  <span>No API keys required from exchanges</span>
                </li>
                <li className="flex items-start">
                  <CircleChevronRight className="h-5 w-5 mr-2 text-bitcoin-orange shrink-0 mt-0.5" />
                  <span>No exchange integrations to risk your data</span>
                </li>
                <li className="flex items-start">
                  <CircleChevronRight className="h-5 w-5 mr-2 text-bitcoin-orange shrink-0 mt-0.5" />
                  <span>Simple CSV imports keep your data private</span>
                </li>
              </ul>
            </div>
          </div>
          {/* Benefit Card 2 */}
           <div className="relative group overflow-hidden rounded-xl bg-gradient-to-br from-gray-800/20 via-gray-900/30 to-gray-800/20 p-6 shadow-md backdrop-blur-sm transition-all duration-300 hover:shadow-bitcoin-orange/10 hover:bg-gradient-to-br hover:from-gray-800/25 hover:via-gray-900/35 hover:to-gray-800/25 transform hover:-translate-y-2">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-bitcoin-orange/[0.07] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative z-10 flex flex-col h-full">
              <TrendingUp className="h-12 w-12 mb-6 text-bitcoin-orange" />
              <h3 className="font-bold text-xl text-white mb-3">For All Levels</h3>
              <ul className="text-gray-400 text-sm leading-relaxed flex-grow space-y-2">
                <li className="flex items-start">
                  <CircleChevronRight className="h-5 w-5 mr-2 text-bitcoin-orange shrink-0 mt-0.5" />
                  <span>Intuitive interface for beginners</span>
                </li>
                <li className="flex items-start">
                  <CircleChevronRight className="h-5 w-5 mr-2 text-bitcoin-orange shrink-0 mt-0.5" />
                  <span>Track cost basis and performance easily</span>
                </li>
                <li className="flex items-start">
                  <CircleChevronRight className="h-5 w-5 mr-2 text-bitcoin-orange shrink-0 mt-0.5" />
                  <span>Advanced metrics for experienced investors</span>
                </li>
              </ul>
            </div>
          </div>
          {/* Benefit Card 3 */}
          <div className="relative group overflow-hidden rounded-xl bg-gradient-to-br from-gray-800/20 via-gray-900/30 to-gray-800/20 p-6 shadow-md backdrop-blur-sm transition-all duration-300 hover:shadow-bitcoin-orange/10 hover:bg-gradient-to-br hover:from-gray-800/25 hover:via-gray-900/35 hover:to-gray-800/25 transform hover:-translate-y-2">
             <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-bitcoin-orange/[0.07] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
             <div className="relative z-10 flex flex-col h-full">
              <Lock className="h-12 w-12 mb-6 text-bitcoin-orange" />
              <h3 className="font-bold text-xl text-white mb-3">Secure Foundation</h3>
              <ul className="text-gray-400 text-sm leading-relaxed flex-grow space-y-2">
                <li className="flex items-start">
                  <CircleChevronRight className="h-5 w-5 mr-2 text-bitcoin-orange shrink-0 mt-0.5" />
                  <span>Built on Supabase's secure infrastructure</span>
                </li>
                <li className="flex items-start">
                  <CircleChevronRight className="h-5 w-5 mr-2 text-bitcoin-orange shrink-0 mt-0.5" />
                  <span>Encrypted connections protect your data</span>
                </li>
                <li className="flex items-start">
                  <CircleChevronRight className="h-5 w-5 mr-2 text-bitcoin-orange shrink-0 mt-0.5" />
                  <span>Your data remains under your control</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
} 