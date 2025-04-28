"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { CheckCircle } from "lucide-react"

export function AccountSettings() {
  // TODO: Replace static data with actual user data
  const userEmail = "john.doe@example.com"
  const isVerified = true // Example verification status
  const subscriptionPlan = "Pro Plan"
  const subscriptionDetails = "$9.99/month, renews on August 15, 2023"

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

      {/* Password Section */}
      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle className="text-lg">Password</CardTitle>
          <CardDescription>
            Update your password to keep your account secure. Leave fields blank to keep the current password.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-password">Current Password</Label>
            <Input id="current-password" type="password" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password">New Password</Label>
            <Input id="new-password" type="password" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm New Password</Label>
            <Input id="confirm-password" type="password" />
          </div>
        </CardContent>
        <CardFooter className="border-t pt-4">
          <Button variant="orange-outline">
            Update Password
          </Button>
        </CardFooter>
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
    </div>
  )
}

