"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"

export function AccountSettings() {
  return (
    <div className="w-full space-y-6">
      <div className="w-full space-y-2">
        <div className="flex items-center justify-between w-full">
          <div>
            <h3 className="text-lg font-medium text-white">Email Address</h3>
            <p className="text-sm text-muted-foreground">Your email address is used for login and notifications</p>
          </div>
          <Badge className="bg-bitcoin-orange">Verified</Badge>
        </div>
        <div className="grid w-full gap-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value="john.doe@example.com" readOnly />
        </div>
      </div>

      <div className="w-full space-y-2">
        <div>
          <h3 className="text-lg font-medium text-white">Password</h3>
          <p className="text-sm text-muted-foreground">Update your password to keep your account secure</p>
        </div>
        <div className="grid w-full gap-2">
          <Label htmlFor="current-password">Current Password</Label>
          <Input id="current-password" type="password" />
        </div>
        <div className="grid w-full gap-2">
          <Label htmlFor="new-password">New Password</Label>
          <Input id="new-password" type="password" />
        </div>
        <div className="grid w-full gap-2">
          <Label htmlFor="confirm-password">Confirm New Password</Label>
          <Input id="confirm-password" type="password" />
        </div>
        <Button className="mt-2 bg-bitcoin-orange hover:bg-bitcoin-dark text-white">Update Password</Button>
      </div>

      <div className="w-full space-y-2">
        <div>
          <h3 className="text-lg font-medium text-white">Subscription</h3>
          <p className="text-sm text-muted-foreground">Manage your BitBasis subscription</p>
        </div>
        <div className="w-full rounded-lg border border-border p-4">
          <div className="flex items-center justify-between w-full">
            <div>
              <h4 className="font-medium text-white">Pro Plan</h4>
              <p className="text-sm text-muted-foreground">$9.99/month, renews on August 15, 2023</p>
            </div>
            <Button variant="outline" className="border-bitcoin-orange text-bitcoin-orange hover:bg-bitcoin-orange/10">
              Manage Subscription
            </Button>
          </div>
        </div>
      </div>

      <div className="w-full space-y-2">
        <div>
          <h3 className="text-lg font-medium text-white">Delete Account</h3>
          <p className="text-sm text-muted-foreground">Permanently delete your account and all your data</p>
        </div>
        <Button variant="destructive">Delete Account</Button>
      </div>
    </div>
  )
}

