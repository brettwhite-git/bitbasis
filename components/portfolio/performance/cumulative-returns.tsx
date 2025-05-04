"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatCurrency, formatPercent } from "@/lib/utils/utils"
import { Info } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface CumulativeReturnsProps {
  data: {
    month: { percent: number | null; dollar: number | null }
    threeMonth: { percent: number | null; dollar: number | null }
    ytd: { percent: number | null; dollar: number | null }
    year: { percent: number | null; dollar: number | null }
    twoYear: { percent: number | null; dollar: number | null }
    threeYear: { percent: number | null; dollar: number | null }
    fourYear: { percent: number | null; dollar: number | null }
    fiveYear: { percent: number | null; dollar: number | null }
  }
}

export function CumulativeReturns({ data }: CumulativeReturnsProps) {
  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
      <div className="p-6">
        <h3 className="text-sm font-medium mb-4">
          Cumulative Returns
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger className="cursor-default">
                <Info className="ml-2 h-4 w-4 text-bitcoin-orange inline-block" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Shows the total return of your portfolio over different time periods.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </h3>
        <Table className="table-fixed w-full">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-center w-[10.625%]"></TableHead>
              <TableHead className="text-center w-[10.625%]">1-Month</TableHead>
              <TableHead className="text-center w-[10.625%]">3-Month</TableHead>
              <TableHead className="text-center w-[10.625%]">YTD</TableHead>
              <TableHead className="text-center w-[10.625%]">1-Year</TableHead>
              <TableHead className="text-center w-[10.625%]">2-Year</TableHead>
              <TableHead className="text-center w-[10.625%]">3-Year</TableHead>
              <TableHead className="text-center w-[10.625%]">4-Year</TableHead>
              <TableHead className="text-center w-[10.625%]">5-Year</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium text-center w-[10.625%]">Percent</TableCell>
              <TableCell className={`text-center w-[10.625%] ${data.month.percent !== null && data.month.percent >= 0 ? "text-green-500" : data.month.percent !== null ? "text-red-500" : ""}`}>
                {data.month.percent ? formatPercent(data.month.percent) : "-"}
              </TableCell>
              <TableCell className={`text-center w-[10.625%] ${data.threeMonth.percent !== null && data.threeMonth.percent >= 0 ? "text-green-500" : data.threeMonth.percent !== null ? "text-red-500" : ""}`}>
                {data.threeMonth.percent ? formatPercent(data.threeMonth.percent) : "-"}
              </TableCell>
              <TableCell className={`text-center w-[10.625%] ${data.ytd.percent !== null && data.ytd.percent >= 0 ? "text-green-500" : data.ytd.percent !== null ? "text-red-500" : ""}`}>
                {data.ytd.percent ? formatPercent(data.ytd.percent) : "-"}
              </TableCell>
              <TableCell className={`text-center w-[10.625%] ${data.year.percent !== null && data.year.percent >= 0 ? "text-green-500" : data.year.percent !== null ? "text-red-500" : ""}`}>
                {data.year.percent ? formatPercent(data.year.percent) : "-"}
              </TableCell>
              <TableCell className={`text-center w-[10.625%] ${data.twoYear?.percent && data.twoYear.percent >= 0 ? "text-green-500" : data.twoYear?.percent ? "text-red-500" : ""}`}>
                {data.twoYear?.percent !== null && data.twoYear?.percent !== undefined 
                  ? formatPercent(data.twoYear.percent) 
                  : "-"}
              </TableCell>
              <TableCell className={`text-center w-[10.625%] ${data.threeYear.percent !== null && data.threeYear.percent >= 0 ? "text-green-500" : data.threeYear.percent !== null ? "text-red-500" : ""}`}>
                {data.threeYear.percent ? formatPercent(data.threeYear.percent) : "-"}
              </TableCell>
              <TableCell className={`text-center w-[10.625%] ${data.fourYear?.percent && data.fourYear.percent >= 0 ? "text-green-500" : data.fourYear?.percent ? "text-red-500" : ""}`}>
                {data.fourYear?.percent !== null && data.fourYear?.percent !== undefined 
                  ? formatPercent(data.fourYear.percent) 
                  : "-"}
              </TableCell>
              <TableCell className={`text-center w-[10.625%] ${data.fiveYear.percent !== null && data.fiveYear.percent >= 0 ? "text-green-500" : data.fiveYear.percent !== null ? "text-red-500" : ""}`}>
                {data.fiveYear.percent ? formatPercent(data.fiveYear.percent) : "-"}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium text-center w-[10.625%]">Dollar</TableCell>
              <TableCell className={`text-center w-[10.625%] ${data.month.dollar !== null && data.month.dollar >= 0 ? "text-green-500" : data.month.dollar !== null ? "text-red-500" : ""}`}>
                {data.month.dollar ? formatCurrency(data.month.dollar) : "-"}
              </TableCell>
              <TableCell className={`text-center w-[10.625%] ${data.threeMonth.dollar !== null && data.threeMonth.dollar >= 0 ? "text-green-500" : data.threeMonth.dollar !== null ? "text-red-500" : ""}`}>
                {data.threeMonth.dollar ? formatCurrency(data.threeMonth.dollar) : "-"}
              </TableCell>
              <TableCell className={`text-center w-[10.625%] ${data.ytd.dollar !== null && data.ytd.dollar >= 0 ? "text-green-500" : data.ytd.dollar !== null ? "text-red-500" : ""}`}>
                {data.ytd.dollar ? formatCurrency(data.ytd.dollar) : "-"}
              </TableCell>
              <TableCell className={`text-center w-[10.625%] ${data.year.dollar !== null && data.year.dollar >= 0 ? "text-green-500" : data.year.dollar !== null ? "text-red-500" : ""}`}>
                {data.year.dollar ? formatCurrency(data.year.dollar) : "-"}
              </TableCell>
              <TableCell className={`text-center w-[10.625%] ${data.twoYear?.dollar && data.twoYear.dollar >= 0 ? "text-green-500" : data.twoYear?.dollar ? "text-red-500" : ""}`}>
                {data.twoYear?.dollar !== null && data.twoYear?.dollar !== undefined 
                  ? formatCurrency(data.twoYear.dollar) 
                  : "-"}
              </TableCell>
              <TableCell className={`text-center w-[10.625%] ${data.threeYear.dollar !== null && data.threeYear.dollar >= 0 ? "text-green-500" : data.threeYear.dollar !== null ? "text-red-500" : ""}`}>
                {data.threeYear.dollar ? formatCurrency(data.threeYear.dollar) : "-"}
              </TableCell>
              <TableCell className={`text-center w-[10.625%] ${data.fourYear?.dollar && data.fourYear.dollar >= 0 ? "text-green-500" : data.fourYear?.dollar ? "text-red-500" : ""}`}>
                {data.fourYear?.dollar !== null && data.fourYear?.dollar !== undefined 
                  ? formatCurrency(data.fourYear.dollar) 
                  : "-"}
              </TableCell>
              <TableCell className={`text-center w-[10.625%] ${data.fiveYear.dollar !== null && data.fiveYear.dollar >= 0 ? "text-green-500" : data.fiveYear.dollar !== null ? "text-red-500" : ""}`}>
                {data.fiveYear.dollar ? formatCurrency(data.fiveYear.dollar) : "-"}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
