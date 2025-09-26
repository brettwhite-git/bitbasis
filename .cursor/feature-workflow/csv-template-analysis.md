# BitBasis CSV Template Analysis & Master Template Design

## Executive Summary

This document provides a comprehensive analysis of BitBasis's transaction import system, database schema, and validation requirements to design optimal CSV templates for users.

## Database Schema Analysis

### Core Transaction Table Structure

The unified `transactions` table supports all transaction types with the following key fields:

**Required Fields:**
- `date` (timestamp with time zone) - Transaction date/time
- `type` (varchar(10)) - Must be one of: 'buy', 'sell', 'deposit', 'withdrawal', 'interest'
- `price` (numeric(20,8)) - BTC price at transaction time
- `user_id` (uuid) - Automatically set by system
- `asset` (varchar(10)) - Defaults to 'BTC'

**Optional Core Fields:**
- `sent_amount` (numeric(20,8)) - Amount sent/paid
- `sent_currency` (varchar(10)) - Currency of sent amount
- `received_amount` (numeric(20,8)) - Amount received
- `received_currency` (varchar(10)) - Currency received
- `fee_amount` (numeric(20,8)) - Transaction fee
- `fee_currency` (varchar(10)) - Fee currency

**Address & Metadata Fields:**
- `from_address` (varchar(100)) - Source wallet address
- `from_address_name` (varchar(100)) - Source name (exchange, wallet)
- `to_address` (varchar(100)) - Destination wallet address  
- `to_address_name` (varchar(100)) - Destination name
- `transaction_hash` (varchar(70)) - Blockchain transaction ID
- `comment` (text) - User notes

**Calculated Fields (Auto-populated):**
- `sent_cost_basis`, `received_cost_basis`, `fee_cost_basis`
- `realized_return`, `fee_realized_return`

### Database Constraints & Validation Rules

**Transaction Type Constraints:**

1. **Buy Transactions:**
   - REQUIRED: `received_amount`, `received_currency`
   - TYPICAL: `sent_amount` (USD paid), `sent_currency` (USD)

2. **Sell Transactions:**
   - REQUIRED: `sent_amount`, `sent_currency`, `received_amount`, `received_currency`
   - TYPICAL: `sent_amount` (BTC sold), `received_amount` (USD received)

3. **Deposit Transactions:**
   - REQUIRED: Either (`sent_amount` + `sent_currency`) OR (`received_amount` + `received_currency`)
   - TYPICAL: `received_amount` (BTC received), `received_currency` (BTC)

4. **Withdrawal Transactions:**
   - REQUIRED: Either (`sent_amount` + `sent_currency`) OR (`received_amount` + `received_currency`)  
   - TYPICAL: `sent_amount` (BTC sent), `sent_currency` (BTC)

5. **Interest Transactions:**
   - REQUIRED: `received_amount`, `received_currency`
   - TYPICAL: `received_amount` (BTC earned), `received_currency` (BTC)

**Amount Constraints:**
- All amounts must be >= 0 (no negative values)
- Amounts support up to 8 decimal places (satoshi precision)

## Import System Analysis

### Auto-Detection Patterns

The system automatically detects CSV columns using these patterns:

**Date Detection:**
- Keywords: "date", "time", "timestamp", "created", "executed"
- Formats supported: ISO 8601, MM/dd/yyyy, dd/MM/yyyy, yyyy-MM-dd, etc.

**Transaction Type Detection:**
- Keywords: "type", "side", "action", "operation", "transaction_type"
- Normalizes: "buy"/"purchase" → buy, "sell" → sell, "deposit"/"receive" → deposit, etc.

**Amount Detection:**
- Keywords: "amount", "quantity", "size", "value", "volume", "total"
- Handles currency symbols ($, ₿) and negative values

**Fee Detection:**
- Keywords: "fee", "cost", "commission", "charge", "expense", "trading fee", "network fee"
- High confidence patterns for fee identification

**Address Detection:**
- Keywords: "address", "wallet", "from", "to", "source", "destination"
- Distinguishes between address names and actual addresses

