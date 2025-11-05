
'use client'

import Image from "next/image"
import { useScrollAnimation } from "@/lib/utils/animations"

export function TestimonialsSection() {
  const titleRef = useScrollAnimation<HTMLHeadingElement>(0.1)
  const gridRef = useScrollAnimation<HTMLDivElement>(0.1)

  const testimonials = [
    {
      name: "Alex R.",
      avatar: "https://api.dicebear.com/9.x/adventurer/png?seed=Brian",
      ringColor: "ring-bitcoin-orange/50",
      quote: "Finally, a simple way to track my Bitcoin cost basis from across multiple exchanges and wallets. BitBasis is exactly what I needed. The interface is clean and calculating my potential tax obligations is much less stressful now."
    },
    {
      name: "Sarah K.",
      avatar: "https://api.dicebear.com/9.x/adventurer/png?seed=Vivian",
      ringColor: "ring-blue-500/50",
      quote: "BitBasis' user centric approach is refreshing and puts the user in control. I have a number of old exchange trades that I can now track and get accurate historical gains on my portfolio. I highly recommend it."
    },
    {
      name: "Michael T.",
      avatar: "https://api.dicebear.com/9.x/adventurer/png?seed=Michael",
      ringColor: "ring-amber-500/50",
      quote: "The performance charts in BitBasis have changed how I view my bitcoin strategy. Being able to visualize my DCA approach over time has been incredibly valuable. This tool strikes the perfect balance between simplicity and depth."
    }
  ]

  return (
    <section className="py-16 md:py-24 relative">
      <div className="absolute inset-0 bg-[#171923]/0 z-[-1]"></div>
      <div className="container mx-auto px-4">
        <h2 ref={titleRef} className="text-3xl md:text-4xl font-bold text-center text-white mb-16">
          What Our Users Say
        </h2>

        <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-gradient-to-br from-gray-800/50 to-gray-900/60 border border-white/10 rounded-xl p-8 shadow-lg"
            >
              <div className="flex items-center mb-4">
                <Image
                  className={`h-12 w-12 rounded-full mr-4 ring-2 ${testimonial.ringColor}`}
                  src={testimonial.avatar}
                  alt={`${testimonial.name} avatar`}
                  width={48}
                  height={48}
                  unoptimized
                />
                <div>
                  <p className="font-semibold text-white">{testimonial.name}</p>
                </div>
              </div>
              <p className="text-gray-300 italic leading-relaxed">
                &ldquo;{testimonial.quote}&rdquo;
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
} 