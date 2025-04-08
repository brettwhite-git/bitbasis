"use client"

import React, { useState } from 'react';
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { CalculatorChart } from "./calculator-chart"

export function BitcoinCalculator() {
  const [calculatorMode, setCalculatorMode] = useState('satsGoal'); // 'satsGoal' or 'recurringBuy'
  const [bitcoinUnit, setBitcoinUnit] = useState('satoshi');
  const [frequency, setFrequency] = useState('weekly');
  const [goalDuration, setGoalDuration] = useState('1_year');

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
      <div className="p-6 space-y-6">
        {/* Calculator Header */}
        <div>
          <h2 className="text-lg font-semibold">Accumulation Calculator</h2>
          <p className="text-sm text-muted-foreground">Estimate your Bitcoin savings journey.</p>
        </div>

        {/* Top Tabs */}
        <div className="flex border-b border-border">
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
            {/* Bitcoin Unit */}
            <div className="space-y-2">
              <Label>Bitcoin Unit</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={bitcoinUnit === 'satoshi' ? "default" : "outline"}
                  onClick={() => setBitcoinUnit('satoshi')}
                  className={`w-full ${bitcoinUnit === 'satoshi' ? 'bg-muted hover:bg-muted/90' : ''}`}
                >
                  Satoshi
                </Button>
                <Button
                  variant={bitcoinUnit === 'bitcoin' ? "default" : "outline"}
                  onClick={() => setBitcoinUnit('bitcoin')}
                  className={`w-full ${bitcoinUnit === 'bitcoin' ? 'bg-muted hover:bg-muted/90' : ''}`}
                >
                  Bitcoin
                </Button>
              </div>
            </div>

            {/* Fiat Currency */}
            <div className="space-y-2">
              <Label>Fiat Currency</Label>
              <Select defaultValue="USD">
                <SelectTrigger>
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
              <div className="grid grid-cols-4 gap-2">
                {["Daily", "Weekly", "Monthly", "Yearly"].map((period) => (
                  <Button
                    key={period.toLowerCase()}
                    variant={frequency === period.toLowerCase() ? "default" : "outline"}
                    onClick={() => setFrequency(period.toLowerCase() as typeof frequency)}
                    className={`w-full ${frequency === period.toLowerCase() ? 'bg-muted hover:bg-muted/90' : ''}`}
                  >
                    {period}
                  </Button>
                ))}
              </div>
            </div>

            {/* Sats Goal */}
            <div className="space-y-2">
              <Label>Sats Goal</Label>
              <div className="relative">
                <Input
                  type="number"
                  placeholder="10,000,000"
                  className="pr-20"
                />
                <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-xs text-muted-foreground">= 0.1 BTC</span>
              </div>
            </div>

            {/* Goal Date */}
            <div className="space-y-2">
              <Label>Goal Date</Label>
              <div className="flex items-center space-x-2">
                <Select defaultValue="1_year" value={goalDuration} onValueChange={setGoalDuration}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1_year">1 Year</SelectItem>
                    <SelectItem value="2_year">2 Years</SelectItem>
                    <SelectItem value="5_year">5 Years</SelectItem>
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
              <Label>Future Price Estimate</Label>
              <div className="flex items-center space-x-2">
                <Input
                  type="text"
                  placeholder="e.g., 4 Year CAGR: 9%"
                />
                <div className="flex items-center space-x-2">
                  <Checkbox id="customPrice" />
                  <Label htmlFor="customPrice" className="text-sm font-normal text-muted-foreground whitespace-nowrap">Set Custom?</Label>
                </div>
              </div>
            </div>

            {/* Advanced Options */}
            <Button variant="secondary" className="w-full mt-4">
              Advanced Options
            </Button>
          </div>

          {/* Right Section */}
          <div className="md:col-span-2 space-y-4">
            {/* Summary Section */}
            <div className="w-full bg-muted/30 p-4 rounded-md border border-border">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-bitcoin-orange rounded-lg flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-8 h-8 text-black"
                  >
                    <path d="M12.378 1.602a.75.75 0 00-.756 0L3 6.632l9 5.25 9-5.25-8.622-5.03zM21.75 7.93l-9 5.25v9l8.628-5.032a.75.75 0 00.372-.648V7.93zM11.25 22.18v-9l-9-5.25v8.57a.75.75 0 00.372.648l8.628 5.033z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold">$663.20</span>
                    <span className="text-muted-foreground">per month</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    in bitcoin to accumulate 10,000,000 sats by 4th April 2026
                  </p>
                </div>
                <Button variant="secondary">Save</Button>
              </div>
            </div>

            {/* Chart Section */}
            <div className="w-full bg-muted/30 p-4 rounded-md border border-border">
              <CalculatorChart />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 