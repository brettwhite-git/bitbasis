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

export function AccountSettings() {
  // TODO: Replace static data with actual user data
  const userEmail = "john.doe@example.com"
  const isVerified = true // Example verification status
  const subscriptionPlan = "Pro Plan"
  const subscriptionDetails = "$9.99/month, renews on August 15, 2023"

  return (
    <div className="grid gap-6">
      {/* Email Section */}
      <Card className="dark:bg-gray-800/50 border-gray-700 rounded-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
             <CardTitle className="text-lg text-white">Email Address</CardTitle>
             {isVerified && <Badge className="bg-green-600 hover:bg-green-700 text-white">Verified</Badge>}
           </div>
           <CardDescription className="dark:text-gray-400">
             Your email address is used for login and notifications.
           </CardDescription>
        </CardHeader>
        <CardContent>
          <Input id="email" type="email" value={userEmail} readOnly className="dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600" />
        </CardContent>
        {/* Optional Footer for actions like 'Resend verification' if needed */}
         {/* <CardFooter className="border-t border-gray-700 px-6 py-4">
           <Button variant="outline" className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">Resend Verification</Button>
         </CardFooter> */}
      </Card>

      {/* Password Section */}
      <Card className="dark:bg-gray-800/50 border-gray-700 rounded-lg">
        <CardHeader>
          <CardTitle className="text-lg text-white">Password</CardTitle>
          <CardDescription className="dark:text-gray-400">
            Update your password to keep your account secure. Leave fields blank to keep the current password.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-password" className="dark:text-gray-300">Current Password</Label>
            <Input id="current-password" type="password" className="dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password" className="dark:text-gray-300">New Password</Label>
            <Input id="new-password" type="password" className="dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password" className="dark:text-gray-300">Confirm New Password</Label>
            <Input id="confirm-password" type="password" className="dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600" />
          </div>
        </CardContent>
        <CardFooter className="border-t border-gray-700 px-6 py-4">
          <Button className="bg-orange-500 hover:bg-orange-600 text-white dark:bg-orange-500 dark:hover:bg-orange-600">
            Update Password
          </Button>
        </CardFooter>
      </Card>

      {/* Subscription Section */}
      <Card className="dark:bg-gray-800/50 border-gray-700 rounded-lg">
        <CardHeader>
          <CardTitle className="text-lg text-white">Subscription</CardTitle>
          <CardDescription className="dark:text-gray-400">
            Manage your BitBasis subscription plan.
          </CardDescription>
        </CardHeader>
        <CardContent>
           <div className="flex items-center justify-between">
             <div>
               <h4 className="font-medium text-white">{subscriptionPlan}</h4>
               <p className="text-sm text-muted-foreground dark:text-gray-400">{subscriptionDetails}</p>
             </div>
             {/* Use orange border/text for consistency */}
             <Button variant="outline" className="border-orange-500 text-orange-500 hover:bg-orange-500/10 hover:text-orange-600 dark:border-orange-500 dark:text-orange-500 dark:hover:bg-orange-500/10 dark:hover:text-orange-400">
               Manage Subscription
             </Button>
           </div>
        </CardContent>
      </Card>

      {/* Delete Account Section */}
      <Card className="dark:bg-gray-800/50 border-red-600/50 dark:border-red-500/40 rounded-lg">
         <CardHeader>
           <CardTitle className="text-lg text-red-500 dark:text-red-400">Delete Account</CardTitle>
           <CardDescription className="dark:text-gray-400">
             Permanently delete your account and all associated data. This action cannot be undone.
           </CardDescription>
         </CardHeader>
         <CardFooter className="border-t border-red-500/30 dark:border-red-500/30 px-6 py-4">
           <Button variant="destructive" className="bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700">
             Delete Account
           </Button>
         </CardFooter>
       </Card>
    </div>
  )
}

