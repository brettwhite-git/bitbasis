"use client"

import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { ImportForm } from "@/components/import/import-form"
import { Button } from "@/components/ui/button"
import { FileDown } from "lucide-react"

export default function ImportPage() {
  return (
    <div className="flex-1 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Import Transactions</h1>
         
        </div>
      </div>

      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>CSV Templates</CardTitle>
            <CardDescription>
              Download our CSV templates to ensure your data is formatted correctly.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2">
            {/* Orders Template */}
            <div className="flex flex-col items-center p-6 space-y-4 rounded-lg border border-border bg-card/50 hover:bg-card/80 transition-colors">
              <div className="p-3 rounded-full bg-bitcoin-orange/10">
                <FileDown className="h-6 w-6 text-bitcoin-orange" />
              </div>
              <h3 className="text-lg font-semibold">Orders Template</h3>
              <p className="text-sm text-muted-foreground text-center">
                Template for buy and sell orders. Includes fields for fiat amounts,
                BTC amounts, prices, exchange fees, and metadata.
              </p>
              <Button variant="outline" className="w-full">
                <FileDown className="mr-2 h-4 w-4" />
                Download Orders Template
              </Button>
            </div>

            {/* Transfers Template */}
            <div className="flex flex-col items-center p-6 space-y-4 rounded-lg border border-border bg-card/50 hover:bg-card/80 transition-colors">
              <div className="p-3 rounded-full bg-bitcoin-orange/10">
                <FileDown className="h-6 w-6 text-bitcoin-orange" />
              </div>
              <h3 className="text-lg font-semibold">Transfers Template</h3>
              <p className="text-sm text-muted-foreground text-center">
                Template for deposits and withdrawals. Includes fields for BTC amounts,
                network fees, transaction hashes, and optional price data.
              </p>
              <Button variant="outline" className="w-full">
                <FileDown className="mr-2 h-4 w-4" />
                Download Transfers Template
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Import Data</CardTitle>
            <CardDescription>
              Upload your CSV file or manually enter transaction details.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ImportForm />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

