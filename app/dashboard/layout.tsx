import type React from "react"
import { Logo } from "@/components/logo"
import { DashboardSidebar } from "@/components/shared/sidebar"
import { UserNav } from "@/components/shared/user-nav"
import { MobileNav } from "@/components/shared/mobile-nav"
import { SidebarProvider } from "@/components/shared/sidebar-provider"
import { SubscriptionTierBadge } from "@/components/subscription/SubscriptionTierBadge"
import { PaymentRecoveryBanner } from "@/components/subscription/PaymentRecoveryBanner"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <div className="relative flex min-h-screen flex-col text-gray-300 overflow-x-hidden isolate">
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

        <header className="fixed inset-x-0 top-0 z-50 bg-[#171923]/60 backdrop-blur-xl supports-[backdrop-filter]:bg-[#171923]/40 transition-all duration-300 shadow-md shadow-black/5">
          <div className="flex h-16 items-center gap-4 px-4 md:px-6">
            <MobileNav />
            <div className="hidden md:block">
              <Logo />
            </div>
            <div className="ml-auto flex items-center gap-4">
              <SubscriptionTierBadge />
              <UserNav />
            </div>
          </div>
        </header>
        <div className="flex flex-1 pt-16">
          <DashboardSidebar />
          <main className="flex-1 overflow-hidden relative z-10">
            <div className="h-full w-full px-8 py-6">
              <PaymentRecoveryBanner />
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}

