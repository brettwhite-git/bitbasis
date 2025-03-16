"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export function ImportForm() {
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0]
      if (droppedFile.type === "text/csv") {
        setFile(droppedFile)
      }
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0])
    }
  }

  return (
    <Tabs defaultValue="csv" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="csv">CSV Upload</TabsTrigger>
        <TabsTrigger value="manual">Manual Entry</TabsTrigger>
      </TabsList>
      <TabsContent value="csv" className="mt-4">
        <div
          className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center ${
            isDragging ? "border-bitcoin-orange bg-bitcoin-orange/10" : "border-border"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Upload className="h-6 w-6 text-bitcoin-orange" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-white">{file ? file.name : "Drag and drop your CSV file"}</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {file ? `${(file.size / 1024).toFixed(2)} KB` : "Or click to browse files"}
          </p>
          <Input id="file-upload" type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
          <Label
            htmlFor="file-upload"
            className="mt-4 cursor-pointer rounded-md bg-bitcoin-orange px-4 py-2 text-sm font-medium text-white hover:bg-bitcoin-dark"
          >
            Browse Files
          </Label>
        </div>

        {file && (
          <div className="mt-4 flex justify-end">
            <Button className="bg-bitcoin-orange hover:bg-bitcoin-dark text-white">Upload and Process</Button>
          </div>
        )}

        <Alert className="mt-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Supported Formats</AlertTitle>
          <AlertDescription>
            <p className="mt-2 text-sm text-muted-foreground">
              We support CSV files from most major exchanges and wallets. The file should include:
            </p>
            <ul className="mt-2 list-disc pl-5 text-sm text-muted-foreground">
              <li>Transaction date</li>
              <li>Transaction type (buy/sell)</li>
              <li>Amount of Bitcoin</li>
              <li>Price per Bitcoin</li>
              <li>Total cost/proceeds</li>
              <li>Fees (if applicable)</li>
            </ul>
          </AlertDescription>
        </Alert>
      </TabsContent>
      <TabsContent value="manual" className="mt-4">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="transaction-date">Transaction Date</Label>
              <Input id="transaction-date" type="date" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="transaction-type">Transaction Type</Label>
              <select
                id="transaction-type"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="buy">Buy</option>
                <option value="sell">Sell</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="btc-amount">BTC Amount</Label>
              <Input id="btc-amount" type="number" step="0.00000001" placeholder="0.00000000" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price-per-btc">Price per BTC (USD)</Label>
              <Input id="price-per-btc" type="number" step="0.01" placeholder="0.00" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="total-cost">Total Cost/Proceeds (USD)</Label>
              <Input id="total-cost" type="number" step="0.01" placeholder="0.00" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fee">Fee (USD)</Label>
              <Input id="fee" type="number" step="0.01" placeholder="0.00" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <textarea
              id="notes"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Add any notes about this transaction"
            />
          </div>
          <div className="flex justify-end">
            <Button className="bg-bitcoin-orange hover:bg-bitcoin-dark text-white">Add Transaction</Button>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  )
}

