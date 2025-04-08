"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, LineChart, PieChart, Upload, Settings, History, Calculator } from "lucide-react"
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
      title: "Import Data",
      icon: Upload,
      href: "/dashboard/import",
      isActive: pathname === "/dashboard/import",
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
      className={`hidden border-r border-border/40 md:block ${
        isOpen ? "w-64" : "w-16"
      } transition-all duration-300`}
    >
      <nav className="flex h-full flex-col py-4">
        <ul className="flex flex-col items-center gap-2">
          {routes.map((route) => (
            <li key={route.href} className="w-full px-2">
              <Link
                href={route.href}
                className={`flex h-10 items-center ${isOpen ? 'justify-start px-3' : 'justify-center'} rounded-md text-sm font-medium ${
                  route.isActive
                    ? "bg-bitcoin-orange text-white"
                    : "text-muted-foreground hover:bg-secondary hover:text-white"
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
  )
}

