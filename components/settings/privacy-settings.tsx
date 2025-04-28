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
               <a href="/privacy" className="font-medium text-primary hover:underline">
                 Privacy Policy
               </a>{" "}
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

      {/* Save Button - Placed outside cards for global save */}
      <div className="flex justify-end">
          <Button variant="orange-outline" className="w-full md:w-auto">
            Save Settings
          </Button>
      </div>
    </div>
  )
}

