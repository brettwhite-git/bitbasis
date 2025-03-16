import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PerformanceDetailChart } from "@/components/dashboard/performance-detail-chart"

export default function PerformancePage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold tracking-tight text-white">Performance</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total ROI</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-bitcoin-orange">+33.3%</div>
            <p className="text-xs text-muted-foreground">Since first purchase</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">30-Day Change</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-bitcoin-orange">+12.8%</div>
            <p className="text-xs text-muted-foreground">+$2,793.82</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">YTD Change</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-bitcoin-orange">+45.2%</div>
            <p className="text-xs text-muted-foreground">+$7,651.30</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">All-Time High</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">$26,890.45</div>
            <p className="text-xs text-muted-foreground">Reached on Jul 14, 2023</p>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Performance Over Time</CardTitle>
          <CardDescription>Track your Bitcoin portfolio performance</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="1y" className="w-full">
            <TabsList className="grid w-full max-w-[400px] grid-cols-4">
              <TabsTrigger value="1m">1M</TabsTrigger>
              <TabsTrigger value="3m">3M</TabsTrigger>
              <TabsTrigger value="1y">1Y</TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>
            <TabsContent value="1m" className="mt-4">
              <PerformanceDetailChart period="1m" />
            </TabsContent>
            <TabsContent value="3m" className="mt-4">
              <PerformanceDetailChart period="3m" />
            </TabsContent>
            <TabsContent value="1y" className="mt-4">
              <PerformanceDetailChart period="1y" />
            </TabsContent>
            <TabsContent value="all" className="mt-4">
              <PerformanceDetailChart period="all" />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

