"use client"

import React, { useState, useEffect, useCallback } from 'react';
import { getCSVUploads, deleteCSVUpload } from '@/lib/supabase/supabase';
import { useAuth } from '@/providers/supabase-auth-provider';
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
import { format } from 'date-fns';
import { useToast } from "@/lib/hooks/use-toast";
import { cn } from "@/lib/utils/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

// We need to import UploadedCSV type from the import component
// Instead of importing from components/import/lib/types, let's define it here to avoid circular dependencies
// The actual type is from Database["public"]["Tables"]["csv_uploads"]["Row"]
type UploadedCSV = {
  id: string;
  user_id: string;
  filename: string;
  original_filename: string;
  file_size: number;
  status: 'pending' | 'processing' | 'completed' | 'error';
  row_count?: number | null;
  imported_row_count?: number | null;
  error_message?: string | null;
  created_at: string;
  updated_at?: string | null;
};

// Utility function for formatting file size
function formatFileSize(bytes: number | null | undefined): string {
  if (bytes === null || bytes === undefined || isNaN(bytes)) return '-';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

type LoadingState = 'idle' | 'fetching' | 'deleting';

export function ManageFilesSettings() {
  const { user } = useAuth();
  const userId = user?.id;
  const { toast } = useToast();

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
      const { data, error } = await getCSVUploads();
      if (error) throw error;
      setUploads(data || []);
    } catch (err) {
      console.error("Failed to fetch CSV uploads:", err);
      const message = err instanceof Error ? err.message : "Could not load previous uploads.";
      setError(message);
      toast({ title: "Error", description: message, variant: "destructive" });
      setUploads([]);
    } finally {
      setLoadingState('idle');
    }
  }, [userId, toast]);

  useEffect(() => {
    fetchUploads();
  }, [fetchUploads]);

  const completedUploads = uploads.filter(upload => upload.status === 'completed');

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
      setUploads(prev => prev.filter(up => up.id !== uploadToDelete.id));
      
    } catch (err) {
      console.error("Failed to delete CSV upload:", err);
      const message = err instanceof Error ? err.message : "Could not delete file.";
      setError(message);
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
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-800/20 via-gray-900/30 to-gray-800/20 p-6 shadow-md backdrop-blur-sm">
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">Manage Uploaded CSV Files</h3>
            <p className="text-gray-400 text-sm">
              View and manage uploaded CSV files.
            </p>
          </div>
        </div>
        
        {loadingState === 'fetching' && <p className="text-gray-400">Loading uploads...</p>}
        {error && <p className="text-red-400">Error: {error}</p>}

        <Table>
          <TableCaption className="text-center">
            Your uploaded CSV files.
            {completedUploads.length === 0 && loadingState !== 'fetching' && " No uploads found."}
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="text-center">File</TableHead>
              <TableHead className="text-center">Date</TableHead>
              <TableHead className="text-center">Size</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-center">Rows</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {completedUploads.map((upload) => (
              <TableRow key={upload.id}>
                <TableCell className="font-medium truncate max-w-xs text-center">{upload.original_filename}</TableCell>
                <TableCell className="text-center">{format(new Date(upload.created_at), 'PP')}</TableCell>
                <TableCell className="text-center">{formatFileSize(upload.file_size)}</TableCell>
                <TableCell className="text-center">
                  <Badge variant={getStatusBadgeVariant(upload.status)}>{upload.status}</Badge>
                </TableCell>
                <TableCell className="text-center">
                  {upload.imported_row_count ?? '-'} / {upload.row_count ?? 'N/A'}
                </TableCell>
                <TableCell className="text-center">
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
                <span className="font-semibold"> {uploadToDelete?.original_filename} </span> 
                and its associated records. 
                <span className="font-bold text-destructive"> Imported transactions from this file will NOT be deleted.</span>
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
    </div>
  );
} 