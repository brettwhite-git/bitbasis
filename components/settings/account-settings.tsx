"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { CheckCircle, ShieldCheck, InfoIcon } from "lucide-react"
import Link from "next/link"
import { SubscriptionManagement } from "./SubscriptionManagement"
import { useAuth } from "@/providers/supabase-auth-provider"
import { useTaxMethod } from "@/providers/tax-method-provider"

export function AccountSettings() {
  const { user } = useAuth()
  const { taxMethod, setTaxMethod } = useTaxMethod()

  return (
    <div className="grid gap-6">
      {/* Email Section */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-800/20 via-gray-900/30 to-gray-800/20 p-6 shadow-md backdrop-blur-sm">
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Email Address</h3>
            <Badge className="bg-green-600 text-white flex items-center gap-1 px-2">
              <CheckCircle className="h-3.5 w-3.5" />
              Verified
            </Badge>
          </div>
          <p className="text-gray-400 text-sm mb-4">
            Your email address is used for login and notifications.
          </p>
          <Input 
            id="email" 
            type="email" 
            value={user?.email || ""} 
            readOnly 
            className="bg-gray-800/30 border-gray-600/50 text-white"
          />
        </div>
      </div>

      {/* Subscription Section - Now Dynamic */}
      <SubscriptionManagement />

      {/* Cost Basis Section */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-800/20 via-gray-900/30 to-gray-800/20 p-6 shadow-md backdrop-blur-sm">
        <div className="relative z-10 space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">Cost Basis Method</h3>
            <p className="text-gray-400 text-sm">
              Select your preferred method for showing your tax liability in the overview dashboard.
            </p>
          </div>
          
          <RadioGroup value={taxMethod} onValueChange={setTaxMethod} className="space-y-4">
            <div className="flex items-start space-x-3">
              <RadioGroupItem value="fifo" id="fifo" className="mt-1" />
              <div className="grid gap-1.5 flex-1">
                <Label htmlFor="fifo" className="font-medium text-white">
                  First In, First Out (FIFO)
                </Label>
                <p className="text-sm text-gray-400">
                  Assumes the first Bitcoin you purchased is the first one you sell. This method typically results in lower
                  capital gains for assets that appreciate over time.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <RadioGroupItem value="lifo" id="lifo" className="mt-1" />
              <div className="grid gap-1.5 flex-1">
                <Label htmlFor="lifo" className="font-medium text-white">
                  Last In, First Out (LIFO)
                </Label>
                <p className="text-sm text-gray-400">
                  Assumes the most recently purchased Bitcoin is the first one you sell. This method can be beneficial in a
                  rising market.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <RadioGroupItem value="hifo" id="hifo" className="mt-1" />
              <div className="grid gap-1.5 flex-1">
                <Label htmlFor="hifo" className="font-medium text-white">
                  Highest In, First Out (HIFO)
                </Label>
                <p className="text-sm text-gray-400">
                  Assumes the Bitcoin purchased at the highest price is the first one you sell. This method typically minimizes capital gains by maximizing the cost basis.
                </p>
              </div>
            </div>
          </RadioGroup>

          <Alert className="border-bitcoin-orange/50 bg-bitcoin-orange/5">
            <InfoIcon className="h-4 w-4 text-bitcoin-orange" />
            <AlertTitle className="text-white">Tax Implications</AlertTitle>
            <AlertDescription className="text-gray-400">
              Different cost basis methods can result in different tax liabilities. We recommend consulting with a tax
              professional to determine the best method for your situation.
            </AlertDescription>
          </Alert>
        </div>
      </div>

      {/* Data Privacy Section */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-800/20 via-gray-900/30 to-gray-800/20 p-6 shadow-md backdrop-blur-sm">
        <div className="relative z-10 space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">Data Privacy</h3>
            <p className="text-gray-400 text-sm">
              Control how your data is stored and used.
            </p>
          </div>
          
          {/* Privacy Toggles */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="encrypt-notes" className="text-white">
                  Encrypt Transaction Notes
                </Label>
                <p className="text-sm text-gray-400">Encrypt your transaction notes with end-to-end encryption.</p>
              </div>
              <Switch id="encrypt-notes" defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="store-csv" className="text-white">
                  Store Original CSV Files
                </Label>
                <p className="text-sm text-gray-400">Keep your original CSV files in your account for reference.</p>
              </div>
              <Switch id="store-csv" defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="analytics" className="text-white">
                  Usage Analytics
                </Label>
                <p className="text-sm text-gray-400">Allow anonymous usage data to help improve BitBasis.</p>
              </div>
              <Switch id="analytics" />
            </div>
          </div>

          {/* Privacy Commitment Alert */}
          <Alert className="border-bitcoin-orange/50 bg-bitcoin-orange/5">
            <ShieldCheck className="h-4 w-4 text-bitcoin-orange" />
            <AlertTitle className="text-white">Privacy Commitment</AlertTitle>
            <AlertDescription className="text-gray-400">
              BitBasis is committed to protecting your privacy. We never sell your data or share it with third parties
              without your explicit consent. Read our{" "}
              <Link href="/privacy" className="font-medium text-bitcoin-orange hover:underline">
                Privacy Policy
              </Link>{" "}
              for more information.
            </AlertDescription>
          </Alert>
        </div>
      </div>

      {/* Export Data Section */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-800/20 via-gray-900/30 to-gray-800/20 p-6 shadow-md backdrop-blur-sm">
        <div className="relative z-10">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-2">Export Your Data</h3>
            <p className="text-gray-400 text-sm">
              Download all your data in a portable format.
            </p>
          </div>
          <div className="border-t border-gray-700/50 pt-4">
            <Button className="bg-gradient-to-r from-bitcoin-orange to-[#D4A76A] text-white font-semibold hover:shadow-lg hover:shadow-bitcoin-orange/30 transition-all duration-300 w-full">
              Export All Data
            </Button>
          </div>
        </div>
      </div>

      {/* Delete Account Section */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-red-900/20 via-red-800/30 to-red-900/20 p-6 shadow-md backdrop-blur-sm border border-red-600/50">
        <div className="relative z-10">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-red-400 mb-2">Delete Account</h3>
            <p className="text-gray-400 text-sm">
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>
          </div>
          <div className="border-t border-red-500/30 pt-4">
            <Button variant="destructive" className="w-full">
              Delete Account
            </Button>
          </div>
        </div>
      </div>

    </div>
  )
}