**Currency Detection:**
- Keywords: "currency", "asset", "symbol", "coin", "token"
- Auto-converts to uppercase (BTC, USD, EUR)

### Validation Requirements

**Critical Validations:**
1. Date must be parseable and valid
2. Transaction type must be recognized
3. Price field required (if not provided, fetched from market data)
4. Type-specific field requirements must be met
5. All amounts must be positive numbers

**Import Process:**
1. CSV Upload & Parsing
2. Column Mapping (auto-detected + user adjustments)  
3. Data Validation & Preview
4. Final Import with error handling

## Master Template Design

### Template Strategy

**Two-Template Approach:**
1. **Standard Template** - Clean, minimal columns for basic usage
2. **Comprehensive Template** - All possible fields with examples

### Standard Template Columns

```csv
Date,Type,Sent Amount,Sent Currency,Received Amount,Received Currency,Fee Amount,Fee Currency,From,To,Price,Comment
```

**Column Descriptions:**
- `Date` - Transaction date (YYYY-MM-DD or MM/DD/YYYY format)
- `Type` - buy, sell, deposit, withdrawal, or interest
- `Sent Amount` - Amount sent/paid (leave blank if not applicable)
- `Sent Currency` - Currency of sent amount (USD, BTC, etc.)
- `Received Amount` - Amount received (leave blank if not applicable)  
- `Received Currency` - Currency received (BTC, USD, etc.)
- `Fee Amount` - Transaction fee (optional)
- `Fee Currency` - Currency of fee (optional)
- `From` - Source exchange/wallet name (optional)
- `To` - Destination exchange/wallet name (optional)
- `Price` - BTC price at transaction time (optional - will be auto-filled if missing)
- `Comment` - Additional notes (optional)

### Comprehensive Template Columns

```csv
Date,Type,Sent Amount,Sent Currency,Received Amount,Received Currency,Fee Amount,Fee Currency,From Address Name,To Address Name,From Address,To Address,Transaction Hash,Price,Comment
```

**Additional Columns in Comprehensive:**
- `From Address Name` - Source wallet/exchange name
- `To Address Name` - Destination wallet/exchange name  
- `From Address` - Source blockchain address
- `To Address` - Destination blockchain address
- `Transaction Hash` - Blockchain transaction ID

### Transaction Type Examples

**Buy Transaction:**
```csv
Date,Type,Sent Amount,Sent Currency,Received Amount,Received Currency,Fee Amount,Fee Currency,From,To,Price,Comment
2024-01-15,buy,1000.00,USD,0.025,BTC,5.00,USD,River,Personal Wallet,40000.00,Monthly DCA purchase
```

**Sell Transaction:**
```csv
Date,Type,Sent Amount,Sent Currency,Received Amount,Received Currency,Fee Amount,Fee Currency,From,To,Price,Comment
2024-02-01,sell,0.01,BTC,420.00,USD,2.10,USD,Personal Wallet,River,42000.00,Profit taking
```

**Deposit Transaction:**
```csv
Date,Type,Sent Amount,Sent Currency,Received Amount,Received Currency,Fee Amount,Fee Currency,From,To,Price,Comment
2024-01-20,deposit,,,0.05,BTC,0.0002,BTC,Friend,Personal Wallet,41000.00,Gift from friend
```

**Withdrawal Transaction:**
```csv
Date,Type,Sent Amount,Sent Currency,Received Amount,Received Currency,Fee Amount,Fee Currency,From,To,Price,Comment
2024-01-25,withdrawal,0.02,BTC,,,0.0003,BTC,Personal Wallet,Cold Storage,41500.00,Moving to cold storage
```

**Interest Transaction:**
```csv
Date,Type,Sent Amount,Sent Currency,Received Amount,Received Currency,Fee Amount,Fee Currency,From,To,Price,Comment
2024-01-31,interest,,,0.001,BTC,,,BlockFi,Personal Wallet,43000.00,Monthly interest payment
```

## Field Usage Guidelines

### Required vs Optional Fields by Transaction Type

