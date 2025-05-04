"use client"

import { useState } from 'react'
import { PortfolioMetricsWrapper } from '@/components/portfolio/portfolio-metrics-wrapper'
import { PerformanceReturnsWrapper } from '@/components/portfolio/performance-returns-wrapper'
import { CostBasisComparisonContent, TaxLiabilityContent } from '@/components/portfolio/tax'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

export default function PortfolioPage() {
  const [mainTab, setMainTab] = useState('performance')
  const [analysisTab, setAnalysisTab] = useState('cost-basis')
  
  return (
    <div className="w-full space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-foreground">Bitcoin Portfolio</h1>
      
      <PortfolioMetricsWrapper />
      
      <Tabs defaultValue="performance" value={mainTab} onValueChange={setMainTab} className="w-full space-y-4">
        <TabsList className="flex w-auto mb-4 bg-transparent p-0 h-auto justify-start gap-x-1 border-b border-border">
          <TabsTrigger 
            value="performance"
            className="data-[state=active]:bg-bitcoin-orange data-[state=active]:text-primary-foreground data-[state=active]:shadow-md data-[state=active]:rounded-t-md px-4 py-2 text-muted-foreground transition-none rounded-none shadow-none bg-transparent data-[state=inactive]:hover:bg-muted/50 data-[state=inactive]:hover:text-accent-foreground justify-start mr-2 data-[state=active]:mb-[-1px] data-[state=active]:border data-[state=active]:border-b-0 data-[state=active]:border-border"
          >
            Performance Metrics
          </TabsTrigger>
          <TabsTrigger 
            value="analysis"
            className="data-[state=active]:bg-bitcoin-orange data-[state=active]:text-primary-foreground data-[state=active]:shadow-md data-[state=active]:rounded-t-md px-4 py-2 text-muted-foreground transition-none rounded-none shadow-none bg-transparent data-[state=inactive]:hover:bg-muted/50 data-[state=inactive]:hover:text-accent-foreground justify-start mr-2 data-[state=active]:mb-[-1px] data-[state=active]:border data-[state=active]:border-b-0 data-[state=active]:border-border"
          >
            Portfolio Analysis
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="performance">
          <PerformanceReturnsWrapper />
        </TabsContent>
        
        <TabsContent value="analysis">
          <Card>
            <CardHeader className="pb-0">
              <h2 className="text-xl font-semibold">Portfolio Analysis</h2>
            </CardHeader>
            <CardContent className="pt-4">
              <Tabs defaultValue="cost-basis" value={analysisTab} onValueChange={setAnalysisTab}>
                <TabsList className="w-full justify-start border-b border-border mb-4">
                  <TabsTrigger value="cost-basis">Cost Basis Methods</TabsTrigger>
                  <TabsTrigger value="tax-liability">Tax Liability</TabsTrigger>
                </TabsList>
                
                <TabsContent value="cost-basis">
                  <CostBasisComparisonContent />
                </TabsContent>
                <TabsContent value="tax-liability">
                  <TaxLiabilityContent />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

