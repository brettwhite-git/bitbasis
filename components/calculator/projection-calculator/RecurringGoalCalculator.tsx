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
      <div className="h-full p-6 rounded-md border border-border bg-muted/30 space-y-8 flex flex-col">
        {/* Bitcoin Unit */}
        <div className="space-y-3">
          <Label className="text-base">Bitcoin Unit</Label>
          <RadioGroup value={bitcoinUnit} onValueChange={(value) => setBitcoinUnit(value as BitcoinUnit)} className="grid grid-cols-2 gap-3">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="bitcoin" id="rg-bitcoin" className="peer sr-only" />
              <Label
                htmlFor="rg-bitcoin"
                className="flex-1 cursor-pointer rounded-md border-2 border-muted p-4 hover:bg-muted peer-data-[state=checked]:border-bitcoin-orange peer-data-[state=checked]:bg-bitcoin-orange/10 peer-data-[state=checked]:text-bitcoin-orange"
              >
                Bitcoin
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="satoshi" id="rg-satoshi" className="peer sr-only" />
              <Label
                htmlFor="rg-satoshi"
                className="flex-1 cursor-pointer rounded-md border-2 border-muted p-4 hover:bg-muted peer-data-[state=checked]:border-bitcoin-orange peer-data-[state=checked]:bg-bitcoin-orange/10 peer-data-[state=checked]:text-bitcoin-orange"
              >
                Satoshi
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Fiat Currency */}
        <div className="space-y-3">
          <Label className="text-base">Fiat Currency</Label>
          <Select defaultValue="USD">
            <SelectTrigger className="bg-background border-input p-6">
              <SelectValue placeholder="Select currency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USD">USD ($)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Buying Frequency */}
        <div className="space-y-3">
          <Label className="text-base">Buying Frequency</Label>
          <RadioGroup value={frequency} onValueChange={setFrequency} className="grid grid-cols-4 gap-3">
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
        <div className="space-y-3">
          <Label className="text-base">Recurring Buy Amount</Label>
          <div className="relative">
            <Input
              type="text"
              placeholder="100"
              value={recurringBuyAmount} // Display the raw state value
              onChange={handleRecurringBuyAmountChange}
              className="pl-8 pr-10 bg-muted/50 border-input h-12" // Padding for symbols and increased height
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
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Label className="text-base">Goal Date</Label>
            <span className="font-medium dark:text-gray-100 text-base">{getDurationDetails(goalDuration).label}</span>
          </div>
          <div className="space-y-3 mt-2">
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
                className="w-full cursor-pointer h-3 rounded-lg appearance-none bg-primary/20 dark:bg-primary/10"
              />
            </div>
          </div>
        </div>

        {/* Compound Annual Growth Rate (CAGR) Slider */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Label htmlFor="cagrSliderRecurring" className="dark:text-gray-300 text-base">Compound Annual Growth Rate (CAGR)</Label>
            <span className="font-medium dark:text-gray-100 text-base">{priceGrowth}%</span>
          </div>
          <div className="space-y-3 mt-2">
            <Slider
              id="cagrSliderRecurring" // Unique ID
              min={0}
              max={100} // Set max to 100%
              step={1}
              value={[parseFloat(priceGrowth)]} // Use the numeric value
              onValueChange={(value) => {
                setPriceGrowth(value[0]?.toString() || '30'); // Add null check and fallback
              }}
              className="w-full cursor-pointer h-3 rounded-lg appearance-none bg-primary/20 dark:bg-primary/10"
            />
          </div>
        </div>
      </div>
    </div>
  );
} 