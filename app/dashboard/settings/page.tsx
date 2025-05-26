'use client'

import { useState } from 'react'
import { AccountSettings } from "@/components/settings/account-settings"
import { ManageFilesSettings } from "@/components/settings/manage-files"
import { ResourcesSettings } from "@/components/settings/resources-settings"

type SettingsSection = 'account' | 'files' | 'resources' // Add more sections as needed

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<SettingsSection>('account')

  const renderSection = () => {
    switch (activeSection) {
      case 'account':
        return <AccountSettings />
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
    { id: 'files', label: 'Manage Files' },
    { id: 'resources', label: 'Resources' },
  ]

  return (
    <div className="w-full max-w-7xl mx-auto px-4 md:px-6 lg:px-8 space-y-6">
      <div className="w-full">
        <h1 className="text-3xl font-bold tracking-tight text-white">Settings</h1>
        <p className="text-gray-400 mt-2">Manage your account preferences and data</p>
      </div>
      
      <div className="grid w-full gap-6 md:grid-cols-[250px_1fr] lg:grid-cols-[280px_1fr]">
        {/* Navigation Sidebar */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-800/20 via-gray-900/30 to-gray-800/20 p-6 shadow-md backdrop-blur-sm">
          <div className="relative z-10">
            <h3 className="text-lg font-semibold text-white mb-4">Navigation</h3>
            <nav className="space-y-2">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id as SettingsSection)}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-300 ${
                    activeSection === item.id 
                      ? 'bg-gradient-to-r from-bitcoin-orange to-[#D4A76A] text-white font-semibold shadow-md shadow-bitcoin-orange/30' 
                      : 'text-gray-300 hover:text-white hover:bg-gray-800/50 hover:shadow-sm'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content Area */}
        <div className="space-y-6 max-w-4xl">
          {renderSection()} 
        </div>
      </div>
    </div>
  )
}

