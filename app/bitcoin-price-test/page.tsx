import { Metadata } from 'next';
import { BitcoinPriceTest } from '@/components/bitcoin-price-test';

export const metadata: Metadata = {
  title: 'Bitcoin Price Test | BitBasis',
  description: 'Test page for the Bitcoin price system',
};

export default function BitcoinPriceTestPage() {
  return (
    <div className="container mx-auto py-8">
      <BitcoinPriceTest />
    </div>
  );
} 