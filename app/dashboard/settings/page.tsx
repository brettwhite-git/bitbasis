'use client'

import { useState } from 'react'
import { AccountSettings } from "@/components/settings/account-settings"
import { PrivacySettings } from "@/components/settings/privacy-settings"
import { CostBasisSettings } from "@/components/settings/cost-basis-settings"
import { ManageFilesSettings } from "@/components/settings/manage-files"
import { ResourcesSettings } from "@/components/settings/resources-settings"

type SettingsSection = 'account' | 'privacy' | 'costBasis' | 'files' | 'resources' // Add more sections as needed

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<SettingsSection>('account')

  const renderSection = () => {
    switch (activeSection) {
      case 'account':
        return <AccountSettings />
      case 'privacy':
        return <PrivacySettings />
      case 'costBasis':
        return <CostBasisSettings />
      case 'files':
        return <ManageFilesSettings />
      case 'resources':
        return <ResourcesSettings />
      default:
        return <AccountSettings />
    }
  }

  const menuItems = [
    { id: 'account', label: 'Account' },
    { id: 'privacy', label: 'Privacy' },
    { id: 'costBasis', label: 'Cost Basis' },
    { id: 'files', label: 'Manage Files' },
    { id: 'resources', label: 'Resources' },
  ]

  return (
    <div className="flex min-h-screen w-full flex-col bg-background"> 
      <main className="flex min-h-[calc(100vh_-_theme(spacing.16))] flex-1 flex-col gap-4 p-4 md:gap-8 md:p-10 bg-background">
        <div className="mx-auto grid w-full max-w-6xl items-start gap-6">
          <h1 className="text-3xl font-semibold text-foreground">Settings</h1>
        </div>
        <div className="mx-auto grid w-full max-w-6xl items-start gap-6 md:grid-cols-[180px_1fr] lg:grid-cols-[250px_1fr]">
          <nav className="grid gap-4 text-sm">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id as SettingsSection)}
                className={`text-left px-4 py-2 rounded-md transition-colors ${
                  activeSection === item.id 
                    ? 'border border-primary text-primary bg-background shadow-sm' // Active state matches orange-outline button
                    : 'text-muted-foreground hover:text-primary hover:border hover:border-primary/70 hover:bg-primary/5' // Default with similar hover effect
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
          <div className="grid gap-6">
            {renderSection()} 
          </div>
        </div>
      </main>
    </div>
  )
}

