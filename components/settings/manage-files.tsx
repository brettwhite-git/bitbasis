"use client"

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { getCSVUploads, deleteCSVUpload } from '@/lib/supabase/supabase';
import { useAuth } from '@/providers/supabase-auth-provider';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
    Table, 
    TableBody, 
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form"
import { 
  Trash2, 
  RefreshCw, 
  Search, 
  FileText, 
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from "@/lib/hooks/use-toast";
import { cn } from "@/lib/utils/utils";

// Form schema for file management filters
const fileFilterSchema = z.object({
  searchTerm: z.string().default(""),
  statusFilter: z.enum(["all", "completed", "processing", "error"]).default("all"),
})

type FileFilterFormValues = z.infer<typeof fileFilterSchema>

// CSV Upload type definition
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

type LoadingState = 'idle' | 'fetching' | 'deleting' | 'refreshing';

export function ManageFilesSettings() {
  const { user } = useAuth();
  const userId = user?.id;
  const { toast } = useToast();

  const [uploads, setUploads] = useState<UploadedCSV[]>([]);
  const [loadingState, setLoadingState] = useState<LoadingState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [uploadToDelete, setUploadToDelete] = useState<UploadedCSV | null>(null);

  // Initialize form for filters
  const form = useForm<FileFilterFormValues>({
    resolver: zodResolver(fileFilterSchema),
    defaultValues: {
      searchTerm: "",
      statusFilter: "all",
    },
    mode: "onChange", // Only validate on change, not on every render
  })

  // Get form values efficiently without causing re-renders
  const searchTerm = form.watch("searchTerm")
  const statusFilter = form.watch("statusFilter")

  // Memoize filtered uploads to prevent unnecessary recalculations
  const filteredUploads = useMemo(() => {
    let filtered = uploads;

    // Apply search filter
    if (searchTerm && searchTerm.trim()) {
      filtered = filtered.filter(upload => 
        upload.original_filename.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter && statusFilter !== "all") {
      filtered = filtered.filter(upload => upload.status === statusFilter);
    }

    return filtered;
  }, [uploads, searchTerm, statusFilter]);

  const fetchUploads = useCallback(async (isRefresh = false) => {
    if (!userId) return;
    setLoadingState(isRefresh ? 'refreshing' : 'fetching');
    setError(null);
    try {
      const { data, error } = await getCSVUploads();
      if (error) throw error;
      // Type assertion for database status field
      const uploadsWithTypedStatus = (data || []).map(upload => ({
        ...upload,
        status: upload.status as 'error' | 'processing' | 'completed' | 'pending'
      }));
      setUploads(uploadsWithTypedStatus);
      
      if (isRefresh) {
        toast({ 
          title: "Refreshed", 
          description: "File list has been updated.",
        });
      }
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

  const handleDeleteClick = useCallback((upload: UploadedCSV) => {
    setUploadToDelete(upload);
    setShowConfirmDialog(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!uploadToDelete) return;

    setLoadingState('deleting');
    setError(null);
    try {
      const { error } = await deleteCSVUpload(uploadToDelete.id);
      if (error) throw error;
      
      toast({ 
        title: "File Deleted", 
        description: `Successfully deleted ${uploadToDelete.original_filename}`,
      });
      
      // Update uploads state by removing the deleted item
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
  }, [uploadToDelete, toast]);

  const getStatusIcon = useCallback((status: UploadedCSV['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="h-3.5 w-3.5" />;
      case 'processing': 
      case 'pending': return <Clock className="h-3.5 w-3.5" />;
      case 'error': return <XCircle className="h-3.5 w-3.5" />;
      default: return <FileText className="h-3.5 w-3.5" />;
    }
  }, []);

  const getStatusBadgeVariant = useCallback((status: UploadedCSV['status']): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'completed': return 'default';
      case 'processing':
      case 'pending': return 'secondary';
      case 'error': return 'destructive';
      default: return 'outline';
    }
  }, []);

  const getStatusColor = useCallback((status: UploadedCSV['status']) => {
    switch (status) {
      case 'completed': return 'text-green-400';
      case 'processing': 
      case 'pending': return 'text-yellow-400';
      case 'error': return 'text-red-400';
      default: return 'text-gray-400';
    }
  }, []);

  // Memoize total size calculation
  const totalSize = useMemo(() => {
    return uploads.reduce((sum, upload) => sum + (upload.file_size || 0), 0);
  }, [uploads]);

  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-800/20 via-gray-900/30 to-gray-800/20 p-6 shadow-md backdrop-blur-sm">
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">File Management</h3>
            <p className="text-gray-400 text-sm">
              View, search, and manage your uploaded CSV files.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchUploads(true)}
            disabled={loadingState === 'refreshing'}
            className="bg-gray-800/50 border-gray-600/50 text-white hover:bg-gray-700/50"
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", loadingState === 'refreshing' && "animate-spin")} />
            Refresh
          </Button>
        </div>

        {/* Search and Filter Form */}
        <Form {...form}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <FormField
              control={form.control}
              name="searchTerm"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Search Files</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search by filename..."
                        className="pl-8 bg-gray-800/30 border-gray-600/50 text-white placeholder:text-gray-400"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormDescription className="text-gray-400">
                    Filter files by filename
                  </FormDescription>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="statusFilter"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Filter by Status</FormLabel>
                  <FormControl>
                    <select
                      {...field}
                      className="flex h-10 w-full rounded-md border border-gray-600/50 bg-gray-800/30 px-3 py-2 text-sm text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                    >
                      <option value="all">All Status</option>
                      <option value="completed">Completed</option>
                      <option value="processing">Processing</option>
                      <option value="error">Error</option>
                    </select>
                  </FormControl>
                  <FormDescription className="text-gray-400">
                    Show files by status
                  </FormDescription>
                </FormItem>
              )}
            />
          </div>
        </Form>

        {/* Error Alert */}
        {error && (
          <Alert className="mb-4 bg-red-900/20 border-red-800/50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-red-300">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Loading State */}
        {loadingState === 'fetching' && (
          <div className="space-y-3">
            <Skeleton className="h-12 w-full bg-gray-800/50" />
            <Skeleton className="h-12 w-full bg-gray-800/50" />
            <Skeleton className="h-12 w-full bg-gray-800/50" />
          </div>
        )}

        {/* Files Table */}
        {loadingState !== 'fetching' && (
          <div className="rounded-lg border border-gray-600/30 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-600/30 hover:bg-gray-800/20">
                  <TableHead className="text-gray-300">File</TableHead>
                  <TableHead className="text-gray-300">Date</TableHead>
                  <TableHead className="text-gray-300">Size</TableHead>
                  <TableHead className="text-gray-300">Status</TableHead>
                  <TableHead className="text-gray-300">Rows</TableHead>
                  <TableHead className="text-gray-300 text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUploads.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <FileText className="h-8 w-8 text-gray-400" />
                        <p className="text-gray-400">
                          {uploads.length === 0 ? "No uploaded files found" : "No files match your filters"}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUploads.map((upload) => (
                    <TableRow key={upload.id} className="border-gray-600/30 hover:bg-gray-800/10">
                      <TableCell className="font-medium text-white">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-gray-400" />
                          <span className="truncate max-w-xs" title={upload.original_filename}>
                            {upload.original_filename}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-300">
                        {format(new Date(upload.created_at), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell className="text-gray-300">{formatFileSize(upload.file_size)}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={getStatusBadgeVariant(upload.status)}
                          className="flex items-center gap-1 w-fit"
                        >
                          <span className={getStatusColor(upload.status)}>
                            {getStatusIcon(upload.status)}
                          </span>
                          {upload.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-300">
                        <div className="text-sm">
                          <span className="font-medium">{upload.imported_row_count ?? '-'}</span>
                          <span className="text-gray-400"> / {upload.row_count ?? 'N/A'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button 
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(upload)}
                          disabled={loadingState === 'deleting'}
                          className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-900/20"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Summary Stats */}
        {uploads.length > 0 && (
          <div className="mt-4 flex items-center justify-between text-sm text-gray-400">
            <span>
              Showing {filteredUploads.length} of {uploads.length} files
            </span>
            <span>
              Total size: {formatFileSize(totalSize)}
            </span>
          </div>
        )}

        {/* Confirmation Dialog */}
        <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <AlertDialogContent className="bg-gray-900 border-gray-700">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-white">Delete File Record?</AlertDialogTitle>
              <AlertDialogDescription className="text-gray-300">
                This action cannot be undone. This will permanently delete the uploaded file record for{" "}
                <span className="font-semibold text-white">{uploadToDelete?.original_filename}</span>.
                <br /><br />
                <span className="font-bold text-yellow-400">
                  Note: Imported transactions from this file will NOT be deleted.
                </span>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel 
                disabled={loadingState === 'deleting'}
                className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700"
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleConfirmDelete} 
                disabled={loadingState === 'deleting'}
                className="bg-red-600 text-white hover:bg-red-700"
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