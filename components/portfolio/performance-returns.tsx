"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatCurrency, formatPercent } from "@/lib/utils"

interface PerformanceData {
  cumulative: {
    total: { percent: number; dollar: number }
    day: { percent: number; dollar: number }
    week: { percent: number; dollar: number }
    month: { percent: number | null; dollar: number | null }
    ytd: { percent: number | null; dollar: number | null }
    threeMonth: { percent: number | null; dollar: number | null }
    year: { percent: number | null; dollar: number | null }
    threeYear: { percent: number | null; dollar: number | null }
    fiveYear: { percent: number | null; dollar: number | null }
  }
  annualized: {
    total: number | null
    oneYear: number | null
    twoYear: number | null
    threeYear: number | null
    fourYear: number | null
    fiveYear: number | null
    sixYear: number | null
    sevenYear: number | null
    eightYear: number | null
  }
}

export function PerformanceReturns({ data }: { data: PerformanceData }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Cumulative Returns Table */}
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="p-6">
            <h3 className="text-sm font-medium mb-4">Cumulative returns</h3>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-center w-24"></TableHead>
                  <TableHead className="text-center">24-Hour</TableHead>
                  <TableHead className="text-center">1-Week</TableHead>
                  <TableHead className="text-center">1-Month</TableHead>
                  <TableHead className="text-center">YTD</TableHead>
                  <TableHead className="text-center">3-Month</TableHead>
                  <TableHead className="text-center">1-Year</TableHead>
                  <TableHead className="text-center">3-Year</TableHead>
                  <TableHead className="text-center">5-Year</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium text-center">Percent</TableCell>
                  <TableCell className={`text-center ${data.cumulative.day.percent >= 0 ? "text-green-500" : "text-red-500"}`}>
                    {formatPercent(data.cumulative.day.percent)}
                  </TableCell>
                  <TableCell className={`text-center ${data.cumulative.week.percent >= 0 ? "text-green-500" : "text-red-500"}`}>
                    {formatPercent(data.cumulative.week.percent)}
                  </TableCell>
                  <TableCell className="text-center">
                    {data.cumulative.month.percent ? formatPercent(data.cumulative.month.percent) : "-"}
                  </TableCell>
                  <TableCell className="text-center">
                    {data.cumulative.ytd.percent ? formatPercent(data.cumulative.ytd.percent) : "-"}
                  </TableCell>
                  <TableCell className="text-center">
                    {data.cumulative.threeMonth.percent ? formatPercent(data.cumulative.threeMonth.percent) : "-"}
                  </TableCell>
                  <TableCell className="text-center">
                    {data.cumulative.year.percent ? formatPercent(data.cumulative.year.percent) : "-"}
                  </TableCell>
                  <TableCell className="text-center">
                    {data.cumulative.threeYear.percent ? formatPercent(data.cumulative.threeYear.percent) : "-"}
                  </TableCell>
                  <TableCell className="text-center">
                    {data.cumulative.fiveYear.percent ? formatPercent(data.cumulative.fiveYear.percent) : "-"}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium text-center">Dollar</TableCell>
                  <TableCell className={`text-center ${data.cumulative.day.dollar >= 0 ? "text-green-500" : "text-red-500"}`}>
                    {formatCurrency(data.cumulative.day.dollar)}
                  </TableCell>
                  <TableCell className={`text-center ${data.cumulative.week.dollar >= 0 ? "text-green-500" : "text-red-500"}`}>
                    {formatCurrency(data.cumulative.week.dollar)}
                  </TableCell>
                  <TableCell className="text-center">
                    {data.cumulative.month.dollar ? formatCurrency(data.cumulative.month.dollar) : "-"}
                  </TableCell>
                  <TableCell className="text-center">
                    {data.cumulative.ytd.dollar ? formatCurrency(data.cumulative.ytd.dollar) : "-"}
                  </TableCell>
                  <TableCell className="text-center">
                    {data.cumulative.threeMonth.dollar ? formatCurrency(data.cumulative.threeMonth.dollar) : "-"}
                  </TableCell>
                  <TableCell className="text-center">
                    {data.cumulative.year.dollar ? formatCurrency(data.cumulative.year.dollar) : "-"}
                  </TableCell>
                  <TableCell className="text-center">
                    {data.cumulative.threeYear.dollar ? formatCurrency(data.cumulative.threeYear.dollar) : "-"}
                  </TableCell>
                  <TableCell className="text-center">
                    {data.cumulative.fiveYear.dollar ? formatCurrency(data.cumulative.fiveYear.dollar) : "-"}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Annualized Returns Table */}
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="p-6">
            <h3 className="text-sm font-medium mb-4">Annualized returns</h3>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-center w-24"></TableHead>
                  <TableHead className="text-center">1-Year</TableHead>
                  <TableHead className="text-center">2-Year</TableHead>
                  <TableHead className="text-center">3-Year</TableHead>
                  <TableHead className="text-center">4-Year</TableHead>
                  <TableHead className="text-center">5-Year</TableHead>
                  <TableHead className="text-center">6-Year</TableHead>
                  <TableHead className="text-center">7-Year</TableHead>
                  <TableHead className="text-center">8-Year</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium text-center">You</TableCell>
                  <TableCell className={`text-center ${data.annualized.oneYear && data.annualized.oneYear >= 0 ? "text-green-500" : data.annualized.oneYear ? "text-red-500" : ""}`}>
                    {data.annualized.oneYear ? formatPercent(data.annualized.oneYear) : "-"}
                  </TableCell>
                  <TableCell className={`text-center ${data.annualized.twoYear && data.annualized.twoYear >= 0 ? "text-green-500" : data.annualized.twoYear ? "text-red-500" : ""}`}>
                    {data.annualized.twoYear ? formatPercent(data.annualized.twoYear) : "-"}
                  </TableCell>
                  <TableCell className={`text-center ${data.annualized.threeYear && data.annualized.threeYear >= 0 ? "text-green-500" : data.annualized.threeYear ? "text-red-500" : ""}`}>
                    {data.annualized.threeYear ? formatPercent(data.annualized.threeYear) : "-"}
                  </TableCell>
                  <TableCell className={`text-center ${data.annualized.fourYear && data.annualized.fourYear >= 0 ? "text-green-500" : data.annualized.fourYear ? "text-red-500" : ""}`}>
                    {data.annualized.fourYear ? formatPercent(data.annualized.fourYear) : "-"}
                  </TableCell>
                  <TableCell className={`text-center ${data.annualized.fiveYear && data.annualized.fiveYear >= 0 ? "text-green-500" : data.annualized.fiveYear ? "text-red-500" : ""}`}>
                    {data.annualized.fiveYear ? formatPercent(data.annualized.fiveYear) : "-"}
                  </TableCell>
                  <TableCell className={`text-center ${data.annualized.sixYear && data.annualized.sixYear >= 0 ? "text-green-500" : data.annualized.sixYear ? "text-red-500" : ""}`}>
                    {data.annualized.sixYear ? formatPercent(data.annualized.sixYear) : "-"}
                  </TableCell>
                  <TableCell className={`text-center ${data.annualized.sevenYear && data.annualized.sevenYear >= 0 ? "text-green-500" : data.annualized.sevenYear ? "text-red-500" : ""}`}>
                    {data.annualized.sevenYear ? formatPercent(data.annualized.sevenYear) : "-"}
                  </TableCell>
                  <TableCell className={`text-center ${data.annualized.eightYear && data.annualized.eightYear >= 0 ? "text-green-500" : data.annualized.eightYear ? "text-red-500" : ""}`}>
                    {data.annualized.eightYear ? formatPercent(data.annualized.eightYear) : "-"}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium text-center">Bitcoin</TableCell>
                  <TableCell className={`text-center text-green-500`}>120.98%</TableCell>
                  <TableCell className={`text-center text-green-500`}>155.41%</TableCell>
                  <TableCell className={`text-center text-red-500`}>-64.27%</TableCell>
                  <TableCell className={`text-center text-green-500`}>59.71%</TableCell>
                  <TableCell className={`text-center text-green-500`}>303.09%</TableCell>
                  <TableCell className={`text-center text-green-500`}>92%</TableCell>
                  <TableCell className={`text-center text-red-500`}>-73.48%</TableCell>
                  <TableCell className={`text-center text-green-500`}>1,369.03%</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 