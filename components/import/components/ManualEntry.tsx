"use client"

import React, { useState, useEffect } from 'react';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Trash2 } from 'lucide-react';

// --- Zod Schema for Validation ---
// Define a schema that adapts based on transaction type
// Note: This is a simplified initial version. Needs refinement based on specific requirements from types.ts/rules
const manualEntrySchema = z.object({
  tempId: z.string().optional(), // For tracking staged entries before submission
  type: z.enum(['buy', 'sell', 'deposit', 'withdrawal']),
  date: z.string().refine(val => !isNaN(Date.parse(val)), { message: "Invalid date" }), // Basic date string validation
  asset: z.string().min(1, "Asset is required").default('BTC'), // Assuming BTC for now
  // Conditional fields - Zod doesn't directly support conditional required fields easily based on enum like this.
  // We'll handle more complex validation within the component or use refine/superRefine.
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
    // Example: Add more complex cross-field validation if needed
    if (data.type === 'buy' && !data.usdAmount) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "USD Amount is required for buys", path: ['usdAmount'] });
    }
    if (data.type === 'buy' && !data.btcAmount) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "BTC Amount is required for buys", path: ['btcAmount'] });
    }
    // Add similar checks for sell, deposit, withdrawal based on rules
});

export type ManualEntryFormValues = z.infer<typeof manualEntrySchema>;

// --- Component Props ---
interface ManualEntryProps {
    isLoading: boolean;
    userId?: string; // Optional, might be needed later
    onSubmitEntries: (entries: ManualEntryFormValues[]) => void; // Passes list of validated entries
}

