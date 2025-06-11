"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, LineChart, PieChart, Settings, History, Calculator, Database } from "lucide-react"
import { useSidebar } from "./sidebar-provider"

export function DashboardSidebar() {
  const pathname = usePathname()
  const { isOpen } = useSidebar()

  const routes = [
    {
      title: "Dashboard",
      icon: LayoutDashboard,
      href: "/dashboard",
      isActive: pathname === "/dashboard",
    },
    {
      title: "Portfolio",
      icon: PieChart,
      href: "/dashboard/portfolio",
      isActive: pathname === "/dashboard/portfolio",
    },
    {
      title: "Performance",
      icon: LineChart,
      href: "/dashboard/performance",
      isActive: pathname === "/dashboard/performance",
    },
    {
      title: "Transactions",
      icon: History,
      href: "/dashboard/transaction-history",
      isActive: pathname === "/dashboard/transaction-history" || pathname === "/dashboard/transactions",
    },
    {
      title: "Calculator",
      icon: Calculator,
      href: "/dashboard/calculator",
      isActive: pathname === "/dashboard/calculator",
    },
    {
      title: "Settings",
      icon: Settings,
      href: "/dashboard/settings",
      isActive: pathname === "/dashboard/settings",
    },
  ]

  return (
    <div
      className={`hidden md:block min-h-full ${
        isOpen ? "w-64" : "w-20"
      } transition-all duration-300`}
    >
      <div className="min-h-full bg-gradient-to-br from-gray-800/20 via-gray-900/30 to-gray-800/20 backdrop-blur-sm rounded-r-xl">
        <nav className="flex flex-col py-4 min-h-full">
          <ul className="flex flex-col items-center gap-3">
            {routes.map((route) => (
              <li key={route.href} className="w-full px-2">
                <Link
                  href={route.href}
                  className={`flex h-10 items-center ${isOpen ? 'justify-start px-3' : 'justify-center'} rounded-md text-sm font-medium transition-colors ${
                    route.isActive
                      ? "bg-gradient-to-r from-bitcoin-orange to-[#D4A76A] text-white shadow-md shadow-bitcoin-orange/20"
                      : "text-gray-300 hover:bg-gray-700/50 hover:text-white"
                  }`}
                >
                  <route.icon className="h-5 w-5" />
                  {isOpen && <span className="ml-3">{route.title}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  )
}

