import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PortfolioYearlyChart } from "@/components/dashboard/portfolio-yearly-chart"
import { CostBasisComparison } from "@/components/dashboard/cost-basis-comparison"

export default function PortfolioPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold tracking-tight text-white">Portfolio Details</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bitcoin</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">0.42 BTC</div>
            <p className="text-xs text-muted-foreground">Current value: $24,563.82</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Fees Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">$125.45</div>
            <p className="text-xs text-muted-foreground">0.68% of total cost basis</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">First Purchase</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">Jan 12, 2022</div>
            <p className="text-xs text-muted-foreground">Bitcoin price: $18,320.00</p>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Bitcoin Accumulation by Year</CardTitle>
          <CardDescription>Amount of Bitcoin acquired each year</CardDescription>
        </CardHeader>
        <CardContent>
          <PortfolioYearlyChart />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Cost Basis Method Comparison</CardTitle>
          <CardDescription>Compare different cost basis calculation methods</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="fifo" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="fifo">FIFO</TabsTrigger>
              <TabsTrigger value="lifo">LIFO</TabsTrigger>
              <TabsTrigger value="average">Average Cost</TabsTrigger>
            </TabsList>
            <TabsContent value="fifo" className="mt-4">
              <CostBasisComparison method="FIFO" />
            </TabsContent>
            <TabsContent value="lifo" className="mt-4">
              <CostBasisComparison method="LIFO" />
            </TabsContent>
            <TabsContent value="average" className="mt-4">
              <CostBasisComparison method="Average Cost" />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

