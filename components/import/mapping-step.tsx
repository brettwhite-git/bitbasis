"use client"

import React, { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, AlertCircle, ArrowRight } from 'lucide-react'
import { useImport } from './import-context'
import type { ColumnMapping, TransactionFieldType } from './import-context'

/**
 * CSV IMPORT COLUMN MAPPING DOCUMENTATION
 * 
 * Available transaction fields for CSV import mapping:
 * 
 * REQUIRED FIELDS:
 * - date: Transaction date/timestamp
 * - type: Transaction type (buy/sell/deposit/withdrawal/interest)
 * 
 * OPTIONAL FIELDS:
 * - sent_amount: Amount sent/paid (e.g., USD paid for BTC)
 * - sent_currency: Currency of sent amount (e.g., USD, BTC)
 * - received_amount: Amount received (e.g., BTC received)
 * - received_currency: Currency of received amount (e.g., BTC, USD)
 * - fee_amount: Transaction fee amount
 * - fee_currency: Currency of the fee
 * - from_address_name: Source name (exchange, wallet name)
 * - to_address_name: Destination name
 * - from_address: Source wallet address (blockchain address)
 * - to_address: Destination wallet address (blockchain address)
 * - transaction_hash: Blockchain transaction ID/hash
 * - price: BTC price at time of transaction
 * - comment: Additional notes/comments
 * - ignore: Skip this CSV column (don't import)
 * 
 * IMPORTANT RULES:
 * - Each transaction field can only be mapped to ONE CSV column
 * - Multiple CSV columns cannot map to the same transaction field
 * - Required fields (date, type) must be mapped
 * - Duplicate mappings will prevent import
 * - Unmapped columns are ignored (don't block import)
 * 
 * AUTO-DETECTION PATTERNS:
 * The system automatically detects common column names:
 * - Fee Amount: "fee", "cost", "commission", "charge", "expense", "trading fee", "network fee", "gas"
 * - Fee Currency: "fee currency", "fee asset", "fee symbol"
 * - Amount patterns: "amount", "quantity", "size", "value", "volume", "total"
 * - Currency patterns: "currency", "asset", "symbol", "coin", "token"
 * - Address patterns: "address", "wallet", with directional context
 * - Exchange patterns: "exchange", "platform", "source", "provider", "service"
 * - Source/Destination: "source", "destination" treated as aliases for "from", "to"
 * 
 * SPECIAL HANDLING:
 * - Fiat amount columns are ignored (calculated dynamically from BTC amount × price)
 * - Negative values in amount columns are detected and handled for withdrawals
 * - Positive/negative mixed columns are mapped to received_amount with conversion logic
 */

// Define available transaction fields with their labels and descriptions
const TRANSACTION_FIELDS: { 
  value: TransactionFieldType, 
  label: string, 
  description: string,
  required: boolean 
}[] = [
  { value: 'date', label: 'Date', description: 'Transaction date', required: true },
  { value: 'type', label: 'Type', description: 'Transaction type (buy/sell/deposit/withdrawal)', required: true },
  { value: 'sent_amount', label: 'Sent Amount', description: 'Amount sent/paid', required: false },
  { value: 'sent_currency', label: 'Sent Currency', description: 'Currency of sent amount', required: false },
  { value: 'received_amount', label: 'Received Amount', description: 'Amount received', required: false },
  { value: 'received_currency', label: 'Received Currency', description: 'Currency of received amount', required: false },
  { value: 'fee_amount', label: 'Fee Amount', description: 'Transaction fee', required: false },
  { value: 'fee_currency', label: 'Fee Currency', description: 'Currency of fee', required: false },
  { value: 'from_address_name', label: 'From (Name)', description: 'Source name (exchange, wallet)', required: false },
  { value: 'to_address_name', label: 'To (Name)', description: 'Destination name', required: false },
  { value: 'from_address', label: 'From Address', description: 'Source wallet address', required: false },
  { value: 'to_address', label: 'To Address', description: 'Destination wallet address', required: false },
  { value: 'transaction_hash', label: 'Transaction Hash', description: 'Blockchain transaction ID', required: false },
  { value: 'price', label: 'Price', description: 'BTC price at transaction time', required: false },
  { value: 'comment', label: 'Comment/Note', description: 'Additional notes', required: false },
  { value: 'ignore', label: 'Ignore Column', description: 'Skip this column', required: false }
]

