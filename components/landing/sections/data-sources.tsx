'use client'

import { useScrollAnimation } from "@/lib/utils/animations"

export function DataSourcesSection() {
  const contentRef = useScrollAnimation<HTMLDivElement>(0.1)

  return (
    <section className="py-16 md:py-24 relative">
      <div className="absolute inset-0 bg-[#171923]/0 z-[-1]"></div>
      <div ref={contentRef} className="container mx-auto px-4 text-center">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-6 sm:mb-8 px-4 sm:px-0">Works with Your Exchange Data</h2>
        <p className="text-base sm:text-lg text-gray-400 max-w-3xl mx-auto mb-8 sm:mb-12 px-4 sm:px-0 leading-relaxed">
          BitBasis processes standard CSV export files. Simply download your transaction history from your favorite exchange or wallet and upload it securely.
        </p>
        {/* Mobile responsive exchange logos */}
        <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-6 md:gap-8 lg:gap-12 filter grayscale opacity-60 px-4 sm:px-0">
          <span className="text-lg sm:text-xl md:text-2xl font-semibold whitespace-nowrap">River</span>
          <span className="text-lg sm:text-xl md:text-2xl font-semibold whitespace-nowrap">Kraken</span>
          <span className="text-lg sm:text-xl md:text-2xl font-semibold whitespace-nowrap">Coinbase</span>
          <span className="text-lg sm:text-xl md:text-2xl font-semibold whitespace-nowrap">Binance</span>
          <span className="text-lg sm:text-xl md:text-2xl font-semibold whitespace-nowrap">Trezor</span>
        </div>
      </div>
    </section>
  )
} 