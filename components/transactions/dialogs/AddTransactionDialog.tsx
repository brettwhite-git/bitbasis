"use client"

import React, { useState } from 'react';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Plus, PlusCircle, Trash2, Check, Calendar, DollarSign, Clock, X } from 'lucide-react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/lib/hooks/use-toast";
import { Separator } from "@/components/ui/separator";

// --- Zod Schema for Validation ---
// This reuses the same schema from ManualEntry.tsx
const transactionSchema = z.object({
  tempId: z.string().optional(),
  type: z.enum(['buy', 'sell', 'deposit', 'withdrawal']),
  date: z.string().refine(val => !isNaN(Date.parse(val)), { message: "Invalid date" }),
  time: z.string().optional(),
  asset: z.string().min(1, "Asset is required").default('BTC'),
  btcAmount: z.preprocess(
    (val) => typeof val === 'string' ? parseFloat(val) : val,
    z.number({ invalid_type_error: "Must be a number" }).positive("Must be positive").optional()
  ),
  usdAmount: z.preprocess(
    (val) => typeof val === 'string' ? parseFloat(val) : val,
    z.number({ invalid_type_error: "Must be a number" }).positive("Must be positive").optional()
  ),
  price: z.preprocess(
    (val) => typeof val === 'string' ? parseFloat(val) : val,
    z.number({ invalid_type_error: "Must be a number" }).positive("Must be positive").optional()
  ),
  fees: z.preprocess(
    (val) => typeof val === 'string' ? parseFloat(val) : val,
    z.number({ invalid_type_error: "Must be a number" }).min(0, "Cannot be negative").optional()
  ),
  exchange: z.string().optional(),
  network_fee: z.preprocess(
    (val) => typeof val === 'string' ? parseFloat(val) : val,
    z.number({ invalid_type_error: "Must be a number" }).min(0, "Cannot be negative").optional()
  ),
  txid: z.string().optional(),
}).superRefine((data, ctx) => {
    // Type-specific validation
    if (data.type === 'buy') {
      if (!data.usdAmount) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "USD Amount is required for buys", path: ['usdAmount'] });
      }
      if (!data.btcAmount) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "BTC Amount is required for buys", path: ['btcAmount'] });
      }
    }
    
    if (data.type === 'sell') {
      if (!data.btcAmount) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "BTC Amount is required for sells", path: ['btcAmount'] });
      }
      if (!data.usdAmount) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "USD Amount is required for sells", path: ['usdAmount'] });
      }
    }
    
    if (data.type === 'deposit' && !data.btcAmount) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "BTC Amount is required for deposits", path: ['btcAmount'] });
    }
    
    if (data.type === 'withdrawal' && !data.btcAmount) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "BTC Amount is required for withdrawals", path: ['btcAmount'] });
    }
});

export type TransactionFormValues = z.infer<typeof transactionSchema>;

// --- Component Props ---
interface AddTransactionDialogProps {
  isLoading?: boolean;
  onSubmitTransactions: (entries: TransactionFormValues[]) => Promise<void>;
  triggerButton?: React.ReactNode;
}

