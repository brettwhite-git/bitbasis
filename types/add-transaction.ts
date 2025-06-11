// Types for Add Transaction Wizard supporting unified transactions table

import { z } from 'zod'

// Base schema for all transaction types
const baseTransactionSchema = z.object({
  id: z.string().optional(), // For temp staging
  date: z.string().min(1, "Date is required"),
  type: z.enum(['buy', 'sell', 'deposit', 'withdrawal', 'interest']),
  asset: z.string().default('BTC'),
  price: z.union([z.number(), z.string()]).transform((val) => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    if (isNaN(num) || num <= 0) throw new Error("BTC price is required and must be greater than 0");
    return num;
  }),
  comment: z.string().optional().nullable(),
  csv_upload_id: z.string().uuid().optional().nullable(), // For CSV import tracking
})

// Buy transaction schema
const buyTransactionSchema = baseTransactionSchema.extend({
  type: z.literal('buy'),
  sent_amount: z.union([z.number(), z.string()]).transform((val) => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    if (isNaN(num) || num <= 0) throw new Error("Fiat amount must be positive");
    return num;
  }),
  sent_currency: z.string().default('USD').optional(), // Optional since we default to USD
  received_amount: z.union([z.number(), z.string()]).transform((val) => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    if (isNaN(num) || num <= 0) throw new Error("BTC amount must be positive");
    return num;
  }),
  received_currency: z.string().default('BTC'),
  fee_amount: z.union([z.number(), z.string(), z.null()]).transform((val) => {
    if (val === null || val === '' || val === undefined) return null;
    const num = typeof val === 'string' ? parseFloat(val) : val;
    if (isNaN(num) || num < 0) throw new Error("Fee cannot be negative");
    return num;
  }).optional().nullable(),
  fee_currency: z.string().default('USD').optional(), // Optional since we default to USD
  from_address_name: z.string().optional().nullable(), // Exchange name
  to_address_name: z.string().optional().nullable(), // Destination wallet
})

// Sell transaction schema  
const sellTransactionSchema = baseTransactionSchema.extend({
  type: z.literal('sell'),
  sent_amount: z.union([z.number(), z.string()]).transform((val) => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    if (isNaN(num) || num <= 0) throw new Error("BTC amount must be positive");
    return num;
  }),
  sent_currency: z.string().default('BTC'),
  received_amount: z.union([z.number(), z.string()]).transform((val) => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    if (isNaN(num) || num <= 0) throw new Error("Fiat amount must be positive");
    return num;
  }),
  received_currency: z.string().default('USD').optional(), // Optional since we default to USD
  fee_amount: z.union([z.number(), z.string(), z.null()]).transform((val) => {
    if (val === null || val === '' || val === undefined) return null;
    const num = typeof val === 'string' ? parseFloat(val) : val;
    if (isNaN(num) || num < 0) throw new Error("Fee cannot be negative");
    return num;
  }).optional().nullable(),
  fee_currency: z.string().default('USD').optional(), // Optional since we default to USD
  from_address_name: z.string().optional().nullable(), // Source wallet
  to_address_name: z.string().optional().nullable(), // Exchange name
})

// Deposit transaction schema
const depositTransactionSchema = baseTransactionSchema.extend({
  type: z.literal('deposit'),
  received_amount: z.union([z.number(), z.string()]).transform((val) => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    if (isNaN(num) || num <= 0) throw new Error("BTC amount must be positive");
    return num;
  }),
  received_currency: z.string().default('BTC'),
  fee_amount: z.union([z.number(), z.string(), z.null()]).transform((val) => {
    if (val === null || val === '' || val === undefined) return null;
    const num = typeof val === 'string' ? parseFloat(val) : val;
    if (isNaN(num) || num < 0) throw new Error("Fee cannot be negative");
    return num;
  }).optional().nullable(),
  fee_currency: z.string().optional().nullable(),
  from_address: z.string().optional().nullable(),
  from_address_name: z.string().optional().nullable(), // Source (exchange, mining pool, etc.)
  to_address: z.string().optional().nullable(),
  to_address_name: z.string().optional().nullable(), // Destination wallet
  transaction_hash: z.string().optional().nullable(),
})

