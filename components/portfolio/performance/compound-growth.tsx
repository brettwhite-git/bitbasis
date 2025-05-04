"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatPercent } from "@/lib/utils/utils"
import { Info } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface CompoundGrowthProps {
  data: {
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

export function CompoundGrowth({ data }: CompoundGrowthProps) {
  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
      <div className="p-6">
        <h3 className="text-sm font-medium mb-4">
          Compound Growth Rate
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger className="cursor-default">
                <Info className="ml-2 h-4 w-4 text-bitcoin-orange inline-block" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Shows the annual growth rate of your portfolio over different time periods.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </h3>
        <Table className="table-fixed w-full">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-center w-[10.625%]"></TableHead>
              <TableHead className="text-center w-[10.625%]">1-Year</TableHead>
              <TableHead className="text-center w-[10.625%]">2-Year</TableHead>
              <TableHead className="text-center w-[10.625%]">3-Year</TableHead>
              <TableHead className="text-center w-[10.625%]">4-Year</TableHead>
              <TableHead className="text-center w-[10.625%]">5-Year</TableHead>
              <TableHead className="text-center w-[10.625%]">6-Year</TableHead>
              <TableHead className="text-center w-[10.625%]">7-Year</TableHead>
              <TableHead className="text-center w-[10.625%]">8-Year</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium text-center w-[10.625%]">
                Your Portfolio
              </TableCell>
              <TableCell className="text-center w-[10.625%] text-bitcoin-orange">
                {data.oneYear ? formatPercent(data.oneYear) : "-"}
              </TableCell>
              <TableCell className="text-center w-[10.625%] text-bitcoin-orange">
                {data.twoYear ? formatPercent(data.twoYear) : "-"}
              </TableCell>
              <TableCell className="text-center w-[10.625%] text-bitcoin-orange">
                {data.threeYear ? formatPercent(data.threeYear) : "-"}
              </TableCell>
              <TableCell className="text-center w-[10.625%] text-bitcoin-orange">
                {data.fourYear ? formatPercent(data.fourYear) : "-"}
              </TableCell>
              <TableCell className="text-center w-[10.625%] text-bitcoin-orange">
                {data.fiveYear ? formatPercent(data.fiveYear) : "-"}
              </TableCell>
              <TableCell className="text-center w-[10.625%] text-bitcoin-orange">
                {data.sixYear ? formatPercent(data.sixYear) : "-"}
              </TableCell>
              <TableCell className="text-center w-[10.625%] text-bitcoin-orange">
                {data.sevenYear ? formatPercent(data.sevenYear) : "-"}
              </TableCell>
              <TableCell className="text-center w-[10.625%] text-bitcoin-orange">
                {data.eightYear ? formatPercent(data.eightYear) : "-"}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium text-center w-[10.625%]">Bitcoin</TableCell>
              <TableCell className="text-center w-[10.625%] text-bitcoin-orange">+48%</TableCell>
              <TableCell className="text-center w-[10.625%] text-bitcoin-orange">+79%</TableCell>
              <TableCell className="text-center w-[10.625%] text-bitcoin-orange">+34%</TableCell>
              <TableCell className="text-center w-[10.625%] text-bitcoin-orange">+15%</TableCell>
              <TableCell className="text-center w-[10.625%] text-bitcoin-orange">+63%</TableCell>
              <TableCell className="text-center w-[10.625%] text-bitcoin-orange">+62%</TableCell>
              <TableCell className="text-center w-[10.625%] text-bitcoin-orange">+39%</TableCell>
              <TableCell className="text-center w-[10.625%] text-bitcoin-orange">+70%</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium text-center w-[10.625%]">Gold</TableCell>
              <TableCell className="text-center w-[10.625%] text-green-500">+42%</TableCell>
              <TableCell className="text-center w-[10.625%] text-green-500">+29%</TableCell>
              <TableCell className="text-center w-[10.625%] text-green-500">+21%</TableCell>
              <TableCell className="text-center w-[10.625%] text-green-500">+17%</TableCell>
              <TableCell className="text-center w-[10.625%] text-green-500">+14%</TableCell>
              <TableCell className="text-center w-[10.625%] text-green-500">+17%</TableCell>
              <TableCell className="text-center w-[10.625%] text-green-500">+14%</TableCell>
              <TableCell className="text-center w-[10.625%] text-green-500">+13%</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium text-center w-[10.625%]">S&P 500</TableCell>
              <TableCell className="text-center w-[10.625%] text-green-500">+8%</TableCell>
              <TableCell className="text-center w-[10.625%] text-green-500">+15%</TableCell>
              <TableCell className="text-center w-[10.625%] text-green-500">+10%</TableCell>
              <TableCell className="text-center w-[10.625%] text-green-500">+7%</TableCell>
              <TableCell className="text-center w-[10.625%] text-green-500">+14%</TableCell>
              <TableCell className="text-center w-[10.625%] text-green-500">+11%</TableCell>
              <TableCell className="text-center w-[10.625%] text-green-500">+11%</TableCell>
              <TableCell className="text-center w-[10.625%] text-green-500">+11%</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
