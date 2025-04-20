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
            <CardDescription>
              Download CSV file templates or manually enter transaction details.
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

