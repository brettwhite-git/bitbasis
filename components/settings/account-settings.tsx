"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { CheckCircle, ShieldCheck, InfoIcon, Trash2, Download, ExternalLink, AlertTriangle } from "lucide-react"
import { SubscriptionManagement } from "./subscription-management"
import { useAuth } from "@/providers/supabase-auth-provider"
import { useTaxMethod } from "@/providers/tax-method-provider"
import { useToast } from "@/lib/hooks/use-toast"
import { exportAllUserDataSingle } from "@/lib/utils/user-data-export"
import { useDisplayName } from "@/lib/hooks/use-display-name"
import { useRouter } from "next/navigation"
import { createClient } from '@/lib/supabase/client'

// Form schema for account settings
const accountSettingsSchema = z.object({
  displayName: z.string().max(50, "Display name must be 50 characters or less").optional(),
  taxMethod: z.enum(["fifo", "lifo", "hifo"], {
    required_error: "Please select a cost basis method.",
  }),
})

type AccountSettingsFormValues = z.infer<typeof accountSettingsSchema>

interface AccountSummary {
  transactionCount: number
  csvUploadCount: number
  subscription: {
    hasActive: boolean
    type?: 'monthly' | 'lifetime'
    nextBillingDate?: string
  }
  email?: string
}

