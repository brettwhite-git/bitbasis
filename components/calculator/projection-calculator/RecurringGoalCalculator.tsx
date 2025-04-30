import React from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { getDurationDetails, getFrequencyDetails } from "../utils/date-utils";
import { BitcoinUnit } from '../types/calculator-types';

interface RecurringGoalCalculatorProps {
  bitcoinUnit: BitcoinUnit;
  setBitcoinUnit: (unit: BitcoinUnit) => void;
  recurringBuyAmount: string;
  handleRecurringBuyAmountChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  frequency: string;
  setFrequency: (freq: string) => void;
  goalDuration: string;
  setGoalDuration: (duration: string) => void;
  priceGrowth: string;
  setPriceGrowth: (growth: string) => void;
}

export function RecurringGoalCalculator({
  bitcoinUnit,
  setBitcoinUnit,
  recurringBuyAmount,
  handleRecurringBuyAmountChange,
  frequency,
  setFrequency,
  goalDuration,
  setGoalDuration,
  priceGrowth,
  setPriceGrowth,
}: RecurringGoalCalculatorProps) {
  return (
    <div className="md:col-span-1">
      <div className="h-full p-4 rounded-md border border-border bg-muted/30 space-y-4 flex flex-col">
        {/* Bitcoin Unit */}
        <div className="space-y-2">
          <Label>Bitcoin Unit</Label>
          <RadioGroup value={bitcoinUnit} onValueChange={(value) => setBitcoinUnit(value as BitcoinUnit)} className="grid grid-cols-2 gap-2">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="bitcoin" id="rg-bitcoin" className="peer sr-only" />
              <Label
                htmlFor="rg-bitcoin"
                className="flex-1 cursor-pointer rounded-md border-2 border-muted p-3 hover:bg-muted peer-data-[state=checked]:border-bitcoin-orange peer-data-[state=checked]:bg-bitcoin-orange/10 peer-data-[state=checked]:text-bitcoin-orange"
              >
                Bitcoin
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="satoshi" id="rg-satoshi" className="peer sr-only" />
              <Label
                htmlFor="rg-satoshi"
                className="flex-1 cursor-pointer rounded-md border-2 border-muted p-3 hover:bg-muted peer-data-[state=checked]:border-bitcoin-orange peer-data-[state=checked]:bg-bitcoin-orange/10 peer-data-[state=checked]:text-bitcoin-orange"
              >
                Satoshi
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Fiat Currency */}
        <div className="space-y-2">
          <Label>Fiat Currency</Label>
          <Select defaultValue="USD">
            <SelectTrigger className="bg-background border-input">
              <SelectValue placeholder="Select currency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USD">USD ($)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Buying Frequency */}
        <div className="space-y-2">
          <Label>Buying Frequency</Label>
          <RadioGroup value={frequency} onValueChange={setFrequency} className="grid grid-cols-4 gap-2">
            {["daily", "weekly", "monthly", "yearly"].map((period) => (
              <div key={`rg-${period}`} className="flex items-center space-x-2">
                <RadioGroupItem value={period} id={`rg-${period}`} className="peer sr-only" />
                <Label
                  htmlFor={`rg-${period}`}
                  className="flex-1 cursor-pointer rounded-md border-2 border-muted p-3 hover:bg-muted peer-data-[state=checked]:border-bitcoin-orange peer-data-[state=checked]:bg-bitcoin-orange/10 peer-data-[state=checked]:text-bitcoin-orange text-center capitalize text-xs sm:text-sm"
                >
                  {getFrequencyDetails(period).label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        {/* Recurring Buy Amount Input */}
        <div className="space-y-2">
          <Label>Recurring Buy Amount</Label>
          <div className="relative">
            <Input
              type="text"
              placeholder="100"
              value={recurringBuyAmount} // Display the raw state value
              onChange={handleRecurringBuyAmountChange}
              className="pl-8 pr-10 bg-muted/50 border-input" // Padding for symbols
              inputMode="decimal"
            />
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-muted-foreground">
              $
            </span>
            <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-sm text-muted-foreground">
              USD
            </span>
          </div>
        </div>

        {/* Goal Date Slider */}
        <div className="space-y-2">
          <Label>Goal Date</Label>
          <div className="space-y-4">
            <div className="relative pt-5">
              <div className="absolute top-0 left-0 right-0 flex justify-between text-xs text-muted-foreground px-1">
                <span>1M</span>
                <span>6M</span>
                <span>1Y</span>
                <span>3Y</span>
                <span>5Y</span>
                <span>10Y</span>
              </div>
              <Slider
                min={0}
                max={5}
                step={1}
                value={[
                  goalDuration === '1_month' ? 0 :
                  goalDuration === '6_month' ? 1 :
                  goalDuration === '1_year' ? 2 :
                  goalDuration === '3_year' ? 3 :
                  goalDuration === '5_year' ? 4 : 5
                ]}
                onValueChange={(value) => {
                  const index = value[0];
                  const newDuration =
                    index === 0 ? '1_month' :
                    index === 1 ? '6_month' :
                    index === 2 ? '1_year' :
                    index === 3 ? '3_year' :
                    index === 4 ? '5_year' : '10_year';
                  setGoalDuration(newDuration);
                }}
                className="w-full cursor-pointer h-2 rounded-lg appearance-none bg-muted dark:bg-gray-700"
              />
            </div>
            <div className="text-center font-medium dark:text-gray-100">
              {getDurationDetails(goalDuration).label}
            </div>
          </div>
        </div>

        {/* Future Price Estimate Slider */}
        <div className="space-y-2">
          <Label className="dark:text-gray-300">Future Price Estimate</Label>
          <div className="space-y-4">
            <div className="relative pt-5">
              <div className="absolute top-0 left-0 right-0 flex justify-between text-xs text-muted-foreground dark:text-gray-400 px-1">
                <span>48%</span>
                <span>85%</span>
                <span>15%</span>
                <span>72%</span>
                <span>65%</span>
                <span>74%</span>
                <span>84%</span>
                <span>75%</span>
              </div>
              <Slider
                min={0}
                max={7}
                step={1}
                value={[
                  priceGrowth === '48' ? 0 :
                  priceGrowth === '85' ? 1 :
                  priceGrowth === '15' ? 2 :
                  priceGrowth === '72' ? 3 :
                  priceGrowth === '65' ? 4 :
                  priceGrowth === '74' ? 5 :
                  priceGrowth === '84' ? 6 : 7
                ]}
                onValueChange={(value) => {
                  const index = value[0];
                  setPriceGrowth(
                    index === 0 ? '48' :
                    index === 1 ? '85' :
                    index === 2 ? '15' :
                    index === 3 ? '72' :
                    index === 4 ? '65' :
                    index === 5 ? '74' :
                    index === 6 ? '84' : '75'
                  );
                }}
                className="w-full cursor-pointer h-2 rounded-lg appearance-none bg-muted dark:bg-gray-700"
              />
            </div>
            <div className="text-center font-medium dark:text-gray-100">
              CAGR: {priceGrowth}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 