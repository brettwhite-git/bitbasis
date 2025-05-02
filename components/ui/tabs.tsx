"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils/utils"

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> & {
    variant?: "default" | "outline" | "compact"
  }
>(({ className, variant = "default", ...props }, ref) => {
  const baseStyles = {
    default: "flex w-auto mb-4 bg-transparent p-0 h-auto justify-start gap-x-1 border-b border-border",
    outline: "inline-flex h-9 items-center justify-center rounded-lg bg-muted/10 p-1 text-muted-foreground",
    compact: "grid w-full grid-cols-auto-fit gap-1 bg-muted/10 rounded-lg p-1"
  }

  return (
    <TabsPrimitive.List
      ref={ref}
      className={cn(
        baseStyles[variant],
        className
      )}
      {...props}
    />
  )
})
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> & {
    variant?: "default" | "outline" | "compact"
  }
>(({ className, variant = "default", ...props }, ref) => {
  const baseStyles = {
    default: "px-4 py-2 text-muted-foreground transition-all rounded-t-md border border-transparent data-[state=active]:bg-bitcoin-orange data-[state=active]:text-primary-foreground data-[state=active]:shadow-md data-[state=active]:mb-[-1px] data-[state=active]:border-border data-[state=active]:border-b-0 data-[state=inactive]:hover:bg-muted/50 data-[state=inactive]:hover:text-accent-foreground",
    outline: "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-bitcoin-orange data-[state=active]:text-primary-foreground data-[state=active]:shadow",
    compact: "inline-flex items-center justify-center whitespace-nowrap rounded-md px-2.5 py-1 text-sm ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-bitcoin-orange data-[state=active]:text-primary-foreground data-[state=inactive]:hover:bg-muted/30"
  }

  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(
        baseStyles[variant],
        className
      )}
      {...props}
    />
  )
})
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
