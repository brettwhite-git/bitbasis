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
import { getBenchmarkCAGR } from "@/lib/constants/benchmark-cagr"

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
  // Helper function to format CAGR values
  const formatCAGRValue = (value: number | null, isApproximate = false): string => {
    if (value === null) return "-"
    const formatted = formatPercent(value)
    return isApproximate ? `~${formatted}` : formatted
  }
  
  // Helper function to determine if a value is approximate (less than 1 year of data)
  const isApproximate = (period: keyof typeof data): boolean => {
    // Only 1-year can be approximate for users with less than 1 year of data
    return period === 'oneYear' && data.oneYear !== null && 
           (data.twoYear === null && data.threeYear === null)
  }

  return (
    <div className="bg-gradient-to-br from-gray-800/20 via-gray-900/30 to-gray-800/20 p-6 shadow-md backdrop-blur-sm rounded-xl">
      <div>
        <h3 className="text-sm font-medium mb-4 text-white">
          Portfolio vs. Traditional Assets CAGR
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger className="cursor-default">
                <Info className="ml-2 h-4 w-4 text-bitcoin-orange inline-block" />
              </TooltipTrigger>
              <TooltipContent>
                <div className="max-w-xs">
                  <p>Compares your portfolio&apos;s compound annual growth rate (CAGR) against Bitcoin, Gold, and S&P 500.</p>
                  <p className="mt-2 text-xs text-gray-300">Values marked with ~ are approximate for periods less than 1 year.</p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </h3>
        <Table className="table-fixed w-full">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-center w-[11.11%]"></TableHead>
              <TableHead className="text-center w-[11.11%]">1-Year</TableHead>
              <TableHead className="text-center w-[11.11%]">2-Year</TableHead>
              <TableHead className="text-center w-[11.11%]">3-Year</TableHead>
              <TableHead className="text-center w-[11.11%]">4-Year</TableHead>
              <TableHead className="text-center w-[11.11%]">5-Year</TableHead>
              <TableHead className="text-center w-[11.11%]">6-Year</TableHead>
              <TableHead className="text-center w-[11.11%]">7-Year</TableHead>
              <TableHead className="text-center w-[11.11%]">8-Year</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium text-center w-[11.11%]">
                Your Portfolio
              </TableCell>
              <TableCell className="text-center w-[11.11%] text-bitcoin-orange font-medium">
                {formatCAGRValue(data.oneYear, isApproximate('oneYear'))}
              </TableCell>
              <TableCell className="text-center w-[11.11%] text-bitcoin-orange font-medium">
                {formatCAGRValue(data.twoYear)}
              </TableCell>
              <TableCell className="text-center w-[11.11%] text-bitcoin-orange font-medium">
                {formatCAGRValue(data.threeYear)}
              </TableCell>
              <TableCell className="text-center w-[11.11%] text-bitcoin-orange font-medium">
                {formatCAGRValue(data.fourYear)}
              </TableCell>
              <TableCell className="text-center w-[11.11%] text-bitcoin-orange font-medium">
                {formatCAGRValue(data.fiveYear)}
              </TableCell>
              <TableCell className="text-center w-[11.11%] text-bitcoin-orange font-medium">
                {formatCAGRValue(data.sixYear)}
              </TableCell>
              <TableCell className="text-center w-[11.11%] text-bitcoin-orange font-medium">
                {formatCAGRValue(data.sevenYear)}
              </TableCell>
              <TableCell className="text-center w-[11.11%] text-bitcoin-orange font-medium">
                {formatCAGRValue(data.eightYear)}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium text-center w-[11.11%]">Bitcoin</TableCell>
              <TableCell className="text-center w-[11.11%] text-orange-400">
                {formatPercent(getBenchmarkCAGR(1)?.bitcoin || 0)}
              </TableCell>
              <TableCell className="text-center w-[11.11%] text-orange-400">
                {formatPercent(getBenchmarkCAGR(2)?.bitcoin || 0)}
              </TableCell>
              <TableCell className="text-center w-[11.11%] text-orange-400">
                {formatPercent(getBenchmarkCAGR(3)?.bitcoin || 0)}
              </TableCell>
              <TableCell className="text-center w-[11.11%] text-orange-400">
                {formatPercent(getBenchmarkCAGR(4)?.bitcoin || 0)}
              </TableCell>
              <TableCell className="text-center w-[11.11%] text-orange-400">
                {formatPercent(getBenchmarkCAGR(5)?.bitcoin || 0)}
              </TableCell>
              <TableCell className="text-center w-[11.11%] text-orange-400">
                {formatPercent(getBenchmarkCAGR(6)?.bitcoin || 0)}
              </TableCell>
              <TableCell className="text-center w-[11.11%] text-orange-400">
                {formatPercent(getBenchmarkCAGR(7)?.bitcoin || 0)}
              </TableCell>
              <TableCell className="text-center w-[11.11%] text-orange-400">
                {formatPercent(getBenchmarkCAGR(8)?.bitcoin || 0)}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium text-center w-[11.11%]">Gold</TableCell>
              <TableCell className="text-center w-[11.11%] text-yellow-500">
                {formatPercent(getBenchmarkCAGR(1)?.gold || 0)}
              </TableCell>
              <TableCell className="text-center w-[11.11%] text-yellow-500">
                {formatPercent(getBenchmarkCAGR(2)?.gold || 0)}
              </TableCell>
              <TableCell className="text-center w-[11.11%] text-yellow-500">
                {formatPercent(getBenchmarkCAGR(3)?.gold || 0)}
              </TableCell>
              <TableCell className="text-center w-[11.11%] text-yellow-500">
                {formatPercent(getBenchmarkCAGR(4)?.gold || 0)}
              </TableCell>
              <TableCell className="text-center w-[11.11%] text-yellow-500">
                {formatPercent(getBenchmarkCAGR(5)?.gold || 0)}
              </TableCell>
              <TableCell className="text-center w-[11.11%] text-yellow-500">
                {formatPercent(getBenchmarkCAGR(6)?.gold || 0)}
              </TableCell>
              <TableCell className="text-center w-[11.11%] text-yellow-500">
                {formatPercent(getBenchmarkCAGR(7)?.gold || 0)}
              </TableCell>
              <TableCell className="text-center w-[11.11%] text-yellow-500">
                {formatPercent(getBenchmarkCAGR(8)?.gold || 0)}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium text-center w-[11.11%]">S&P 500</TableCell>
              <TableCell className="text-center w-[11.11%] text-green-500">
                {formatPercent(getBenchmarkCAGR(1)?.sp500 || 0)}
              </TableCell>
              <TableCell className="text-center w-[11.11%] text-green-500">
                {formatPercent(getBenchmarkCAGR(2)?.sp500 || 0)}
              </TableCell>
              <TableCell className="text-center w-[11.11%] text-green-500">
                {formatPercent(getBenchmarkCAGR(3)?.sp500 || 0)}
              </TableCell>
              <TableCell className="text-center w-[11.11%] text-green-500">
                {formatPercent(getBenchmarkCAGR(4)?.sp500 || 0)}
              </TableCell>
              <TableCell className="text-center w-[11.11%] text-green-500">
                {formatPercent(getBenchmarkCAGR(5)?.sp500 || 0)}
              </TableCell>
              <TableCell className="text-center w-[11.11%] text-green-500">
                {formatPercent(getBenchmarkCAGR(6)?.sp500 || 0)}
              </TableCell>
              <TableCell className="text-center w-[11.11%] text-green-500">
                {formatPercent(getBenchmarkCAGR(7)?.sp500 || 0)}
              </TableCell>
              <TableCell className="text-center w-[11.11%] text-green-500">
                {formatPercent(getBenchmarkCAGR(8)?.sp500 || 0)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
