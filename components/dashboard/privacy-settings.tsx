"use client"

import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ShieldCheck } from "lucide-react"

export function PrivacySettings() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-medium text-white">Data Privacy</h3>
        <p className="text-sm text-muted-foreground">Control how your data is stored and used</p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="encrypt-notes" className="text-white">
              Encrypt Transaction Notes
            </Label>
            <p className="text-sm text-muted-foreground">Encrypt your transaction notes with end-to-end encryption</p>
          </div>
          <Switch id="encrypt-notes" defaultChecked />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="store-csv" className="text-white">
              Store Original CSV Files
            </Label>
            <p className="text-sm text-muted-foreground">Keep your original CSV files in your account for reference</p>
          </div>
          <Switch id="store-csv" defaultChecked />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="analytics" className="text-white">
              Usage Analytics
            </Label>
            <p className="text-sm text-muted-foreground">Allow anonymous usage data to help improve BitBasis</p>
          </div>
          <Switch id="analytics" />
        </div>
      </div>

      <Alert className="bg-secondary border-bitcoin-orange">
        <ShieldCheck className="h-4 w-4 text-bitcoin-orange" />
        <AlertTitle className="text-white">Privacy Commitment</AlertTitle>
        <AlertDescription className="text-muted-foreground">
          BitBasis is committed to protecting your privacy. We never sell your data or share it with third parties
          without your explicit consent. Read our{" "}
          <a href="/privacy" className="text-bitcoin-orange hover:underline">
            Privacy Policy
          </a>{" "}
          for more information.
        </AlertDescription>
      </Alert>

      <div className="space-y-2">
        <h3 className="text-lg font-medium text-white">Export Your Data</h3>
        <p className="text-sm text-muted-foreground">Download all your data in a portable format</p>
        <Button variant="outline" className="border-bitcoin-orange text-bitcoin-orange hover:bg-bitcoin-orange/10">
          Export All Data
        </Button>
      </div>

      <Button className="bg-bitcoin-orange hover:bg-bitcoin-dark text-white">Save Settings</Button>
    </div>
  )
}

