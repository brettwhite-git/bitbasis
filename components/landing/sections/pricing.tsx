'use client'

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { CheckCircle } from "lucide-react"
import { useScrollAnimation } from "@/lib/utils/animations"

export function PricingSection() {
  const titleRef = useScrollAnimation<HTMLHeadingElement>(0.1)
  const gridRef = useScrollAnimation<HTMLDivElement>(0.1)
  const pricingTiers = [
    {
      name: "Free",
      description: "Get started with essential tracking features.",
      price: "$0",
      priceLabel: "/ month",
      features: [
        "Up to 50 transactions",
        "Portfolio Overview",
        "CSV Import"
      ],
      ctaText: "Get Started for Free",
      ctaHref: "/auth/sign-up",
      buttonVariant: "outline" as const,
      bgGradient: "from-gray-800/20 via-gray-900/30 to-gray-800/20",
      borderColor: "border-gray-700/50",
      buttonClasses: "text-gray-300 border-gray-700 hover:bg-gray-800/50 hover:text-white hover:border-gray-600",
      featureIconColor: "text-green-500"
    },
    {
      name: "Pro",
      description: "Unlock advanced features and unlimited tracking.",
      price: "$4.99",
      priceLabel: "/ month",
      badge: "Most Popular",
      features: [
        "Unlimited transactions",
        "Cost Basis (FIFO, LIFO, HIFO)",
        "Detailed Performance Analytics",
        "Tax Lot Identification"
      ],
      ctaText: "Go Pro",
      ctaHref: "/auth/sign-up?plan=pro",
      buttonVariant: "default" as const,
      bgGradient: "from-gray-800/30 via-[#171923]/50 to-gray-800/30",
      borderColor: "border-bitcoin-orange/30",
      buttonClasses: "relative overflow-hidden bg-gradient-to-r from-bitcoin-orange to-[#D4A76A] text-white font-semibold shadow-lg hover:shadow-bitcoin-orange/30 transform hover:-translate-y-px group",
      featureIconColor: "text-bitcoin-orange",
      scale: true
    },
    {
      name: "Lifetime",
      description: "One-time payment for lifetime access.",
      price: "$210",
      priceLabel: "/ one-time",
      badge: "Best Value",
      features: [
        "Everything in Pro plan",
        "Lifetime Access",
        "Future Premium Features",
        "VIP Support"
      ],
      ctaText: "Get Lifetime Access",
      ctaHref: "/auth/sign-up?plan=lifetime",
      buttonVariant: "default" as const,
      bgGradient: "from-gray-800/40 via-[#171923]/60 to-gray-800/40",
      borderColor: "border-bitcoin-orange/40",
      buttonClasses: "relative overflow-hidden bg-gradient-to-r from-[#D4A76A] to-bitcoin-orange text-white font-semibold shadow-lg hover:shadow-bitcoin-orange/40 transform hover:-translate-y-px group",
      featureIconColor: "text-bitcoin-orange"
    }
  ]

  return (
    <section id="pricing" className="py-16 md:py-24 relative">
      <div className="absolute inset-0 bg-[#171923]/0 z-[-1]"></div>
      <div className="container mx-auto px-4">
        <h2 ref={titleRef} className="text-3xl md:text-4xl font-bold text-center text-white mb-16">
          Simple, Transparent Pricing
        </h2>

        <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {pricingTiers.map((tier, index) => (
            <div
              key={index}
              className={`relative group overflow-hidden rounded-xl bg-gradient-to-br ${tier.bgGradient} p-8 shadow-md transition-all duration-300 ${tier.scale ? 'md:scale-105' : ''}`}
            >
              <div className={`absolute inset-0 border-2 ${tier.borderColor} rounded-xl opacity-70 blur-[0.5px] pointer-events-none`}></div>

              {tier.badge && (
                <div className={`absolute top-0 right-0 bg-${tier.badge === 'Most Popular' ? 'bitcoin-orange' : 'gradient-to-r from-bitcoin-orange to-[#D4A76A]'} text-black text-xs font-bold px-3 py-1 rounded-bl-lg`}>
                  {tier.badge}
                </div>
              )}

              <h3 className="text-2xl font-semibold text-white mb-2">{tier.name}</h3>
              <p className="text-gray-400 mb-6">{tier.description}</p>
              <p className="text-4xl font-bold text-white mb-6">
                {tier.price}
                <span className={`text-lg font-normal ${tier.priceLabel === 'one-time' ? 'text-bitcoin-orange' : 'text-gray-400'}`}>
                  {tier.priceLabel}
                </span>
              </p>

              <ul className="space-y-3 text-gray-300 mb-8">
                {tier.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-center">
                    <CheckCircle className={`w-5 h-5 mr-3 ${tier.featureIconColor}`} />
                    {feature}
                  </li>
                ))}
              </ul>

              <Link href={tier.ctaHref}>
                <Button
                  size="lg"
                  variant={tier.buttonVariant}
                  className={`w-full transition-all duration-300 ${tier.buttonClasses}`}
                >
                  {tier.ctaText}
                  {tier.buttonVariant === "default" && (
                    <span className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 group-active:opacity-20 transition-opacity duration-300"></span>
                  )}
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
} 