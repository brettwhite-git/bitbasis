import { Card, CardContent, CardDescription, CardHeader, CardTitle, Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui"
import { PerformanceDetailChart } from "@/components/performance/performance-detail-chart"

export default function PerformancePage() {
  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between w-full">
        <h1 className="text-2xl font-bold tracking-tight text-white">Performance</h1>
        <Tabs defaultValue="1y" className="w-[400px]">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="1m">1M</TabsTrigger>
            <TabsTrigger value="3m">3M</TabsTrigger>
            <TabsTrigger value="1y">1Y</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      <div className="grid w-full gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
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
      <div className="grid w-full gap-4 grid-cols-1 lg:grid-cols-12">
        <Card className="lg:col-span-12">
          <CardHeader>
            <CardTitle>Performance Over Time</CardTitle>
            <CardDescription>Track your Bitcoin portfolio performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="w-full">
              <PerformanceDetailChart period="1m" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

