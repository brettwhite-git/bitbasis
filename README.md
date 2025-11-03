# BitBasis - Bitcoin Portfolio Tracker

**A privacy-first Bitcoin portfolio tracking and cost basis analysis platform.**

BitBasis helps you track your Bitcoin holdings, calculate accurate cost basis, and manage your transaction history—all while keeping your data private and secure. No exchange API keys required.

## 🌟 What is BitBasis?

BitBasis is a comprehensive Bitcoin portfolio management tool designed for individuals who value privacy and want precise control over their transaction data. Unlike other portfolio trackers that require API access to exchanges, BitBasis uses a simple CSV import system, giving you complete control over your data.

### Key Principles

- **Privacy-First**: Your data is never shared with third parties. No exchange API integrations mean no external access to your accounts.
- **User-Controlled**: You upload your transaction data directly via CSV files.
- **Secure**: Built on Supabase with Row Level Security (RLS) ensuring your data is isolated and protected.
- **Tax-Ready**: Multiple cost basis calculation methods (FIFO, LIFO, HIFO) help you prepare for tax reporting.

---

## 🚀 Getting Started

### 1. Create Your Account

Visit [bitbasis.io](https://bitbasis.io) and sign up with your email address. You'll receive a verification email to activate your account.

### 2. Import Your Transactions

The easiest way to get started is by importing your transaction history via CSV:

1. **Export from Your Exchange**: Most exchanges (Coinbase, Kraken, River, Binance, etc.) allow you to export transaction history as CSV.
2. **Navigate to Transactions**: In your BitBasis dashboard, go to "Transaction History" → "Import CSV"
3. **Upload Your File**: Drag and drop or select your CSV file (up to 10MB)
4. **Map Your Columns**: BitBasis will automatically detect common column formats, but you can manually adjust if needed
5. **Review & Confirm**: Preview your transactions before final import

### Supported Transaction Types

- **Buy Orders**: Fiat currency → Bitcoin purchases
- **Sell Orders**: Bitcoin → Fiat currency sales
- **Deposits**: Bitcoin received from external wallets
- **Withdrawals**: Bitcoin sent to external wallets
- **Interest/Earnings**: Bitcoin earned from lending, staking, or rewards

---

## 📊 Understanding Cost Basis Methods

BitBasis supports three industry-standard cost basis calculation methods. Understanding these will help you choose the best method for your tax situation.

### FIFO (First In, First Out)

- Uses your **oldest** Bitcoin holdings first when calculating gains/losses on sales
- Most commonly used method for tax reporting
- Often recommended by tax professionals for simplicity
- Best for: Long-term investors with infrequent transactions

### LIFO (Last In, First Out)

- Uses your **newest** Bitcoin holdings first when calculating gains/losses
- May provide tax advantages in certain scenarios (consult a tax professional)
- Useful for traders with frequent buy/sell activity
- Best for: Active traders managing short-term positions

### HIFO (Highest In, First Out)

- Uses your **highest-cost** Bitcoin holdings first when calculating gains/losses
- Can help minimize taxable gains by selling higher-cost basis coins first
- Advanced strategy for tax optimization
- Best for: Sophisticated investors optimizing tax liability

**Important**: BitBasis is not a tax calculator. Always consult with a qualified tax professional regarding your specific situation and which method is best for you.

---

## 📈 Dashboard Overview

Your BitBasis dashboard provides a comprehensive view of your Bitcoin portfolio:

### Portfolio Metrics

- **Total BTC Holdings**: Your current Bitcoin balance from buy/sell transactions
- **Cost Basis**: Total amount invested (including fees)
- **Current Value**: Current market value of your holdings
- **Unrealized Gain/Loss**: Potential profit or loss if you sold today
- **Return on Investment (ROI)**: Percentage return on your investment

### Performance Analytics

- **Portfolio Growth Chart**: Visualize your portfolio value over time
- **Performance Returns**: Track your returns across different time periods (30-day, YTD, All-time)
- **Holdings Breakdown**: See distribution of your holdings by purchase date
- **Transaction History**: Complete record of all your transactions

### Transaction Management

- **View All Transactions**: Filter, sort, and search through your transaction history
- **Edit Transactions**: Correct any errors or missing information
- **Add Transactions Manually**: Enter transactions directly if you don't have CSV exports
- **Export Data**: Download your transaction history for tax preparation or record-keeping

---

## 📝 CSV Import Guide

### Preparing Your CSV File

Your CSV should include these essential fields:

#### Required Fields
- **Date**: Transaction date (YYYY-MM-DD format preferred)
- **Type**: Transaction type (buy, sell, deposit, withdrawal, interest)
- **Price**: Bitcoin price at transaction time (required for accurate calculations)

#### Transaction-Specific Requirements

**Buy Transactions:**
- Received Amount (BTC)
- Received Currency (BTC)
- Sent Amount (USD or fiat)
- Sent Currency (USD, EUR, etc.)

**Sell Transactions:**
- Sent Amount (BTC)
- Sent Currency (BTC)
- Received Amount (USD or fiat)
- Received Currency (USD, EUR, etc.)

**Deposit/Withdrawal:**
- Amount and currency (BTC for deposits/withdrawals)

#### Optional Fields
- Fee Amount and Fee Currency
- From/To addresses or exchange names
- Comments or notes

### CSV Templates

BitBasis provides CSV templates to help you format your data correctly. You can download these templates from the import interface or use your exchange's export format—BitBasis will attempt to automatically map common formats.

### Import Tips

1. **Start with Recent Data**: Import your most recent transactions first to verify the format works correctly
2. **Check for Duplicates**: BitBasis will flag potential duplicate transactions during import
3. **Verify Prices**: Ensure Bitcoin prices are accurate—this affects all calculations
4. **Include Fees**: Adding transaction fees improves cost basis accuracy
5. **Date Format**: Use consistent date formats (YYYY-MM-DD is preferred)

---

## 🔒 Privacy & Security

### How Your Data is Protected

- **Row Level Security (RLS)**: Your data is isolated at the database level—only you can access your transactions
- **Encrypted Storage**: All data is encrypted at rest
- **Secure Transmission**: All communications use HTTPS/TLS encryption
- **No Third-Party Tracking**: We don't use analytics services or tracking pixels

### Your Privacy Rights

- **Data Control**: You can export all your data at any time
- **Account Deletion**: You can permanently delete your account and all associated data
- **No Data Sharing**: We never sell or share your transaction data with third parties

### Best Practices

- Keep your account password secure
- Use email verification (enabled by default)
- Review your transaction history regularly for accuracy
- Export your data periodically for backup

---

## 💰 Subscription Plans

BitBasis offers flexible subscription options:

- **Free Tier**: Basic portfolio tracking with limited transaction history
- **Pro Tier**: Unlimited transactions, advanced analytics, tax reports
- **Lifetime**: One-time payment for unlimited access to all features

Visit the [pricing page](https://bitbasis.io) for current pricing and feature comparisons.

---

## ❓ Frequently Asked Questions

### Which exchanges are supported?

BitBasis works with any exchange or wallet that can export transaction history as CSV. Common supported platforms include:
- Coinbase
- Kraken
- River
- Binance
- Strike
- Trezor
- And many more

### How accurate are the calculations?

BitBasis calculations are designed to match professional accounting standards. However, the accuracy depends on:
- Complete and accurate transaction data
- Correct Bitcoin prices at transaction time
- Proper inclusion of transaction fees

Always verify calculations and consult with a tax professional for tax reporting.

### Can I use this for tax reporting?

BitBasis provides cost basis calculations and transaction reports that can assist with tax preparation. However, **BitBasis is not a tax calculator or tax preparation software**. Always consult with a qualified tax professional before filing your taxes.

### What if I find errors in my data?

You can edit any transaction directly in the dashboard. Changes will automatically recalculate your portfolio metrics and cost basis.

### Can I export my data?

Yes! You can export your complete transaction history as CSV at any time from the dashboard.

---

## 🆘 Getting Help

### Support Resources

- **Email Support**: [support@bitbasis.io](mailto:support@bitbasis.io)
- **Documentation**: This README and in-app help guides
- **Transaction Templates**: Download CSV templates from the import interface

### Reporting Issues

If you encounter any problems:
1. Check that your CSV format matches the template requirements
2. Verify your Bitcoin prices are accurate
3. Ensure your transaction dates are in a valid format
4. Contact support with details about the issue

---

## 🔄 Updates & Improvements

BitBasis is continuously being improved. New features and enhancements are added regularly based on user feedback. Check back periodically for updates to features and functionality.

---

## 📄 Legal & Disclaimers

- **Not Financial Advice**: BitBasis is a portfolio tracking tool, not financial or tax advice
- **Tax Consultation Required**: Always consult with a qualified tax professional for tax matters
- **Data Accuracy**: While BitBasis strives for accuracy, users are responsible for verifying their data
- **Privacy Policy**: Review our [Privacy Policy](https://bitbasis.io/privacy) for details on data handling
- **Terms of Service**: Review our [Terms of Service](https://bitbasis.io/terms) for usage guidelines

---

## 🎯 Getting the Most from BitBasis

### Tips for Best Results

1. **Start with Clean Data**: Import transactions with complete information (dates, prices, amounts, fees)
2. **Regular Updates**: Keep your transaction history current by importing new transactions regularly
3. **Review Calculations**: Periodically review your portfolio metrics to ensure accuracy
4. **Use Cost Basis Methods**: Experiment with different cost basis methods to understand tax implications
5. **Export Regularly**: Download your transaction data periodically for backup and tax preparation

### Advanced Features

- **Performance Analysis**: Dive deep into your portfolio performance with detailed analytics
- **Holdings Tracking**: See which Bitcoin purchases are short-term vs. long-term holdings
- **Tax Lot Identification**: Track individual purchase lots for tax optimization strategies

---

**BitBasis** — *Privacy-first Bitcoin portfolio tracking made simple.*

Visit [bitbasis.io](https://bitbasis.io) to get started.
