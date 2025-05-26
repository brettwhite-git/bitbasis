#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Mapping of console methods to logger methods
const CONSOLE_TO_LOGGER_MAP = {
  'console.log': 'logger.debug',
  'console.info': 'logger.info', 
  'console.warn': 'logger.warn',
  'console.error': 'logger.error',
  'console.debug': 'logger.debug'
};

// Files to exclude from processing
const EXCLUDE_PATTERNS = [
  'node_modules/**',
  '.next/**',
  'dist/**',
  'build/**',
  'scripts/**',
  '*.config.js',
  '*.config.ts'
];

// Function to check if file should be processed
function shouldProcessFile(filePath) {
  return EXCLUDE_PATTERNS.every(pattern => !filePath.includes(pattern.replace('/**', '')));
}

// Function to add logger import if not present
function addLoggerImport(content, filePath) {
  const hasLoggerImport = content.includes("from '@/lib/logger'") || content.includes("from '../lib/logger'");
  
  if (hasLoggerImport) {
    return content;
  }

  // Determine relative path to logger
  const relativePath = path.relative(path.dirname(filePath), 'lib/logger').replace(/\\/g, '/');
  const importPath = relativePath.startsWith('.') ? relativePath : `./${relativePath}`;
  
  // Find the best place to insert the import
  const lines = content.split('\n');
  let insertIndex = 0;
  
  // Look for existing imports
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('import ') && !lines[i].includes('import type')) {
      insertIndex = i + 1;
    } else if (lines[i].trim() === '' && insertIndex > 0) {
      break;
    }
  }
  
  const loggerImport = `import { logger } from '${importPath}'`;
  lines.splice(insertIndex, 0, loggerImport);
  
  return lines.join('\n');
}

// Function to replace console statements
function replaceConsoleStatements(content) {
  let modified = content;
  
  // Replace console.log with context
  modified = modified.replace(
    /console\.log\(['"`]([^'"`]+)['"`],?\s*([^)]*)\)/g,
    (match, message, context) => {
      if (context.trim()) {
        return `logger.debug('${message}', { ${context.trim()} })`;
      }
      return `logger.debug('${message}')`;
    }
  );
  
  // Replace console.error with context
  modified = modified.replace(
    /console\.error\(['"`]([^'"`]+)['"`],?\s*([^)]*)\)/g,
    (match, message, context) => {
      if (context.trim()) {
        return `logger.error('${message}', { error: ${context.trim()} })`;
      }
      return `logger.error('${message}')`;
    }
  );
  
  // Replace console.warn with context
  modified = modified.replace(
    /console\.warn\(['"`]([^'"`]+)['"`],?\s*([^)]*)\)/g,
    (match, message, context) => {
      if (context.trim()) {
        return `logger.warn('${message}', { ${context.trim()} })`;
      }
      return `logger.warn('${message}')`;
    }
  );
  
  // Replace console.info with context
  modified = modified.replace(
    /console\.info\(['"`]([^'"`]+)['"`],?\s*([^)]*)\)/g,
    (match, message, context) => {
      if (context.trim()) {
        return `logger.info('${message}', { ${context.trim()} })`;
      }
      return `logger.info('${message}')`;
    }
  );
  
  return modified;
}

// Main processing function
function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check if file has console statements
    const hasConsoleStatements = /console\.(log|error|warn|info|debug)/.test(content);
    
    if (!hasConsoleStatements) {
      return false; // No changes needed
    }
    
    console.log(`Processing: ${filePath}`);
    
    let modified = content;
    
    // Add logger import
    modified = addLoggerImport(modified, filePath);
    
    // Replace console statements
    modified = replaceConsoleStatements(modified);
    
    // Write back to file
    fs.writeFileSync(filePath, modified, 'utf8');
    
    return true; // File was modified
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return false;
  }
}

// Main execution
function main() {
  console.log('🔧 Starting logging cleanup...');
  
  // Find all TypeScript and JavaScript files
  const files = glob.sync('**/*.{ts,tsx,js,jsx}', {
    ignore: EXCLUDE_PATTERNS
  });
  
  let processedCount = 0;
  let modifiedCount = 0;
  
  files.forEach(file => {
    if (shouldProcessFile(file)) {
      processedCount++;
      if (processFile(file)) {
        modifiedCount++;
      }
    }
  });
  
  console.log(`\n✅ Logging cleanup complete!`);
  console.log(`📊 Processed ${processedCount} files`);
  console.log(`🔄 Modified ${modifiedCount} files`);
  console.log(`\n⚠️  Please review the changes and test your application!`);
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { processFile, replaceConsoleStatements, addLoggerImport }; 