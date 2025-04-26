import Link from "next/link"
import { Logo } from "@/components/logo"

export function Footer() {
  return (
    <footer className="relative py-12 mt-16">
      <div className="absolute inset-0 bg-transparent z-[-1]"></div>
      <div className="container mx-auto px-4 flex flex-col items-center justify-between gap-6 md:flex-row">
        <Logo />
        <p className="text-sm text-gray-500">&copy; {new Date().getFullYear()} BitBasis. All rights reserved.</p>
        <div className="flex gap-6">
          <Link href="/privacy" className="text-sm text-gray-500 hover:text-white transition-colors duration-200">
            Privacy
          </Link>
          <Link href="/terms" className="text-sm text-gray-500 hover:text-white transition-colors duration-200">
            Terms
          </Link>
          <Link href="/contact" className="text-sm text-gray-500 hover:text-white transition-colors duration-200">
            Contact
          </Link>
        </div>
      </div>
    </footer>
  )
} 