export function MappingStep() {
  const {
    csvHeaders,
    csvData,
    columnMappings,
    setColumnMappings,
    setStep,
    setError,
    setIsLoading,
    setLoadingState
  } = useImport()

  const [mappings, setMappings] = useState<ColumnMapping[]>([])
  const [previewData, setPreviewData] = useState<any[]>([])

  // Smart field detection patterns with enhanced recognition
  // This function maps common CSV column names to our transaction fields
  const detectFieldType = useCallback((columnName: string, sampleValues: string[]): { 
    field: TransactionFieldType | null, 
    confidence: number 
  } => {
    const name = columnName.toLowerCase().trim()
    
    // Date patterns
    if (name.includes('date') || name.includes('time') || name.includes('timestamp')) {
      return { field: 'date', confidence: 0.9 }
    }
    
    // Type patterns
    if (name.includes('type') || name.includes('action') || name.includes('side')) {
      return { field: 'type', confidence: 0.8 }
    }
    
    // Fee amount patterns - CHECK BEFORE general amount patterns!
    if (name === 'fee amount' || name === 'fee_amount' || name === 'feeamount') {
      return { field: 'fee_amount', confidence: 0.95 }
    }
    
    // Fee amount patterns with spaces and variations
    if (name.includes('fee amount') || name.includes('fee_amount') || 
        name.includes('transaction fee') || name.includes('trading fee') ||
        name.includes('network fee') || name.includes('exchange fee') ||
        name.includes('service fee') || name.includes('gas fee')) {
      return { field: 'fee_amount', confidence: 0.9 }
    }
    
    // General fee patterns (before amount patterns)
    if (name.includes('fee') || name.includes('cost') || name.includes('commission') || 
        name.includes('charge') || name.includes('expense')) {
      
      // If it mentions currency, it might be fee currency instead
      if (name.includes('currency') || name.includes('asset') || name.includes('symbol')) {
        return { field: 'fee_currency', confidence: 0.8 }
      }
      return { field: 'fee_amount', confidence: 0.8 }
    }

    // Amount patterns (after fee detection)
    if (name.includes('amount') || name.includes('quantity') || name.includes('size') || 
        name.includes('value') || name.includes('volume') || name.includes('total')) {
      
      // Skip fiat amount columns for deposits/withdrawals - we calculate dynamically
      if (name.includes('fiat') || name.includes('usd') || name.includes('eur') || 
          name.includes('market') || name.includes('dollar')) {
        return { field: null, confidence: 0.1 } // Low confidence = likely to be ignored
      }
      
      // Try to determine if it's sent or received based on context
      if (name.includes('sent') || name.includes('sold') || name.includes('debit') || 
          name.includes('pay') || name.includes('spend') || name.includes('out') ||
          name.includes('from') || name.includes('withdraw')) {
        return { field: 'sent_amount', confidence: 0.8 }
      }
      if (name.includes('received') || name.includes('bought') || name.includes('credit') || 
          name.includes('get') || name.includes('earn') || name.includes('in') ||
          name.includes('to') || name.includes('deposit')) {
        return { field: 'received_amount', confidence: 0.8 }
      }
      
      // Check sample values for negative/positive pattern (deposits/withdrawals)
      if (sampleValues.length > 0) {
        const hasNegative = sampleValues.some(val => val.toString().includes('-'))
        const hasPositive = sampleValues.some(val => !val.toString().includes('-') && parseFloat(val) > 0)
        
        // If we see both positive and negative values, this is likely a combined deposit/withdrawal column
        if (hasNegative && hasPositive) {
          return { field: 'received_amount', confidence: 0.85 } // Will handle negative conversion in parsing
        }
      }
      
      // Check for common exchange-specific terms
      if (name.includes('base') || name.includes('quote')) {
        return { field: 'sent_amount', confidence: 0.7 }
      }
      if (name.includes('crypto') || name.includes('btc') || name.includes('bitcoin')) {
        return { field: 'received_amount', confidence: 0.7 }
      }
      // Generic amount - let's default to received for now
      return { field: 'received_amount', confidence: 0.6 }
    }
    
    // Fee currency patterns - exact matches first
    if (name === 'fee currency' || name === 'fee_currency' || name === 'feecurrency') {
      return { field: 'fee_currency', confidence: 0.95 }
    }
    
    // Fee currency patterns (check before general currency)
    if ((name.includes('fee') && (name.includes('currency') || name.includes('asset') || name.includes('symbol'))) ||
        name.includes('fee currency') || name.includes('fee asset') || name.includes('fee symbol')) {
      return { field: 'fee_currency', confidence: 0.85 }
    }
    
    // Currency patterns
    if (name.includes('currency') || name.includes('asset') || name.includes('symbol') || 
        name.includes('coin') || name.includes('token')) {
      if (name.includes('sent') || name.includes('sold') || name.includes('from') || 
          name.includes('debit') || name.includes('pay') || name.includes('spend')) {
        return { field: 'sent_currency', confidence: 0.7 }
      }
      if (name.includes('received') || name.includes('bought') || name.includes('to') || 
          name.includes('credit') || name.includes('get') || name.includes('earn')) {
        return { field: 'received_currency', confidence: 0.7 }
      }
      return { field: 'received_currency', confidence: 0.5 }
    }
    

    
    // Price patterns
    if (name.includes('price') || name.includes('rate') || name.includes('usd')) {
      return { field: 'price', confidence: 0.7 }
    }
    
    // FROM/SOURCE patterns - treat source as alias for from
    if (name === 'from' || name === 'source' || name === 'from_address_name' || 
        name === 'source_name' || name === 'from address name' || name === 'source address name') {
      return { field: 'from_address_name', confidence: 0.95 }
    }
    
    // TO/DESTINATION patterns - treat destination as alias for to
    if (name === 'to' || name === 'destination' || name === 'to_address_name' ||
        name === 'destination_name' || name === 'to address name' || name === 'destination address name') {
      return { field: 'to_address_name', confidence: 0.95 }
    }
    
    // FROM ADDRESS patterns
    if (name === 'from address' || name === 'from_address' || name === 'source address' ||
        name === 'source_address' || name === 'fromaddress' || name === 'sourceaddress') {
      return { field: 'from_address', confidence: 0.95 }
    }
    
    // TO ADDRESS patterns  
    if (name === 'to address' || name === 'to_address' || name === 'destination address' ||
        name === 'destination_address' || name === 'toaddress' || name === 'destinationaddress') {
      return { field: 'to_address', confidence: 0.95 }
    }

    // Address patterns with directional context
    if (name.includes('address') || name.includes('wallet')) {
      if (name.includes('from') || name.includes('source') || name.includes('sender')) {
        return { field: 'from_address', confidence: 0.85 }
      }
      if (name.includes('to') || name.includes('destination') || name.includes('recipient') || name.includes('receiver')) {
        return { field: 'to_address', confidence: 0.85 }
      }
      return { field: 'from_address', confidence: 0.5 }
    }
    
    // Address name patterns with context - source/destination as from/to aliases
    if ((name.includes('from') || name.includes('source')) && 
        (name.includes('name') || name.includes('exchange') || name.includes('platform') || 
         name.includes('provider') || name.includes('service') || name.includes('wallet name') ||
         name.includes('account') || name.includes('institution'))) {
      return { field: 'from_address_name', confidence: 0.85 }
    }
    
    if ((name.includes('to') || name.includes('destination') || name.includes('target')) && 
        (name.includes('name') || name.includes('exchange') || name.includes('platform') || 
         name.includes('provider') || name.includes('service') || name.includes('wallet name') ||
         name.includes('account') || name.includes('institution'))) {
      return { field: 'to_address_name', confidence: 0.85 }
    }

    // General platform/exchange patterns (fallback for from_address_name)
    if (name.includes('exchange') || name.includes('platform') || name.includes('source') ||
        name.includes('provider') || name.includes('service') || name.includes('wallet name') ||
        name.includes('account') || name.includes('institution')) {
      if (name.includes('to') || name.includes('destination') || name.includes('target')) {
        return { field: 'to_address_name', confidence: 0.7 }
      }
      return { field: 'from_address_name', confidence: 0.7 }
    }
    
    // Hash patterns
    if (name.includes('hash') || name.includes('txid') || name.includes('transaction') && name.includes('id')) {
      return { field: 'transaction_hash', confidence: 0.9 }
    }
    
    // Note/comment patterns
    if (name.includes('note') || name.includes('comment') || name.includes('memo') || name.includes('description')) {
      return { field: 'comment', confidence: 0.8 }
    }
    
    return { field: null, confidence: 0 }
  }, [])

  // Auto-detect column mappings
  useEffect(() => {
    if (csvHeaders.length > 0 && csvData && csvData.length > 0) {
      setIsLoading(true)
      setLoadingState('mapping')
      
      try {
        const autoMappings: ColumnMapping[] = csvHeaders.map(header => {
          // Get sample values for this column (first 5 non-empty values)
          const sampleValues = csvData
            .map(row => row[header])
            .filter((value): value is string => Boolean(value && value.trim() !== ''))
            .slice(0, 5)
          
          const detection = detectFieldType(header, sampleValues)
          
          // Debug logging for key field detection
          if (header.toLowerCase().includes('fee') || header.toLowerCase().includes('amount') ||
              header.toLowerCase().includes('from') || header.toLowerCase().includes('to') ||
              header.toLowerCase().includes('source') || header.toLowerCase().includes('destination') ||
              header.toLowerCase().includes('address')) {
            console.log('🔍 Column detection debug:', {
              originalHeader: header,
              normalizedName: header.toLowerCase().trim(),
              detectedField: detection.field,
              confidence: Math.round(detection.confidence * 100) + '%',
              sampleValues: sampleValues.slice(0, 3),
              isConfident: detection.confidence >= 0.7
            })
          }
          
          return {
            csvColumn: header,
            transactionField: detection.field,
            isRequired: detection.field ? TRANSACTION_FIELDS.find(f => f.value === detection.field)?.required || false : false,
            isConfident: detection.confidence >= 0.7
          }
        })
        
        setMappings(autoMappings)
        setColumnMappings(autoMappings)
        
        // Generate preview data (first 3 rows)
        const preview = csvData.slice(0, 3).map((row, index) => ({
          rowIndex: index + 1,
          ...row
        }))
        setPreviewData(preview)
        
      } catch (error) {
        console.error('Auto-mapping error:', error)
        setError('Failed to auto-detect column mappings')
      } finally {
        setIsLoading(false)
        setLoadingState('idle')
      }
    }
  }, [csvHeaders, csvData, detectFieldType, setColumnMappings, setError, setIsLoading, setLoadingState])

  // Handle mapping change
  const handleMappingChange = (csvColumn: string, newField: TransactionFieldType | null) => {
    const updatedMappings = mappings.map(mapping => 
      mapping.csvColumn === csvColumn 
        ? { 
            ...mapping, 
            transactionField: newField,
            isRequired: newField ? TRANSACTION_FIELDS.find(f => f.value === newField)?.required || false : false,
            isConfident: false // User override, so not auto-detected
          }
        : mapping
    )
    setMappings(updatedMappings)
    setColumnMappings(updatedMappings)
  }

  // Get duplicate mappings (fields mapped to multiple CSV columns)
  const getDuplicateMappings = () => {
    const fieldCounts = new Map<TransactionFieldType, string[]>()
    
    mappings.forEach(mapping => {
      if (mapping.transactionField && mapping.transactionField !== 'ignore') {
        const existing = fieldCounts.get(mapping.transactionField) || []
        fieldCounts.set(mapping.transactionField, [...existing, mapping.csvColumn])
      }
    })
    
    // Return fields that are mapped to multiple CSV columns
    return Array.from(fieldCounts.entries())
      .filter(([_, csvColumns]) => csvColumns.length > 1)
      .map(([field, csvColumns]) => ({ field, csvColumns }))
  }
  
  // Check if we can proceed
  const canProceed = () => {
    const requiredFields = TRANSACTION_FIELDS.filter(f => f.required).map(f => f.value)
    const mappedFields = mappings
      .filter(m => m.transactionField && m.transactionField !== 'ignore')
      .map(m => m.transactionField)
    
    // Check if all required fields are mapped
    const hasRequiredFields = requiredFields.every(field => mappedFields.includes(field))
    
    // Check if there are no duplicate mappings
    const duplicates = getDuplicateMappings()
    const hasNoDuplicates = duplicates.length === 0
    
    return hasRequiredFields && hasNoDuplicates
  }

  // Handle continue
  const handleContinue = () => {
    if (canProceed()) {
      setStep('preview')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-2">Map CSV Columns</h3>
        <p className="text-gray-400 text-sm">
          Match your CSV columns to transaction fields. Required fields are marked with a badge.
        </p>
      </div>

      {/* Mapping interface */}
      <div className="space-y-4">
        {mappings.map((mapping, index) => {
          const field = TRANSACTION_FIELDS.find(f => f.value === mapping.transactionField)
          const isUsedElsewhere = mappings.some((m, i) => 
            i !== index && 
            m.transactionField === mapping.transactionField && 
            mapping.transactionField !== 'ignore' &&
            mapping.transactionField !== null
          )
          const isUnmapped = !mapping.transactionField || mapping.transactionField === null
          
          return (
            <div 
              key={mapping.csvColumn}
              className={`
                p-4 rounded-xl border transition-all
                bg-gray-800/30 border-gray-700/50
                ${isUsedElsewhere ? 'border-yellow-500/30 bg-yellow-500/5' : ''}
                ${isUnmapped ? 'border-blue-500/20 bg-blue-500/10' : ''}
              `}
            >
              <div className="flex items-center justify-between gap-4">
                {/* CSV Column info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-white truncate">{mapping.csvColumn}</h4>
                    {mapping.isConfident && (
                      <Badge variant="secondary" className="bg-green-500/10 text-green-400 border-green-500/20">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Auto-detected
                      </Badge>
                    )}

                    {isUsedElsewhere && (
                      <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Duplicate
                      </Badge>
                    )}
                    {isUnmapped && (
                      <Badge variant="secondary" className="bg-blue-500/10 text-blue-400 border-blue-500/20">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Not mapped
                      </Badge>
                    )}
                  </div>
                  
                  {/* Preview values */}
                  <div className="text-xs text-gray-400">
                    Sample: {previewData
                      .map(row => row[mapping.csvColumn])
                      .filter(val => val)
                      .slice(0, 3)
                      .join(', ')
                    }
                  </div>
                </div>

                {/* Arrow */}
                <ArrowRight className="h-4 w-4 text-gray-500" />

                {/* Field selector */}
                <div className="flex-1 min-w-0">
                  <Select
                    value={mapping.transactionField || 'unmapped'}
                    onValueChange={(value) => 
                      handleMappingChange(mapping.csvColumn, value === 'unmapped' ? null : value as TransactionFieldType)
                    }
                  >
                    <SelectTrigger className="bg-gray-800/40 border-gray-600/50">
                      <SelectValue placeholder="Select field..." />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="unmapped">-- Not mapped --</SelectItem>
                      {TRANSACTION_FIELDS.map(field => (
                        <SelectItem key={field.value} value={field.value}>
                          <div className="flex items-center gap-2">
                            <span>{field.label}</span>
                            {field.required && (
                              <Badge variant="secondary" className="bg-blue-500/10 text-blue-400 text-xs">
                                Required
                              </Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {field && (
                    <p className="text-xs text-gray-500 mt-1">{field.description}</p>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Summary */}
      <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-700/50">
        <h4 className="font-medium text-white mb-3">Mapping Summary</h4>
        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
          <div>
            <span className="text-gray-400">Mapped columns:</span>
            <span className="text-white ml-2">
              {mappings.filter(m => m.transactionField && m.transactionField !== 'ignore').length} / {mappings.length}
            </span>
          </div>
          <div>
            <span className="text-gray-400">Required fields:</span>
            <span className={`ml-2 ${TRANSACTION_FIELDS.filter(f => f.required).every(field => 
              mappings.some(m => m.transactionField === field.value)
            ) ? 'text-green-400' : 'text-red-400'}`}>
              {mappings.filter(m => 
                m.transactionField && 
                TRANSACTION_FIELDS.find(f => f.value === m.transactionField)?.required
              ).length} / {TRANSACTION_FIELDS.filter(f => f.required).length}
              {TRANSACTION_FIELDS.filter(f => f.required).every(field => 
                mappings.some(m => m.transactionField === field.value)
              ) ? ' ✓' : ' ✗'}
            </span>
          </div>
        </div>
        
        {/* Duplicate warnings */}
        {(() => {
          const duplicates = getDuplicateMappings()
          if (duplicates.length > 0) {
            return (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-4 w-4 text-red-400" />
                  <span className="text-red-400 font-medium">Duplicate Mappings Detected</span>
                </div>
                <div className="text-sm text-red-300 space-y-1">
                  {duplicates.map(({ field, csvColumns }) => (
                    <div key={field}>
                      <strong>{TRANSACTION_FIELDS.find(f => f.value === field)?.label}</strong> 
                      {' '}is mapped to multiple columns: {csvColumns.join(', ')}
                    </div>
                  ))}
                  <div className="text-xs text-red-200 mt-2">
                    Each transaction field can only be mapped to one CSV column. 
                    Please remove duplicate mappings to continue.
                  </div>
                </div>
              </div>
            )
          }
          return null
        })()}
        
        {/* Missing required fields */}
        {(() => {
          const missingRequired = TRANSACTION_FIELDS
            .filter(f => f.required)
            .filter(field => !mappings.some(m => m.transactionField === field.value))
          
          if (missingRequired.length > 0) {
            return (
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mt-3">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-4 w-4 text-yellow-400" />
                  <span className="text-yellow-400 font-medium">Missing Required Fields</span>
                </div>
                <div className="text-sm text-yellow-300">
                  Please map the following required fields: {missingRequired.map(f => f.label).join(', ')}
                </div>
              </div>
            )
          }
          return null
        })()}
        
        {/* Success state - moved to top */}
        {canProceed() && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 mt-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <span className="text-green-400 font-medium">Ready to proceed!</span>
            </div>
            <div className="text-sm text-green-300 mt-1">
              All required fields are mapped and no duplicates detected.
            </div>
          </div>
        )}

        {/* Unmapped columns info (doesn't block progress) */}
        {(() => {
          const unmappedColumns = mappings.filter(m => !m.transactionField || m.transactionField === null)
          if (unmappedColumns.length > 0) {
            return (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mt-3">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-4 w-4 text-blue-400" />
                  <span className="text-blue-400 font-medium">Unmapped Columns</span>
                </div>
                <div className="text-sm text-blue-300">
                  <div className="mb-1">The following columns will be ignored during import:</div>
                  <div className="text-xs text-blue-200">
                    {unmappedColumns.map(m => m.csvColumn).join(', ')}
                  </div>
                  <div className="text-xs text-blue-200 mt-2">
                    This won't prevent import - unmapped columns are simply skipped.
                  </div>
                </div>
              </div>
            )
          }
          return null
        })()}
      </div>

      {/* Continue button */}
      <div className="flex justify-end">
        <Button 
          onClick={handleContinue}
          disabled={!canProceed()}
          className="bg-bitcoin-orange hover:bg-bitcoin-orange/90 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          title={canProceed() ? 'Continue to preview' : 'Fix mapping issues to continue'}
        >
          {(() => {
            if (canProceed()) return 'Continue to Preview'
            
            const duplicates = getDuplicateMappings()
            const missingRequired = TRANSACTION_FIELDS
              .filter(f => f.required)
              .filter(field => !mappings.some(m => m.transactionField === field.value))
            
            if (duplicates.length > 0) return 'Fix Duplicate Mappings'
            if (missingRequired.length > 0) return 'Map Required Fields'
            return 'Complete Mapping'
          })()}
        </Button>
      </div>
    </div>
  )
} 