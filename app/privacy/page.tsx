import { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ShieldCheck } from "lucide-react"

export const metadata: Metadata = {
  title: "Privacy Policy | BitBasis",
  description: "Learn how BitBasis protects your data and privacy",
}

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col text-gray-300 overflow-x-hidden relative isolate">
      {/* Global Background Gradient & Grid */}
      <div 
        className="fixed inset-0 z-[-2] bg-gradient-to-b from-[#0F1116] via-[#171923] to-[#13151D]"
      />
      <div 
        className="fixed inset-0 z-[-1] opacity-[0.07]"
        style={{
          backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
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

      <div className="container mx-auto px-4 py-12 max-w-4xl relative z-10">
        <div className="flex items-center space-x-2 mb-8">
          <ShieldCheck className="h-7 w-7 text-bitcoin-orange" />
          <h1 className="text-3xl font-bold text-white">Privacy Policy</h1>
        </div>
        
        <div className="flex flex-col gap-6 bg-gray-800/20 rounded-xl p-8 backdrop-blur-sm">
          <p className="text-gray-400">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white">Our Commitment to Privacy</h2>
            <p className="text-gray-400">
              At BitBasis, we prioritize your privacy and the security of your personal data. This Privacy Policy outlines how we collect, use, 
              and protect your information when you use our Bitcoin portfolio tracking services.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white">Information We Collect</h2>
            <p className="text-gray-400">
              We collect the following types of information:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-400">
              <li><span className="font-medium text-white">Account Information:</span> Email address and password for authentication.</li>
              <li><span className="font-medium text-white">Portfolio Data:</span> Bitcoin transaction data from CSV files you upload, including dates, amounts, prices, and transaction types.</li>
              <li><span className="font-medium text-white">Usage Data:</span> Information about how you interact with our platform, if you opt-in to analytics.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white">How We Use Your Information</h2>
            <p className="text-gray-400">
              We use your information to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-400">
              <li>Provide and maintain our portfolio tracking services</li>
              <li>Calculate your Bitcoin cost basis, gains, and portfolio metrics</li>
              <li>Improve and optimize our platform</li>
              <li>Communicate important updates about our service</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white">Data Storage and Security</h2>
            <p className="text-gray-400">
              All data is stored in our secure Supabase database with the following protections:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-400">
              <li>End-to-end encryption for sensitive transaction notes (when enabled)</li>
              <li>Row-level security policies that ensure you can only access your own data</li>
              <li>Regular security audits and updates</li>
              <li>No data sharing with third parties without your explicit consent</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white">Your Data Rights</h2>
            <p className="text-gray-400">
              You have the right to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-400">
              <li>Access all data we store about you</li>
              <li>Export your data in a portable format</li>
              <li>Request deletion of your account and associated data</li>
              <li>Opt-out of analytics and data collection features</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white">Cookies and Tracking</h2>
            <p className="text-gray-400">
              We use secure HTTP-only cookies for authentication purposes only. We do not use tracking cookies 
              or third-party trackers unless you explicitly opt-in to analytics features.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white">Changes to This Policy</h2>
            <p className="text-gray-400">
              We may update this privacy policy from time to time. We will notify you of any changes by posting 
              the new privacy policy on this page and updating the &#34;Last updated&#34; date.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white">Contact Us</h2>
            <p className="text-gray-400">
              If you have any questions about this Privacy Policy, please contact us at:
            </p>
            <p className="font-medium text-white">privacy@bitbasis.app</p>
          </section>

          <div className="mt-8 flex justify-center">
            <Button asChild variant="orange-outline" className="relative overflow-hidden bg-gradient-to-r from-bitcoin-orange to-[#D4A76A] text-white font-semibold shadow-lg hover:shadow-bitcoin-orange/30 transform hover:-translate-y-px transition-all duration-300 group">
              <Link href="/">
                <span className="relative z-10">Return to Home</span>
                <span className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 group-active:opacity-20 transition-opacity duration-300"></span>
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
} 