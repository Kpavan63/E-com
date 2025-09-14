'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useStore } from '@/store/useStore'
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, ArrowLeft } from 'lucide-react'

export default function CartPage() {
  const { cartItems, cartTotal, cartCount, updateCartQuantity, removeFromCart } = useStore()

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      removeFromCart(itemId)
    } else {
      updateCartQuantity(itemId, newQuantity)
    }
  }

  if (cartItems.length === 0) {
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
                  Back to Shopping
                </Link>
                <h1 className="text-xl font-bold text-white">Shopping Cart</h1>
                <div></div>
              </div>
            </div>
          </header>

          <div className="max-w-4xl mx-auto px-4 py-16 text-center">
            <div className="bg-black/40 backdrop-blur-lg border border-green-500/30 rounded-none p-12">
              <ShoppingBag className="w-24 h-24 text-green-400/60 mx-auto mb-6" />
              <h1 className="text-3xl font-bold text-white mb-4">Your cart is empty</h1>
              <p className="text-white/70 mb-8 text-lg">
                Looks like you haven&apos;t added any items to your cart yet.
              </p>
              <Link
                href="/"
                className="inline-flex items-center bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-3 rounded-none font-semibold hover:from-green-700 hover:to-emerald-700 transition-colors border border-green-500/50"
              >
                Continue Shopping
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
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
                Back to Shopping
              </Link>
              <h1 className="text-xl font-bold text-white">Shopping Cart</h1>
              <div></div>
            </div>
          </div>
        </header>
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white">Shopping Cart</h1>
            <p className="text-white/70 mt-2">{cartCount} {cartCount === 1 ? 'item' : 'items'} in your cart</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <div className="bg-black/40 backdrop-blur-lg border border-green-500/30 rounded-none overflow-hidden">
                <div className="divide-y divide-green-500/20">
                  {cartItems.map((item) => {
                    const itemPrice = item.product.base_price + (item.variant.price_adjustment || 0)
                    const itemTotal = itemPrice * item.quantity

                    return (
                      <div key={item.id} className="p-6">
                        <div className="flex items-center space-x-4">
                          {/* Product Image */}
                          <div className="flex-shrink-0 w-24 h-24 bg-black/60 border border-green-500/30 rounded-none overflow-hidden">
                            <Image
                              src={item.product.image_url || '/api/placeholder/96/96'}
                              alt={item.product.name}
                              width={96}
                              height={96}
                              className="w-full h-full object-cover"
                            />
                          </div>

                          {/* Product Details */}
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold text-white mb-1">
                              {item.product.name}
                            </h3>
                            <p className="text-white/70 mb-2">
                              Color: <span className="capitalize">{item.variant.color}</span> • Size: {item.variant.size}
                            </p>
                            <p className="text-lg font-bold text-green-400">
                              ₹{itemPrice.toFixed(2)}
                            </p>
                          </div>

                          {/* Quantity Controls */}
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center border border-green-500/30 rounded-none">
                              <button
                                onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                                className="p-2 text-white/80 hover:text-green-400 hover:bg-green-500/20 transition-colors"
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <span className="px-4 py-2 font-medium min-w-[3rem] text-center text-white">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                                className="p-2 text-white/80 hover:text-green-400 hover:bg-green-500/20 transition-colors"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>

                            {/* Remove Button */}
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-none border border-red-500/30 hover:border-red-400/50 transition-colors"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>

                          {/* Item Total */}
                          <div className="text-right">
                            <p className="text-lg font-bold text-green-400">
                              ₹{itemTotal.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-black/40 backdrop-blur-lg border border-green-500/30 rounded-none p-6 sticky top-8">
                <h2 className="text-xl font-semibold text-white mb-6">Order Summary</h2>
                
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-white/70">
                    <span>Subtotal ({cartCount} items)</span>
                    <span>₹{cartTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-white/70">
                    <span>Shipping</span>
                    <span className="text-green-400 font-medium">Free</span>
                  </div>
                  <div className="flex justify-between text-white/70">
                    <span>Tax</span>
                    <span>₹0.00</span>
                  </div>
                  <div className="border-t border-green-500/20 pt-4">
                    <div className="flex justify-between text-lg font-bold text-white">
                      <span>Total</span>
                      <span className="text-green-400">₹{cartTotal.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <Link
                  href="/checkout"
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 px-4 rounded-none font-semibold hover:from-green-700 hover:to-emerald-700 transition-colors flex items-center justify-center border border-green-500/50 mb-4"
                >
                  Proceed to Checkout
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>

                <Link
                  href="/"
                  className="w-full bg-black/60 border border-green-500/30 text-white/80 py-3 px-4 rounded-none font-semibold hover:bg-green-500/20 hover:text-green-400 transition-colors flex items-center justify-center"
                >
                  Continue Shopping
                </Link>

                {/* Payment Info */}
                <div className="mt-6 p-4 bg-green-500/20 border border-green-500/30 rounded-none">
                  <h3 className="font-medium text-green-400 mb-2">Payment Options</h3>
                  <p className="text-sm text-white/80">
                    • Cash on Delivery available
                  </p>
                  <p className="text-sm text-white/80">
                    • Free delivery on all orders
                  </p>
                  <p className="text-sm text-white/80">
                    • 7-day return policy
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}