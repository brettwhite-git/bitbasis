"use client"

import React, { createContext, useContext, useState, ReactNode } from 'react'

export type TaxMethod = 'fifo' | 'lifo' | 'hifo'

interface TaxMethodContextType {
  taxMethod: TaxMethod
  setTaxMethod: (method: TaxMethod) => void
}

const TaxMethodContext = createContext<TaxMethodContextType | undefined>(undefined)

interface TaxMethodProviderProps {
  children: ReactNode
}

export function TaxMethodProvider({ children }: TaxMethodProviderProps) {
  const [taxMethod, setTaxMethod] = useState<TaxMethod>('fifo') // Default to FIFO

  return (
    <TaxMethodContext.Provider value={{ taxMethod, setTaxMethod }}>
      {children}
    </TaxMethodContext.Provider>
  )
}

export function useTaxMethod() {
  const context = useContext(TaxMethodContext)
  if (context === undefined) {
    throw new Error('useTaxMethod must be used within a TaxMethodProvider')
  }
  return context
} 