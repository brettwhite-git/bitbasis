"use client"

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { EditTransactionForm } from "./edit-transaction-form"
import { useEditDrawer } from "./edit-drawer-provider"
import { useEffect, useState } from "react"

export function EditTransactionDrawer() {
  const { isOpen, closeDrawer, transaction } = useEditDrawer()
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return (
    <Sheet open={isOpen} onOpenChange={closeDrawer}>
      <SheetContent
        side={isMobile ? "bottom" : "left"}
        className={`bg-gradient-to-br from-gray-900/60 via-gray-900/80 to-gray-900/60 border-gray-700/50 overflow-y-auto z-50 ${
          isMobile
            ? "w-full h-[90vh] rounded-t-xl p-4"
            : "w-full max-w-sm sm:max-w-md lg:max-w-lg p-4 sm:p-6"
        } [&>button]:text-gray-400 [&>button]:hover:text-white [&>button]:hover:bg-gray-700/50`}
      >
        <SheetHeader className="pb-4 sm:pb-6">
          <SheetTitle className="text-lg sm:text-xl font-semibold text-white">
            Edit Transaction
          </SheetTitle>
          <SheetDescription className="text-sm sm:text-base text-gray-400">
            {transaction && (
              <>
                {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)} transaction from{' '}
                {new Date(transaction.date).toLocaleDateString()}
              </>
            )}
          </SheetDescription>
        </SheetHeader>
        
        {transaction && (
          <EditTransactionForm transaction={transaction} />
        )}
      </SheetContent>
    </Sheet>
  )
} 