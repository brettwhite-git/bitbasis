import { Metadata } from 'next'
import Link from 'next/link'
import { CheckCircle, Mail, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Account Deleted - BitBasis',
  description: 'Your account has been successfully deleted',
  robots: {
    index: false,
    follow: false,
  },
}

export default function AccountDeletedPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-800/20 via-gray-900/30 to-gray-800/20 p-8 shadow-md backdrop-blur-sm border border-gray-700/50">
          <div className="text-center space-y-6">
            {/* Success Icon */}
            <div className="flex justify-center">
              <div className="rounded-full bg-green-500/20 p-4">
                <CheckCircle className="h-16 w-16 text-green-400" />
              </div>
            </div>

            {/* Title */}
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Account Successfully Deleted
              </h1>
              <p className="text-gray-400">
                Your account and all associated data have been permanently removed from our systems.
              </p>
            </div>

            {/* What Was Deleted */}
            <div className="bg-gray-800/30 rounded-lg p-6 space-y-4 text-left">
              <h2 className="text-lg font-semibold text-white mb-4">What Was Deleted:</h2>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>All Bitcoin transaction history</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>All CSV uploads and uploaded files</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>Account settings and preferences</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>Subscription information</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>All personal information</span>
                </li>
              </ul>
            </div>

            {/* Support Information */}
            <div className="bg-blue-900/20 border border-blue-800/50 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-white mb-2">Need Help?</h2>
              <p className="text-gray-300 text-sm mb-4">
                If you have any questions or concerns about your account deletion, please don&apos;t hesitate to contact us.
              </p>
              <div className="flex items-center justify-center gap-2 text-blue-300">
                <Mail className="h-4 w-4" />
                <a 
                  href="mailto:support@bitbasis.io" 
                  className="hover:text-blue-200 transition-colors"
                >
                  support@bitbasis.io
                </a>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button
                asChild
                className="bg-bitcoin-orange hover:bg-[#D4A76A] text-white"
              >
                <Link href="/">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Return to Home
                </Link>
              </Button>
            </div>

            {/* Footer Note */}
            <p className="text-xs text-gray-500 pt-4">
              Your session has been cleared and you have been signed out. 
              This page cannot be accessed again after you navigate away.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
