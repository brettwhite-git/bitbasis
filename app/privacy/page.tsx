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
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="flex items-center space-x-2 mb-8">
        <ShieldCheck className="h-7 w-7 text-primary" />
        <h1 className="text-3xl font-bold">Privacy Policy</h1>
      </div>
      
      <div className="flex flex-col gap-6 text-muted-foreground">
        <p>Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Our Commitment to Privacy</h2>
          <p>
            At BitBasis, we prioritize your privacy and the security of your personal data. This Privacy Policy outlines how we collect, use, 
            and protect your information when you use our Bitcoin portfolio tracking services.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Information We Collect</h2>
          <p>
            We collect the following types of information:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li><span className="font-medium text-foreground">Account Information:</span> Email address and password for authentication.</li>
            <li><span className="font-medium text-foreground">Portfolio Data:</span> Bitcoin transaction data from CSV files you upload, including dates, amounts, prices, and transaction types.</li>
            <li><span className="font-medium text-foreground">Usage Data:</span> Information about how you interact with our platform, if you opt-in to analytics.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">How We Use Your Information</h2>
          <p>
            We use your information to:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Provide and maintain our portfolio tracking services</li>
            <li>Calculate your Bitcoin cost basis, gains, and portfolio metrics</li>
            <li>Improve and optimize our platform</li>
            <li>Communicate important updates about our service</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Data Storage and Security</h2>
          <p>
            All data is stored in our secure Supabase database with the following protections:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>End-to-end encryption for sensitive transaction notes (when enabled)</li>
            <li>Row-level security policies that ensure you can only access your own data</li>
            <li>Regular security audits and updates</li>
            <li>No data sharing with third parties without your explicit consent</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Your Data Rights</h2>
          <p>
            You have the right to:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Access all data we store about you</li>
            <li>Export your data in a portable format</li>
            <li>Request deletion of your account and associated data</li>
            <li>Opt-out of analytics and data collection features</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Cookies and Tracking</h2>
          <p>
            We use secure HTTP-only cookies for authentication purposes only. We do not use tracking cookies 
            or third-party trackers unless you explicitly opt-in to analytics features.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Changes to This Policy</h2>
          <p>
            We may update this privacy policy from time to time. We will notify you of any changes by posting 
            the new privacy policy on this page and updating the "Last updated" date.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact us at:
          </p>
          <p className="font-medium text-foreground">privacy@bitbasis.app</p>
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