**Buy Transactions:**
- MUST HAVE: Date, Type, Price, Received Amount (BTC), Received Currency (BTC)
- SHOULD HAVE: Sent Amount (USD), Sent Currency (USD)
- OPTIONAL: Fee Amount, Fee Currency, From, To, Comment

**Sell Transactions:**  
- MUST HAVE: Date, Type, Price, Sent Amount (BTC), Sent Currency (BTC), Received Amount (USD), Received Currency (USD)
- OPTIONAL: Fee Amount, Fee Currency, From, To, Comment

**Deposit/Withdrawal:**
- MUST HAVE: Date, Type, Price, Amount (sent OR received), Currency
- OPTIONAL: Fee Amount, Fee Currency, Addresses, Comment

**Interest:**
- MUST HAVE: Date, Type, Price, Received Amount (BTC), Received Currency (BTC)
- OPTIONAL: From (platform name), Comment

### Common Patterns & Best Practices

**Date Formats:**
- Preferred: YYYY-MM-DD (ISO format)
- Accepted: MM/DD/YYYY, DD/MM/YYYY, MM-DD-YYYY
- Include time if available: YYYY-MM-DD HH:MM:SS

**Amount Precision:**
- BTC: Up to 8 decimal places (0.00000001)
- USD: Up to 2 decimal places (1000.50)
- No currency symbols in amounts (use currency columns)

**Currency Codes:**
- Use standard codes: BTC, USD, EUR, GBP
- Will be auto-converted to uppercase

**Exchange/Platform Names:**
- Use consistent naming: "River", "Coinbase", "Personal Wallet"
- Helps with portfolio tracking and categorization

## Template File Generation Plan

### Standard Template (bitbasis_template.csv)
- Clean, essential columns only
- No example data
- Includes header row with clear column names
- Optimized for auto-detection

### Example Template (bitbasis_template_with_examples.csv)  
- Same columns as standard template
- Includes 5-10 example rows showing each transaction type
- Demonstrates proper formatting and common scenarios
- Users can delete examples and add their own data

### Template Download Implementation
- Host templates in `/public/templates/` directory
- Update ResourcesSettings component to point to actual files
- Include download analytics to track usage
- Consider dynamic generation for future customization

## Validation & Error Handling

### Common Import Issues
1. **Date parsing failures** - Provide clear format examples
2. **Missing required fields** - Show specific requirements per transaction type
3. **Invalid transaction types** - List accepted values
4. **Negative amounts** - Explain amount constraints
5. **Currency mismatches** - Validate currency codes

### User Guidance Strategy
1. **Pre-import validation** - Check file structure before processing
2. **Interactive mapping** - Allow manual column mapping adjustments
3. **Preview step** - Show transformed data before final import
4. **Detailed error messages** - Specific field-level feedback
5. **Recovery options** - Allow fixing errors without re-upload

## Implementation Recommendations

### Phase 1: Template Creation
1. Generate standard and example CSV templates
2. Host in public directory with proper MIME types
3. Update download links in ResourcesSettings component
4. Test download functionality across browsers

### Phase 2: Documentation Enhancement  
1. Add field-by-field documentation to templates
2. Create import guide with common scenarios
3. Include troubleshooting section for common errors
4. Add exchange-specific mapping guides

### Phase 3: Advanced Features
1. Template customization based on user's transaction patterns
2. Exchange-specific templates (River, Coinbase, etc.)
3. Bulk template generation for multiple formats
4. Import validation API for external tools

## Success Metrics

**Template Effectiveness:**
- Successful import rate > 95% for template-based uploads
- Reduced support requests related to CSV formatting
- User adoption of template downloads

**User Experience:**
- Import completion time < 2 minutes for typical files
- Auto-detection accuracy > 90% for template-based files
- User satisfaction with import process

**Technical Performance:**
- Template download success rate > 99%
- File processing time < 30 seconds for 1000 transactions
- Error recovery rate > 80% for fixable issues

---

*This analysis provides the foundation for creating optimal CSV templates that align with BitBasis's technical requirements while maximizing user success rates.*