export function AccountSettings() {
  const { user } = useAuth()
  const { taxMethod, setTaxMethod } = useTaxMethod()
  const { displayName, setDisplayName, isLoaded } = useDisplayName()
  const { toast } = useToast()
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [accountSummary, setAccountSummary] = useState<AccountSummary | null>(null)
  const [loadingSummary, setLoadingSummary] = useState(false)
  const [confirmationText, setConfirmationText] = useState("")

  // Initialize form with current values
  const form = useForm<AccountSettingsFormValues>({
    resolver: zodResolver(accountSettingsSchema),
    defaultValues: {
      displayName: displayName || "",
      taxMethod: taxMethod as "fifo" | "lifo" | "hifo",
    },
  })

  // Update form when displayName loads from localStorage
  useEffect(() => {
    if (isLoaded) {
      form.setValue('displayName', displayName || "")
    }
  }, [displayName, isLoaded, form])

  // Form submit handler
  const handleFormSubmit = async (values: AccountSettingsFormValues) => {
    setIsSaving(true)
    try {
      let hasChanges = false
      const updates = []

      // Update display name if it changed
      if (values.displayName !== displayName) {
        setDisplayName(values.displayName || "")
        hasChanges = true
        updates.push("display name")
      }

      // Update tax method if it changed
      if (values.taxMethod !== taxMethod) {
        setTaxMethod(values.taxMethod)
        hasChanges = true
        updates.push("cost basis method")
      }

      if (hasChanges) {
        toast({
          title: "Settings Saved",
          description: `Successfully updated your ${updates.join(" and ")}.`,
        })
      } else {
        toast({
          title: "No Changes",
          description: "No changes were made to your settings.",
        })
      }

      // Here you would typically save other settings to your backend
      console.log("Form values saved:", values)
    } catch (error) {
      console.error("Save error:", error)
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }
  
  // Handle data export
  const handleExportData = async () => {
    setIsExporting(true)
    try {
      await exportAllUserDataSingle()
      toast({
        title: "Data Export Complete",
        description: "Your data has been exported successfully. Check your downloads folder.",
      })
    } catch (error) {
      console.error('Export error:', error)
      toast({
        title: "Export Failed",
        description: "Failed to export your data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  // Fetch account summary when dialog opens
  useEffect(() => {
    if (deleteDialogOpen) {
      // Always refetch when dialog opens to get latest subscription status
      setAccountSummary(null)
      fetchAccountSummary()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deleteDialogOpen])

  const fetchAccountSummary = async () => {
    setLoadingSummary(true)
    try {
      const response = await fetch('/api/account/summary')
      if (!response.ok) {
        throw new Error('Failed to fetch account summary')
      }
      const data = await response.json()
      setAccountSummary(data)
    } catch (error) {
      console.error('Error fetching account summary:', error)
      toast({
        title: "Error",
        description: "Failed to load account information. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoadingSummary(false)
    }
  }

  // Handle account deletion
  const handleDeleteAccount = async () => {
    if (confirmationText !== "DELETE") {
      toast({
        title: "Confirmation Required",
        description: "Please type DELETE to confirm account deletion.",
        variant: "destructive",
      })
      return
    }

    setIsDeleting(true)
    try {
      const response = await fetch('/api/account/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          confirmationText: "DELETE",
          cancelSubscriptionImmediately: true
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete account')
      }

      // Clear local storage before sign out
      if (typeof window !== 'undefined') {
        localStorage.clear()
      }

      // Redirect to success page FIRST (before sign out)
      // This prevents the auth state change listener from redirecting to sign-in
      router.push('/account-deleted')
      
      // Small delay to ensure redirect starts, then sign out
      // The redirect will complete and user will be on account-deleted page
      setTimeout(async () => {
        const supabase = createClient()
        await supabase.auth.signOut()
      }, 100)

    } catch (error) {
      console.error('Account deletion error:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete account. Please try again.",
        variant: "destructive",
      })
      setIsDeleting(false)
    }
  }

  return (
    <div className="grid gap-6">
      {/* Subscription Section - Keep existing component */}
      <div data-subscription-section>
        <SubscriptionManagement />
      </div>

      {/* Combined Account Settings Form */}
      <Form {...form}>
        <form 
          onSubmit={form.handleSubmit(handleFormSubmit)}
          className="space-y-6"
        >
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-800/20 via-gray-900/30 to-gray-800/20 p-6 shadow-md backdrop-blur-sm">
            <div className="relative z-10 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Account Settings</h3>
                <p className="text-gray-400 text-sm">
                  Manage your personal information and preferences.
                </p>
              </div>

              {/* Display Name Section */}
              <div className="space-y-3">
                <h4 className="text-white font-medium">Display Name</h4>
                <p className="text-gray-400 text-sm">
                  This name will be shown in your account dropdown. It&apos;s stored locally on your device only.
                </p>
                <FormField
                  control={form.control}
                  name="displayName"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input 
                          placeholder="Enter your display name"
                          className="bg-gray-800/30 border-gray-600/50 text-white placeholder:text-gray-400"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Email Section - Read Only */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-white font-medium">Email Address</h4>
                  <Badge className="bg-green-600 text-white flex items-center gap-1 px-2">
                    <CheckCircle className="h-3.5 w-3.5" />
                    Verified
                  </Badge>
                </div>
                <p className="text-gray-400 text-sm">
                  Your email address is used for login and notifications.
                </p>
                <Input 
                  id="email" 
                  type="email" 
                  value={user?.email || ""} 
                  readOnly 
                  className="bg-gray-800/30 border-gray-600/50 text-white opacity-75"
                />
              </div>

              {/* Cost Basis Method Section */}
              <div className="space-y-3">
                <h4 className="text-white font-medium">Cost Basis Method</h4>
                <p className="text-gray-400 text-sm">
                  Select your preferred method for showing your tax liability in the overview dashboard.
                </p>
                <FormField
                  control={form.control}
                  name="taxMethod"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="space-y-4"
                        >
                          <div className="flex items-start space-x-3">
                            <RadioGroupItem value="fifo" id="fifo" className="mt-1" />
                            <div className="grid gap-1.5 flex-1">
                              <label htmlFor="fifo" className="font-medium text-white">
                                First In, First Out (FIFO)
                              </label>
                              <p className="text-sm text-gray-400">
                                Assumes the first Bitcoin you purchased is the first one you sell. This method typically results in lower
                                capital gains for assets that appreciate over time.
                              </p>
                            </div>
                          </div>
                          <div className="flex items-start space-x-3">
                            <RadioGroupItem value="lifo" id="lifo" className="mt-1" />
                            <div className="grid gap-1.5 flex-1">
                              <label htmlFor="lifo" className="font-medium text-white">
                                Last In, First Out (LIFO)
                              </label>
                              <p className="text-sm text-gray-400">
                                Assumes the last Bitcoin you purchased is the first one you sell. This method typically results in higher
                                capital gains for assets that appreciate over time.
                              </p>
                            </div>
                          </div>
                          <div className="flex items-start space-x-3">
                            <RadioGroupItem value="hifo" id="hifo" className="mt-1" />
                            <div className="grid gap-1.5 flex-1">
                              <label htmlFor="hifo" className="font-medium text-white">
                                Highest In, First Out (HIFO)
                              </label>
                              <p className="text-sm text-gray-400">
                                Assumes the Bitcoin with the highest cost basis is sold first. This method minimizes capital gains and is
                                optimal for tax purposes.
                              </p>
                            </div>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Save Button */}
              <div className="flex items-center justify-end pt-4 border-t border-gray-600/30">
                <Button 
                  type="submit" 
                  disabled={isSaving}
                  className="bg-bitcoin-orange hover:bg-[#D4A76A] text-white px-6"
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </Form>

      {/* Data Privacy Section */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-800/20 via-gray-900/30 to-gray-800/20 p-6 shadow-md backdrop-blur-sm">
        <div className="relative z-10 space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck className="h-5 w-5 text-green-400" />
            <h3 className="text-lg font-semibold text-white">Data privacy</h3>
          </div>
          
          <p className="text-gray-300 text-sm leading-relaxed">
            BitBasis believes in transparent data practices. Learn how your information is protected when using BitBasis products, and visit our{' '}
            <a 
              href="/privacy" 
              className="text-bitcoin-orange hover:text-[#D4A76A] transition-colors duration-200 inline-flex items-center gap-1"
            >
              Privacy Policy
              <ExternalLink className="h-3 w-3" />
            </a>
            {' '}for more details.
          </p>

          <div className="pt-4">
            <h4 className="text-white font-medium mb-4">Export data</h4>
            <p className="text-gray-400 text-sm mb-4">
              Download a copy of all your data including transactions, CSV upload history, and account information.
            </p>
            <Button
              onClick={handleExportData}
              disabled={isExporting}
              className="bg-bitcoin-orange hover:bg-[#D4A76A] text-white"
            >
              {isExporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Exporting data...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Export data
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-red-900/20 via-red-800/30 to-red-900/20 p-6 shadow-md backdrop-blur-sm border border-red-800/50">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <InfoIcon className="h-5 w-5 text-red-400" />
            <h3 className="text-lg font-semibold text-white">Danger Zone</h3>
          </div>
          
          <Alert className="mb-4 bg-red-900/20 border-red-800/50">
            <AlertTitle className="text-red-300">Warning: Account Deletion</AlertTitle>
            <AlertDescription className="text-red-300">
              This action is irreversible. All your data, including transactions, uploads, and account information, will be permanently deleted.
            </AlertDescription>
          </Alert>

          <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="bg-red-600 hover:bg-red-700">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-gray-900 border-gray-700 max-w-2xl">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-white text-xl">Delete Account - This Cannot Be Undone</AlertDialogTitle>
                <AlertDialogDescription className="text-gray-300 space-y-4">
                  <div className="bg-red-900/20 border border-red-800/50 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-red-300 mb-2">Warning: Permanent Data Loss</p>
                        <p className="text-sm text-gray-300">
                          This action will permanently delete your account and all associated data. This cannot be undone.
                        </p>
                      </div>
                    </div>
                  </div>

                  {loadingSummary ? (
                    <div className="flex items-center gap-2 text-gray-400">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Loading account information...
                    </div>
                  ) : accountSummary && (
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-semibold text-white mb-2">Data That Will Be Deleted:</h4>
                        <ul className="list-disc list-inside space-y-1 text-sm text-gray-300">
                          <li>{accountSummary.transactionCount.toLocaleString()} transaction{accountSummary.transactionCount !== 1 ? 's' : ''}</li>
                          <li>{accountSummary.csvUploadCount} CSV upload{accountSummary.csvUploadCount !== 1 ? 's' : ''}</li>
                          <li>All account settings and preferences</li>
                          <li>All uploaded files and data</li>
                        </ul>
                      </div>

                      {accountSummary.subscription.hasActive && (
                        <div className="bg-red-900/30 border-2 border-red-800/70 rounded-lg p-4">
                          <div className="flex items-start gap-3">
                            <AlertTriangle className="h-6 w-6 text-red-400 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <p className="font-bold text-red-300 mb-2">Cancel Subscription Required</p>
                              <p className="text-sm text-gray-300 mb-3">
                                {accountSummary.subscription.type === 'lifetime' ? (
                                  <>
                                    You have an active <span className="font-semibold">lifetime subscription</span>. 
                                    You must cancel your subscription before you can delete your account.
                                  </>
                                ) : (
                                  <>
                                    You have an active <span className="font-semibold">{accountSummary.subscription.type} subscription</span>. 
                                    You must cancel your subscription before you can delete your account.
                                    {accountSummary.subscription.nextBillingDate && (
                                      <> Your next billing date is {new Date(accountSummary.subscription.nextBillingDate).toLocaleDateString()}.</>
                                    )}
                                  </>
                                )}
                              </p>
                              <Button
                                onClick={() => {
                                  setDeleteDialogOpen(false)
                                  // Scroll to subscription section or open subscription modal
                                  setTimeout(() => {
                                    const subscriptionSection = document.querySelector('[data-subscription-section]')
                                    if (subscriptionSection) {
                                      subscriptionSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
                                    }
                                  }, 100)
                                }}
                                className="bg-red-600 hover:bg-red-700 text-white text-sm"
                              >
                                Go to Subscription Settings
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="bg-blue-900/20 border border-blue-800/50 rounded-lg p-3">
                        <p className="text-sm text-gray-300">
                          <strong className="text-blue-300">Recommendation:</strong> Export your data before deleting your account. 
                          You can use the &quot;Export data&quot; button above to download all your information.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="pt-4 border-t border-gray-700">
                    <label htmlFor="confirm-delete" className="block text-sm font-medium text-white mb-2">
                      Type <span className="font-mono font-bold text-red-400">DELETE</span> to confirm:
                    </label>
                    <Input
                      id="confirm-delete"
                      type="text"
                      value={confirmationText}
                      onChange={(e) => setConfirmationText(e.target.value)}
                      placeholder="DELETE"
                      className="bg-gray-800/30 border-gray-600/50 text-white placeholder:text-gray-500 font-mono"
                      disabled={isDeleting}
                      autoFocus
                    />
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel 
                  className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700"
                  disabled={isDeleting}
                  onClick={() => {
                    setConfirmationText("")
                    setDeleteDialogOpen(false)
                  }}
                >
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleDeleteAccount}
                  disabled={
                    isDeleting || 
                    confirmationText !== "DELETE" || 
                    (accountSummary?.subscription.hasActive ?? false)
                  }
                  className="bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeleting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Deleting...
                    </>
                  ) : (
                    'Yes, delete my account'
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  )
}

