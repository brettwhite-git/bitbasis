"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { UnifiedTransaction } from "@/types/transactions"
import { exportTransactionsToCSV, importTransactionsFromCSV } from "@/lib/utils/transaction-export"
import { FileDown, Upload } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils/utils"

interface ImportExportModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  transactions: UnifiedTransaction[]
  onImportSuccess?: (count: number) => void
}

/**
 * Modal for handling CSV file import and export
 */
export function ImportExportModal({
  open,
  onOpenChange,
  transactions,
  onImportSuccess
}: ImportExportModalProps) {
  const [activeTab, setActiveTab] = useState<string>("import")
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)

  // Handle CSV export
  const handleExport = async () => {
    try {
      setIsExporting(true)
      await exportTransactionsToCSV(transactions)
      // Close the modal after successful export
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to export transactions:', error)
      // Error would be shown here
    } finally {
      setIsExporting(false)
    }
  }

  // Handle file selection for import
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files && files.length > 0) {
      // Type assertion to help TypeScript understand this won't be undefined
      const file = files[0] as File
      setImportFile(file)
      setImportError(null)
    }
  }

  // Handle file drop for import
  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setDragActive(false)
    
    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      // Type assertion to help TypeScript understand this won't be undefined
      const file = event.dataTransfer.files[0] as File
      // Check if it's a CSV file
      if (file.type === "text/csv" || file.name.endsWith(".csv")) {
        setImportFile(file)
        setImportError(null)
      } else {
        setImportError("Please select a CSV file")
      }
    }
  }

  // Handle drag events
  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setDragActive(true)
  }

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setDragActive(false)
  }

  // Handle CSV import
  const handleImport = async () => {
    if (!importFile) {
      setImportError("Please select a file to import")
      return
    }

    try {
      setIsImporting(true)
      setImportError(null)
      
      // This is where the actual import would happen
      // For now, it's just a placeholder
      // const importedTransactions = await importTransactionsFromCSV(importFile)
      
      // Here you'd send the imported data to your API
      // const response = await fetch('/api/transactions/import', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ transactions: importedTransactions }),
      // })
      
      // Show success message
      if (onImportSuccess) {
        onImportSuccess(0) // Replace with actual count
      }
      
      // Close modal
      onOpenChange(false)
    } catch (error: any) {
      console.error('Import failed:', error)
      setImportError(error.message || 'Failed to import file')
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Import/Export Transactions</DialogTitle>
          <DialogDescription>
            Import transactions from a CSV file or export your current transactions.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="import" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="import">Import</TabsTrigger>
            <TabsTrigger value="export">Export</TabsTrigger>
          </TabsList>
          
          {/* Import Tab */}
          <TabsContent value="import" className="py-4">
            <div className="space-y-4">
              <div className="text-sm">
                Import transactions from a CSV file. Your file should include columns for date, type, 
                asset, amount, and price.
              </div>
              
              <div 
                className={cn(
                  "border-2 border-dashed rounded-md p-6 text-center",
                  dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/20",
                  importError && "border-destructive"
                )}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                
                <div className="text-sm font-medium mb-2">
                  {importFile ? importFile.name : "Drag and drop your CSV file here"}
                </div>
                
                <div className="text-xs text-muted-foreground mb-3">
                  {!importFile && "or"}
                </div>
                
                <Label htmlFor="file-upload" className="cursor-pointer">
                  <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    onClick={() => document.getElementById('file-upload')?.click()}
                  >
                    Browse Files
                  </Button>
                  <Input
                    id="file-upload"
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </Label>
                
                {importError && (
                  <div className="text-xs text-destructive mt-2">
                    {importError}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Export Tab */}
          <TabsContent value="export" className="py-4">
            <div className="space-y-4">
              <div className="text-sm">
                Export your transaction data as a CSV file that you can open in spreadsheet applications 
                like Excel or Google Sheets.
              </div>
              
              <div className="flex justify-center pt-4">
                <Button 
                  onClick={handleExport} 
                  disabled={isExporting || transactions.length === 0}
                  className="w-full sm:w-auto"
                >
                  <FileDown className="mr-2 h-4 w-4" />
                  {isExporting ? "Exporting..." : "Export Transactions"}
                </Button>
              </div>
              
              {transactions.length === 0 && (
                <div className="text-sm text-muted-foreground text-center mt-2">
                  You don't have any transactions to export.
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          {activeTab === "import" && (
            <Button 
              onClick={handleImport} 
              disabled={!importFile || isImporting}
              className="w-full sm:w-auto"
            >
              {isImporting ? "Importing..." : "Import Transactions"}
            </Button>
          )}
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 