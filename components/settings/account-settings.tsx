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

export function AccountSettings() {
  // TODO: Replace static data with actual user data
  const userEmail = "john.doe@example.com"
  const isVerified = true // Example verification status
  const subscriptionPlan = "Pro Plan"
  const subscriptionDetails = "$9.99/month, renews on August 15, 2023"
  const [costBasisMethod, setCostBasisMethod] = useState("fifo")

  return (
    <div className="grid gap-6">
      {/* Email Section */}
      <Card className="rounded-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
             <CardTitle className="text-lg">Email Address</CardTitle>
             {isVerified && (
               <Badge className="bg-green-600 text-white flex items-center gap-1 px-2">
                 <CheckCircle className="h-3.5 w-3.5" />
                 Verified
               </Badge>
             )}
           </div>
           <CardDescription>
             Your email address is used for login and notifications.
           </CardDescription>
        </CardHeader>
        <CardContent>
          <Input id="email" type="email" value={userEmail} readOnly />
        </CardContent>
      </Card>

      {/* Subscription Section */}
      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle className="text-lg">Subscription</CardTitle>
          <CardDescription>
            Manage your BitBasis subscription plan.
          </CardDescription>
        </CardHeader>
        <CardContent>
           <div className="flex items-center justify-between">
             <div>
               <h4 className="font-medium">{subscriptionPlan}</h4>
               <p className="text-sm text-muted-foreground">{subscriptionDetails}</p>
             </div>
             <Button variant="orange-outline">
               Manage Subscription
             </Button>
           </div>
        </CardContent>
      </Card>

      {/* Cost Basis Section */}
      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle className="text-lg">Cost Basis Method</CardTitle>
          <CardDescription>
            Select your preferred method for calculating cost basis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <RadioGroup value={costBasisMethod} onValueChange={setCostBasisMethod} className="space-y-4">
            <div className="flex items-start space-x-2">
              <RadioGroupItem value="fifo" id="fifo" className="mt-1" />
              <div className="grid gap-1.5 flex-1">
                <Label htmlFor="fifo" className="font-medium">
                  First In, First Out (FIFO)
                </Label>
                <p className="text-sm text-muted-foreground">
                  Assumes the first Bitcoin you purchased is the first one you sell. This method typically results in lower
                  capital gains for assets that appreciate over time.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <RadioGroupItem value="lifo" id="lifo" className="mt-1" />
              <div className="grid gap-1.5 flex-1">
                <Label htmlFor="lifo" className="font-medium">
                  Last In, First Out (LIFO)
                </Label>
                <p className="text-sm text-muted-foreground">
                  Assumes the most recently purchased Bitcoin is the first one you sell. This method can be beneficial in a
                  rising market.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <RadioGroupItem value="hifo" id="hifo" className="mt-1" />
              <div className="grid gap-1.5 flex-1">
                <Label htmlFor="hifo" className="font-medium">
                  Highest In, First Out (HIFO)
                </Label>
                <p className="text-sm text-muted-foreground">
                  Assumes the Bitcoin purchased at the highest price is the first one you sell. This method typically minimizes capital gains by maximizing the cost basis.
                </p>
              </div>
            </div>
          </RadioGroup>

          <Alert className="border-primary">
            <InfoIcon className="h-4 w-4 text-primary" />
            <AlertTitle>Tax Implications</AlertTitle>
            <AlertDescription className="text-muted-foreground">
              Different cost basis methods can result in different tax liabilities. We recommend consulting with a tax
              professional to determine the best method for your situation.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Data Privacy Section */}
      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle className="text-lg">Data Privacy</CardTitle>
          <CardDescription>
            Control how your data is stored and used.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Privacy Toggles */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="encrypt-notes">
                  Encrypt Transaction Notes
                </Label>
                <p className="text-sm text-muted-foreground">Encrypt your transaction notes with end-to-end encryption.</p>
              </div>
              <Switch id="encrypt-notes" defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="store-csv">
                  Store Original CSV Files
                </Label>
                <p className="text-sm text-muted-foreground">Keep your original CSV files in your account for reference.</p>
              </div>
              <Switch id="store-csv" defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="analytics">
                  Usage Analytics
                </Label>
                <p className="text-sm text-muted-foreground">Allow anonymous usage data to help improve BitBasis.</p>
              </div>
              <Switch id="analytics" />
            </div>
          </div>

          {/* Privacy Commitment Alert */}
          <Alert className="border-primary/50">
             <ShieldCheck className="h-4 w-4 text-primary" />
             <AlertTitle>Privacy Commitment</AlertTitle>
             <AlertDescription className="text-muted-foreground">
               BitBasis is committed to protecting your privacy. We never sell your data or share it with third parties
               without your explicit consent. Read our{" "}
               <Link href="/privacy" className="font-medium text-primary hover:underline">
                 Privacy Policy
               </Link>{" "}
               for more information.
             </AlertDescription>
           </Alert>
        </CardContent>
      </Card>

      {/* Export Data Section */}
      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle className="text-lg">Export Your Data</CardTitle>
          <CardDescription>
            Download all your data in a portable format.
          </CardDescription>
        </CardHeader>
        <CardFooter className="border-t pt-4">
          <Button variant="orange-outline" className="w-full">
            Export All Data
          </Button>
        </CardFooter>
      </Card>

      {/* Delete Account Section */}
      <Card className="rounded-lg border-red-600/50">
         <CardHeader>
           <CardTitle className="text-lg text-red-500">Delete Account</CardTitle>
           <CardDescription>
             Permanently delete your account and all associated data. This action cannot be undone.
           </CardDescription>
         </CardHeader>
         <CardFooter className="border-t border-red-500/30 pt-4">
           <Button variant="destructive">
             Delete Account
           </Button>
         </CardFooter>
       </Card>

      {/* Save Button - Placed outside cards for global save */}
      <div className="flex justify-end">
          <Button variant="orange-outline" className="w-full md:w-auto">
            Save Settings
          </Button>
      </div>
    </div>
  )
}

