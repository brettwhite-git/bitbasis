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
    <div className="w-full space-y-6">
      <div className="w-full">
        <h1 className="text-2xl font-bold tracking-tight text-white">Import Data</h1>
      </div>

      {/* Template Downloads Section */}
      <div className="w-full">
        <Card>
          <CardHeader>
            <CardTitle>CSV Templates</CardTitle>
            <CardDescription>Download template files for different transaction types</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Order Transactions Template */}
              <div className="flex flex-col items-center p-6 space-y-4 rounded-lg border border-border bg-card/50 hover:bg-card/80 transition-colors">
                <div className="p-3 rounded-full bg-bitcoin-orange/10">
                  <FileDown className="h-6 w-6 text-bitcoin-orange" />
                </div>
                <h3 className="text-lg font-semibold">Order Transactions</h3>
                <p className="text-sm text-muted-foreground text-center">Template for buy/sell transactions with price and amount fields</p>
                <Button variant="outline" className="w-full">
                  <FileDown className="mr-2 h-4 w-4" />
                  Download Template
                </Button>
              </div>

              {/* Send Transactions Template */}
              <div className="flex flex-col items-center p-6 space-y-4 rounded-lg border border-border bg-card/50 hover:bg-card/80 transition-colors">
                <div className="p-3 rounded-full bg-bitcoin-orange/10">
                  <FileDown className="h-6 w-6 text-bitcoin-orange" />
                </div>
                <h3 className="text-lg font-semibold">Send Transactions</h3>
                <p className="text-sm text-muted-foreground text-center">Template for outgoing Bitcoin transfers with network fees</p>
                <Button variant="outline" className="w-full">
                  <FileDown className="mr-2 h-4 w-4" />
                  Download Template
                </Button>
              </div>

              {/* Receive Transactions Template */}
              <div className="flex flex-col items-center p-6 space-y-4 rounded-lg border border-border bg-card/50 hover:bg-card/80 transition-colors">
                <div className="p-3 rounded-full bg-bitcoin-orange/10">
                  <FileDown className="h-6 w-6 text-bitcoin-orange" />
                </div>
                <h3 className="text-lg font-semibold">Receive Transactions</h3>
                <p className="text-sm text-muted-foreground text-center">Template for incoming Bitcoin transfers and deposits</p>
                <Button variant="outline" className="w-full">
                  <FileDown className="mr-2 h-4 w-4" />
                  Download Template
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="w-full">
        <Card>
          <CardHeader>
            <CardTitle>Import Transactions</CardTitle>
            <CardDescription>Upload CSV files or manually enter your Bitcoin transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <ImportForm />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

