import { ParsedOrder, ParsedTransaction, ParsedTransfer, ValidationIssue } from "./types";
import { isOrder, isTransfer } from "./utils";

/**
 * Validates a single parsed transaction.
 * 
 * @param tx The ParsedTransaction object.
 * @param index Optional index for context (e.g., original row number), not used in current logic but good practice.
 * @returns An array of ValidationIssue objects.
 */
export const validateTransaction = (tx: ParsedTransaction, index?: number): ValidationIssue[] => {
    const issues: ValidationIssue[] = [];
    const id = tx.id; // Use the ID from the parsed transaction

    // --- General Checks --- 

    // Check Date
    if (!tx.date || isNaN(tx.date.getTime())) {
        issues.push({ transactionId: id, field: 'date', message: 'Invalid or missing date', severity: 'error' });
    }
    // Check Future Date (Warning)
    else if (tx.date.getTime() > Date.now()) {
         issues.push({ transactionId: id, field: 'date', message: 'Transaction date is in the future', severity: 'warning' });
    }

    // Check Type (Already validated during parsing, but double-check)
    if (!tx.type || !['buy', 'sell', 'deposit', 'withdrawal'].includes(tx.type)) {
        issues.push({ transactionId: id, field: 'type', message: 'Invalid transaction type', severity: 'error' });
        // If type is fundamentally wrong, stop further type-specific validation
        return issues; 
    }

    // --- Type-Specific Checks --- 

    if (isOrder(tx)) {
        const order = tx as ParsedOrder;
        
        // Check Price (must be positive for orders)
        if (order.price === null || order.price <= 0) {
            issues.push({ transactionId: id, field: 'price', message: 'Price must be a positive number for orders', severity: 'error' });
        }

        // Check Buy Order Fields
        if (order.type === 'buy') {
            if (!(order.buyFiatAmount && order.buyFiatAmount > 0)) {
                issues.push({ transactionId: id, field: 'buyFiatAmount', message: 'Buy amount (Fiat) must be positive', severity: 'error' });
            }
            if (!(order.receivedBtcAmount && order.receivedBtcAmount > 0)) {
                issues.push({ transactionId: id, field: 'receivedBtcAmount', message: 'Received amount (BTC) must be positive', severity: 'error' });
            }
            // Warning for missing buy currency
             if (!order.buyCurrency) {
                issues.push({ transactionId: id, field: 'buyCurrency', message: 'Buy currency information missing (assuming USD)', severity: 'warning' });
            }
        }
        
        // Check Sell Order Fields
        else { // Sell
            if (!(order.sellBtcAmount && order.sellBtcAmount > 0)) {
                issues.push({ transactionId: id, field: 'sellBtcAmount', message: 'Sell amount (BTC) must be positive', severity: 'error' });
            }
            if (!(order.receivedFiatAmount && order.receivedFiatAmount > 0)) {
                issues.push({ transactionId: id, field: 'receivedFiatAmount', message: 'Received amount (Fiat) must be positive', severity: 'error' });
            }
             // Warning for missing sell currency
             if (!order.sellBtcCurrency) {
                issues.push({ transactionId: id, field: 'sellBtcCurrency', message: 'Sell currency (BTC) information missing', severity: 'warning' });
            }
             if (!order.receivedFiatCurrency) {
                issues.push({ transactionId: id, field: 'receivedFiatCurrency', message: 'Received currency (Fiat) information missing (assuming USD)', severity: 'warning' });
            }
        }

        // Check Fees (must be non-negative if present)
        if (order.serviceFee !== null && order.serviceFee !== undefined && order.serviceFee < 0) {
             issues.push({ transactionId: id, field: 'serviceFee', message: 'Service fee cannot be negative', severity: 'error' });
        }
        // Warning for missing fee currency if fee exists
        if (order.serviceFee !== null && order.serviceFee !== undefined && order.serviceFee !== 0 && !order.serviceFeeCurrency) {
             issues.push({ transactionId: id, field: 'serviceFeeCurrency', message: 'Service fee currency missing (assuming USD)', severity: 'warning' });
        }
        
        // Warning for missing exchange
        if (!order.exchange) {
            issues.push({ transactionId: id, field: 'exchange', message: 'Exchange information is missing', severity: 'warning' });
        }

    } else if (isTransfer(tx)) {
        const transfer = tx as ParsedTransfer;

        // Check BTC Amount (must be positive)
        if (transfer.amountBtc === null || transfer.amountBtc <= 0) {
            issues.push({ transactionId: id, field: 'amountBtc', message: 'Transfer amount (BTC) must be positive', severity: 'error' });
        }

        // Check Network Fee (must be non-negative if present)
        if (transfer.feeAmountBtc !== null && transfer.feeAmountBtc !== undefined && transfer.feeAmountBtc < 0) {
             issues.push({ transactionId: id, field: 'feeAmountBtc', message: 'Network fee (BTC) cannot be negative', severity: 'error' });
        }
        
        // Check Fiat Amount (optional, but must be non-negative if present)
        if (transfer.amountFiat !== null && transfer.amountFiat !== undefined && transfer.amountFiat < 0) {
             issues.push({ transactionId: id, field: 'amountFiat', message: 'Fiat value cannot be negative', severity: 'error' });
        }

        // Warning for missing hash on withdrawals
        if (transfer.type === 'withdrawal' && !transfer.hash) {
            issues.push({ transactionId: id, field: 'hash', message: 'Transaction hash is recommended for withdrawals', severity: 'warning' });
        }
    }

    return issues;
}; 