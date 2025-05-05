"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CheckCircle2 } from "lucide-react"

interface SuccessDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  message: string
}

/**
 * Dialog component for displaying success messages
 */
export function SuccessDialog({
  open,
  onOpenChange,
  message
}: SuccessDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-green-100/80 backdrop-blur-sm border border-green-200 shadow-xl max-w-md">
        <div className="flex flex-col items-center justify-center text-center py-4">
          <div className="w-16 h-16 rounded-full bg-green-400/90 flex items-center justify-center mb-4 shadow-sm">
            <CheckCircle2 className="h-10 w-10 text-white" />
          </div>
          <DialogTitle className="text-2xl font-bold text-green-800 mb-2">Success!</DialogTitle>
          <DialogDescription className="text-green-700 mb-8 text-base">
            {message}
          </DialogDescription>
          <Button 
            onClick={() => onOpenChange(false)}
            className="bg-green-500/90 hover:bg-green-600 text-white w-32 shadow-sm transition-all duration-200"
          >
            Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 