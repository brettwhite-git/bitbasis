'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/providers/supabase-auth-provider'
import { AccountSettings } from "@/components/settings/account-settings"
import { ManageFilesSettings } from "@/components/settings/manage-files"
import { ResourcesSettings } from "@/components/settings/resources-settings"

type SettingsSection = 'account' | 'files' | 'resources' // Add more sections as needed

export default function SettingsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  // Compute section from searchParams
  const sectionFromParams = useMemo(() => {
    const section = searchParams.get('section') as SettingsSection
    if (section && ['account', 'files', 'resources'].includes(section)) {
      return section
    }
    return null
  }, [searchParams])

  const [userSelectedSection, setUserSelectedSection] = useState<SettingsSection | null>(null)
  const prevSectionFromParams = useRef(sectionFromParams)

  // Reset user selection when URL params change
  if (prevSectionFromParams.current !== sectionFromParams) {
    prevSectionFromParams.current = sectionFromParams
    setUserSelectedSection(null)
  }

  const activeSection = userSelectedSection ?? sectionFromParams ?? 'account'
  const setActiveSection = setUserSelectedSection

  // Client-side protection (layout already protects server-side)
  useEffect(() => {
    // Layout-level requireAuth handles server-side protection
    if (!user) {
      router.push('/auth/sign-in')
    }
  }, [user, router])

  // Don't render until auth is confirmed
  if (!user) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

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

