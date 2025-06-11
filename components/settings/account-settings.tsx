"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
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
import { CheckCircle, ShieldCheck, InfoIcon, Trash2 } from "lucide-react"
import { SubscriptionManagement } from "./SubscriptionManagement"
import { useAuth } from "@/providers/supabase-auth-provider"
import { useTaxMethod } from "@/providers/tax-method-provider"
import { useToast } from "@/lib/hooks/use-toast"

// Form schema for account settings
const accountSettingsSchema = z.object({
  taxMethod: z.enum(["fifo", "lifo", "hifo"], {
    required_error: "Please select a cost basis method.",
  }),
  encryptNotes: z.boolean().default(true),
  storeCsv: z.boolean().default(true),
  analytics: z.boolean().default(false),
})

type AccountSettingsFormValues = z.infer<typeof accountSettingsSchema>

export function AccountSettings() {
  const { user } = useAuth()
  const { taxMethod, setTaxMethod } = useTaxMethod()
  const { toast } = useToast()
  const [isDeleting, setIsDeleting] = useState(false)

  // Initialize form with current values
  const form = useForm<AccountSettingsFormValues>({
    resolver: zodResolver(accountSettingsSchema),
    defaultValues: {
      taxMethod: taxMethod as "fifo" | "lifo" | "hifo",
      encryptNotes: true,
      storeCsv: true,
      analytics: false,
    },
  })

  // Auto-save function
  const handleFormChange = async (values: AccountSettingsFormValues) => {
    try {
      // Update tax method if it changed
      if (values.taxMethod !== taxMethod) {
        setTaxMethod(values.taxMethod)
        toast({
          title: "Settings Updated",
          description: "Your cost basis method has been updated.",
        })
      }

      // Here you would typically save other settings to your backend
      // For now, we'll just show a toast for other changes
      console.log("Form values updated:", values)
    } catch {
      toast({
        title: "Error",
        description: "Failed to update settings. Please try again.",
        variant: "destructive",
      })
    }
  }
  
  // Handle account deletion
  const handleDeleteAccount = async () => {
    setIsDeleting(true)
    try {
      // Add your account deletion logic here
      await new Promise(resolve => setTimeout(resolve, 2000)) // Simulate API call
      
      toast({
        title: "Account Deleted",
        description: "Your account has been permanently deleted.",
      })
      
      // Redirect or sign out user
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete account. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="grid gap-6">
      {/* Email Section - Read Only */}
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

      {/* Subscription Section - Keep existing component */}
      <SubscriptionManagement />

      {/* Account Settings Form */}
      <Form {...form}>
        <form 
          onChange={() => {
            // Debounced auto-save
            const timeoutId = setTimeout(() => {
              const values = form.getValues()
              handleFormChange(values)
            }, 1000)
            return () => clearTimeout(timeoutId)
          }}
          className="space-y-6"
        >
          {/* Cost Basis Method Section */}
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-800/20 via-gray-900/30 to-gray-800/20 p-6 shadow-md backdrop-blur-sm">
            <div className="relative z-10 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Cost Basis Method</h3>
                <p className="text-gray-400 text-sm">
                  Select your preferred method for showing your tax liability in the overview dashboard.
                </p>
              </div>
              
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
          </div>

          {/* Privacy Settings Section */}
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-800/20 via-gray-900/30 to-gray-800/20 p-6 shadow-md backdrop-blur-sm">
            <div className="relative z-10 space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <ShieldCheck className="h-5 w-5 text-green-400" />
                <h3 className="text-lg font-semibold text-white">Privacy & Security</h3>
              </div>
              
              <div className="space-y-6">
                <FormField
                  control={form.control}
                  name="encryptNotes"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border border-gray-600/50 p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base text-white">
                          Encrypt Transaction Notes
                        </FormLabel>
                        <FormDescription className="text-gray-400">
                          Automatically encrypt your transaction notes for enhanced privacy.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="storeCsv"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border border-gray-600/50 p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base text-white">
                          Store CSV Files
                        </FormLabel>
                        <FormDescription className="text-gray-400">
                          Keep uploaded CSV files for re-import and backup purposes.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="analytics"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border border-gray-600/50 p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base text-white">
                          Anonymous Analytics
                        </FormLabel>
                        <FormDescription className="text-gray-400">
                          Help improve BitBasis by sharing anonymous usage data.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </div>
        </form>
      </Form>

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

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="bg-red-600 hover:bg-red-700">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-gray-900 border-gray-700">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-white">Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription className="text-gray-300">
                  This action cannot be undone. This will permanently delete your account and remove all your data from our servers.
                  <br /><br />
                  <span className="font-bold text-red-400">
                    All transactions, CSV uploads, and account settings will be lost forever.
                  </span>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleDeleteAccount}
                  disabled={isDeleting}
                  className="bg-red-600 text-white hover:bg-red-700"
                >
                  {isDeleting ? 'Deleting...' : 'Yes, delete my account'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  )
}

