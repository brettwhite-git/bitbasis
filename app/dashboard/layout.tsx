import type React from "react"
import { Logo } from "@/components/logo"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { UserNav } from "@/components/dashboard/user-nav"
import { MobileNav } from "@/components/dashboard/mobile-nav"
import { SidebarProvider } from "@/components/ui/sidebar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <div className="relative flex min-h-screen flex-col">
        <header className="fixed inset-x-0 top-0 z-50 border-b border-border/40 bg-background">
          <div className="flex h-16 items-center gap-4 px-4 md:px-6">
            <MobileNav />
            <div className="hidden md:block">
              <Logo />
            </div>
            <div className="ml-auto flex items-center gap-4">
              <UserNav />
            </div>
          </div>
        </header>
        <div className="flex flex-1 pt-16">
          <DashboardSidebar />
          <main className="flex-1 overflow-hidden">
            <div className="h-full w-full px-6 py-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}

