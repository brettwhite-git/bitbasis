"use client"

import { createContext, useContext, useState, ReactNode, useCallback, useMemo } from 'react'
import { UnifiedTransaction } from '@/types/transactions'

interface EditDrawerState {
  isOpen: boolean
  transaction: UnifiedTransaction | null
  isDirty: boolean
  isLoading: boolean
}

interface EditDrawerContextType extends EditDrawerState {
  openDrawer: (transaction: UnifiedTransaction) => void
  closeDrawer: () => void
  setIsDirty: (dirty: boolean) => void
  setIsLoading: (loading: boolean) => void
  updateTransaction: (updates: Partial<UnifiedTransaction>) => void
}

const EditDrawerContext = createContext<EditDrawerContextType | undefined>(undefined)

interface EditDrawerProviderProps {
  children: ReactNode
}

export function EditDrawerProvider({ children }: EditDrawerProviderProps) {
  const [state, setState] = useState<EditDrawerState>({
    isOpen: false,
    transaction: null,
    isDirty: false,
    isLoading: false,
  })

  const openDrawer = useCallback((transaction: UnifiedTransaction) => {
    setState({
      isOpen: true,
      transaction,
      isDirty: false,
      isLoading: false,
    })
  }, [])

  const closeDrawer = useCallback(() => {
    setState(prev => ({
      ...prev,
      isOpen: false,
      transaction: null,
      isDirty: false,
      isLoading: false,
    }))
  }, [])

  const setIsDirty = useCallback((dirty: boolean) => {
    setState(prev => ({ ...prev, isDirty: dirty }))
  }, [])

  const setIsLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, isLoading: loading }))
  }, [])

  const updateTransaction = useCallback((updates: Partial<UnifiedTransaction>) => {
    setState(prev => ({
      ...prev,
      transaction: prev.transaction ? { ...prev.transaction, ...updates } : null,
      isDirty: true,
    }))
  }, [])

  const value: EditDrawerContextType = useMemo(() => ({
    ...state,
    openDrawer,
    closeDrawer,
    setIsDirty,
    setIsLoading,
    updateTransaction,
  }), [state, openDrawer, closeDrawer, setIsDirty, setIsLoading, updateTransaction])

  return (
    <EditDrawerContext.Provider value={value}>
      {children}
    </EditDrawerContext.Provider>
  )
}

export function useEditDrawer() {
  const context = useContext(EditDrawerContext)
  if (context === undefined) {
    throw new Error('useEditDrawer must be used within an EditDrawerProvider')
  }
  return context
} 