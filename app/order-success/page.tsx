'use client'

import { useEffect, useState, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, Package, Truck, Mail, Home, ShoppingBag, ArrowLeft } from 'lucide-react'

function OrderSuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const orderNumber = searchParams.get('order')
  const [countdown, setCountdown] = useState(10)
  const redirectTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!orderNumber) {
      router.push('/')
      return
    }

    // Countdown timer for auto-redirect
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          // Use setTimeout to avoid setState during render
          redirectTimeoutRef.current = setTimeout(() => {
            router.push('/')
          }, 0)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      clearInterval(timer)
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current)
      }
    }
  }, [orderNumber, router])

  if (!orderNumber) {
    return null
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Background Gradient Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-green-400/10 via-emerald-500/5 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-gradient-to-tl from-green-500/15 via-lime-400/10 to-transparent rounded-full blur-2xl"></div>
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="bg-black/80 backdrop-blur-lg border-b border-green-500/20 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <Link
                href="/"
                className="flex items-center text-white/80 hover:text-green-400 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Home
              </Link>
              <h1 className="text-xl font-bold text-white">Order Success</h1>
              <div></div>
            </div>
          </div>
        </header>
        
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            {/* Success Icon */}
            <div className="mx-auto flex items-center justify-center w-20 h-20 bg-green-500/20 border border-green-500/30 rounded-none mb-8">
              <CheckCircle className="w-12 h-12 text-green-400" />
            </div>

            {/* Success Message */}
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Order Placed Successfully!
            </h1>
            <p className="text-lg text-white/80 mb-2">
              Thank you for your order. We&apos;ve received your order and will process it shortly.
            </p>
            <p className="text-sm text-white/60 mb-8">
              Order Number: <span className="font-semibold text-green-400">{orderNumber}</span>
            </p>

            {/* Order Details Card */}
            <div className="bg-black/40 backdrop-blur-lg border border-green-500/30 rounded-none p-8 mb-8 text-left max-w-2xl mx-auto">
              <h2 className="text-xl font-semibold text-white mb-6">What happens next?</h2>
              
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-500/20 border border-green-500/30 rounded-none flex items-center justify-center">
                    <Mail className="w-4 h-4 text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-white">Order Confirmation Email</h3>
                    <p className="text-white/70 text-sm">
                      You&apos;ll receive an email confirmation with your order details shortly.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-yellow-500/20 border border-yellow-500/30 rounded-none flex items-center justify-center">
                    <Package className="w-4 h-4 text-yellow-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-white">Order Processing</h3>
                    <p className="text-white/70 text-sm">
                      We&apos;ll prepare your order within 1-2 business days.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-500/20 border border-green-500/30 rounded-none flex items-center justify-center">
                    <Truck className="w-4 h-4 text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-white">Delivery</h3>
                    <p className="text-white/70 text-sm">
                      Your order will be delivered within 3-7 business days. Payment on delivery.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <Link
                href="/orders"
                className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-3 rounded-none font-semibold hover:from-green-700 hover:to-emerald-700 transition-colors flex items-center border border-green-500/50"
              >
                <Package className="w-5 h-5 mr-2" />
                Track Your Orders
              </Link>
              
              <Link
                href="/"
                className="bg-black/60 border border-green-500/30 text-white/80 px-8 py-3 rounded-none font-semibold hover:bg-green-500/20 hover:text-green-400 transition-colors flex items-center"
              >
                <ShoppingBag className="w-5 h-5 mr-2" />
                Continue Shopping
              </Link>
            </div>

            {/* Auto-redirect Notice */}
            <div className="bg-green-500/20 border border-green-500/30 rounded-none p-4 max-w-md mx-auto">
              <p className="text-green-400 text-sm">
                <Home className="w-4 h-4 inline mr-1" />
                Redirecting to homepage in <span className="font-semibold">{countdown}</span> seconds
              </p>
            </div>
          </div>

          {/* Additional Information */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="bg-black/40 backdrop-blur-lg border border-green-500/30 rounded-none p-6">
              <div className="w-12 h-12 bg-green-500/20 border border-green-500/30 rounded-none flex items-center justify-center mx-auto mb-4">
                <Truck className="w-6 h-6 text-green-400" />
              </div>
              <h3 className="font-semibold text-white mb-2">Free Delivery</h3>
              <p className="text-white/70 text-sm">
                No delivery charges on cash on delivery orders
              </p>
            </div>

            <div className="bg-black/40 backdrop-blur-lg border border-green-500/30 rounded-none p-6">
              <div className="w-12 h-12 bg-green-500/20 border border-green-500/30 rounded-none flex items-center justify-center mx-auto mb-4">
                <Package className="w-6 h-6 text-green-400" />
              </div>
              <h3 className="font-semibold text-white mb-2">Quality Assured</h3>
              <p className="text-white/70 text-sm">
                All products are quality checked before dispatch
              </p>
            </div>

            <div className="bg-black/40 backdrop-blur-lg border border-green-500/30 rounded-none p-6">
              <div className="w-12 h-12 bg-green-500/20 border border-green-500/30 rounded-none flex items-center justify-center mx-auto mb-4">
                <Mail className="w-6 h-6 text-green-400" />
              </div>
              <h3 className="font-semibold text-white mb-2">Order Updates</h3>
              <p className="text-white/70 text-sm">
                Get real-time updates via email notifications
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-green-400/10 via-emerald-500/5 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-gradient-to-tl from-green-500/15 via-lime-400/10 to-transparent rounded-full blur-2xl"></div>
      </div>

      <div className="relative z-10">
        <header className="bg-black/80 backdrop-blur-lg border-b border-green-500/20 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <Link
                href="/"
                className="flex items-center text-white/80 hover:text-green-400 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Home
              </Link>
              <h1 className="text-xl font-bold text-white">Order Success</h1>
              <div></div>
            </div>
          </div>
        </header>
        
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center w-20 h-20 bg-green-500/20 border border-green-500/30 rounded-none mb-8">
              <CheckCircle className="w-12 h-12 text-green-400" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Loading Order Details...
            </h1>
            <p className="text-lg text-white/80">
              Please wait while we prepare your order confirmation.
            </p>
          </div>
        </main>
      </div>
    </div>
  )
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <OrderSuccessContent />
    </Suspense>
  )
}