import Link from "next/link"

export function Logo() {
  return (
    <Link href="/" className="flex items-center space-x-2">
      <div className="w-8 h-8 rounded-full bg-bitcoin-orange flex items-center justify-center">
        <span className="text-black font-bold">₿</span>
      </div>
      <span className="font-bold text-xl text-white">BitBasis</span>
    </Link>
  )
}

