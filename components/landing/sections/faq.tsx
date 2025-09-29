'use client'

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { useScrollAnimation } from "@/lib/utils/animations"

export function FAQSection() {
  const titleRef = useScrollAnimation<HTMLHeadingElement>(0.1)
  const accordionRef = useScrollAnimation<HTMLDivElement>(0.1)

  return (
    <section id="faq" className="py-16 md:py-24 relative">
      <div className="absolute inset-0 bg-[#171923]/0 z-[-1]"></div>
      <div className="container mx-auto px-4">
        <h2 ref={titleRef} className="text-3xl md:text-4xl font-bold text-center text-white mb-16">Frequently Asked Questions</h2>
        <div ref={accordionRef} className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="w-full space-y-5">
            <AccordionItem value="item-1" className="bg-gray-800/20 rounded-lg px-6 transition-colors hover:bg-gray-800/30 shadow-sm">
              <AccordionTrigger className="text-left font-medium text-white hover:no-underline py-4">Is my data secure and private?</AccordionTrigger>
              <AccordionContent className="text-gray-400 pb-4 pt-2 text-sm leading-relaxed">
                Absolutely. Privacy is our top priority. We don&apos;t require API keys or direct connections to your exchanges. All data is handled via secure CSV uploads and stored either locally in your browser or encrypted in our secure database using Supabase. We never sell or share your data.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2" className="bg-gray-800/20 rounded-lg px-6 transition-colors hover:bg-gray-800/30 shadow-sm">
              <AccordionTrigger className="text-left font-medium text-white hover:no-underline py-4">Which exchanges/wallets are supported?</AccordionTrigger>
              <AccordionContent className="text-gray-400 pb-4 pt-2 text-sm leading-relaxed">
                BitBasis is designed to work with standard CSV transaction history exports from most major platforms, including River, Kraken, Coinbase, Binance, Trezor, and many others. If your platform provides a CSV export, it should be compatible.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3" className="bg-gray-800/20 rounded-lg px-6 transition-colors hover:bg-gray-800/30 shadow-sm">
              <AccordionTrigger className="text-left font-medium text-white hover:no-underline py-4">How is the cost basis calculated?</AccordionTrigger>
              <AccordionContent className="text-gray-400 pb-4 pt-2 text-sm leading-relaxed">
                Currently, we show users the FIFO (First-In, First-Out) method, LIFO (Last-In, First-Out) and HIFO (Highest-In, First-Out) options in order to provide more flexibility for tax optimization strategies. BitBasis is not a tax calculator, but a tool to help you organize and calculate your transaction data for potential tax reporting purposes. We strongly recommend consulting with a qualified tax professional regarding your specific situation.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-4" className="bg-gray-800/20 rounded-lg px-6 transition-colors hover:bg-gray-800/30 shadow-sm">
              <AccordionTrigger className="text-left font-medium text-white hover:no-underline py-4">Do you offer tax advice?</AccordionTrigger>
              <AccordionContent className="text-gray-400 pb-4 pt-2 text-sm leading-relaxed">
                No. BitBasis is a tool to help you organize and calculate your transaction data for potential tax reporting purposes. It does not provide financial or tax advice. We strongly recommend consulting with a qualified tax professional regarding your specific situation.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </section>
  )
} 