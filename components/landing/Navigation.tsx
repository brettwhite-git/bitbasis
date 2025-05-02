import { Button } from "@/components/ui/button"
import { Logo } from "@/components/logo"
import Link from "next/link"

export function Navigation() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#171923]/60 backdrop-blur-xl supports-[backdrop-filter]:bg-[#171923]/40 transition-all duration-300 shadow-md shadow-black/5">
      <div className="container mx-auto px-4 flex h-16 items-center">
        <div className="w-[160px] flex justify-start">
          <Logo />
        </div>
        <div className="flex-grow flex justify-center">
          <nav className="hidden md:flex items-center gap-8 text-sm">
            <Link href="/" className="relative text-white font-medium group">
              Home
              <span className="absolute bottom-0 left-0 h-[2px] w-0 bg-bitcoin-orange transition-all duration-300 group-hover:w-full"></span>
            </Link>
            <Link href="#benefits" className="relative text-gray-400 hover:text-white group">
              Benefits
              <span className="absolute bottom-0 left-0 h-[2px] w-0 bg-bitcoin-orange transition-all duration-300 group-hover:w-full"></span>
            </Link>
            <Link href="#features" className="relative text-gray-400 hover:text-white group">
              Features
              <span className="absolute bottom-0 left-0 h-[2px] w-0 bg-bitcoin-orange transition-all duration-300 group-hover:w-full"></span>
            </Link>
            <Link href="#pricing" className="relative text-gray-400 hover:text-white group">
              Pricing
              <span className="absolute bottom-0 left-0 h-[2px] w-0 bg-bitcoin-orange transition-all duration-300 group-hover:w-full"></span>
            </Link>
            <Link href="#faq" className="relative text-gray-400 hover:text-white group">
              FAQ
              <span className="absolute bottom-0 left-0 h-[2px] w-0 bg-bitcoin-orange transition-all duration-300 group-hover:w-full"></span>
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4 w-[160px] justify-end">
          <Link href="/auth/sign-in">
            <Button variant="ghost" className="text-gray-300 hover:text-white transition-colors duration-200">
              Log in
            </Button>
          </Link>
          <Link href="/auth/sign-up">
            <Button className="relative overflow-hidden bg-gradient-to-r from-bitcoin-orange to-[#D4A76A] text-white font-semibold shadow-md hover:shadow-lg hover:from-bitcoin-orange/90 hover:to-[#D4A76A]/90 transition-all duration-300 group px-6 py-2">
              <span className="relative z-10">Get Started</span>
              <span className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 group-active:opacity-20 transition-opacity duration-300"></span>
            </Button>
          </Link>
        </div>
      </div>
    </header>
  )
} 