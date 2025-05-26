import { ReactNode } from "react"

interface EnhancedCardBaseProps {
  title: string
  value: ReactNode
  subtitle?: ReactNode
  className?: string
}

export function EnhancedCardBase({ title, value, subtitle, className }: EnhancedCardBaseProps) {
  return (
    <div className={`relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-800/20 via-gray-900/30 to-gray-800/20 p-6 shadow-md backdrop-blur-sm ${className || ''}`}>
      <div className="relative z-10 flex flex-col h-full">
        <h3 className="text-sm font-medium text-gray-400 mb-2">{title}</h3>
        <div className="text-2xl font-bold text-bitcoin-orange mb-1">
          {value}
        </div>
        {subtitle && (
          <p className="text-xs text-gray-400">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  )
} 