export function ManualEntry({ isLoading, onSubmitEntries }: ManualEntryProps) {
    const [stagedEntries, setStagedEntries] = useState<ManualEntryFormValues[]>([]);
    const { 
        control,
        handleSubmit,
        register,
        reset,
        watch,
        formState: { errors, isValid }
    } = useForm<ManualEntryFormValues>({
        resolver: zodResolver(manualEntrySchema),
        mode: 'onChange', // Validate on change for better feedback
        defaultValues: {
            type: 'buy', // Default type
            asset: 'BTC',
            date: new Date().toISOString().split('T')[0], // Default to today
        }
    });

    const selectedType = watch('type');

    // Handler for adding the current form state to the staged list
    const handleAddToStaged: SubmitHandler<ManualEntryFormValues> = (data) => {
        console.log("[ManualEntry] handleAddToStaged called with data:", data);
        const newEntry = { ...data, tempId: `manual-${Date.now()}-${Math.random()}` };
        setStagedEntries(prev => {
            console.log("[ManualEntry] Updating stagedEntries. Prev count:", prev.length);
            const updatedEntries = [...prev, newEntry];
            console.log("[ManualEntry] Updated stagedEntries. New count:", updatedEntries.length);
            return updatedEntries;
        });
        reset({ // Reset form fields after adding
             type: data.type, // Keep the selected type
             asset: 'BTC',
             date: new Date().toISOString().split('T')[0],
             btcAmount: undefined,
             usdAmount: undefined,
             price: undefined,
             fees: undefined,
             exchange: '',
             network_fee: undefined,
             txid: ''
        });
        console.log("[ManualEntry] Form reset called after adding to stage.");
    };
    
    // Handler for removing an entry from the staged list
    const handleRemoveStaged = (tempId?: string) => {
        if (!tempId) return;
        setStagedEntries(prev => prev.filter(entry => entry.tempId !== tempId));
    };

    // Handler for submitting the entire list of staged entries
    const handleSubmitAll = () => {
        if (stagedEntries.length > 0) {
            onSubmitEntries(stagedEntries);
            setStagedEntries([]); // Clear staged entries after submission
        }
    };

    // Function to determine which fields are relevant for the selected type
    const getRelevantFields = (type: ManualEntryFormValues['type']) => {
         switch (type) {
            case 'buy': return ['date', 'btcAmount', 'usdAmount', 'price', 'fees', 'exchange'];
            case 'sell': return ['date', 'btcAmount', 'usdAmount', 'price', 'fees', 'exchange'];
            case 'deposit': return ['date', 'btcAmount', 'usdAmount', 'price', 'txid']; // Assuming USD amount might be relevant
            case 'withdrawal': return ['date', 'btcAmount', 'usdAmount', 'price', 'network_fee', 'txid'];
            default: return ['date', 'btcAmount', 'usdAmount'];
         }
    };

    const relevantFields = getRelevantFields(selectedType);

    return (
        <div className="space-y-6">
            {/* Form for adding a single entry */}
            <Card>
                <CardHeader>
                    <CardTitle>Add Manual Transaction</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Type Selector */}
                    <div>
                        <Label htmlFor="type">Transaction Type</Label>
                        <Controller
                            name="type"
                            control={control}
                            render={({ field }) => (
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                    </div>

                    {/* Dynamic Fields based on Type */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {relevantFields.includes('date') && (
                             <div>
                                 <Label htmlFor="date">Date</Label>
                                 <Input id="date" type="date" {...register('date')} />
                                 {errors.date && <p className="text-xs text-destructive mt-1">{errors.date.message}</p>}
                             </div>
                        )}
                        {relevantFields.includes('btcAmount') && (
                            <div>
                                <Label htmlFor="btcAmount">BTC Amount</Label>
                                <Input id="btcAmount" type="number" step="any" {...register('btcAmount')} placeholder="e.g., 0.5" />
                                {errors.btcAmount && <p className="text-xs text-destructive mt-1">{errors.btcAmount.message}</p>}
                            </div>
                        )}
                        {relevantFields.includes('usdAmount') && (
                            <div>
                                <Label htmlFor="usdAmount">Fiat Amount (USD)</Label>
                                <Input id="usdAmount" type="number" step="any" {...register('usdAmount')} placeholder="e.g., 25000" />
                                {errors.usdAmount && <p className="text-xs text-destructive mt-1">{errors.usdAmount.message}</p>}
                            </div>
                        )}
                         {relevantFields.includes('price') && (
                            <div>
                                <Label htmlFor="price">Price per BTC (USD)</Label>
                                <Input id="price" type="number" step="any" {...register('price')} placeholder="e.g., 50000" />
                                {errors.price && <p className="text-xs text-destructive mt-1">{errors.price.message}</p>}
                            </div>
                        )}
                        {relevantFields.includes('fees') && (
                             <div>
                                <Label htmlFor="fees">Service Fee (USD)</Label>
                                <Input id="fees" type="number" step="any" {...register('fees')} placeholder="e.g., 5.00" />
                                {errors.fees && <p className="text-xs text-destructive mt-1">{errors.fees.message}</p>}
                            </div>
                        )}
                         {relevantFields.includes('exchange') && (
                            <div>
                                <Label htmlFor="exchange">Exchange (Optional)</Label>
                                <Input id="exchange" {...register('exchange')} placeholder="e.g., Coinbase" />
                                {errors.exchange && <p className="text-xs text-destructive mt-1">{errors.exchange.message}</p>}
                            </div>
                        )}
                        {relevantFields.includes('network_fee') && (
                            <div>
                                <Label htmlFor="network_fee">Network Fee (BTC)</Label>
                                <Input id="network_fee" type="number" step="any" {...register('network_fee')} placeholder="e.g., 0.0001" />
                                {errors.network_fee && <p className="text-xs text-destructive mt-1">{errors.network_fee.message}</p>}
                            </div>
                        )}
                        {relevantFields.includes('txid') && (
                             <div>
                                <Label htmlFor="txid">Transaction Hash (Optional)</Label>
                                <Input id="txid" {...register('txid')} placeholder="e.g., a1b2..." />
                                {errors.txid && <p className="text-xs text-destructive mt-1">{errors.txid.message}</p>}
                            </div>
                        )}
                        {/* Asset field (defaulted to BTC, could be hidden or made selectable) */}
                         {/* <Input type="hidden" {...register('asset')} value="BTC" /> */}
                    </div>
                </CardContent>
                <CardFooter className="flex justify-end">
                    <Button 
                        onClick={handleSubmit(handleAddToStaged)} 
                        disabled={!isValid || isLoading}
                        type="button" // Prevent default form submission
                    >
                         <PlusCircle className="mr-2 h-4 w-4" /> Add to List
                    </Button>
                </CardFooter>
            </Card>

            {/* Staged Entries List */}
            {stagedEntries.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Staged Transactions ({stagedEntries.length})</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                         {stagedEntries.map((entry) => (
                            <div key={entry.tempId} className="flex items-center justify-between p-2 border rounded text-sm">
                                <span>
                                    {entry.date} - {entry.type.toUpperCase()} - 
                                    {entry.btcAmount ? `${entry.btcAmount} BTC` : ''} 
                                    {entry.usdAmount ? ` ($${entry.usdAmount})` : ''}
                                    {/* Add more details as needed */} 
                                </span>
                                <Button 
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                    onClick={() => handleRemoveStaged(entry.tempId)}
                                    disabled={isLoading}
                                    aria-label="Remove staged transaction"
                                >
                                     <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                         ))}
                    </CardContent>
                    <CardFooter className="flex justify-end">
                        <Button 
                            onClick={handleSubmitAll} 
                            disabled={isLoading || stagedEntries.length === 0}
                        >
                            Submit All Staged Entries
                        </Button>
                    </CardFooter>
                </Card>
            )}
        </div>
    );
} 