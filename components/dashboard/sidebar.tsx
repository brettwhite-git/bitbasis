"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, LineChart, PieChart, Upload, Settings, History } from "lucide-react"
import { SheetTitle } from "@/components/ui/sheet"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function DashboardSidebar() {
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
    <Sidebar className="hidden border-r border-border/40 md:flex md:h-[calc(100vh-4rem)] top-16">
      <SidebarContent>
        <nav aria-label="Sidebar Navigation">
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {routes.map((route) => (
                  <SidebarMenuItem key={route.href}>
                    <SidebarMenuButton asChild isActive={route.isActive}>
                      <Link href={route.href} className="flex items-center gap-2">
                        <route.icon className="h-5 w-5" />
                        <span>{route.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </nav>
      </SidebarContent>
    </Sidebar>
  )
}

