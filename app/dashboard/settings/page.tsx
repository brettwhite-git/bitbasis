'use client'

import { useState } from 'react'
import { AccountSettings } from "@/components/settings/account-settings"
import { PrivacySettings } from "@/components/settings/privacy-settings"
// Assuming you have a CostBasisSettings component, import it here
// import { CostBasisSettings } from "@/components/settings/cost-basis-settings"; 

type SettingsSection = 'account' | 'privacy' | 'costBasis' // Add more sections as needed

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<SettingsSection>('account')

  const renderSection = () => {
    switch (activeSection) {
      case 'account':
        return <AccountSettings />
      case 'privacy':
        return <PrivacySettings />
      // case 'costBasis':
      //   return <CostBasisSettings />;
      default:
        return <AccountSettings />
    }
  }

  const menuItems = [
    { id: 'account', label: 'Account' },
    { id: 'privacy', label: 'Privacy' },
    // { id: 'costBasis', label: 'Cost Basis' }, // Uncomment when component is ready
  ]

  return (
    // Using dark slate for the main background
    <div className="flex min-h-screen w-full flex-col dark:bg-slate-950"> 
      <main className="flex min-h-[calc(100vh_-_theme(spacing.16))] flex-1 flex-col gap-4 bg-muted/40 p-4 md:gap-8 md:p-10 dark:bg-slate-950">
        <div className="mx-auto grid w-full max-w-6xl items-start gap-6">
          <h1 className="text-3xl font-semibold text-white">Settings</h1>
        </div>
        <div className="mx-auto grid w-full max-w-6xl items-start gap-6 md:grid-cols-[180px_1fr] lg:grid-cols-[250px_1fr]">
          <nav className="grid gap-4 text-sm text-muted-foreground" x-chunk="dashboard-04-chunk-0">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id as SettingsSection)}
                // Improved styling for clarity
                className={`text-left px-3 py-2 rounded-md transition-colors ${
                  activeSection === item.id 
                    ? 'font-semibold text-primary dark:text-orange-500 bg-muted dark:bg-gray-800' // Active state background kept gray for contrast
                    : 'text-muted-foreground dark:text-gray-400 hover:text-primary dark:hover:text-orange-400 dark:hover:bg-gray-800/50' // Default and hover state
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
          <div className="grid gap-6">
            {/* Render the active component */} 
            {renderSection()} 
          </div>
        </div>
      </main>
    </div>
  )
}

