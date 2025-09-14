import { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { FileText } from "lucide-react"

export const metadata: Metadata = {
  title: "Terms of Service | BitBasis",
  description: "BitBasis terms of service and user agreement",
}

export default function TermsPage() {
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
          <FileText className="h-7 w-7 text-bitcoin-orange" />
          <h1 className="text-3xl font-bold text-white">Terms of Service</h1>
        </div>
        
        <div className="flex flex-col gap-6 bg-gray-800/20 rounded-xl p-8 backdrop-blur-sm">
          <p className="text-gray-400">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white">1. Agreement to Terms</h2>
            <p className="text-gray-400">
              By accessing or using BitBasis, you agree to be bound by these Terms of Service. If you disagree with any part 
              of the terms, you may not access the service.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white">2. Description of Service</h2>
            <p className="text-gray-400">
              BitBasis provides Bitcoin portfolio tracking services, including cost basis calculation, performance metrics, 
              and data visualization. We are not a financial institution, exchange, or investment advisor.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white">3. User Accounts</h2>
            <p className="text-gray-400">
              When you create an account with us, you must provide accurate and complete information. You are responsible for 
              safeguarding your account credentials and for all activities under your account.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white">4. User Data and Privacy</h2>
            <p className="text-gray-400">
              Our Privacy Policy governs the collection and use of your personal information. By using BitBasis, you consent to 
              the data practices described in our <Link href="/privacy" className="text-bitcoin-orange hover:underline">Privacy Policy</Link>.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white">5. Intellectual Property</h2>
            <p className="text-gray-400">
              The BitBasis service and its original content, features, and functionality are owned by BitBasis and are protected 
              by international copyright, trademark, and other intellectual property laws.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white">6. User Content</h2>
            <p className="text-gray-400">
              You retain all rights to the data you upload to BitBasis. By uploading data, you grant us a license to use, store, 
              and process this information solely for the purpose of providing our services to you.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white">7. Disclaimer</h2>
            <p className="text-gray-400">
              BitBasis is provided &#34;as is&#34; without warranties of any kind. We do not guarantee the accuracy of calculations or 
              data presented. BitBasis is not a tax preparation service, and all tax calculations should be verified by a qualified 
              tax professional.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white">8. Limitation of Liability</h2>
            <p className="text-gray-400">
              In no event shall BitBasis, its directors, employees, or agents be liable for any indirect, incidental, special, 
              consequential or punitive damages, including loss of profits, data, or other intangible losses, resulting from your 
              access to or use of or inability to access or use the service.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white">9. Termination</h2>
            <p className="text-gray-400">
              We may terminate or suspend your account immediately, without prior notice, for any reason whatsoever, including 
              without limitation if you breach the Terms. Upon termination, your right to use BitBasis will immediately cease.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white">10. Changes to Terms</h2>
            <p className="text-gray-400">
              We reserve the right to modify these terms at any time. We will provide notice of significant changes by updating 
              the &#34;Last updated&#34; date at the top of this page. Your continued use of BitBasis after such modifications constitutes 
              your acceptance of the new Terms.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white">11. Governing Law</h2>
            <p className="text-gray-400">
              These Terms shall be governed by the laws of the United States, without regard to its conflict of law provisions.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white">12. Contact Us</h2>
            <p className="text-gray-400">
              If you have any questions about these Terms, please contact us at:
            </p>
            <p className="font-medium text-white">terms@bitbasis.app</p>
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