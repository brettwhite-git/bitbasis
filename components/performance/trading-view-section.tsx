"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui"
import TradingViewWidget from "../../components/trading/TradingViewWidget"

export function TradingViewSection() {
  return (
    <Card>
      <CardHeader className="pb-0">
        <CardTitle className="text-lg font-semibold text-white">Bitcoin Time Chart</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="rounded-xl border overflow-hidden h-[600px] shadow-[inset_0_1px_4px_rgba(0,0,0,0.6)] relative">
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-transparent pointer-events-none" />
          <div className="relative h-full">
            <TradingViewWidget />
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 