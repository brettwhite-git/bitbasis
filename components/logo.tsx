import Link from "next/link"
import Image from "next/image"

export function Logo() {
  return (
    <Link href="/" className="flex items-center space-x-2">
      <div className="w-8 h-8 rounded-full bg-bitcoin-orange flex items-center justify-center">
        <Image
          src="/bitcoin_svg.svg"
          alt="Bitcoin Logo"
          width={20}
          height={20}
          className="brightness-0"
        />
      </div>
      <span className="font-bold text-xl text-white">BitBasis</span>
    </Link>
  )
}