// Withdrawal transaction schema
const withdrawalTransactionSchema = baseTransactionSchema.extend({
  type: z.literal('withdrawal'),
  sent_amount: z.union([z.number(), z.string()]).transform((val) => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    if (isNaN(num) || num <= 0) throw new Error("BTC amount must be positive");
    return num;
  }),
  sent_currency: z.string().default('BTC'),
  fee_amount: z.union([z.number(), z.string(), z.null()]).transform((val) => {
    if (val === null || val === '' || val === undefined) return null;
    const num = typeof val === 'string' ? parseFloat(val) : val;
    if (isNaN(num) || num < 0) throw new Error("Fee cannot be negative");
    return num;
  }).optional().nullable(),
  fee_currency: z.string().optional().nullable(),
  from_address: z.string().optional().nullable(),
  from_address_name: z.string().optional().nullable(), // Source wallet
  to_address: z.string().optional().nullable(),
  to_address_name: z.string().optional().nullable(), // Destination
  transaction_hash: z.string().optional().nullable(),
})

// Interest transaction schema
const interestTransactionSchema = baseTransactionSchema.extend({
  type: z.literal('interest'),
  received_amount: z.union([z.number(), z.string()]).transform((val) => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    if (isNaN(num) || num <= 0) throw new Error("Interest amount must be positive");
    return num;
  }),
  received_currency: z.string().default('BTC'),
  from_address_name: z.string().optional().nullable(), // Platform name
  to_address_name: z.string().optional().nullable(), // Account name
})

// Union type for all transaction schemas
export const transactionSchema = z.discriminatedUnion('type', [
  buyTransactionSchema,
  sellTransactionSchema,
  depositTransactionSchema,
  withdrawalTransactionSchema,
  interestTransactionSchema,
])

export type NewTransaction = z.infer<typeof transactionSchema>

// Wizard step types
export type WizardStep = 'type' | 'details' | 'review' | 'submit'

// Field configuration for each transaction type
export interface FieldConfig {
  name: string
  label: string
  type: 'text' | 'number' | 'select' | 'textarea'
  placeholder?: string
  required: boolean
  options?: string[]
  description?: string
  validation?: {
    min?: number
    max?: number
    step?: string
  }
}

