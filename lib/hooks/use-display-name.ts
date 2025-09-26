"use client"

import { useState, useEffect, useCallback } from 'react'

const DISPLAY_NAME_KEY = 'bitbasis_display_name'
const STORAGE_EVENT_KEY = 'bitbasis_display_name_changed'

export function useDisplayName() {
  const [displayName, setDisplayNameState] = useState<string>('')
  const [isLoaded, setIsLoaded] = useState(false)

  // Load display name from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(DISPLAY_NAME_KEY)
      if (stored) {
        setDisplayNameState(stored)
      }
    } catch (error) {
      console.warn('Failed to load display name from localStorage:', error)
    } finally {
      setIsLoaded(true)
    }
  }, [])

  // Listen for display name changes from other components
  useEffect(() => {
    const handleStorageChange = () => {
      try {
        const stored = localStorage.getItem(DISPLAY_NAME_KEY)
        setDisplayNameState(stored || '')
      } catch (error) {
        console.warn('Failed to sync display name from storage:', error)
      }
    }

    // Listen for custom storage events
    window.addEventListener(STORAGE_EVENT_KEY, handleStorageChange)
    
    return () => {
      window.removeEventListener(STORAGE_EVENT_KEY, handleStorageChange)
    }
  }, [])

  // Update display name and persist to localStorage
  const setDisplayName = useCallback((name: string) => {
    try {
      setDisplayNameState(name)
      if (name.trim()) {
        localStorage.setItem(DISPLAY_NAME_KEY, name.trim())
      } else {
        localStorage.removeItem(DISPLAY_NAME_KEY)
      }
      
      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent(STORAGE_EVENT_KEY))
    } catch (error) {
      console.warn('Failed to save display name to localStorage:', error)
    }
  }, [])

  // Clear display name
  const clearDisplayName = useCallback(() => {
    try {
      setDisplayNameState('')
      localStorage.removeItem(DISPLAY_NAME_KEY)
      
      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent(STORAGE_EVENT_KEY))
    } catch (error) {
      console.warn('Failed to clear display name from localStorage:', error)
    }
  }, [])

  return {
    displayName,
    setDisplayName,
    clearDisplayName,
    isLoaded,
  }
}
