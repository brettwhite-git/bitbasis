"use client"

import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ImportProvider, useImport } from './ImportContext'
import { ArrowLeft, Loader2 } from 'lucide-react'

// Import step components
import { UploadStep } from './UploadStep'
import { PreviewStep } from './PreviewStep'
import { ConfirmationStep } from './ConfirmationStep'

interface ImportModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImportSuccess?: (count: number) => void
}

function ImportModalContent() {
  const { step, setStep, isLoading, loadingState, error, resetImportState } = useImport()
  
  // Handle back button navigation
  const handleBack = () => {
    if (step === 'preview') {
      setStep('upload')
    } else if (step === 'confirmation') {
      setStep('preview')
    }
  }

  // Loading indicator component for various states
  const LoadingIndicator = () => {
    const loadingMessages = {
      idle: 'Processing...',
      uploading: 'Uploading file...',
      parsing: 'Parsing data...',
      validating: 'Validating transactions...',
      importing: 'Importing transactions...'
    }
    
    return isLoading ? (
      <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-50">
        <div className="flex flex-col items-center gap-3 p-6 bg-card rounded-lg border shadow-lg">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm font-medium">{loadingMessages[loadingState] || 'Processing...'}</p>
        </div>
      </div>
    ) : null
  }

  // Handle modal step content
  const renderStepContent = () => {
    switch (step) {
      case 'upload':
        return <UploadStep />
      case 'preview':
        return <PreviewStep />
      case 'confirmation':
        return <ConfirmationStep />
      default:
        return <div>Invalid step</div>
    }
  }

  // Step indicator/progress bar
  const StepIndicator = () => {
    const steps = [
      { id: 'upload', label: 'Upload' },
      { id: 'preview', label: 'Preview' },
      { id: 'confirmation', label: 'Confirm' }
    ]
    
    const currentIndex = steps.findIndex(s => s.id === step)
    
    return (
      <div className="flex items-center justify-center w-full mb-6">
        {steps.map((s, idx) => (
          <React.Fragment key={s.id}>
            <div className="flex flex-col items-center">
              <div 
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  idx <= currentIndex 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {idx + 1}
              </div>
              <span className="text-xs mt-1">{s.label}</span>
            </div>
            {idx < steps.length - 1 && (
              <div 
                className={`h-1 flex-1 mx-2 ${
                  idx < currentIndex ? 'bg-primary' : 'bg-muted'
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    )
  }
  
  return (
    <>
      <DialogHeader>
        <DialogTitle>Import Transactions</DialogTitle>
        <DialogDescription>
          Import your transaction data from a CSV file.
        </DialogDescription>
      </DialogHeader>
      
      <StepIndicator />
      
      {/* Error message if any */}
      {error && (
        <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md mb-4">
          {error}
        </div>
      )}
      
      {/* Step content */}
      <div className="relative">
        {renderStepContent()}
        <LoadingIndicator />
      </div>
      
      {/* Navigation buttons */}
      <div className="flex justify-between mt-6">
        {step !== 'upload' ? (
          <Button 
            variant="outline" 
            onClick={handleBack}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        ) : (
          <Button 
            variant="outline" 
            onClick={resetImportState}
            className="opacity-0 pointer-events-none"
          >
            Cancel
          </Button>
        )}
        
        {/* Step-specific buttons will be inside each step component */}
      </div>
    </>
  )
}

export function ImportModal({ open, onOpenChange, onImportSuccess }: ImportModalProps) {
  return (
    <ImportProvider onImportSuccess={onImportSuccess}>
      <ModalWithDynamicWidth open={open} onOpenChange={onOpenChange} />
    </ImportProvider>
  )
}

// Separate component to use the context after it's provided
function ModalWithDynamicWidth({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const { step } = useImport()
  
  // Determine modal width based on current step
  const modalWidth = step === 'preview' ? 'sm:max-w-[1100px]' : 'sm:max-w-[700px]'
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`${modalWidth} max-h-[90vh] overflow-y-auto`}>
        <ImportModalContent />
      </DialogContent>
    </Dialog>
  )
} 