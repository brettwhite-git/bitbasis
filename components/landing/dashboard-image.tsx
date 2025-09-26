'use client'

import Image from "next/image"
import { useState } from "react"

interface DashboardImageProps {
  className?: string
}

export function DashboardImage({ className }: DashboardImageProps) {
  const [isLoading, setIsLoading] = useState(true)

  return (
    <div className={`relative ${className}`}>
      {/* Loading skeleton */}
      {isLoading && (
        <div className="absolute inset-0 bg-gradient-to-r from-gray-800/50 via-gray-700/30 to-gray-800/50 animate-pulse rounded-lg" />
      )}
      
      {/* Optimized dashboard image with multiple formats */}
      <picture>
        {/* WebP sources for different screen sizes */}
        <source
          media="(max-width: 640px)"
          srcSet="/dashboard-render-sm.webp"
          type="image/webp"
        />
        <source
          media="(max-width: 1024px)"
          srcSet="/dashboard-render-md.webp"
          type="image/webp"
        />
        <source
          media="(max-width: 1600px)"
          srcSet="/dashboard-render-lg.webp"
          type="image/webp"
        />
        <source
          srcSet="/dashboard-render.webp"
          type="image/webp"
        />
        
        {/* Fallback to original JPEG */}
        <Image 
          src="/dashboard-render.jpg" 
          alt="BitBasis Dashboard Preview - Bitcoin Portfolio Tracking Interface showing portfolio value, cost basis, unrealized gains, and performance metrics" 
          width={2000}
          height={1200}
          className={`w-full h-auto transition-opacity duration-300 ${
            isLoading ? 'opacity-0' : 'opacity-100'
          }`}
          priority
          placeholder="blur"
          blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, (max-width: 1600px) 85vw, 80vw"
          onLoad={() => setIsLoading(false)}
          quality={90}
        />
      </picture>
    </div>
  )
}
