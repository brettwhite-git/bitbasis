'use client'

import { useEffect, useRef } from 'react'

// CSS animation classes for scroll-triggered effects
// These correspond to the keyframes defined in tailwind.config.js
export const animationClasses = {
  fadeInUp: 'animate-fade-in-up',
  fadeIn: 'animate-fade-in',
  slideInLeft: 'animate-slide-in-left',
  slideInRight: 'animate-slide-in-right',
  scaleIn: 'animate-scale-in',
}

// Hook to animate elements when they scroll into view
export function useScrollAnimation<T extends HTMLElement = HTMLDivElement>(threshold = 0.1) {
  const ref = useRef<T>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    // Start with element invisible and moved down
    element.style.opacity = '0'
    element.style.transform = 'translateY(60px)'

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry && entry.isIntersecting) {
          // Trigger the animation by adding the class
          element.classList.add('animate-fade-in-up')
          // Remove inline styles to let animation take over
          element.style.opacity = ''
          element.style.transform = ''
          observer.unobserve(element)
        }
      },
      { threshold }
    )

    observer.observe(element)

    return () => observer.disconnect()
  }, [threshold])

  return ref
}
