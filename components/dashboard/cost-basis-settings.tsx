"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { InfoIcon } from "lucide-react"

export function CostBasisSettings() {
  const [method, setMethod] = useState("fifo")

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-medium text-white">Default Cost Basis Method</h3>
        <p className="text-sm text-muted-foreground">Select your preferred method for calculating cost basis</p>
      </div>

      <RadioGroup value={method} onValueChange={setMethod} className="space-y-4">
        <div className="flex items-start space-x-2">
          <RadioGroupItem value="fifo" id="fifo" className="mt-1" />
          <div className="grid gap-1.5">
            <Label htmlFor="fifo" className="font-medium text-white">
              First In, First Out (FIFO)
            </Label>
            <p className="text-sm text-muted-foreground">
              Assumes the first Bitcoin you purchased is the first one you sell. This method typically results in lower
              capital gains for assets that appreciate over time.
            </p>
          </div>
        </div>
        <div className="flex items-start space-x-2">
          <RadioGroupItem value="lifo" id="lifo" className="mt-1" />
          <div className="grid gap-1.5">
            <Label htmlFor="lifo" className="font-medium text-white">
              Last In, First Out (LIFO)
            </Label>
            <p className="text-sm text-muted-foreground">
              Assumes the most recently purchased Bitcoin is the first one you sell. This method can be beneficial in a
              rising market.
            </p>
          </div>
        </div>
        <div className="flex items-start space-x-2">
          <RadioGroupItem value="average" id="average" className="mt-1" />
          <div className="grid gap-1.5">
            <Label htmlFor="average" className="font-medium text-white">
              Average Cost
            </Label>
            <p className="text-sm text-muted-foreground">
              Calculates the cost basis by taking the total amount spent on all Bitcoin purchases and dividing by the
              total number of Bitcoin acquired.
            </p>
          </div>
        </div>
      </RadioGroup>

      <Alert className="bg-secondary border-bitcoin-orange">
        <InfoIcon className="h-4 w-4 text-bitcoin-orange" />
        <AlertTitle className="text-white">Tax Implications</AlertTitle>
        <AlertDescription className="text-muted-foreground">
          Different cost basis methods can result in different tax liabilities. We recommend consulting with a tax
          professional to determine the best method for your situation.
        </AlertDescription>
      </Alert>

      <Button className="bg-bitcoin-orange hover:bg-bitcoin-dark text-white">Save Settings</Button>
    </div>
  )
}

