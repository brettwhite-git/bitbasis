"use client"

import React, { useState, useEffect, useCallback } from 'react';
import { getCSVUploads, deleteCSVUpload } from '@/lib/supabase/supabase'; // Assuming these helpers exist
import { UploadedCSV } from '../lib/types'; // Fixed path: Import the type
import { useAuth } from '@/providers/supabase-auth-provider'; // To get userId
import { Button } from "@/components/ui/button";
import { 
    Table, 
    TableBody, 
    TableCaption, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from "@/components/ui/table";
import { 
    AlertDialog, 
    AlertDialogAction, 
    AlertDialogCancel, 
    AlertDialogContent, 
    AlertDialogDescription, 
    AlertDialogFooter, 
    AlertDialogHeader, 
    AlertDialogTitle 
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Trash2, RefreshCw } from 'lucide-react';
import { format } from 'date-fns'; // For formatting dates
import { formatFileSize } from '../lib/utils'; // Fixed path: Import utility
import { useToast } from "@/hooks/use-toast"; // Correct path for the hook
import { cn } from "@/lib/utils/utils";

// No specific props needed from container if we use useAuth here directly
// interface ManageCSVsProps {
//     userId: string;
// }

type LoadingState = 'idle' | 'fetching' | 'deleting';

export function ManageCSVs() {
    const { user } = useAuth();
    const userId = user?.id;
    const { toast } = useToast(); // Call the hook to get the toast function

    const [uploads, setUploads] = useState<UploadedCSV[]>([]);
    const [loadingState, setLoadingState] = useState<LoadingState>('idle');
    const [error, setError] = useState<string | null>(null);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [uploadToDelete, setUploadToDelete] = useState<UploadedCSV | null>(null);

    const fetchUploads = useCallback(async () => {
        if (!userId) return;
        setLoadingState('fetching');
        setError(null);
        try {
            const { data, error } = await getCSVUploads(); // Assumes it gets uploads for the authenticated user
            if (error) throw error;
            setUploads(data || []);
        } catch (err) {
            console.error("Failed to fetch CSV uploads:", err);
            const message = err instanceof Error ? err.message : "Could not load previous uploads.";
            setError(message);
            toast({ title: "Error", description: message, variant: "destructive" });
            setUploads([]); // Clear uploads on error
        } finally {
            setLoadingState('idle');
        }
    }, [userId]);

    // Fetch uploads on mount and when userId changes
    useEffect(() => {
        fetchUploads();
    }, [fetchUploads]);

    const handleDeleteClick = (upload: UploadedCSV) => {
        setUploadToDelete(upload);
        setShowConfirmDialog(true);
    };

    const handleConfirmDelete = async () => {
        if (!uploadToDelete) return;

        setLoadingState('deleting');
        setError(null);
        try {
            const { error } = await deleteCSVUpload(uploadToDelete.id);
            if (error) throw error;
            
            toast({ title: "Success", description: `Deleted file: ${uploadToDelete.original_filename}` });
            // Refresh the list after deletion
            setUploads(prev => prev.filter(up => up.id !== uploadToDelete.id)); 
            // Or call fetchUploads() again, filter might be faster UI update
            
        } catch (err) {
            console.error("Failed to delete CSV upload:", err);
            const message = err instanceof Error ? err.message : "Could not delete file.";
            setError(message); // Show error near the table potentially
            toast({ title: "Error", description: message, variant: "destructive" });
        } finally {
            setLoadingState('idle');
            setShowConfirmDialog(false);
            setUploadToDelete(null);
        }
    };

    const getStatusBadgeVariant = (status: UploadedCSV['status']): "default" | "secondary" | "destructive" | "outline" => {
        switch (status) {
            case 'completed': return 'default';
            case 'processing':
            case 'pending': return 'secondary';
            case 'error': return 'destructive';
            default: return 'outline';
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Manage Uploaded Files</h3>
                <Button variant="outline" size="sm" onClick={fetchUploads} disabled={loadingState === 'fetching'}>
                    <RefreshCw className={cn("mr-2 h-4 w-4", loadingState === 'fetching' && "animate-spin")} />
                    Refresh
                </Button>
            </div>

            {loadingState === 'fetching' && <p className="text-muted-foreground">Loading uploads...</p>}
            {error && <p className="text-destructive">Error: {error}</p>} 

            <Table>
                <TableCaption>
A list of your previously uploaded CSV files.
                    {uploads.length === 0 && loadingState !== 'fetching' && " No uploads found."}
                </TableCaption>
                <TableHeader>
                    <TableRow>
                        <TableHead>Filename</TableHead>
                        <TableHead>Upload Date</TableHead>
                        <TableHead>Size</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Rows</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {uploads.map((upload) => (
                        <TableRow key={upload.id}>
                            <TableCell className="font-medium truncate max-w-xs">{upload.original_filename}</TableCell>
                            <TableCell>{format(new Date(upload.created_at), 'PP pp')}</TableCell>
                            <TableCell>{formatFileSize(upload.file_size)}</TableCell>
                            <TableCell>
                                <Badge variant={getStatusBadgeVariant(upload.status)}>{upload.status}</Badge>
                            </TableCell>
                            <TableCell>
                                {upload.imported_row_count ?? '-'} / {upload.row_count ?? 'N/A'}
                            </TableCell>
                            <TableCell className="text-right">
                                <Button 
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDeleteClick(upload)}
                                    disabled={loadingState === 'deleting'}
                                    aria-label="Delete upload"
                                >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            {/* Confirmation Dialog */}
            <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the uploaded file 
                            <span className="font-semibold">{uploadToDelete?.original_filename}</span> 
                            and its associated records. 
                            <span className="font-bold text-destructive">Imported transactions from this file will NOT be deleted.</span>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={loadingState === 'deleting'}>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={handleConfirmDelete} 
                            disabled={loadingState === 'deleting'}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {loadingState === 'deleting' ? 'Deleting...' : 'Delete File Record'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
} 