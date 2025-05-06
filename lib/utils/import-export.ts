/**
 * Utilities for importing and exporting data in various formats
 * Primarily focused on CSV handling for transaction data
 */
import Papa from 'papaparse'
import { format } from 'date-fns'

/**
 * Options for CSV export
 */
export interface ExportCSVOptions {
  /** Name of the file to download (without extension) */
  filename?: string
  /** Add timestamp to filename */
  addTimestamp?: boolean
  /** Custom Papa Parse options */
  papaParseOptions?: Papa.UnparseConfig
}

/**
 * Generic function to export data to CSV and trigger download
 * 
 * @param data - Array of objects to export
 * @param options - Export options
 * @returns Promise that resolves when the file has been processed for download
 */
export async function exportToCSV<T>(
  data: T[], 
  options?: ExportCSVOptions
): Promise<void> {
  try {
    // Default options
    const opts = {
      filename: 'export',
      addTimestamp: true,
      papaParseOptions: {
        quotes: true,
        header: true
      },
      ...options
    }

    // Generate the CSV content
    const csv = Papa.unparse(data, opts.papaParseOptions)
    
    // Create file for download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    
    // Generate filename
    let filename = opts.filename
    if (opts.addTimestamp) {
      filename += `_${format(new Date(), 'yyyy-MM-dd_HHmm')}`
    }
    filename += '.csv'
    
    // Trigger download
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Failed to export data to CSV:', error)
    throw error
  }
}

/**
 * Options for CSV import
 */
export interface ImportCSVOptions {
  /** Custom Papa Parse options */
  papaParseOptions?: Papa.ParseConfig
  /** Process chunks as they are parsed (for large files) */
  onChunk?: (results: Papa.ParseResult<unknown>, parser: Papa.Parser) => void
}

/**
 * Parse a CSV file into an array of objects
 * 
 * @param file - The CSV file to parse
 * @param options - Import options
 * @returns Promise that resolves with the parsed data
 */
export function importFromCSV<T = unknown>(
  file: File,
  options?: ImportCSVOptions
): Promise<T[]> {
  return new Promise((resolve, reject) => {
    // Default options
    const opts = {
      papaParseOptions: {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
      },
      ...options
    }

    // Merge with Papa Parse expected options
    const parseOptions: Papa.ParseConfig = {
      ...opts.papaParseOptions,
      complete: (results) => {
        resolve(results.data as T[])
      },
      error: (error) => {
        reject(error)
      }
    }

    // Add chunk processing if provided
    if (opts.onChunk) {
      parseOptions.chunk = opts.onChunk
    }

    // Parse the file
    Papa.parse(file, parseOptions)
  })
} 