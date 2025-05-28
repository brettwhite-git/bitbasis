"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Logo } from "@/components/logo"
import { LayoutDashboard, LineChart, PieChart, Settings, History, Calculator, Database } from "lucide-react"

export function MobileNav() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  const routes = [
    {
      title: "Dashboard",
      icon: LayoutDashboard,
      href: "/dashboard",
      isActive: pathname === "/dashboard",
    },
    {
      title: "Performance",
      icon: LineChart,
      href: "/dashboard/performance",
      isActive: pathname === "/dashboard/performance",
    },
    {
      title: "Portfolio",
      icon: PieChart,
      href: "/dashboard/portfolio",
      isActive: pathname === "/dashboard/portfolio",
    },
    {
      title: "Calculator",
      icon: Calculator,
      href: "/dashboard/calculator",
      isActive: pathname === "/dashboard/calculator",
    },
    {
      title: "Transactions",
      icon: History,
      href: "/dashboard/transactions",
      isActive: pathname === "/dashboard/transactions",
    },
    {
      title: "Transaction History",
      icon: Database,
      href: "/dashboard/transaction-history",
      isActive: pathname === "/dashboard/transaction-history",
    },
    {
      title: "Settings",
      icon: Settings,
      href: "/dashboard/settings",
      isActive: pathname === "/dashboard/settings",
    },
  ]

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden text-gray-300 hover:text-white hover:bg-gray-700/50">
          <Menu className="h-6 w-6" />
          <span className="sr-only">Toggle navigation menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="flex flex-col p-0 bg-gradient-to-br from-gray-800/20 via-gray-900/30 to-gray-800/20 backdrop-blur-sm border-gray-700/50">
        <SheetHeader className="border-b border-gray-700/50 px-4 py-2">
          <div className="flex items-center justify-between">
            <Logo />
          </div>
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
        </SheetHeader>
        <nav className="flex-1 overflow-auto py-2">
          <ul className="grid gap-1 px-2">
            {routes.map((route) => (
              <li key={route.href}>
                <Link
                  href={route.href}
                  className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    route.isActive
                      ? "bg-gradient-to-r from-bitcoin-orange to-[#D4A76A] text-white shadow-md shadow-bitcoin-orange/20"
                      : "text-gray-300 hover:bg-gray-700/50 hover:text-white"
                  }`}
                  onClick={() => setOpen(false)}
                >
                  <route.icon className="h-5 w-5" />
                  {route.title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </SheetContent>
    </Sheet>
  )
}