export function AddTransactionDialog({ 
  isLoading = false, 
  onSubmitTransactions, 
  triggerButton 
}: AddTransactionDialogProps) {
  const [open, setOpen] = useState(false);
  const [stagedTransactions, setStagedTransactions] = useState<TransactionFormValues[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  // Format current time for default value
  const now = new Date();
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  
  const { 
    control,
    handleSubmit,
    register,
    reset,
    setValue,
    watch,
    formState: { errors, isValid }
  } = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    mode: 'onChange',
    defaultValues: {
      type: 'buy',
      asset: 'BTC',
      date: new Date().toISOString().split('T')[0],
      time: currentTime
    }
  });

  // Watch current form values
  const currentType = watch('type');

  // Handler for adding a transaction to the staged list
  const handleAddToStaged: SubmitHandler<TransactionFormValues> = (data) => {
    // Create a merged date+time if time is provided
    let dateObject = new Date(data.date);
    if (data.time) {
      const [hours, minutes] = data.time.split(':').map(Number);
      // Fix the TypeScript error by ensuring both parameters are numbers
      dateObject.setHours(hours || 0, minutes || 0);
    }
    
    const newTransaction = { 
      ...data, 
      tempId: `manual-${Date.now()}-${Math.random()}`,
      date: dateObject.toISOString()
    };
    
    setStagedTransactions(prev => [...prev, newTransaction]);
    
    // Reset form but keep the current type
    reset({ 
      type: data.type,
      asset: 'BTC',
      date: new Date().toISOString().split('T')[0],
      time: currentTime
    });
    
    // Provide user feedback
    toast({
      title: "Transaction added",
      description: "Transaction has been added to the staging area.",
      duration: 2000,
    });
  };
  
  // Handler for removing a transaction from the staged list
  const handleRemoveStaged = (tempId?: string) => {
    if (!tempId) return;
    setStagedTransactions(prev => prev.filter(entry => entry.tempId !== tempId));
    
    toast({
      title: "Transaction removed",
      description: "Transaction has been removed from the staging area.",
      duration: 2000,
    });
  };

  // Handler for submitting all staged transactions
  const handleSubmitAll = async () => {
    if (stagedTransactions.length === 0) return;
    
    setIsSubmitting(true);
    try {
      await onSubmitTransactions(stagedTransactions);
      setStagedTransactions([]);
      setOpen(false);
      
      toast({
        title: "Transactions submitted",
        description: `Successfully added ${stagedTransactions.length} transaction(s)`,
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit transactions. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function to determine which fields are relevant for the selected type
  const getRelevantFields = (type: TransactionFormValues['type']) => {
    switch (type) {
      case 'buy': return ['date', 'time', 'btcAmount', 'usdAmount', 'price', 'fees', 'exchange'];
      case 'sell': return ['date', 'time', 'btcAmount', 'usdAmount', 'price', 'fees', 'exchange'];
      case 'deposit': return ['date', 'time', 'btcAmount', 'price', 'txid'];
      case 'withdrawal': return ['date', 'time', 'btcAmount', 'price', 'network_fee', 'txid'];
      default: return ['date', 'time', 'btcAmount', 'usdAmount'];
    }
  };

  // Get transaction title based on type
  const getTransactionTitle = (type: string) => {
    switch (type) {
      case 'buy': return 'Add entry for Bitcoin purchase';
      case 'sell': return 'Add entry for Bitcoin sale';
      case 'deposit': return 'Add entry for Bitcoin deposit';
      case 'withdrawal': return 'Add entry for Bitcoin withdrawal';
      default: return 'Add Transaction';
    }
  };

  // Get transaction description based on type
  const getTransactionDescription = (type: string) => {
    switch (type) {
      case 'buy': return 'Record a purchase of Bitcoin with fiat currency';
      case 'sell': return 'Record a sale of Bitcoin for fiat currency';
      case 'deposit': return 'Record a deposit of Bitcoin to your wallet';
      case 'withdrawal': return 'Record a withdrawal of Bitcoin from your wallet';
      default: return 'Enter transaction details below';
    }
  };

  const relevantFields = getRelevantFields(currentType);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerButton || (
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Add Transaction
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-5xl p-0 overflow-hidden">
        <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogClose>
        <div className="flex w-full">
          {/* Form Section */}
          <div className="w-1/2 p-6 border-r">
            <div className="mb-6">
              <h2 className="text-xl font-semibold">{getTransactionTitle(currentType)}</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {getTransactionDescription(currentType)}
              </p>
            </div>
            
            <form onSubmit={handleSubmit(handleAddToStaged)} className="space-y-5">
              {/* Transaction Type Field */}
              <div className="space-y-2">
                <Label htmlFor="type" className="text-sm font-medium">Transaction Type</Label>
                <Controller
                  name="type"
                  control={control}
                  render={({ field }) => (
                    <Select 
                      onValueChange={(value) => {
                        field.onChange(value);
                      }} 
                      value={field.value}
                    >
                      <SelectTrigger id="type">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="buy">Buy</SelectItem>
                        <SelectItem value="sell">Sell</SelectItem>
                        <SelectItem value="deposit">Deposit</SelectItem>
                        <SelectItem value="withdrawal">Withdrawal</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.type && (
                  <p className="text-xs text-destructive">{errors.type.message}</p>
                )}
              </div>
              
              {/* Date & Time Fields - 2-column layout */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date" className="text-sm font-medium">Date</Label>
                  <div>
                    <Input 
                      id="date" 
                      type="date" 
                      {...register('date')} 
                    />
                  </div>
                  {errors.date && (
                    <p className="text-xs text-destructive">{errors.date.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="time" className="text-sm font-medium">Time (UTC)</Label>
                  <div>
                    <Input 
                      id="time" 
                      type="time" 
                      {...register('time')} 
                    />
                  </div>
                  {errors.time && (
                    <p className="text-xs text-destructive">{errors.time.message}</p>
                  )}
                </div>
              </div>
              
              {/* Bitcoin and USD Amount - 2-column layout */}
              <div className="grid grid-cols-2 gap-4">
                {relevantFields.includes('btcAmount') && (
                  <div className="space-y-2">
                    <Label htmlFor="btcAmount" className="text-sm font-medium">BTC Amount</Label>
                    <Input 
                      id="btcAmount" 
                      type="number" 
                      step="any" 
                      {...register('btcAmount')} 
                      placeholder="0.00" 
                    />
                    {errors.btcAmount && (
                      <p className="text-xs text-destructive">{errors.btcAmount.message}</p>
                    )}
                  </div>
                )}
                
                {/* For deposit/withdrawal, show price next to BTC amount */}
                {(currentType === 'deposit' || currentType === 'withdrawal') && relevantFields.includes('price') && (
                  <div className="space-y-2">
                    <Label htmlFor="price" className="text-sm font-medium">Price per BTC (USD)</Label>
                    <Input 
                      id="price" 
                      type="number" 
                      step="any" 
                      {...register('price')} 
                      placeholder="0.00"
                    />
                    {errors.price && (
                      <p className="text-xs text-destructive">{errors.price.message}</p>
                    )}
                  </div>
                )}
                
                {relevantFields.includes('usdAmount') && (
                  <div className="space-y-2">
                    <Label htmlFor="usdAmount" className="text-sm font-medium">USD Amount</Label>
                    <Input 
                      id="usdAmount" 
                      type="number" 
                      step="any" 
                      {...register('usdAmount')} 
                      placeholder="0.00"
                    />
                    {errors.usdAmount && (
                      <p className="text-xs text-destructive">{errors.usdAmount.message}</p>
                    )}
                  </div>
                )}
              </div>
              
              {/* Price Field and Exchange Field - 2-column layout for buy/sell only */}
              {(currentType === 'buy' || currentType === 'sell') && (
                <div className="grid grid-cols-2 gap-4">
                  {relevantFields.includes('price') && (
                    <div className="space-y-2">
                      <Label htmlFor="price" className="text-sm font-medium">Price per BTC (USD)</Label>
                      <Input 
                        id="price" 
                        type="number" 
                        step="any" 
                        {...register('price')} 
                        placeholder="0.00"
                      />
                      {errors.price && (
                        <p className="text-xs text-destructive">{errors.price.message}</p>
                      )}
                    </div>
                  )}
                  
                  {relevantFields.includes('exchange') && (
                    <div className="space-y-2">
                      <Label htmlFor="exchange" className="text-sm font-medium">Exchange</Label>
                      <Input 
                        id="exchange" 
                        {...register('exchange')} 
                        placeholder="e.g., Coinbase" 
                      />
                      {errors.exchange && (
                        <p className="text-xs text-destructive">{errors.exchange.message}</p>
                      )}
                    </div>
                  )}
                </div>
              )}
              
              {/* Exchange field in a single column for deposit/withdrawal */}
              {(currentType === 'deposit' || currentType === 'withdrawal') && relevantFields.includes('exchange') && (
                <div className="space-y-2">
                  <Label htmlFor="exchange" className="text-sm font-medium">Exchange</Label>
                  <Input 
                    id="exchange" 
                    {...register('exchange')} 
                    placeholder="e.g., Coinbase" 
                  />
                  {errors.exchange && (
                    <p className="text-xs text-destructive">{errors.exchange.message}</p>
                  )}
                </div>
              )}
              
              {/* Fees - single column layout */}
              {relevantFields.includes('fees') && (
                <div className="space-y-2">
                  <Label htmlFor="fees" className="text-sm font-medium">Service Fee (USD)</Label>
                  <Input 
                    id="fees" 
                    type="number" 
                    step="any" 
                    {...register('fees')} 
                    placeholder="0.00"
                  />
                  {errors.fees && (
                    <p className="text-xs text-destructive">{errors.fees.message}</p>
                  )}
                </div>
              )}
              
              {relevantFields.includes('network_fee') && (
                <div className="space-y-2">
                  <Label htmlFor="network_fee" className="text-sm font-medium">Network Fee (BTC)</Label>
                  <Input 
                    id="network_fee" 
                    type="number" 
                    step="any" 
                    {...register('network_fee')} 
                    placeholder="0.0000" 
                  />
                  {errors.network_fee && (
                    <p className="text-xs text-destructive">{errors.network_fee.message}</p>
                  )}
                </div>
              )}
              
              {/* Transaction Hash */}
              {relevantFields.includes('txid') && (
                <div className="space-y-2">
                  <Label htmlFor="txid" className="text-sm font-medium">Transaction Hash</Label>
                  <Input 
                    id="txid" 
                    {...register('txid')} 
                    placeholder="e.g., a1b2c3..." 
                  />
                  {errors.txid && (
                    <p className="text-xs text-destructive">{errors.txid.message}</p>
                  )}
                </div>
              )}
              
              {/* Footer note */}
              <p className="text-xs text-muted-foreground mt-4">
                After you click on save, this entry will be added to your transactions.
              </p>
              
              {/* Form Buttons */}
              <div className="flex justify-between pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setOpen(false)} 
                  disabled={isSubmitting}
                  type="button"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={!isValid || isLoading || isSubmitting}
                  className="bg-[#F7931A] hover:bg-[#E78219]"
                >
                  Save and proceed
                </Button>
              </div>
            </form>
          </div>
          
          {/* Staged Transactions Section */}
          <div className="w-1/2 p-10">
            {stagedTransactions.length > 0 ? (
              <>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Staged Transactions ({stagedTransactions.length})</h3>
                  <Button 
                    onClick={handleSubmitAll} 
                    disabled={isLoading || isSubmitting}
                    size="sm"
                    className="bg-[#F7931A] hover:bg-[#E78219]"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Submitting
                      </span>
                    ) : (
                      <>
                        <Check className="mr-2 h-4 w-4" /> Submit All
                      </>
                    )}
                  </Button>
                </div>
                <ScrollArea className="h-[400px] rounded-md border p-2">
                  <div className="space-y-2">
                    {stagedTransactions.map((transaction) => (
                      <div 
                        key={transaction.tempId} 
                        className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-slate-900 border"
                      >
                        <div className="grid grid-cols-1 gap-1">
                          <span className="font-medium">
                            {new Date(transaction.date).toLocaleString()} - {transaction.type.toUpperCase()}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {transaction.btcAmount && `${transaction.btcAmount} BTC`}
                            {transaction.usdAmount && ` ($${transaction.usdAmount})`}
                            {transaction.price && ` at $${transaction.price}/BTC`}
                            {transaction.exchange && ` via ${transaction.exchange}`}
                          </span>
                        </div>
                        <Button 
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveStaged(transaction.tempId)}
                          disabled={isLoading || isSubmitting}
                          aria-label="Remove staged transaction"
                          className="h-8 w-8"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground">
                <PlusCircle className="h-12 w-12 mb-3 text-muted-foreground/50" />
                <h3 className="text-lg font-medium mb-1">No Staged Transactions</h3>
                <p className="text-sm max-w-xs">
                  Add transactions using the form on the left. They will appear here before final submission.
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 