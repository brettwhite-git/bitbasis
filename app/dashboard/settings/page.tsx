import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AccountSettings } from "@/components/dashboard/account-settings"
import { CostBasisSettings } from "@/components/dashboard/cost-basis-settings"
import { PrivacySettings } from "@/components/dashboard/privacy-settings"

export default function SettingsPage() {
  return (
    <div className="w-full space-y-6">
      <div className="w-full">
        <h1 className="text-2xl font-bold tracking-tight text-white">Settings</h1>
      </div>
      <div className="w-full grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Account Settings</CardTitle>
            <CardDescription>Manage your account details and subscription</CardDescription>
          </CardHeader>
          <CardContent>
            <AccountSettings />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Cost Basis Settings</CardTitle>
            <CardDescription>Configure your preferred cost basis calculation method</CardDescription>
          </CardHeader>
          <CardContent>
            <CostBasisSettings />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Privacy Settings</CardTitle>
            <CardDescription>Control your data and privacy preferences</CardDescription>
          </CardHeader>
          <CardContent>
            <PrivacySettings />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

