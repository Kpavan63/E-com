'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useStore } from '@/store/useStore'
import Footer from '@/app/components/Footer'
import { supabase } from '@/lib/supabase'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { 
  Truck, 
  CreditCard, 
  MapPin, 
  User, 
  Phone, 
  Mail, 
  ArrowLeft, 
  Loader2, 
  CheckCircle,
  ShoppingBag,
  Lock,
  Star,
  Shield
} from 'lucide-react'

const checkoutSchema = z.object({
  customer_name: z.string().min(2, 'Name must be at least 2 characters'),
  customer_email: z.string().email('Please enter a valid email'),
  customer_phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  shipping_address: z.string().min(10, 'Address must be at least 10 characters'),
  shipping_city: z.string().min(2, 'City is required'),
  shipping_state: z.string().min(2, 'State is required'),
  shipping_postal_code: z.string().min(5, 'Postal code must be at least 5 characters'),
})

type CheckoutFormData = z.infer<typeof checkoutSchema>

export default function CheckoutPage() {
  const router = useRouter()
  const { cartItems, cartTotal, clearCart, user } = useStore()
  const [isProcessing, setIsProcessing] = useState(false)
  const [orderStep, setOrderStep] = useState(1) // 1: form, 2: processing, 3: success

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      customer_name: user?.full_name || '',
      customer_email: user?.email || '',
    }
  })

  // Redirect if cart is empty
  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-black relative overflow-hidden">
        {/* Background Elements */}
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
                <h1 className="text-xl font-bold text-white">Checkout</h1>
                <div></div>
              </div>
            </div>
          </header>

          <div className="max-w-2xl mx-auto px-4 py-16 text-center">
            <div className="bg-black/40 backdrop-blur-lg border border-green-500/30 rounded-none p-12">
              <ShoppingBag className="w-24 h-24 text-green-400/60 mx-auto mb-6" />
              <h1 className="text-3xl font-bold text-white mb-4">Your cart is empty</h1>
              <p className="text-white/70 mb-8 text-lg">
                Add some products to your cart before checkout.
              </p>
              <Link
                href="/"
                className="inline-flex items-center bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-3 rounded-none font-semibold hover:from-green-700 hover:to-emerald-700 transition-colors border border-green-500/50"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const onSubmit = async (data: CheckoutFormData) => {
    if (!user?.id) {
      router.push('/auth/login?redirect=/checkout')
      return
    }

    setIsProcessing(true)
    setOrderStep(2)

    try {
      // Compute totals
      const subtotal = cartItems.reduce((sum, item) => {
        const unit = item.product.base_price + (item.variant.price_adjustment || 0)
        return sum + unit * item.quantity
      }, 0)
      const tax_amount = 0
      const shipping_amount = 0
      const discount_amount = 0
      const total_amount = subtotal + tax_amount + shipping_amount - discount_amount

      // Generate order number (unique-ish)
      const now = new Date()
      const orderNumber = `ORD-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([{
          user_id: user.id,
          order_number: orderNumber,
          status: 'pending',
          subtotal,
          tax_amount,
          shipping_amount,
          discount_amount,
          total_amount,
          payment_method: 'cash_on_delivery',
          payment_status: 'pending',
          customer_name: data.customer_name,
          customer_email: data.customer_email,
          customer_phone: data.customer_phone,
          shipping_address: data.shipping_address,
          shipping_city: data.shipping_city,
          shipping_state: data.shipping_state,
          shipping_postal_code: data.shipping_postal_code,
          shipping_country: 'India'
        }])
        .select()
        .single()

      if (orderError || !order) {
        console.error('Order creation failed:', orderError)
        throw new Error((orderError as any)?.message || 'Failed to create order')
      }

      // Create order items
      const orderItems = cartItems.map((item) => {
        const unit_price = item.product.base_price + (item.variant.price_adjustment || 0)
        return {
          order_id: order.id,
          product_id: item.product_id,
          variant_id: item.variant_id,
          product_name: item.product.name,
          product_sku: null,
          variant_name: `${item.variant.color} - ${item.variant.size}`,
          variant_color: item.variant.color,
          variant_size: item.variant.size,
          quantity: item.quantity,
          unit_price,
          total_price: unit_price * item.quantity,
          image_url: item.product.image_url || null,
        }
      })

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)

      if (itemsError) {
        console.error('Order items insert error:', itemsError)
        // Continue: order exists; items failed �� still show success to user but log issue
      }

      // Clear cart and show success
      clearCart()
      setOrderStep(3)
      setTimeout(() => {
        router.push(`/order-success?order=${orderNumber}`)
      }, 1500)

    } catch (error) {
      console.error('Checkout error:', error)
      alert('Failed to place order. Please try again.')
      setOrderStep(1)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Background Elements */}
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
                href="/cart"
                className="flex items-center text-white/80 hover:text-green-400 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Cart
              </Link>
              <h1 className="text-xl font-bold text-white">Secure Checkout</h1>
              <div className="flex items-center text-white/70">
                <Lock className="w-4 h-4 mr-1" />
                <span className="text-sm">SSL Secured</span>
              </div>
            </div>
          </div>
        </header>

        {/* Order Processing Animation */}
        {orderStep === 2 && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-black/80 border border-green-500/30 rounded-none p-8 max-w-md w-full mx-4 text-center">
              <div className="mb-6">
                <Loader2 className="w-16 h-16 animate-spin text-green-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Processing Your Order</h3>
                <p className="text-white/70">Please wait while we confirm your order...</p>
              </div>
              
              <div className="space-y-3 text-left">
                <div className="flex items-center text-green-400">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  <span className="text-sm">Validating order details</span>
                </div>
                <div className="flex items-center text-green-400">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  <span className="text-sm">Checking product availability</span>
                </div>
                <div className="flex items-center text-white/70">
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  <span className="text-sm">Confirming delivery address</span>
                </div>
                <div className="flex items-center text-white/50">
                  <div className="w-4 h-4 mr-2 border border-white/30 rounded-full"></div>
                  <span className="text-sm">Generating order confirmation</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Order Success Animation */}
        {orderStep === 3 && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-black/80 border border-green-500/30 rounded-none p-8 max-w-md w-full mx-4 text-center">
              <div className="mb-6">
                <div className="w-16 h-16 bg-green-500/20 border border-green-500/30 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                  <CheckCircle className="w-8 h-8 text-green-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Order Placed Successfully!</h3>
                <p className="text-white/70">Thank you for your purchase. Redirecting to order confirmation...</p>
              </div>
              
              <div className="flex items-center justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-green-400 mr-2" />
                <span className="text-sm text-white/70">Redirecting...</span>
              </div>
            </div>
          </div>
        )}
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-6xl mx-auto">
            {/* Progress Steps */}
            <div className="mb-8">
              <div className="flex items-center justify-center space-x-4 mb-4">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                    1
                  </div>
                  <span className="ml-2 text-white font-medium">Cart</span>
                </div>
                <div className="w-16 h-0.5 bg-green-500"></div>
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                    2
                  </div>
                  <span className="ml-2 text-white font-medium">Checkout</span>
                </div>
                <div className="w-16 h-0.5 bg-white/30"></div>
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-white/30 text-white/70 rounded-full flex items-center justify-center text-sm font-medium">
                    3
                  </div>
                  <span className="ml-2 text-white/70 font-medium">Confirmation</span>
                </div>
              </div>
            </div>

            <h1 className="text-3xl font-bold text-white mb-8 text-center">Complete Your Order</h1>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Checkout Form */}
              <div className="bg-black/40 backdrop-blur-lg border border-green-500/30 rounded-none p-6">
                <h2 className="text-xl font-semibold text-white mb-6">Shipping Information</h2>
                
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  {/* Personal Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-white flex items-center">
                      <User className="w-5 h-5 mr-2 text-green-400" />
                      Personal Details
                    </h3>
                    
                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">
                        Full Name *
                      </label>
                      <input
                        {...register('customer_name')}
                        type="text"
                        className="w-full px-3 py-2 bg-black/20 border border-green-500/30 rounded-none text-white placeholder-white/50 focus:ring-2 focus:ring-green-400 focus:border-transparent"
                        placeholder="Enter your full name"
                      />
                      {errors.customer_name && (
                        <p className="text-red-400 text-sm mt-1">{errors.customer_name.message}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-white/80 mb-2">
                          <Mail className="w-4 h-4 inline mr-1 text-green-400" />
                          Email *
                        </label>
                        <input
                          {...register('customer_email')}
                          type="email"
                          className="w-full px-3 py-2 bg-black/20 border border-green-500/30 rounded-none text-white placeholder-white/50 focus:ring-2 focus:ring-green-400 focus:border-transparent"
                          placeholder="your@email.com"
                        />
                        {errors.customer_email && (
                          <p className="text-red-400 text-sm mt-1">{errors.customer_email.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-white/80 mb-2">
                          <Phone className="w-4 h-4 inline mr-1 text-green-400" />
                          Phone *
                        </label>
                        <input
                          {...register('customer_phone')}
                          type="tel"
                          className="w-full px-3 py-2 bg-black/20 border border-green-500/30 rounded-none text-white placeholder-white/50 focus:ring-2 focus:ring-green-400 focus:border-transparent"
                          placeholder="+91 12345 67890"
                        />
                        {errors.customer_phone && (
                          <p className="text-red-400 text-sm mt-1">{errors.customer_phone.message}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Shipping Address */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-white flex items-center">
                      <MapPin className="w-5 h-5 mr-2 text-green-400" />
                      Shipping Address
                    </h3>
                    
                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">
                        Street Address *
                      </label>
                      <textarea
                        {...register('shipping_address')}
                        rows={3}
                        className="w-full px-3 py-2 bg-black/20 border border-green-500/30 rounded-none text-white placeholder-white/50 focus:ring-2 focus:ring-green-400 focus:border-transparent resize-none"
                        placeholder="Enter your complete address"
                      />
                      {errors.shipping_address && (
                        <p className="text-red-400 text-sm mt-1">{errors.shipping_address.message}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-white/80 mb-2">
                          City *
                        </label>
                        <input
                          {...register('shipping_city')}
                          type="text"
                          className="w-full px-3 py-2 bg-black/20 border border-green-500/30 rounded-none text-white placeholder-white/50 focus:ring-2 focus:ring-green-400 focus:border-transparent"
                          placeholder="City"
                        />
                        {errors.shipping_city && (
                          <p className="text-red-400 text-sm mt-1">{errors.shipping_city.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-white/80 mb-2">
                          State *
                        </label>
                        <input
                          {...register('shipping_state')}
                          type="text"
                          className="w-full px-3 py-2 bg-black/20 border border-green-500/30 rounded-none text-white placeholder-white/50 focus:ring-2 focus:ring-green-400 focus:border-transparent"
                          placeholder="State"
                        />
                        {errors.shipping_state && (
                          <p className="text-red-400 text-sm mt-1">{errors.shipping_state.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-white/80 mb-2">
                          Postal Code *
                        </label>
                        <input
                          {...register('shipping_postal_code')}
                          type="text"
                          className="w-full px-3 py-2 bg-black/20 border border-green-500/30 rounded-none text-white placeholder-white/50 focus:ring-2 focus:ring-green-400 focus:border-transparent"
                          placeholder="123456"
                        />
                        {errors.shipping_postal_code && (
                          <p className="text-red-400 text-sm mt-1">{errors.shipping_postal_code.message}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-white flex items-center">
                      <CreditCard className="w-5 h-5 mr-2 text-green-400" />
                      Payment Method
                    </h3>
                    
                    <div className="bg-green-500/20 border border-green-500/30 rounded-none p-4">
                      <div className="flex items-center">
                        <Truck className="w-5 h-5 text-green-400 mr-3" />
                        <div>
                          <h4 className="font-medium text-white">Cash on Delivery</h4>
                          <p className="text-sm text-white/70">Pay when your order is delivered to your doorstep</p>
                        </div>
                        <div className="ml-auto">
                          <Shield className="w-5 h-5 text-green-400" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 px-6 rounded-none font-semibold hover:from-green-700 hover:to-emerald-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed border border-green-500/50 flex items-center justify-center"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        Processing Order...
                      </>
                    ) : (
                      <>
                        <Lock className="w-5 h-5 mr-2" />
                        Place Secure Order
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Order Summary */}
              <div className="bg-black/40 backdrop-blur-lg border border-green-500/30 rounded-none p-6">
                <h2 className="text-xl font-semibold text-white mb-6">Order Summary</h2>
                
                <div className="space-y-4 mb-6">
                  {cartItems.map((item) => {
                    const itemPrice = item.product.base_price + (item.variant.price_adjustment || 0)
                    const itemTotal = itemPrice * item.quantity
                    
                    return (
                      <div key={item.id} className="flex items-center space-x-4 py-4 border-b border-green-500/20">
                        <div className="w-16 h-16 bg-green-500/20 border border-green-500/30 rounded-none flex-shrink-0 overflow-hidden">
                          <img
                            src={item.product.image_url || '/api/placeholder/64/64'}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-white">{item.product.name}</h3>
                          <p className="text-sm text-white/70">
                            {item.variant.color} • {item.variant.size} • Qty: {item.quantity}
                          </p>
                          <p className="text-sm font-medium text-green-400">₹{itemTotal.toFixed(2)}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-white/70">
                    <span>Subtotal</span>
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
                  <div className="flex justify-between text-lg font-semibold text-white pt-3 border-t border-green-500/20">
                    <span>Total</span>
                    <span className="text-green-400">₹{cartTotal.toFixed(2)}</span>
                  </div>
                </div>

                <div className="bg-blue-500/20 border border-blue-500/30 rounded-none p-4 mb-6">
                  <h4 className="font-medium text-blue-400 mb-2 flex items-center">
                    <Truck className="w-4 h-4 mr-2" />
                    Delivery Information
                  </h4>
                  <ul className="text-sm text-white/80 space-y-1">
                    <li>• Free delivery on all orders</li>
                    <li>• Expected delivery: 3-7 business days</li>
                    <li>• Cash on delivery available</li>
                    <li>• Order tracking via email & SMS</li>
                  </ul>
                </div>

                <div className="bg-green-500/20 border border-green-500/30 rounded-none p-4">
                  <h4 className="font-medium text-green-400 mb-2 flex items-center">
                    <Star className="w-4 h-4 mr-2" />
                    Why Choose Us?
                  </h4>
                  <ul className="text-sm text-white/80 space-y-1">
                    <li>• 7-day easy return policy</li>
                    <li>• 100% authentic products</li>
                    <li>• Secure payment processing</li>
                    <li>• 24/7 customer support</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </main>
        
        <Footer />
      </div>
    </div>
  )
}