export function DataSourcesSection() {
  return (
    <section className="py-16 md:py-24 relative">
      <div className="absolute inset-0 bg-[#171923]/0 z-[-1]"></div>
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-8">Works with Your Exchange Data</h2>
        <p className="text-lg text-gray-400 max-w-3xl mx-auto mb-12">
          BitBasis processes standard CSV export files. Simply download your transaction history from your favorite exchange or wallet and upload it securely.
        </p>
        {/* Placeholder for exchange logos - requires actual logo assets */}
        <div className="flex justify-center items-center gap-8 md:gap-12 filter grayscale opacity-60">
          <span className="text-2xl font-semibold">Coinbase</span>
          <span className="text-2xl font-semibold">Binance</span>
          <span className="text-2xl font-semibold">Kraken</span>
          <span className="text-2xl font-semibold">Ledger</span>
          <span className="text-2xl font-semibold">Trezor</span>
        </div>
        <p className="mt-8 text-sm text-gray-500">(And many more...)</p>
      </div>
    </section>
  )
} 