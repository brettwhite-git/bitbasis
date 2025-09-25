import Image from 'next/image'

export function TestimonialsSection() {
  return (
    <section className="py-16 md:py-24 relative">
      <div className="absolute inset-0 bg-[#171923]/0 z-[-1]"></div>
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-white mb-16">What Our Users Say</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {/* Testimonial 1 */}
          <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/60 border border-white/10 rounded-xl p-8 shadow-lg">
            <div className="flex items-center mb-4">
              <img className="h-12 w-12 rounded-full mr-4 ring-2 ring-bitcoin-orange/50" src="https://api.dicebear.com/9.x/adventurer/png?seed=Brian" alt="Alex R. avatar" width={48} height={48}/>
              <div>
                <p className="font-semibold text-white">Alex R.</p>
              </div>
            </div>
            <p className="text-gray-300 italic leading-relaxed">"Finally, a simple way to track my Bitcoin cost basis without giving up my privacy. BitBasis is exactly what I needed. The interface is clean and calculating my potential tax obligations is much less stressful now."</p>
          </div>
          {/* Testimonial 2 */}
          <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/60 border border-white/10 rounded-xl p-8 shadow-lg">
            <div className="flex items-center mb-4">
              <Image className="h-12 w-12 rounded-full mr-4 ring-2 ring-blue-500/50" src="https://api.dicebear.com/9.x/adventurer/png?seed=Vivian" alt="User avatar" width={48} height={48}/>
              <div>
                <p className="font-semibold text-white">Sarah K.</p>
              </div>
            </div>
            <p className="text-gray-300 italic leading-relaxed">"I was hesitant to use online portfolio trackers because of privacy concerns. BitBasis's focus on CSV imports and no exchange connections sold me. It's secure, easy to use, and respects user data."</p>
          </div>
          {/* Testimonial 3 */}
          <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/60 border border-white/10 rounded-xl p-8 shadow-lg">
            <div className="flex items-center mb-4">
              <Image className="h-12 w-12 rounded-full mr-4 ring-2 ring-amber-500/50" src="https://api.dicebear.com/9.x/adventurer/png?seed=Michael" alt="User avatar" width={48} height={48}/>
              <div>
                <p className="font-semibold text-white">Michael T.</p>
              </div>
            </div>
            <p className="text-gray-300 italic leading-relaxed">"The performance charts in BitBasis have changed how I view my bitcoin strategy. Being able to visualize my DCA approach over time has been incredibly valuable. This tool strikes the perfect balance between simplicity and depth."</p>
          </div>
        </div>
      </div>
    </section>
  )
} 