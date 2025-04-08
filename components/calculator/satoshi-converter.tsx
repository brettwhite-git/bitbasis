"use client"

import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface ConversionState {
  satoshis: string;
  usd: string;
  btc: string;
}

export function SatoshiConverter() {
  const [values, setValues] = useState<ConversionState>({
    satoshis: '',
    usd: '',
    btc: ''
  });
  const [btcPrice, setBtcPrice] = useState<number>(0);

  useEffect(() => {
    // In a real app, you'd fetch this from your API
    // For now using a mock price
    setBtcPrice(65000);
  }, []);

  const handleInputChange = (field: keyof ConversionState, value: string) => {
    const numValue = value === '' ? '' : parseFloat(value);
    const newValues = { ...values };

    switch (field) {
      case 'satoshis':
        newValues.satoshis = value;
        if (numValue !== '') {
          newValues.btc = (numValue / 100000000).toFixed(8);
          newValues.usd = ((numValue / 100000000) * btcPrice).toFixed(4);
        } else {
          newValues.btc = '';
          newValues.usd = '';
        }
        break;

      case 'usd':
        newValues.usd = value;
        if (numValue !== '') {
          const btcAmount = numValue / btcPrice;
          newValues.btc = btcAmount.toFixed(8);
          newValues.satoshis = (btcAmount * 100000000).toFixed(0);
        } else {
          newValues.btc = '';
          newValues.satoshis = '';
        }
        break;

      case 'btc':
        newValues.btc = value;
        if (numValue !== '') {
          newValues.satoshis = (numValue * 100000000).toFixed(0);
          newValues.usd = (numValue * btcPrice).toFixed(4);
        } else {
          newValues.satoshis = '';
          newValues.usd = '';
        }
        break;
    }

    setValues(newValues);
  };

  return (
    <div className="w-full bg-card rounded-lg border p-4 mb-6">
      <h3 className="text-lg font-semibold mb-4">Satoshi Converter</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-bitcoin-orange flex items-center justify-center mr-2">
              <span className="text-black font-bold">₿</span>
            </div>
            <Label>Satoshis</Label>
          </div>
          <Input
            type="number"
            placeholder="Enter satoshis..."
            value={values.satoshis}
            onChange={(e) => handleInputChange('satoshis', e.target.value)}
            className="text-right"
          />
          <p className="text-xs text-muted-foreground text-right">SATS</p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center mr-2">
              <span className="text-white font-bold">$</span>
            </div>
            <Label>US Dollar</Label>
          </div>
          <Input
            type="number"
            placeholder="Enter USD..."
            value={values.usd}
            onChange={(e) => handleInputChange('usd', e.target.value)}
            className="text-right"
          />
          <p className="text-xs text-muted-foreground text-right">USD</p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-bitcoin-orange flex items-center justify-center mr-2">
              <span className="text-black font-bold">₿</span>
            </div>
            <Label>Bitcoin</Label>
          </div>
          <Input
            type="number"
            placeholder="Enter BTC..."
            value={values.btc}
            onChange={(e) => handleInputChange('btc', e.target.value)}
            className="text-right"
          />
          <p className="text-xs text-muted-foreground text-right">BTC</p>
        </div>
      </div>
    </div>
  );
} 