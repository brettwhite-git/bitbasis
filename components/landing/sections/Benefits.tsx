import { Shield, TrendingUp, Lock } from "lucide-react"

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
              <p className="text-gray-400 text-sm leading-relaxed flex-grow">
                We collect only what's necessary. No API keys, no exchange integrations, no personal details beyond basic authentication. Track your investments with simple CSV imports.
              </p>
            </div>
          </div>
          {/* Benefit Card 2 */}
           <div className="relative group overflow-hidden rounded-xl bg-gradient-to-br from-gray-800/20 via-gray-900/30 to-gray-800/20 p-6 shadow-md backdrop-blur-sm transition-all duration-300 hover:shadow-blue-500/10 hover:bg-gradient-to-br hover:from-gray-800/25 hover:via-gray-900/35 hover:to-gray-800/25 transform hover:-translate-y-2">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-500/[0.07] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative z-10 flex flex-col h-full">
              <TrendingUp className="h-12 w-12 mb-6 text-blue-400" />
              <h3 className="font-bold text-xl text-white mb-3">For All Levels</h3>
              <p className="text-gray-400 text-sm leading-relaxed flex-grow">
                Whether you're new to Bitcoin or an experienced investor, our platform makes complex metrics simple. Track cost basis, gains, and performance in an intuitive interface.
              </p>
            </div>
          </div>
          {/* Benefit Card 3 */}
          <div className="relative group overflow-hidden rounded-xl bg-gradient-to-br from-gray-800/20 via-gray-900/30 to-gray-800/20 p-6 shadow-md backdrop-blur-sm transition-all duration-300 hover:shadow-purple-500/10 hover:bg-gradient-to-br hover:from-gray-800/25 hover:via-gray-900/35 hover:to-gray-800/25 transform hover:-translate-y-2">
             <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-purple-500/[0.07] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
             <div className="relative z-10 flex flex-col h-full">
              <Lock className="h-12 w-12 mb-6 text-purple-400" />
              <h3 className="font-bold text-xl text-white mb-3">Secure Foundation</h3>
              <p className="text-gray-400 text-sm leading-relaxed flex-grow">
                Built on Supabase's secure infrastructure with encrypted connections and protected database access. Your data remains under your control with transparent storage practices.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
} 