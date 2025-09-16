"use client"

import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, ChevronRight, Calendar, DollarSign, Package } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAddTransactionWizard } from '../add-transaction-wizard-context'
import { 
  NewTransaction, 
  transactionSchema, 
  transactionTypeConfigs,
  FieldConfig 
} from '@/types/add-transaction'

interface DynamicFieldProps {
  field: FieldConfig
  value: string | number | boolean | undefined
  onChange: (value: string | number | boolean | undefined) => void
  error?: string
}

function DynamicField({ field, value, onChange, error }: DynamicFieldProps) {
  const baseClasses = "bg-gray-800/50 border-gray-600/50 text-white placeholder:text-gray-400 focus:border-bitcoin-orange focus:ring-bitcoin-orange/20"
  
  switch (field.type) {
    case 'number':
      return (
        <div className="space-y-2">
          <Label htmlFor={field.name} className="text-sm font-medium text-white">
            {field.label}
            {field.required && <span className="text-red-400 ml-1">*</span>}
          </Label>
          <Input
            id={field.name}
            type="text"
            inputMode="decimal"
            placeholder={field.placeholder}
            value={value !== null && value !== undefined ? value.toString() : ''}
            onChange={(e) => {
              const inputValue = e.target.value
              
              // Allow empty input
              if (inputValue === '') {
                onChange(null)
                return
              }
              
              // Allow natural decimal number entry for Bitcoin
              // This regex allows: 0, 0., .5, 0.5, 0.00000001, .00000001, etc.
              if (/^\.?\d*\.?\d*$/.test(inputValue)) {
                // Always store as string during typing to preserve leading zeros and decimal format
                onChange(inputValue)
              }
              // If invalid format, don't update the value (ignore the keystroke)
            }}
            onBlur={(e) => {
              // Convert to number on blur for form validation, but preserve string if it's a valid partial entry
              const inputValue = e.target.value
              if (inputValue && inputValue !== '.' && inputValue !== '') {
                const numValue = parseFloat(inputValue)
                if (!isNaN(numValue) && numValue >= 0) {
                  // For final validation, convert to number
                  onChange(numValue)
                } else if (inputValue.match(/^\.?\d*\.?\d*$/)) {
                  // Keep valid partial entries as strings
                  onChange(inputValue)
                }
              }
            }}
            className={cn(baseClasses, error && "border-red-500 focus:border-red-500")}
          />
          {field.description && (
            <p className="text-xs text-gray-400">{field.description}</p>
          )}
          {error && (
            <p className="text-xs text-red-400">{error}</p>
          )}
        </div>
      )

    case 'select':
      return (
        <div className="space-y-2">
          <Label htmlFor={field.name} className="text-sm font-medium text-white">
            {field.label}
            {field.required && <span className="text-red-400 ml-1">*</span>}
          </Label>
          <Select value={value || ''} onValueChange={onChange}>
            <SelectTrigger className={cn(baseClasses, error && "border-red-500")}>
              <SelectValue placeholder={field.placeholder} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {field.description && (
            <p className="text-xs text-gray-400">{field.description}</p>
          )}
          {error && (
            <p className="text-xs text-red-400">{error}</p>
          )}
        </div>
      )

    case 'textarea':
      return (
        <div className="space-y-2">
          <Label htmlFor={field.name} className="text-sm font-medium text-white">
            {field.label}
            {field.required && <span className="text-red-400 ml-1">*</span>}
          </Label>
          <Textarea
            id={field.name}
            placeholder={field.placeholder}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className={cn(baseClasses, error && "border-red-500 focus:border-red-500")}
            rows={3}
          />
          {field.description && (
            <p className="text-xs text-gray-400">{field.description}</p>
          )}
          {error && (
            <p className="text-xs text-red-400">{error}</p>
          )}
        </div>
      )

    default: // text
      return (
        <div className="space-y-2">
          <Label htmlFor={field.name} className="text-sm font-medium text-white">
            {field.label}
            {field.required && <span className="text-red-400 ml-1">*</span>}
          </Label>
          <Input
            id={field.name}
            type="text"
            placeholder={field.placeholder}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className={cn(baseClasses, error && "border-red-500 focus:border-red-500")}
          />
          {field.description && (
            <p className="text-xs text-gray-400">{field.description}</p>
          )}
          {error && (
            <p className="text-xs text-red-400">{error}</p>
          )}
        </div>
      )
  }
}

