"use client"

import React, { useState, useCallback, useRef } from 'react';
import { UploadCloud, X, File as FileIcon } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress"; // If progress bar is needed
import { cn } from "@/lib/utils"; // For conditional class names

// Props definition based on REFACTORING_PLAN.md (Step 9)
interface FileUploadProps {
    isLoading: boolean;
    error: string | null;
    progress: number; // Assuming 0-100 scale for progress bar
    currentFile: File | null;
    onFileSelected: (file: File) => void;
    onClearFile: () => void;
    // Optional drag/drop state can be managed internally or passed if needed elsewhere
}

export function FileUpload({
    isLoading,
    error,
    progress,
    currentFile,
    onFileSelected,
    onClearFile,
}: FileUploadProps) {
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        // Add a slight delay or check relatedTarget to prevent flickering when dragging over children
        setIsDragging(false);
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        // Indicate this is a valid drop target
        e.dataTransfer.dropEffect = 'copy'; 
    }, []);

    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const file = e.dataTransfer.files[0];
            // Basic validation (e.g., check if it's a CSV)
            if (file && (file.type === 'text/csv' || file.name.toLowerCase().endsWith('.csv'))) {
                 onFileSelected(file);
            } else if (file) {
                 // TODO: Handle non-CSV file error feedback more robustly
                 console.error("Invalid file type. Please upload a CSV file.");
                 // Potentially set an internal error state or call an onError prop
            }
            e.dataTransfer.clearData(); // Clear the drag data cache
        }
    }, [onFileSelected]);

    const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
             if (file && (file.type === 'text/csv' || file.name.toLowerCase().endsWith('.csv'))) {
                 onFileSelected(file);
             } else if (file) {
                 console.error("Invalid file type. Please upload a CSV file.");
             }
        }
    }, [onFileSelected]);

    const handleButtonClick = () => {
        fileInputRef.current?.click();
    };

    const handleClearClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation(); // Prevent triggering label/input click
        onClearFile();
        if (fileInputRef.current) {
            fileInputRef.current.value = ""; // Reset input value
        }
    };

    return (
        <div className="space-y-4">
            <div
                className={cn(
                    "relative flex flex-col items-center justify-center w-full p-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-200 ease-in-out",
                    isDragging ? "border-primary bg-primary/10" : "border-border hover:border-primary/50",
                    currentFile ? "border-solid border-primary/30" : ""
                )}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={!currentFile ? handleButtonClick : undefined} // Trigger input click only if no file selected
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv, text/csv"
                    onChange={handleFileChange}
                    className="sr-only" // Hidden input, triggered programmatically
                    disabled={isLoading || !!currentFile} // Disable if loading or file already selected
                />

                {currentFile ? (
                    // Display selected file info
                    <div className="flex items-center space-x-3 text-sm">
                        <FileIcon className="h-6 w-6 text-muted-foreground" />
                        <span className="font-medium truncate max-w-[200px] sm:max-w-[300px] md:max-w-[400px]">{currentFile.name}</span>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-muted-foreground hover:text-destructive"
                            onClick={handleClearClick}
                            disabled={isLoading}
                            aria-label="Clear file"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                ) : (
                    // Display upload prompt
                    <div className="text-center">
                        <UploadCloud className="mx-auto h-10 w-10 text-muted-foreground mb-2" />
                        <p className="font-semibold text-sm">Drag & drop CSV file here</p>
                        <p className="text-xs text-muted-foreground">or</p>
                        <Button 
                           variant="outline" 
                           size="sm" 
                           className="mt-2" 
                           onClick={handleButtonClick}
                           disabled={isLoading}
                        >
                           Select File
                        </Button>
                    </div>
                )}
            </div>

            {/* Loading/Progress Indicator */}
            {isLoading && (
                 <div className="flex items-center space-x-2">
                     <Progress value={progress} className="w-full h-2" />
                     {/* Optionally show percentage text */}
                     {/* <span className="text-xs text-muted-foreground">{progress}%</span> */}
                 </div>
             )}


            {/* Error Message Display */}
            {error && (
                <p className="text-sm text-destructive">Error: {error}</p>
            )}
        </div>
    );
} 