import { UploadCloud, BarChart, TrendingUp, Shield, Lock, Percent } from "lucide-react"

export function FeaturesSection() {
  return (
    <section id="features" className="py-16 md:py-24 relative">
      <div className="absolute inset-0 bg-[#171923]/0 z-[-1]"></div>
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-white mb-16">Features You&rsquo;ll Love</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {[ 
            { icon: UploadCloud, title: "Simple CSV Upload", description: "Easily import your transaction history from popular exchanges and wallets via CSV. No API keys needed.", color: "text-bitcoin-orange" },
            { icon: BarChart, title: "Cost Basis Calculation", description: "Accurately calculate your Bitcoin cost basis using FIFO, LIFO, or HIFO methods.", color: "text-bitcoin-orange" },
            { icon: TrendingUp, title: "Performance Tracking", description: "Visualize your portfolio growth, unrealized gains, ROI, and other key metrics over time.", color: "text-bitcoin-orange" },
            { icon: Shield, title: "Privacy Focused", description: "Your data stays in secure cloud storage. We don&rsquo;t track or sell your financial information.", color: "text-bitcoin-orange" },
            { icon: Lock, title: "Secure Storage", description: "Built on Supabase with robust security measures, including encryption at rest and Row Level Security.", color: "text-bitcoin-orange" },
            { icon: Percent, title: "Tax Lot Identification", description: "Track individual Bitcoin purchase lots to optimize for short-term vs. long-term capital gains.", color: "text-bitcoin-orange" },
          ].map((feature, index) => (
            <div key={index} className="group relative bg-gray-800/40 border border-white/10 rounded-xl p-6 transition-all duration-300 hover:bg-gray-800/60 hover:border-white/20">
              <div className={`absolute top-4 right-4 text-4xl opacity-10 group-hover:opacity-20 transition-opacity duration-300 ${feature.color}`}><feature.icon strokeWidth={1.5} /></div>
              <feature.icon className={`h-8 w-8 mb-4 ${feature.color}`} strokeWidth={1.5} />
              <h3 className="font-semibold text-lg text-white mb-2">{feature.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
} 