// Transaction type configurations
export const transactionTypeConfigs: Record<NewTransaction['type'], {
  title: string
  description: string
  icon: string
  fields: FieldConfig[]
}> = {
  buy: {
    title: 'Bitcoin Purchase',
    description: 'Record a purchase of Bitcoin with fiat currency',
    icon: 'TrendingUp',
    fields: [
      { name: 'sent_amount', label: 'Fiat Amount Paid (USD)', type: 'number', placeholder: '1000.00', required: true, validation: { min: 0, step: '0.01' } },
      { name: 'received_amount', label: 'BTC Received', type: 'number', placeholder: '0.025', required: true, validation: { min: 0, step: 'any' } },
      { name: 'fee_amount', label: 'Exchange Fee (USD)', type: 'number', placeholder: '5.00', required: false, validation: { min: 0, step: '0.01' } },
      { name: 'from_address_name', label: 'Exchange/Platform', type: 'text', placeholder: 'River, Coinbase, etc.', required: false },
      { name: 'to_address_name', label: 'Destination Wallet', type: 'text', placeholder: 'Personal Wallet, Cold Storage', required: false },
    ]
  },
  sell: {
    title: 'Bitcoin Sale',
    description: 'Record a sale of Bitcoin for fiat currency',
    icon: 'TrendingDown',
    fields: [
      { name: 'sent_amount', label: 'BTC Sold', type: 'number', placeholder: '0.025', required: true, validation: { min: 0, step: 'any' } },
      { name: 'received_amount', label: 'Fiat Received (USD)', type: 'number', placeholder: '1200.00', required: true, validation: { min: 0, step: '0.01' } },
      { name: 'fee_amount', label: 'Exchange Fee (USD)', type: 'number', placeholder: '6.00', required: false, validation: { min: 0, step: '0.01' } },
      { name: 'from_address_name', label: 'Source Wallet', type: 'text', placeholder: 'Personal Wallet, Cold Storage', required: false },
      { name: 'to_address_name', label: 'Exchange/Platform', type: 'text', placeholder: 'River, Coinbase, etc.', required: false },
    ]
  },
  deposit: {
    title: 'Bitcoin Deposit',
    description: 'Record a deposit of Bitcoin to your wallet',
    icon: 'ArrowDownToLine',
    fields: [
      { name: 'received_amount', label: 'BTC Deposited', type: 'number', placeholder: '0.1', required: true, validation: { min: 0, step: 'any' } },
      { name: 'fee_amount', label: 'Network Fee', type: 'number', placeholder: '0.0001', required: false, validation: { min: 0, step: 'any' } },
      { name: 'from_address_name', label: 'Source', type: 'text', placeholder: 'River, Mining Pool, etc.', required: false },
      { name: 'to_address_name', label: 'Destination Wallet', type: 'text', placeholder: 'Personal Wallet, Cold Storage', required: false },
      { name: 'from_address', label: 'Source Address', type: 'text', placeholder: 'bc1...', required: false },
      { name: 'to_address', label: 'Destination Address', type: 'text', placeholder: 'bc1...', required: false },
      { name: 'transaction_hash', label: 'Transaction Hash', type: 'text', placeholder: 'a1b2c3...', required: false },
    ]
  },
  withdrawal: {
    title: 'Bitcoin Withdrawal',
    description: 'Record a withdrawal of Bitcoin from your wallet',
    icon: 'ArrowUpFromLine',
    fields: [
      { name: 'sent_amount', label: 'BTC Withdrawn', type: 'number', placeholder: '0.05', required: true, validation: { min: 0, step: 'any' } },
      { name: 'fee_amount', label: 'Network Fee', type: 'number', placeholder: '0.0002', required: false, validation: { min: 0, step: 'any' } },
      { name: 'from_address_name', label: 'Source Wallet', type: 'text', placeholder: 'Personal Wallet, Cold Storage', required: false },
      { name: 'to_address_name', label: 'Destination', type: 'text', placeholder: 'River, Friend\'s Wallet', required: false },
      { name: 'from_address', label: 'Source Address', type: 'text', placeholder: 'bc1...', required: false },
      { name: 'to_address', label: 'Destination Address', type: 'text', placeholder: 'bc1...', required: false },
      { name: 'transaction_hash', label: 'Transaction Hash', type: 'text', placeholder: 'a1b2c3...', required: false },
    ]
  },
  interest: {
    title: 'Interest Earned',
    description: 'Record interest earned on Bitcoin holdings',
    icon: 'Percent',
    fields: [
      { name: 'received_amount', label: 'Interest Earned (BTC)', type: 'number', placeholder: '0.001', required: true, validation: { min: 0, step: 'any' } },
      { name: 'from_address_name', label: 'Platform', type: 'text', placeholder: 'BlockFi, Celsius, etc.', required: false },
      { name: 'to_address_name', label: 'Account', type: 'text', placeholder: 'Savings Account', required: false },
    ]
  }
}

// Staging transaction for the wizard
export type StagedTransaction = NewTransaction & {
  tempId: string
  created_at: string
}

// Flexible wizard data type that allows any combination of fields during editing
// This solves the discriminated union problem by being more permissive during wizard state management
export type TransactionWizardData = {
  // Always allow the discriminating field
  type?: NewTransaction['type']
  
  // Core fields that all transactions can have
  id?: string
  date?: string
  asset?: string
  price?: number
  comment?: string | null
  csv_upload_id?: string | null
  
  // Amount fields (any transaction might use these)
  sent_amount?: number
  sent_currency?: string
  received_amount?: number
  received_currency?: string
  fee_amount?: number | null
  fee_currency?: string | null
  
  // Address fields (for deposits/withdrawals)
  from_address?: string | null
  from_address_name?: string | null
  to_address?: string | null
  to_address_name?: string | null
  transaction_hash?: string | null
  
  // Allow any other string keys for flexibility during development
  [key: string]: any
}

// Updated wizard context type
export interface AddTransactionWizardContext {
  currentStep: WizardStep
  transactionData: TransactionWizardData
  stagedTransactions: StagedTransaction[]
  isSubmitting: boolean
  errors: Record<string, string>
  
  // Navigation
  goToStep: (step: WizardStep) => void
  nextStep: () => void
  prevStep: () => void
  
  // Data management
  updateTransactionData: (data: Partial<TransactionWizardData>) => void
  clearTransactionData: () => void
  
  // Staging
  addToStaging: (transaction: NewTransaction) => void
  removeFromStaging: (tempId: string) => void
  clearStaging: () => void
  editStagedTransaction: (tempId: string) => void
  
  // Submission
  submitTransactions: () => Promise<void>
  
  // Reset
  resetWizard: () => void
} 