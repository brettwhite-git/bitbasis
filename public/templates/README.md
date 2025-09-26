# BitBasis CSV Templates

This directory contains standardized CSV templates for importing Bitcoin transaction data into BitBasis.

## Template Files

### Standard Templates (Recommended for most users)
- **bitbasis_template.csv** - Basic template with essential fields only
- **bitbasis_template_with_examples.csv** - Basic template with sample transaction data

### Comprehensive Templates (Advanced users)
- **bitbasis_comprehensive_template.csv** - Full template with all available fields
- **bitbasis_comprehensive_with_examples.csv** - Full template with sample data

## Template Structure

### Standard Template Fields
- **Date** - Transaction date (YYYY-MM-DD format preferred)
- **Type** - Transaction type: buy, sell, deposit, withdrawal, interest
- **Sent Amount** - Amount sent/paid (leave blank if not applicable)
- **Sent Currency** - Currency of sent amount (USD, BTC, etc.)
- **Received Amount** - Amount received (leave blank if not applicable)
- **Received Currency** - Currency received (BTC, USD, etc.)
- **Fee Amount** - Transaction fee (optional)
- **Fee Currency** - Currency of fee (optional)
- **From** - Source exchange/wallet name (optional)
- **To** - Destination exchange/wallet name (optional)
- **Price** - BTC price at transaction time (required)
- **Comment** - Additional notes (optional)

### Comprehensive Template Additional Fields
- **From Address Name** - Source wallet/exchange name
- **To Address Name** - Destination wallet/exchange name
- **From Address** - Source blockchain address
- **To Address** - Destination blockchain address
- **Transaction Hash** - Blockchain transaction ID

## Transaction Type Requirements

### Buy Transactions
- **Required**: Date, Type, Price, Received Amount (BTC), Received Currency (BTC)
- **Recommended**: Sent Amount (USD), Sent Currency (USD)

### Sell Transactions
- **Required**: Date, Type, Price, Sent Amount (BTC), Sent Currency (BTC), Received Amount (USD), Received Currency (USD)

### Deposit Transactions
- **Required**: Date, Type, Price, Received Amount (BTC), Received Currency (BTC)
- **Optional**: Fee Amount, From, To

### Withdrawal Transactions
- **Required**: Date, Type, Price, Sent Amount (BTC), Sent Currency (BTC)
- **Optional**: Fee Amount, From, To

### Interest Transactions
- **Required**: Date, Type, Price, Received Amount (BTC), Received Currency (BTC)
- **Optional**: From (platform name)

## Usage Guidelines

1. **Download the appropriate template** for your needs
2. **Fill in your transaction data** following the examples
3. **Save as CSV format** (UTF-8 encoding recommended)
4. **Import via Dashboard** → Transactions → Import CSV
5. **Review mappings** during import process
6. **Verify data** in preview step before finalizing

## Data Format Guidelines

### Dates
- Preferred: YYYY-MM-DD (e.g., 2024-01-15)
- Accepted: MM/DD/YYYY, DD/MM/YYYY
- Include time if available: YYYY-MM-DD HH:MM:SS

### Amounts
- BTC: Up to 8 decimal places (0.00000001)
- USD: Up to 2 decimal places (1000.50)
- No currency symbols in amount fields

### Currencies
- Use standard codes: BTC, USD, EUR, GBP
- Will be auto-converted to uppercase

## Common Issues & Solutions

### Import Errors
- **Date parsing errors**: Use YYYY-MM-DD format
- **Missing required fields**: Check transaction type requirements
- **Invalid amounts**: Ensure positive numbers only
- **Currency codes**: Use standard 3-letter codes

### Auto-Detection
The import system automatically detects common column names and transaction patterns. For best results:
- Use descriptive column headers
- Follow the template structure
- Include sample data for pattern recognition

## Support

For additional help with CSV imports, visit the BitBasis dashboard settings page or contact support.

---
*Last updated: Based on unified transactions schema*
