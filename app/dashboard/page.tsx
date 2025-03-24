import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle, 
  Tabs, 
  TabsList, 
  TabsTrigger,
  TabsContent
} from "@/components/ui"
import { PerformanceChart } from "@/components/overview/performance-chart"
import { PortfolioOverview } from "@/components/overview/portfolio-overview"
import { RecentTransactions } from "@/components/overview/recent-transactions"

export default function DashboardPage() {
  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between w-full">
        <h1 className="text-2xl font-bold tracking-tight text-white">Dashboard</h1>
        <Tabs defaultValue="all" className="w-[300px]">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">All Time</TabsTrigger>
            <TabsTrigger value="year">Year</TabsTrigger>
            <TabsTrigger value="month">Month</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      <div className="grid w-full gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Portfolio Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">$24,563.82</div>
            <p className="text-xs text-muted-foreground">+20.1% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost Basis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">$18,420.69</div>
            <p className="text-xs text-muted-foreground">0.42 BTC acquired</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unrealized Gains</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-bitcoin-orange">+$6,143.13</div>
            <p className="text-xs text-muted-foreground">+33.3% ROI</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Buy Price</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">$43,858.79</div>
            <p className="text-xs text-muted-foreground">Per Bitcoin</p>
          </CardContent>
        </Card>
      </div>
      <div className="grid w-full gap-4 grid-cols-1 lg:grid-cols-12">
        <Card className="lg:col-span-8">
          <CardHeader>
            <CardTitle>Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <PerformanceChart />
          </CardContent>
        </Card>
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Portfolio Overview</CardTitle>
            <CardDescription>Bitcoin acquired by year</CardDescription>
          </CardHeader>
          <CardContent>
            <PortfolioOverview />
          </CardContent>
        </Card>
      </div>
      <div className="w-full">
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Your most recent Bitcoin transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <RecentTransactions />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