export function TransactionDetailsStep() {
  const { 
    transactionData, 
    updateTransactionData, 
    nextStep, 
    prevStep,
    addToStaging,
    stagedTransactions,
    goToStep
  } = useAddTransactionWizard()

  const selectedType = transactionData.type!
  const config = transactionTypeConfigs[selectedType]

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors: formErrors }
  } = useForm<NewTransaction>({
    resolver: zodResolver(transactionSchema),
    mode: 'onChange',
    defaultValues: transactionData as NewTransaction
  })

  const watchedValues = watch()

  // Remove the automatic sync that causes infinite loops
  // Instead, we'll update context data only when form is submitted or specific actions occur

  const onSubmit = (data: NewTransaction) => {
    try {
      // Validate the complete transaction
      const validatedTransaction = transactionSchema.parse(data)
      
      // Update context with current form data before staging
      updateTransactionData(validatedTransaction)
      
      // Add to staging
      addToStaging(validatedTransaction)
    } catch (error) {
      console.error('Validation error:', error)
      
      // Show user-friendly error message
      if (error instanceof Error) {
        toast.error('Validation Error', {
          description: error.message || 'Please check your transaction details and try again.'
        })
      }
    }
  }

  const handleNext = () => {
    // Update context with current form data before proceeding
    updateTransactionData(watchedValues)
    nextStep()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center space-x-2">
          <h2 className="text-2xl font-bold text-white">Transaction Details</h2>
          <Badge 
            variant="secondary" 
            className="bg-bitcoin-orange/20 text-bitcoin-orange border-bitcoin-orange/30"
          >
            {config.title}
          </Badge>
        </div>
        <p className="text-gray-400">{config.description}</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Core Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Date & Time */}
          <div className="space-y-2">
            <Label htmlFor="date" className="text-sm font-medium text-white">
              Date & Time
              <span className="text-red-400 ml-1">*</span>
            </Label>
            <div className="relative">
              <Input
                id="date"
                type="datetime-local"
                {...register('date', { required: 'Date is required' })}
                className="bg-gray-800/50 border-gray-600/50 text-white focus:border-bitcoin-orange focus:ring-bitcoin-orange/20 pl-10"
              />
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
            {formErrors.date && (
              <p className="text-xs text-red-400">{formErrors.date.message}</p>
            )}
          </div>

          {/* Price */}
          <div className="space-y-2">
            <Label htmlFor="price" className="text-sm font-medium text-white">
              BTC Price (USD)
              <span className="text-red-400 ml-1">*</span>
            </Label>
            <div className="relative">
              <Input
                id="price"
                type="number"
                step="0.01"
                placeholder="Price at transaction"
                {...register('price', { 
                  required: 'BTC price is required',
                  valueAsNumber: true,
                  min: { value: 0.01, message: 'Price must be greater than 0' }
                })}
                className="bg-gray-800/50 border-gray-600/50 text-white focus:border-bitcoin-orange focus:ring-bitcoin-orange/20 pl-10"
              />
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
            <p className="text-xs text-gray-400">
              Enter the BTC price at the time of this transaction
            </p>
            {formErrors.price && (
              <p className="text-xs text-red-400">{formErrors.price.message}</p>
            )}
          </div>
        </div>

        {/* Dynamic Fields Based on Transaction Type */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white border-b border-gray-700/50 pb-2">
            {config.title} Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {config.fields.map((field) => (
              <DynamicField
                key={field.name}
                field={field}
                value={watchedValues[field.name as keyof NewTransaction]}
                onChange={(value) => setValue(field.name as keyof NewTransaction, value)}
                error={formErrors[field.name as keyof NewTransaction]?.message}
              />
            ))}
          </div>
        </div>

        {/* Comment Field */}
        <div className="space-y-2">
          <Label htmlFor="comment" className="text-sm font-medium text-white">
            Notes / Comments
            <span className="text-gray-400 ml-1">(optional)</span>
          </Label>
          <Textarea
            id="comment"
            placeholder="Add any additional notes about this transaction..."
            {...register('comment')}
            className="bg-gray-800/50 border-gray-600/50 text-white placeholder:text-gray-400 focus:border-bitcoin-orange focus:ring-bitcoin-orange/20"
            rows={3}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={prevStep}
            className="bg-gray-800/40 border-gray-600/50 hover:bg-gray-700/50 text-white"
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          
          <div className="flex space-x-3">
            {/* Show current staging count if any */}
            {stagedTransactions.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToStep('review')}
                className="bg-blue-600/20 border-blue-600/30 text-blue-300 hover:bg-blue-600/30 hover:text-blue-200 px-3 py-2"
              >
                <Package className="h-4 w-4 mr-2" />
                <span className="text-sm">
                  {stagedTransactions.length} staged
                </span>
              </Button>
            )}
            
            <Button
              type="submit"
              className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white border-0"
            >
              {stagedTransactions.length > 0 ? 'Add Another' : 'Add to Staging'}
            </Button>
            
            <Button
              type="button"
              onClick={handleNext}
              disabled={stagedTransactions.length === 0}
              className="bg-gradient-to-r from-bitcoin-orange to-[#D4A76A] hover:from-bitcoin-orange/90 hover:to-[#D4A76A]/90 text-white border-0 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Review & Submit
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
} 