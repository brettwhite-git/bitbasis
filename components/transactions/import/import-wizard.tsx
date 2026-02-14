"use client"

import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ImportProvider, useImport } from './import-context'
import { ArrowLeft, Loader2 } from 'lucide-react'

// Import step components
import { UploadStep } from './upload-step'
import { MappingStep } from './mapping-step'
import { PreviewStep } from './preview-step'
import { ConfirmationStep } from './confirmation-step'

interface ImportWizardProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImportSuccess?: (count: number) => void
}

// Loading indicator component for various states
const loadingMessages: Record<string, string> = {
  idle: 'Processing...',
  uploading: 'Uploading file...',
  parsing: 'Parsing CSV data...',
  mapping: 'Auto-detecting columns...',
  validating: 'Validating transactions...',
  importing: 'Importing transactions...'
}

function LoadingIndicator({ isLoading, loadingState }: { isLoading: boolean; loadingState: string }) {
  return isLoading ? (
    <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="flex flex-col items-center gap-3 p-6 bg-gradient-to-br from-gray-800/20 via-gray-900/40 to-gray-800/20 backdrop-blur-sm rounded-xl border border-gray-700/30 shadow-2xl">
        <Loader2 className="h-8 w-8 animate-spin text-bitcoin-orange" />
        <p className="text-sm font-medium text-white">{loadingMessages[loadingState] || 'Processing...'}</p>
      </div>
    </div>
  ) : null
}

// Step indicator/progress bar
const wizardSteps = [
  { id: 'upload', label: 'Upload' },
  { id: 'mapping', label: 'Map Fields' },
  { id: 'preview', label: 'Preview' },
  { id: 'confirmation', label: 'Confirm' }
]

function StepIndicator({ step }: { step: string }) {
  const currentIndex = wizardSteps.findIndex(s => s.id === step)

  return (
    <div className="flex items-center justify-center w-full mb-6">
      {wizardSteps.map((s, idx) => (
        <React.Fragment key={s.id}>
          <div className="flex flex-col items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-medium ${
                idx <= currentIndex
                  ? 'bg-gradient-to-r from-bitcoin-orange to-[#D4A76A] text-white'
                  : 'bg-gray-800/40 text-gray-400 border border-gray-700/50'
              }`}
            >
              {idx + 1}
            </div>
            <span className={`text-xs mt-1 ${idx <= currentIndex ? 'text-white' : 'text-gray-400'}`}>{s.label}</span>
          </div>
          {idx < wizardSteps.length - 1 && (
            <div
              className={`h-1 flex-1 mx-2 rounded-full ${
                idx < currentIndex ? 'bg-gradient-to-r from-bitcoin-orange to-[#D4A76A]' : 'bg-gray-700/50'
              }`}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  )
}

function ImportWizardContent() {
  const { step, setStep, isLoading, loadingState, error, resetImportState } = useImport()

  // Handle back button navigation
  const handleBack = () => {
    switch (step) {
      case 'mapping':
        setStep('upload')
        break
      case 'preview':
        setStep('mapping')
        break
      case 'confirmation':
        setStep('preview')
        break
    }
  }

  // Handle modal step content
  const renderStepContent = () => {
    switch (step) {
      case 'upload':
        return <UploadStep />
      case 'mapping':
        return <MappingStep />
      case 'preview':
        return <PreviewStep />
      case 'confirmation':
        return <ConfirmationStep />
      default:
        return <div>Invalid step</div>
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-white">Import Transactions</DialogTitle>
        <DialogDescription className="text-gray-300">
          Import your transaction data from a CSV file to the new unified transaction system.
        </DialogDescription>
      </DialogHeader>
      
      <StepIndicator step={step} />

      {/* Error message if any */}
      {error && (
        <div className="bg-red-500/5 text-red-400 text-sm p-3 rounded-xl border border-red-500/10 mb-4 backdrop-blur-sm">
          {error}
        </div>
      )}

      {/* Step content */}
      <div className="relative">
        {renderStepContent()}
        <LoadingIndicator isLoading={isLoading} loadingState={loadingState} />
      </div>
      
      {/* Navigation buttons */}
      <div className="flex justify-between mt-6">
        {step !== 'upload' ? (
          <Button 
            variant="outline" 
            onClick={handleBack}
            disabled={isLoading}
            className="flex items-center gap-2 bg-gray-800/40 border-gray-600/50 hover:bg-gray-700/50 text-white"
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

export function ImportWizard({ open, onOpenChange, onImportSuccess }: ImportWizardProps) {
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
  const getModalWidth = () => {
    switch (step) {
      case 'mapping':
      case 'preview':
        return 'sm:max-w-[1200px]'
      default:
        return 'sm:max-w-[700px]'
    }
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`${getModalWidth()} max-h-[90vh] overflow-y-auto bg-gradient-to-br from-gray-800/20 via-gray-900/40 to-gray-800/20 backdrop-blur-md border-gray-700/30 [&>button]:text-gray-400 [&>button]:hover:text-white [&>button]:hover:bg-gray-700/50`}>
        <ImportWizardContent />
      </DialogContent>
    </Dialog>
  )
} 