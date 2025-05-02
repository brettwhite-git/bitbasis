"use client"

import React, { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/providers/supabase-auth-provider';
import { 
    ParsedTransaction, 
    ValidationIssue, 
    OrderInsert, 
    TransferInsert, 
    UploadedCSV,
    CSVRow,
    ParsedOrder,
    ParsedTransfer
} from './lib/types';
import { normalizeHeaders, transformRowToTransaction } from './lib/parsing';
import { validateTransaction } from './lib/validation';
import {
  getTransactions,
  insertTransactions,
  uploadCSVFile,
  getCSVUploads,
} from '@/lib/supabase/supabase'; // Assuming these are correctly exported
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Papa from 'papaparse';
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from 'lucide-react';

// Placeholder imports for child components - will be created later
import { FileUpload } from './components/FileUpload';
import { ManualEntry, ManualEntryFormValues } from './components/ManualEntry';
import { ManageCSVs } from './components/ManageCSVs';
import { ImportResources } from './components/ImportResources';
import { ImportPreview } from './components/ImportPreview';

// Define more granular loading states
type LoadingState = 'idle' | 'uploading' | 'parsing' | 'validating' | 'importing' | 'fetchingCSVs';

export function ImportFormContainer() {
    const { user } = useAuth();
    const userId = user?.id;
    const { toast } = useToast();

    // === State Management ===
    const [activeTab, setActiveTab] = useState<string>('upload');
    const [currentFile, setCurrentFile] = useState<File | null>(null);
    const [loadingState, setLoadingState] = useState<LoadingState>('idle');
    const [error, setError] = useState<string | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [parsedTransactions, setParsedTransactions] = useState<ParsedTransaction[] | null>(null);
    const [validationIssues, setValidationIssues] = useState<ValidationIssue[]>([]);
    const [showPreview, setShowPreview] = useState(false);
    const [currentCsvUploadId, setCurrentCsvUploadId] = useState<string | null>(null); // For tracking during CSV import flow
    const [importSource, setImportSource] = useState<'csv' | 'manual' | null>(null); // Track origin for preview
    const [manualEntries, setManualEntries] = useState<ManualEntryFormValues[]>([]); // Use imported type
    
    // Effect to handle missing user ID
    useEffect(() => {
        if (!userId) {
            console.error("ImportFormContainer: User ID not available.");
            setError("User session error. Please log in again.");
            // Optionally disable functionality or redirect
        }
    }, [userId]);

    // === Core Logic Handlers ===

    // 1. Handle File Selection/Drop (from FileUpload component)
    const handleFileSelected = useCallback(async (file: File) => {
        if (!userId) {
            setError("Cannot process file: User not authenticated.");
            return;
        }
        
        setCurrentFile(file);
        setError(null);
        setParsedTransactions(null);
        setValidationIssues([]);
        setShowPreview(false);
        setCurrentCsvUploadId(null);
        setImportSource('csv');
        setUploadProgress(0);

        setLoadingState('uploading');
        try {
            // Step 1: Upload file and create DB record
            const { data: csvUpload, error: uploadError } = await uploadCSVFile(file);
            if (uploadError || !csvUpload?.id) {
                throw uploadError || new Error('Failed to upload file and create record.');
            }
            setCurrentCsvUploadId(csvUpload.id);
            
            // Step 2: Parse the file locally (using Papaparse or similar)
            setLoadingState('parsing');
            // Simulating parsing delay/process
            await new Promise(resolve => setTimeout(resolve, 500)); 

            const parseResult = await new Promise<{ data: Record<string, any>[], errors: any[] }>((resolve, reject) => {
                 Papa.parse(file, {
                    header: true,
                    skipEmptyLines: true,
                    complete: (results) => resolve({ data: results.data as Record<string, any>[], errors: results.errors }),
                    error: (error) => reject(error),
                 });
            });

            if (parseResult.errors.length > 0) {
                console.error('Papaparse errors:', parseResult.errors);
                throw new Error(`Failed to parse CSV: ${parseResult.errors[0]?.message || 'Unknown parsing error'}`);
            }

            const rawRows = parseResult.data;
            const processed: ParsedTransaction[] = [];
            const issues: ValidationIssue[] = [];
            
            setLoadingState('validating');
            rawRows.forEach((rawRow, index) => {
                 try {
                    if (Object.values(rawRow).every(val => !val || String(val).trim() === '')) return;
                    const normalizedRow = normalizeHeaders(rawRow);
                    const transaction = transformRowToTransaction(normalizedRow, 'csv');
                    const rowIssues = validateTransaction(transaction, index);
                    processed.push(transaction);
                    issues.push(...rowIssues);
                 } catch (err) {
                    console.error(`Error processing row ${index + 1}:`, err);
                    issues.push({
                        transactionId: `csv-row-${index + 1}-${Date.now()}`,
                        field: 'general',
                        message: err instanceof Error ? err.message : 'Row processing error',
                        severity: 'error'
                    });
                 }
            });

            setParsedTransactions(processed);
            setValidationIssues(issues);

            if (processed.length === 0) {
                 throw new Error("No valid transactions found in the CSV file.");
            }

            // Update status in DB before showing preview
            await updateCSVUploadStatus(csvUpload.id, 'processing', { rowCount: rawRows.length });

            setLoadingState('idle');
            setShowPreview(true); // Show preview after successful parse/validation

        } catch (err) {
            console.error("File processing error:", err);
            const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred.";
            setError(errorMessage);
            setLoadingState('idle');
            // If upload succeeded but parsing failed, mark CSV as error
            if (currentCsvUploadId) {
                try {
                   await updateCSVUploadStatus(currentCsvUploadId, 'error', { errorMessage });
                } catch (statusError) {
                   console.error("Failed to update CSV status to error:", statusError);
                }
            }
            setCurrentCsvUploadId(null); // Reset ID on error
        }
    }, [userId, currentCsvUploadId]);

    // 2. Handle Manual Entry Submission (from ManualEntry component)
    // This will receive a list of raw entries, parse/validate them
    const handleManualSubmit = useCallback((entries: ManualEntryFormValues[]) => {
        if (!userId) {
            setError("User not authenticated.");
            return;
        }
        if (entries.length === 0) {
            setError("No manual entries to submit.");
            return;
        }

        console.log("Handling manual submit with entries:", entries);
        setLoadingState('validating'); // Indicate processing start

        // **Map ManualEntryFormValues[] to CSVRow[]**
        const csvRowsEquivalent: CSVRow[] = entries.map(manualEntry => {
            // Explicitly map fields, converting numbers/dates to strings as CSVRow expects strings
            const row: CSVRow = {
                date: manualEntry.date, // Keep as string from form
                type: manualEntry.type,
                asset: manualEntry.asset || 'BTC', // Ensure asset is present
                // Map relevant fields, converting numbers to string. Handle undefined.
                btc_amount: manualEntry.btcAmount?.toString(),
                fiat_amount: manualEntry.usdAmount?.toString(), // Assuming manual entry 'usdAmount' maps to 'fiat_amount'
                price: manualEntry.price?.toString(),
                service_fee: manualEntry.fees?.toString(), // Assuming manual entry 'fees' maps to 'service_fee'
                exchange: manualEntry.exchange || undefined,
                fee_amount_btc: manualEntry.network_fee?.toString(), // Assuming manual entry 'network_fee' maps to 'fee_amount_btc'
                hash: manualEntry.txid || undefined,

                // Add any other fields expected by transformRowToTransaction based on CSVRow definition and parsing logic
                // e.g., currency fields if applicable, though manual entry seems simplified
                buy_currency: manualEntry.type === 'buy' ? 'USD' : undefined, // Example default if needed
                sell_btc_currency: manualEntry.type === 'sell' ? 'BTC' : undefined,
                received_fiat_currency: manualEntry.type === 'sell' ? 'USD' : undefined,
                service_fee_currency: manualEntry.fees ? 'USD' : undefined,
            };
            // Clean up undefined values if necessary, though CSVRow allows undefined
             Object.keys(row).forEach(key => row[key] === undefined && delete row[key]);
             console.log("Mapped Manual Entry:", manualEntry, "to CSVRow:", row);
            return row;
        });

        console.log("Mapped CSV Rows from Manual Entries:", csvRowsEquivalent);

        // Process the mapped data
        processData(csvRowsEquivalent, 'manual');

    }, [userId]);

    // 3. Handle Preview Confirmation (from ImportPreview component)
    const handlePreviewConfirm = useCallback(async () => {
        if (!userId) {
            setError("Cannot import: User not authenticated.");
            toast({ variant: "destructive", title: "Error", description: "Authentication required." });
            return;
        }
        if (!parsedTransactions || parsedTransactions.length === 0) {
             setError("No transactions to import.");
             toast({ variant: "destructive", title: "Error", description: "No transactions found in the preview." });
             return;
        }
        if (validationIssues.some(issue => issue.severity === 'error')) {
            setError("Cannot import: Please resolve errors first."); // Should ideally be prevented by disabling button in preview
            return;
        }

        setLoadingState('importing');
        setError(null);

        try {
            // Prepare data for insertion (map ParsedTransaction to OrderInsert/TransferInsert)
            const ordersToInsert: OrderInsert[] = [];
            const transfersToInsert: TransferInsert[] = [];
            
            parsedTransactions.forEach(tx => {
                if (!tx.date) return; // Should have been caught by validation
                const isoDate = tx.date.toISOString();
                if (tx.type === 'buy' || tx.type === 'sell') {
                    const order = tx as ParsedOrder;
                    ordersToInsert.push({ 
                        user_id: userId as string,
                        date: isoDate, type: order.type, asset: order.asset ?? 'BTC',
                        price: order.price ?? 0, exchange: order.exchange ?? null,
                        buy_fiat_amount: order.buyFiatAmount ?? null, buy_currency: order.buyCurrency ?? null,
                        received_btc_amount: order.receivedBtcAmount ?? null, received_currency: 'BTC',
                        sell_btc_amount: order.sellBtcAmount ?? null, sell_btc_currency: order.sellBtcCurrency ?? null,
                        received_fiat_amount: order.receivedFiatAmount ?? null, received_fiat_currency: order.receivedFiatCurrency ?? null,
                        service_fee: order.serviceFee ?? null, service_fee_currency: order.serviceFeeCurrency ?? null,
                        // csv_upload_id is added by insertTransactions if provided
                    });
                } else if (tx.type === 'deposit' || tx.type === 'withdrawal') {
                    const transfer = tx as ParsedTransfer;
                     transfersToInsert.push({ 
                        user_id: userId as string,
                        date: isoDate, type: transfer.type,
                        amount_btc: transfer.amountBtc ?? 0, 
                        fee_amount_btc: transfer.feeAmountBtc ?? null, 
                        amount_fiat: transfer.amountFiat ?? null,
                        price: transfer.price ?? 0, 
                        hash: transfer.hash ?? null,
                         // csv_upload_id is added by insertTransactions if provided
                    });
                }
            });

            console.log("Importing - Orders:", ordersToInsert.length, "Transfers:", transfersToInsert.length, "CSV ID:", currentCsvUploadId);

            // Call the Supabase helper function
            const result = await insertTransactions({
                orders: ordersToInsert,
                transfers: transfersToInsert,
                // Pass CSV ID only if the source was CSV and ID is not null
                csvUploadId: importSource === 'csv' && currentCsvUploadId ? currentCsvUploadId : undefined 
            });

            if (result.error) {
                throw new Error(result.error.message || 'Import failed');
            }

            // Success!
            setLoadingState('idle');
            setShowPreview(false);
            setParsedTransactions(null);
            setValidationIssues([]);
            setCurrentFile(null);
            setCurrentCsvUploadId(null);
            setImportSource(null);
            setActiveTab('manage'); // Navigate to manage tab after successful import
            console.log("Import successful!", result.data);

        } catch (err) {
            console.error("Import confirmation error:", err);
            setError(err instanceof Error ? err.message : "An unexpected error occurred during import.");
            setLoadingState('idle');
             // Note: insertTransactions already attempts to mark CSV as error on failure
        }
    }, [userId, parsedTransactions, validationIssues, currentCsvUploadId, importSource]);

    // 4. Handle Preview Cancellation (from ImportPreview component)
    const handlePreviewCancel = useCallback(() => {
        setShowPreview(false);
        console.log("Preview cancelled");
    }, []);

    // 5. Handle Clear File (from FileUpload component)
    const handleClearFile = useCallback(() => {
        setCurrentFile(null);
        setParsedTransactions(null);
        setValidationIssues([]);
        setError(null);
        setShowPreview(false);
        setUploadProgress(0);
        setLoadingState('idle');
        setCurrentCsvUploadId(null); 
        setImportSource(null);
    }, []);

    // === Helper Functions ===
    
    // Define processData *before* handlers that use it
    const processData = (data: CSVRow[], source: 'csv' | 'manual', csvUploadId?: string | null) => {
        // ... (implementation of processData as defined in previous steps) ...
        setLoadingState('validating');
        setError(null);
        setParsedTransactions([]);
        setValidationIssues([]);

        const processed: ParsedTransaction[] = [];
        const issues: ValidationIssue[] = [];
        let parseErrors = 0;

        data.forEach((row, index) => {
            try {
                if (source === 'csv' && Object.values(row).every(val => !val || String(val).trim() === '')) {
                    console.warn(`Skipping empty CSV row at index ${index}`);
                    return;
                }
                const transaction = transformRowToTransaction(row, source);
                const rowIssues = validateTransaction(transaction, index); 
                processed.push(transaction);
                issues.push(...rowIssues.map(issue => ({ ...issue, transactionId: transaction.id })));
            } catch (err: any) {
                console.error(`Error processing ${source} row ${index + 1}:`, err);
                parseErrors++;
                issues.push({
                    transactionId: `row-${source}-${index + 1}-${Date.now()}`,
                    field: 'general',
                    message: err.message || 'Unknown processing error',
                    severity: 'error'
                });
            }
        });

        setParsedTransactions(processed);
        setValidationIssues(issues);
        setLoadingState('idle');

        if (processed.length > 0) {
            console.log(`Processed ${processed.length} ${source} transactions. Issues found: ${issues.length}`);
            setShowPreview(true);
            if (source === 'csv' && csvUploadId) {
                 setCurrentCsvUploadId(csvUploadId);
                 console.log("Setting CSV Upload ID for preview:", csvUploadId);
            } else {
                 setCurrentCsvUploadId(null);
                 console.log("Clearing CSV Upload ID for manual preview.");
            }
        } else {
            setError(`Failed to process any valid transactions from ${source}. ${parseErrors > 0 ? `${parseErrors} rows had errors.` : 'Source might be empty or incorrectly formatted.'}`);
        }
    };

    // === Render Logic ===
    // This will eventually render the child UI components and pass down state/callbacks
    return (
        <div className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-4 mb-4">
                    <TabsTrigger value="upload">Upload CSV</TabsTrigger>
                    <TabsTrigger value="manual">Manual Entry</TabsTrigger>
                    <TabsTrigger value="manage">Manage Files</TabsTrigger>
                    <TabsTrigger value="resources">Resources</TabsTrigger>
                </TabsList>

                {/* General Error Display Area */}
                {error && (
                    <Alert variant="destructive" className="mt-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                <TabsContent value="upload">
                    <FileUpload 
                        isLoading={loadingState === 'uploading' || loadingState === 'parsing' || loadingState === 'validating'}
                        error={error}
                        progress={uploadProgress} // Assuming uploadProgress covers upload phase
                        currentFile={currentFile}
                        onFileSelected={handleFileSelected}
                        onClearFile={handleClearFile} // Pass the new handler
                    />
                </TabsContent>

                <TabsContent value="manual">
                    <ManualEntry 
                        isLoading={loadingState === 'validating'} 
                        onSubmitEntries={handleManualSubmit}
                        userId={userId}
                    />
                </TabsContent>

                <TabsContent value="manage">
                     <ManageCSVs />
                </TabsContent>

                <TabsContent value="resources">
                    <ImportResources />
                </TabsContent>
            </Tabs>

            {/* Conditional rendering of ImportPreview component */}
            {showPreview && parsedTransactions && (
                <ImportPreview
                    transactions={parsedTransactions}
                    validationIssues={validationIssues}
                    isLoading={loadingState === 'importing'} // Pass importing state
                    source={importSource ?? 'csv'} // Default to csv if somehow null
                    onConfirmImport={handlePreviewConfirm} // Pass confirm handler
                    onCancel={handlePreviewCancel} // Pass cancel handler
                 />
            )}
        </div>
    );
} 