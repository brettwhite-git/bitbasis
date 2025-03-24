"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ImportForm } from "@/components/dashboard/import-form"

export default function ImportPage() {
  return (
    <div className="w-full space-y-6">
      <div className="w-full">
        <h1 className="text-2xl font-bold tracking-tight text-white">Import Data</h1>
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

