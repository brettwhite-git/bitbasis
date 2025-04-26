import { Navigation } from "@/components/landing/Navigation"
import { 
  HeroSection,
  BenefitsSection,
  FeaturesSection,
  TestimonialsSection,
  DataSourcesSection,
  PricingSection,
  FAQSection,
  Footer
} from "@/components/landing/sections"

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col text-gray-300 overflow-x-hidden relative isolate">
      {/* Global Background Gradient & Grid */}
      <div 
        className="fixed inset-0 z-[-2] bg-gradient-to-b from-[#0F1116] via-[#171923] to-[#13151D]"
      />
      <div 
        className="fixed inset-0 z-[-1] opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(white .5px, transparent .5px), linear-gradient(90deg, white .5px, transparent .5px)',
          backgroundSize: '30px 30px'
        }}
      />
      {/* Noise Texture Overlay */}
      <div 
        className="fixed inset-0 z-[-1] opacity-30 mix-blend-soft-light pointer-events-none"
        style={{ 
          backgroundImage: 'url(\'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800"><defs><filter id="noiseFilter"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch"/></filter></defs><rect width="100%" height="100%" filter="url(%23noiseFilter)"/></svg>\')',
        }} 
      />

      <Navigation />

      <main className="flex-1 relative z-10 pt-16">
        <HeroSection />
        <BenefitsSection />
        <FeaturesSection />
        <TestimonialsSection />
        <DataSourcesSection />
        <PricingSection />
        <FAQSection />
      </main>

      <Footer />
    </div>
  )
}

