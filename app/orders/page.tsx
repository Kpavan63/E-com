'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useStore } from '@/store/useStore'
import { supabase } from '@/lib/supabase'
import { Package, Truck, CheckCircle, Clock, X, Eye, ArrowLeft } from 'lucide-react'

interface OrderItem {
  id: string
  product_name: string
  variant_color: string
  variant_size: string
  quantity: number
  unit_price: number
  total_price: number
}

interface Order {
  id: string
  order_number: string
  total_amount: number
  status: string
  payment_method: string
  payment_status: string
  customer_name: string
  created_at: string
  order_items: OrderItem[]
}

export default function OrdersPage() {
  const { user, isAuthenticated } = useStore()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  useEffect(() => {
    fetchOrders()
  }, [user?.id, isAuthenticated])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      
      if (!user?.id) {
        setOrders([])
        return
      }

      // Fetch orders from Supabase
      const { data: ordersData, error } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          total_amount,
          status,
          payment_method,
          payment_status,
          customer_name,
          created_at,
          order_items:order_items(
            id,
            product_name,
            variant_color,
            variant_size,
            quantity,
            unit_price,
            total_price
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching orders:', error)
        setOrders([])
      } else {
        setOrders(ordersData || [])
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-400" />
      case 'confirmed':
        return <CheckCircle className="w-5 h-5 text-blue-400" />
      case 'processing':
        return <Package className="w-5 h-5 text-purple-400" />
      case 'shipped':
        return <Truck className="w-5 h-5 text-indigo-400" />
      case 'delivered':
        return <CheckCircle className="w-5 h-5 text-green-400" />
      case 'cancelled':
        return <X className="w-5 h-5 text-red-400" />
      default:
        return <Clock className="w-5 h-5 text-white/60" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
      case 'confirmed':
        return 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
      case 'processing':
        return 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
      case 'shipped':
        return 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
      case 'delivered':
        return 'bg-green-500/20 text-green-400 border border-green-500/30'
      case 'cancelled':
        return 'bg-red-500/20 text-red-400 border border-red-500/30'
      default:
        return 'bg-white/10 text-white/60 border border-white/20'
    }
  }

  if (!isAuthenticated) {
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
                <h1 className="text-xl font-bold text-white">My Orders</h1>
                <div></div>
              </div>
            </div>
          </header>

          <div className="max-w-2xl mx-auto px-4 py-16 text-center">
            <Package className="w-16 h-16 text-green-400/60 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-4">Please Login</h1>
            <p className="text-white/70 mb-8">You need to be logged in to view your orders.</p>
            <Link
              href="/auth/login"
              className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-none font-semibold hover:from-green-700 hover:to-emerald-700 transition-colors border border-green-500/50"
            >
              Login to Continue
            </Link>
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
                Back to Home
              </Link>
              <h1 className="text-xl font-bold text-white">My Orders</h1>
              <div></div>
            </div>
          </div>
        </header>
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white">My Orders</h1>
            <p className="text-white/70 mt-2">Track and manage your orders</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400"></div>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-20">
              <Package className="w-16 h-16 text-green-400/60 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-white mb-2">No Orders Yet</h2>
              <p className="text-white/70 mb-8">You haven&apos;t placed any orders yet.</p>
              <Link
                href="/"
                className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-none font-semibold hover:from-green-700 hover:to-emerald-700 transition-colors border border-green-500/50"
              >
                Start Shopping
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {orders.map((order) => (
                <div key={order.id} className="bg-black/40 backdrop-blur-lg border border-green-500/30 rounded-none overflow-hidden">
                  {/* Order Header */}
                  <div className="px-6 py-4 border-b border-green-500/20 bg-black/20">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center space-x-4">
                        {getStatusIcon(order.status)}
                        <div>
                          <h3 className="font-semibold text-white">
                            Order #{order.order_number}
                          </h3>
                          <p className="text-sm text-white/70">
                            Placed on {new Date(order.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 sm:mt-0 flex items-center space-x-4">
                        <span className={`px-3 py-1 rounded-none text-xs font-medium ${getStatusColor(order.status)}`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                        <button
                          onClick={() => setSelectedOrder(selectedOrder?.id === order.id ? null : order)}
                          className="text-green-400 hover:text-green-300 font-medium text-sm flex items-center"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          {selectedOrder?.id === order.id ? 'Hide' : 'View'} Details
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Order Summary */}
                  <div className="px-6 py-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-white/70">
                          {order.order_items?.length || 0} item(s) • {order.payment_method.replace('_', ' ')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-green-400">
                          ₹{order.total_amount.toFixed(2)}
                        </p>
                        <p className="text-sm text-white/70">
                          Payment: {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Order Details (Expandable) */}
                  {selectedOrder?.id === order.id && (
                    <div className="px-6 py-4 border-t border-green-500/20 bg-black/20">
                      <h4 className="font-medium text-white mb-4">Order Items</h4>
                      <div className="space-y-3">
                        {order.order_items?.map((item) => (
                          <div key={item.id} className="flex items-center justify-between py-2">
                            <div className="flex-1">
                              <h5 className="font-medium text-white">{item.product_name}</h5>
                              <p className="text-sm text-white/70">
                                Color: {item.variant_color} • Size: {item.variant_size} • Qty: {item.quantity}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium text-green-400">₹{item.total_price.toFixed(2)}</p>
                              <p className="text-sm text-white/70">₹{item.unit_price.toFixed(2)} each</p>
                            </div>
                          </div>
                        )) || (
                          <p className="text-white/70 text-sm">Order items not available</p>
                        )}
                      </div>

                      {/* Order Status Timeline */}
                      <div className="mt-6 pt-4 border-t border-green-500/20">
                        <h4 className="font-medium text-white mb-4">Order Status</h4>
                        <div className="flex items-center space-x-4 text-sm">
                          <div className={`flex items-center ${
                            ['pending', 'confirmed', 'processing', 'shipped', 'delivered'].includes(order.status) 
                              ? 'text-green-400' : 'text-white/40'
                          }`}>
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Order Placed
                          </div>
                          <div className={`flex items-center ${
                            ['confirmed', 'processing', 'shipped', 'delivered'].includes(order.status) 
                              ? 'text-green-400' : 'text-white/40'
                          }`}>
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Confirmed
                          </div>
                          <div className={`flex items-center ${
                            ['processing', 'shipped', 'delivered'].includes(order.status) 
                              ? 'text-green-400' : 'text-white/40'
                          }`}>
                            <Package className="w-4 h-4 mr-1" />
                            Processing
                          </div>
                          <div className={`flex items-center ${
                            ['shipped', 'delivered'].includes(order.status) 
                              ? 'text-green-400' : 'text-white/40'
                          }`}>
                            <Truck className="w-4 h-4 mr-1" />
                            Shipped
                          </div>
                          <div className={`flex items-center ${
                            order.status === 'delivered' ? 'text-green-400' : 'text-white/40'
                          }`}>
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Delivered
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}