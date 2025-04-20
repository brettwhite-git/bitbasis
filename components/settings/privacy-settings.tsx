"use client"

import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ShieldCheck } from "lucide-react"

export function PrivacySettings() {
  // TODO: Replace defaultChecked/values with actual user preferences state

  return (
    <div className="grid gap-6">
      {/* Data Privacy Section */}
      <Card className="dark:bg-gray-800/50 border-gray-700 rounded-lg">
        <CardHeader>
          <CardTitle className="text-lg text-white">Data Privacy</CardTitle>
          <CardDescription className="dark:text-gray-400">
            Control how your data is stored and used.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Privacy Toggles */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="encrypt-notes" className="dark:text-gray-200">
                  Encrypt Transaction Notes
                </Label>
                <p className="text-sm text-muted-foreground dark:text-gray-400">Encrypt your transaction notes with end-to-end encryption.</p>
              </div>
              {/* Add data-state attribute for orange styling when checked */}
              <Switch id="encrypt-notes" defaultChecked className="data-[state=checked]:bg-orange-500" />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="store-csv" className="dark:text-gray-200">
                  Store Original CSV Files
                </Label>
                <p className="text-sm text-muted-foreground dark:text-gray-400">Keep your original CSV files in your account for reference.</p>
              </div>
              <Switch id="store-csv" defaultChecked className="data-[state=checked]:bg-orange-500" />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="analytics" className="dark:text-gray-200">
                  Usage Analytics
                </Label>
                <p className="text-sm text-muted-foreground dark:text-gray-400">Allow anonymous usage data to help improve BitBasis.</p>
              </div>
              <Switch id="analytics" className="data-[state=checked]:bg-orange-500" />
            </div>
          </div>

          {/* Privacy Commitment Alert */}
          <Alert className="dark:bg-slate-800 border-orange-500/50 dark:border-orange-500/40">
             <ShieldCheck className="h-4 w-4 text-orange-400 dark:text-orange-400" />
             <AlertTitle className="text-white dark:text-gray-100">Privacy Commitment</AlertTitle>
             <AlertDescription className="text-muted-foreground dark:text-gray-400">
               BitBasis is committed to protecting your privacy. We never sell your data or share it with third parties
               without your explicit consent. Read our{" "}
               <a href="/privacy" className="font-medium text-orange-500 hover:underline dark:text-orange-400">
                 Privacy Policy
               </a>{" "}
               for more information.
             </AlertDescription>
           </Alert>
        </CardContent>
      </Card>

      {/* Export Data Section */}
      <Card className="dark:bg-gray-800/50 border-gray-700 rounded-lg">
        <CardHeader>
          <CardTitle className="text-lg text-white">Export Your Data</CardTitle>
          <CardDescription className="dark:text-gray-400">
            Download all your data in a portable format.
          </CardDescription>
        </CardHeader>
        <CardFooter className="border-t border-gray-700 px-6 py-4">
          <Button variant="outline" className="w-full border-orange-500 text-orange-500 hover:bg-orange-500/10 hover:text-orange-600 dark:border-orange-500 dark:text-orange-500 dark:hover:bg-orange-500/10 dark:hover:text-orange-400">
            Export All Data
          </Button>
        </CardFooter>
      </Card>

      {/* Save Button - Placed outside cards for global save */}
      <div className="flex justify-end">
          <Button className="w-full md:w-auto bg-orange-500 hover:bg-orange-600 text-white dark:bg-orange-500 dark:hover:bg-orange-600">
            Save Settings
          </Button>
      </div>
    </div>
  )
}

