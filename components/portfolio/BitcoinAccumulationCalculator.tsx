'use client';

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";

const BitcoinAccumulationCalculator = () => {
  const [calculatorMode, setCalculatorMode] = useState('satsGoal'); // 'satsGoal' or 'recurringBuy'
  const [bitcoinUnit, setBitcoinUnit] = useState('satoshi');
  const [frequency, setFrequency] = useState('weekly');
  const [goalDuration, setGoalDuration] = useState('1_year');

  return (
    <Card className="w-full mt-4"> {/* Reduced margin-top from mt-6 to mt-4 */}
      <CardHeader>
        <CardTitle>Bitcoin Accumulation Calculator</CardTitle>
        <CardDescription>Estimate your Bitcoin savings journey.</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Top Tabs - Using Buttons for now, could be Tabs component */}
        <div className="flex mb-6 border-b border-border">
          <Button
            variant={calculatorMode === 'satsGoal' ? "default" : "ghost"}
            onClick={() => setCalculatorMode('satsGoal')}
            className={`rounded-b-none ${calculatorMode === 'satsGoal' ? 'bg-bitcoin-orange text-black hover:bg-bitcoin-orange/90' : ''}`}
          >
            Fixed Sats Goal
          </Button>
          <Button
            variant={calculatorMode === 'recurringBuy' ? "default" : "ghost"}
            onClick={() => setCalculatorMode('recurringBuy')}
            className={`ml-1 rounded-b-none ${calculatorMode === 'recurringBuy' ? 'bg-bitcoin-orange text-black hover:bg-bitcoin-orange/90' : ''}`}
          >
            Fixed Recurring Buy
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Input Section (Left) */}
          <div className="md:col-span-1 space-y-4">
            {/* Bitcoin Unit - RadioGroup */}
            <div className="space-y-2">
              <Label>Bitcoin Unit</Label>
              <RadioGroup defaultValue="satoshi" value={bitcoinUnit} onValueChange={setBitcoinUnit} className="flex space-x-1 bg-background p-1 rounded-md border">
                  <Label className={`flex-1 text-center p-1 rounded-md cursor-pointer text-sm ${bitcoinUnit === 'satoshi' ? 'bg-muted' : 'hover:bg-muted/50'}`}>
                    <RadioGroupItem value="satoshi" id="satoshi" className="sr-only" />
                    Satoshi
                  </Label>
                  <Label className={`flex-1 text-center p-1 rounded-md cursor-pointer text-sm ${bitcoinUnit === 'bitcoin' ? 'bg-muted' : 'hover:bg-muted/50'}`}>
                    <RadioGroupItem value="bitcoin" id="bitcoin" className="sr-only" />
                    Bitcoin
                  </Label>
              </RadioGroup>
            </div>

            {/* Fiat Currency - Select */}
            <div className="space-y-2">
              <Label htmlFor="fiatCurrency">Fiat Currency</Label>
              <Select defaultValue="USD">
                <SelectTrigger id="fiatCurrency">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  {/* Add other currencies if needed */}
                </SelectContent>
              </Select>
            </div>

            {/* Buying Frequency - RadioGroup */}
             <div className="space-y-2">
              <Label>Buying Frequency</Label>
              <RadioGroup defaultValue="weekly" value={frequency} onValueChange={setFrequency} className="flex space-x-1 bg-background p-1 rounded-md border text-sm">
                  <Label className={`flex-1 text-center p-1 rounded-md cursor-pointer ${frequency === 'daily' ? 'bg-muted' : 'hover:bg-muted/50'}`}>
                    <RadioGroupItem value="daily" id="daily" className="sr-only" />
                    Daily
                  </Label>
                   <Label className={`flex-1 text-center p-1 rounded-md cursor-pointer ${frequency === 'weekly' ? 'bg-muted' : 'hover:bg-muted/50'}`}>
                    <RadioGroupItem value="weekly" id="weekly" className="sr-only" />
                    Weekly
                  </Label>
                   <Label className={`flex-1 text-center p-1 rounded-md cursor-pointer ${frequency === 'monthly' ? 'bg-muted' : 'hover:bg-muted/50'}`}>
                    <RadioGroupItem value="monthly" id="monthly" className="sr-only" />
                    Monthly
                  </Label>
                   <Label className={`flex-1 text-center p-1 rounded-md cursor-pointer ${frequency === 'yearly' ? 'bg-muted' : 'hover:bg-muted/50'}`}>
                    <RadioGroupItem value="yearly" id="yearly" className="sr-only" />
                    Yearly
                  </Label>
              </RadioGroup>
            </div>

            {/* SatsGoal Input */}
            <div className="space-y-2">
              <Label htmlFor="satsGoal">Sats Goal</Label>
              <div className="relative">
                <Input
                  type="number"
                  id="satsGoal"
                  placeholder="10,000,000"
                  className="pr-20" // Keep padding for the text
                />
                <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-xs text-muted-foreground">= 0.1 BTC</span>
              </div>
            </div>

            {/* Goal Date */}
            <div className="space-y-2">
              <Label htmlFor="goalDate">Goal Date</Label>
              <div className="flex items-center space-x-2">
                <Select defaultValue="1_year" value={goalDuration} onValueChange={setGoalDuration}>
                  <SelectTrigger id="goalDate">
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1_year">1 Year</SelectItem>
                    <SelectItem value="2_year">2 Years</SelectItem>
                    <SelectItem value="5_year">5 Years</SelectItem>
                    {/* Add other options */}
                  </SelectContent>
                </Select>
                <div className="flex items-center space-x-2">
                  <Checkbox id="customDate" />
                  <Label htmlFor="customDate" className="text-sm font-normal text-muted-foreground whitespace-nowrap">Set Custom?</Label>
                </div>
              </div>
            </div>

            {/* Future Price Estimate */}
            <div className="space-y-2">
              <Label htmlFor="futurePrice">Future Price Estimate</Label>
               <div className="flex items-center space-x-2">
                <Input
                  type="text"
                  id="futurePrice"
                  placeholder="e.g., 4 Year CAGR: 9%"
                />
                 <div className="flex items-center space-x-2">
                  <Checkbox id="customPrice" />
                  <Label htmlFor="customPrice" className="text-sm font-normal text-muted-foreground whitespace-nowrap">Set Custom?</Label>
                </div>
              </div>
            </div>

            {/* Advanced Options Button */}
            <div>
              <Button variant="secondary" className="w-full mt-4">
                Advanced Options
              </Button>
            </div>
          </div>

          {/* Chart Section (Right) - Placeholder */}
          <div className="md:col-span-2 bg-muted/30 p-4 rounded-md flex items-center justify-center min-h-[300px] border border-border">
            <p className="text-muted-foreground">Chart Placeholder</p>
          </div>
        </div>

        {/* Summary Section (Bottom) - Placeholder */}
        <div className="mt-8 bg-muted/30 p-4 rounded-md border border-border flex items-center justify-center">
          <p className="text-muted-foreground">Summary Placeholder (e.g., "$164.84 per week...")</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default BitcoinAccumulationCalculator; 