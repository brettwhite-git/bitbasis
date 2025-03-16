import { Bitcoin } from "lucide-react"
import Link from "next/link"

export function Logo() {
  return (
    <Link href="/" className="flex items-center space-x-2">
      <div className="relative h-8 w-8 overflow-hidden">
        <Bitcoin className="h-8 w-8 text-bitcoin-orange" />
      </div>
      <span className="font-bold text-xl text-white">BitBasis</span>
    </Link>
  )
}

