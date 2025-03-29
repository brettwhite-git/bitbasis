"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, LineChart, PieChart, Upload, Settings, History } from "lucide-react"
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
        <ul className="grid gap-1 px-2">
          {routes.map((route) => (
            <li key={route.href}>
              <Link
                href={route.href}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium ${
                  route.isActive
                    ? "bg-bitcoin-orange text-white"
                    : "text-muted-foreground hover:bg-secondary hover:text-white"
                }`}
              >
                <route.icon className="h-5 w-5" />
                {isOpen && route.title}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}

