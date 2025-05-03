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
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="flex items-center space-x-2 mb-8">
        <FileText className="h-7 w-7 text-primary" />
        <h1 className="text-3xl font-bold">Terms of Service</h1>
      </div>
      
      <div className="flex flex-col gap-6 text-muted-foreground">
        <p>Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">1. Agreement to Terms</h2>
          <p>
            By accessing or using BitBasis, you agree to be bound by these Terms of Service. If you disagree with any part 
            of the terms, you may not access the service.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">2. Description of Service</h2>
          <p>
            BitBasis provides Bitcoin portfolio tracking services, including cost basis calculation, performance metrics, 
            and data visualization. We are not a financial institution, exchange, or investment advisor.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">3. User Accounts</h2>
          <p>
            When you create an account with us, you must provide accurate and complete information. You are responsible for 
            safeguarding your account credentials and for all activities under your account.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">4. User Data and Privacy</h2>
          <p>
            Our Privacy Policy governs the collection and use of your personal information. By using BitBasis, you consent to 
            the data practices described in our <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">5. Intellectual Property</h2>
          <p>
            The BitBasis service and its original content, features, and functionality are owned by BitBasis and are protected 
            by international copyright, trademark, and other intellectual property laws.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">6. User Content</h2>
          <p>
            You retain all rights to the data you upload to BitBasis. By uploading data, you grant us a license to use, store, 
            and process this information solely for the purpose of providing our services to you.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">7. Disclaimer</h2>
          <p>
            BitBasis is provided "as is" without warranties of any kind. We do not guarantee the accuracy of calculations or 
            data presented. BitBasis is not a tax preparation service, and all tax calculations should be verified by a qualified 
            tax professional.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">8. Limitation of Liability</h2>
          <p>
            In no event shall BitBasis, its directors, employees, or agents be liable for any indirect, incidental, special, 
            consequential or punitive damages, including loss of profits, data, or other intangible losses, resulting from your 
            access to or use of or inability to access or use the service.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">9. Termination</h2>
          <p>
            We may terminate or suspend your account immediately, without prior notice, for any reason whatsoever, including 
            without limitation if you breach the Terms. Upon termination, your right to use BitBasis will immediately cease.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">10. Changes to Terms</h2>
          <p>
            We reserve the right to modify these terms at any time. We will provide notice of significant changes by updating 
            the "Last updated" date at the top of this page. Your continued use of BitBasis after such modifications constitutes 
            your acceptance of the new Terms.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">11. Governing Law</h2>
          <p>
            These Terms shall be governed by the laws of the United States, without regard to its conflict of law provisions.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">12. Contact Us</h2>
          <p>
            If you have any questions about these Terms, please contact us at:
          </p>
          <p className="font-medium text-foreground">terms@bitbasis.app</p>
        </section>

        <div className="mt-8 flex justify-center">
          <Button asChild variant="orange-outline">
            <Link href="/">Return to Home</Link>
          </Button>
        </div>
      </div>
    </div>
  )
} 