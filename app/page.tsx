'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useStore } from '@/store/useStore'
import Header from './components/Header'
import ProductGrid from './components/ProductGrid'
import HeroSection from './components/HeroSection'
import Footer from './components/Footer'
import { Loader2 } from 'lucide-react'

export default function Home() {
  const router = useRouter()
  const { isAuthenticated, checkSessionExpiry } = useStore()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check session validity first
    const isValidSession = checkSessionExpiry()
    
    // Small delay to prevent flash
    const timer = setTimeout(() => {
      if (isValidSession && isAuthenticated) {
        router.push('/products')
      } else {
        setIsLoading(false)
      }
    }, 100)

    return () => clearTimeout(timer)
  }, [isAuthenticated, router, checkSessionExpiry])

  // Show loading state while checking authentication
  if (isLoading || isAuthenticated) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-green-400 mx-auto mb-4" />
          <p className="text-white/80">Loading...</p>
        </div>
      </div>
    )
  }
  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Background Gradient Elements */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Top Left Gradient */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-green-400/20 via-emerald-500/15 to-transparent rounded-full blur-3xl"></div>
        
        {/* Top Right Gradient */}
        <div className="absolute top-20 right-0 w-80 h-80 bg-gradient-to-bl from-lime-400/15 via-green-500/10 to-transparent rounded-full blur-2xl"></div>
        
        {/* Bottom Left Gradient */}
        <div className="absolute bottom-40 left-20 w-72 h-72 bg-gradient-to-tr from-emerald-600/20 via-green-400/15 to-transparent rounded-full blur-3xl"></div>
        
        {/* Bottom Right Gradient */}
        <div className="absolute bottom-0 right-20 w-96 h-96 bg-gradient-to-tl from-green-500/25 via-lime-400/15 to-transparent rounded-full blur-2xl"></div>
        
        {/* Center Gradients */}
        <div className="absolute top-1/3 left-1/3 w-64 h-64 bg-gradient-to-r from-green-300/10 to-emerald-400/10 rounded-full blur-xl"></div>
        <div className="absolute bottom-1/3 right-1/3 w-48 h-48 bg-gradient-to-l from-lime-500/15 to-green-400/10 rounded-full blur-2xl"></div>
      </div>

      <div className="relative z-10">
        <Header />
        
        <main>
          <HeroSection />
          <ProductGrid />
        </main>
        
        <Footer />
        
        {/* Mobile bottom padding to account for bottom navigation */}
        <div className="lg:hidden h-20"></div>
      </div>
    </div>
  )
}