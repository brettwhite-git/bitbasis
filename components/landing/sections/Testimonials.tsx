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
              <img className="h-12 w-12 rounded-full mr-4 ring-2 ring-bitcoin-orange/50" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="User avatar"/>
              <div>
                <p className="font-semibold text-white">Alex R.</p>
                <p className="text-sm text-gray-500">Long-term HODLer</p>
              </div>
            </div>
            <p className="text-gray-300 italic leading-relaxed">&ldquo;Finally, a simple way to track my Bitcoin cost basis without giving up my privacy. BitBasis is exactly what I needed. The interface is clean and calculating my potential tax obligations is much less stressful now.&rdquo;</p>
          </div>
          {/* Testimonial 2 */}
          <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/60 border border-white/10 rounded-xl p-8 shadow-lg">
            <div className="flex items-center mb-4">
              <img className="h-12 w-12 rounded-full mr-4 ring-2 ring-blue-500/50" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="User avatar"/>
              <div>
                <p className="font-semibold text-white">Sarah K.</p>
                <p className="text-sm text-gray-500">Privacy Advocate</p>
              </div>
            </div>
            <p className="text-gray-300 italic leading-relaxed">&ldquo;I was hesitant to use online portfolio trackers because of privacy concerns. BitBasis's focus on CSV imports and no exchange connections sold me. It\'s secure, easy to use, and respects user data.&rdquo;</p>
          </div>
          {/* Testimonial 3 */}
          <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/60 border border-white/10 rounded-xl p-8 shadow-lg">
            <div className="flex items-center mb-4">
              <img className="h-12 w-12 rounded-full mr-4 ring-2 ring-amber-500/50" src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="User avatar"/>
              <div>
                <p className="font-semibold text-white">Michael T.</p>
                <p className="text-sm text-gray-500">DCA Investor</p>
              </div>
            </div>
            <p className="text-gray-300 italic leading-relaxed">&ldquo;The performance charts in BitBasis have changed how I view my bitcoin strategy. Being able to visualize my DCA approach over time has been incredibly valuable. This tool strikes the perfect balance between simplicity and depth.&rdquo;</p>
          </div>
        </div>
      </div>
    </section>
  )
} 