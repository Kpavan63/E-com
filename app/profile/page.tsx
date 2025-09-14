'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'
import { useStore } from '@/store/useStore'
import { useNotifications } from '@/app/components/NotificationSystem'
import Footer from '@/app/components/Footer'
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Edit3, 
  Save, 
  LogOut, 
  Package, 
  Heart,
  Camera,
  Shield,
  Bell,
  CreditCard,
  Settings,
  ChevronRight,
  Star,
  Award,
  Calendar,
  X,
  ArrowLeft,
  Clock,
  Truck,
  CheckCircle,
  XCircle,
  Eye,
  Loader2,
  Plus,
  Trash2
} from 'lucide-react'

const profileSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postal_code: z.string().optional(),
})

type ProfileFormData = z.infer<typeof profileSchema>

export default function ProfilePage() {
  const router = useRouter()
  const { user, setUser, isAuthenticated } = useStore()
  const { addNotification } = useNotifications()
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [activeTab, setActiveTab] = useState('profile')
  const [profileData, setProfileData] = useState<{
    user_id: string
    full_name: string
    phone: string
    address?: string
    city?: string
    state?: string
    postal_code?: string
  } | null>(null)
  const [orders, setOrders] = useState<{
    id: string
    order_number: string
    total_amount: number
    status: string
    created_at: string
    order_items?: {
      id: string
      product_name: string
      variant_color: string
      variant_size: string
      quantity: number
      total_price: number
    }[]
  }[]>([])
  const [ordersLoading, setOrdersLoading] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema)
  })

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login')
      return
    }

    fetchUserProfile()
    if (activeTab === 'orders') {
      fetchUserOrders()
    }
  }, [isAuthenticated, router, activeTab])

  const fetchUserProfile = async () => {
    if (!user?.id) return

    try {
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error)
        return
      }

      if (profile) {
        setProfileData(profile)
        reset({
          full_name: profile.full_name || user.full_name || '',
          phone: profile.phone || user.phone || '',
          address: profile.address || '',
          city: profile.city || '',
          state: profile.state || '',
          postal_code: profile.postal_code || '',
        })
      } else {
        // Create initial profile if it doesn't exist using upsert to avoid duplicate key errors
        const { data: newProfile, error: createError } = await supabase
          .from('user_profiles')
          .upsert({
            user_id: user.id,
            full_name: user.full_name || '',
            phone: user.phone || '',
            email_verified: true,
          }, {
            onConflict: 'user_id'
          })
          .select()
          .single()

        if (!createError && newProfile) {
          setProfileData(newProfile)
          reset({
            full_name: newProfile.full_name || '',
            phone: newProfile.phone || '',
            address: newProfile.address || '',
            city: newProfile.city || '',
            state: newProfile.state || '',
            postal_code: newProfile.postal_code || '',
          })
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    }
  }

  const fetchUserOrders = async () => {
    if (!user?.id) return

    setOrdersLoading(true)
    try {
      const { data: ordersData, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            products (name, image_url),
            product_variants (color, size)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching orders:', error)
      } else {
        setOrders(ordersData || [])
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setOrdersLoading(false)
    }
  }

  const onSubmit = async (data: ProfileFormData) => {
    if (!user?.id) return

    setIsLoading(true)
    setMessage('')

    try {
      const { data: updatedProfile, error } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: user.id,
          ...data,
          email_verified: true, // Ensure email_verified is set
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        })
        .select()
        .single()

      if (error) {
        console.error('Profile update error:', error)
        
        // Check if it's a duplicate key error
        if (error.code === '23505') {
          addNotification({
            type: 'error',
            title: 'Profile Update Failed',
            message: 'A profile with this information already exists. Please try different details.',
            duration: 5000
          })
        } else {
          addNotification({
            type: 'error',
            title: 'Profile Update Failed',
            message: error.message || 'Failed to update profile. Please try again.',
            duration: 5000
          })
        }
        setMessage('Error updating profile')
      } else {
        setProfileData(updatedProfile)
        setUser({
          ...user,
          full_name: data.full_name,
          phone: data.phone
        })
        
        addNotification({
          type: 'success',
          title: 'Profile Updated!',
          message: `Your ${activeTab === 'profile' ? 'profile information' : 'address'} has been updated successfully.`,
          duration: 4000
        })
        
        setMessage('Profile updated successfully!')
        setIsEditing(false)
        
        // Refresh the profile data
        setTimeout(() => {
          fetchUserProfile()
        }, 500)
      }
    } catch (error) {
      console.error('Profile update error:', error)
      addNotification({
        type: 'error',
        title: 'Update Failed',
        message: 'An unexpected error occurred. Please try again.',
        duration: 5000
      })
      setMessage('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignOut = async () => {
    const { clearSession } = useStore.getState()
    await supabase.auth.signOut()
    clearSession()
    router.push('/')
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-400" />
      case 'confirmed':
        return <CheckCircle className="w-4 h-4 text-blue-400" />
      case 'shipped':
        return <Truck className="w-4 h-4 text-purple-400" />
      case 'delivered':
        return <CheckCircle className="w-4 h-4 text-green-400" />
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-red-400" />
      default:
        return <Clock className="w-4 h-4 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-400 bg-yellow-400/20 border-yellow-400/30'
      case 'confirmed':
        return 'text-blue-400 bg-blue-400/20 border-blue-400/30'
      case 'shipped':
        return 'text-purple-400 bg-purple-400/20 border-purple-400/30'
      case 'delivered':
        return 'text-green-400 bg-green-400/20 border-green-400/30'
      case 'cancelled':
        return 'text-red-400 bg-red-400/20 border-red-400/30'
      default:
        return 'text-gray-400 bg-gray-400/20 border-gray-400/30'
    }
  }

  if (!isAuthenticated) {
    return null
  }

  const menuItems = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'address', label: 'Address', icon: MapPin },
    { id: 'orders', label: 'My Orders', icon: Package },
    { id: 'settings', label: 'Settings', icon: Settings },
  ]

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="p-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              {/* Personal Information Section */}
              <div className="space-y-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 bg-green-500/20 border border-green-500/30 rounded-none flex items-center justify-center">
                    <User className="w-5 h-5 text-green-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white">Personal Information</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-white/80">
                      Full Name
                    </label>
                    <div className="relative group">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 w-5 h-5 group-focus-within:text-green-400 transition-colors" />
                      <input
                        {...register('full_name')}
                        type="text"
                        disabled={!isEditing}
                        className="w-full pl-10 pr-4 py-3 border border-green-500/30 rounded-none focus:ring-2 focus:ring-green-400 focus:border-transparent disabled:bg-black/20 disabled:text-white/60 bg-black/20 text-white transition-all duration-200 hover:border-green-400/50"
                        placeholder="Enter your full name"
                      />
                    </div>
                    {errors.full_name && (
                      <p className="text-red-400 text-sm mt-1">{errors.full_name.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-white/80">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 w-5 h-5" />
                      <input
                        type="email"
                        value={user?.email || ''}
                        disabled
                        className="w-full pl-10 pr-4 py-3 border border-green-500/30 rounded-none bg-black/40 text-white/60"
                      />
                    </div>
                    <p className="text-xs text-white/50">Email cannot be changed</p>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="block text-sm font-medium text-white/80">
                      Phone Number
                    </label>
                    <div className="relative group">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 w-5 h-5 group-focus-within:text-green-400 transition-colors" />
                      <input
                        {...register('phone')}
                        type="tel"
                        disabled={!isEditing}
                        className="w-full pl-10 pr-4 py-3 border border-green-500/30 rounded-none focus:ring-2 focus:ring-green-400 focus:border-transparent disabled:bg-black/20 disabled:text-white/60 bg-black/20 text-white transition-all duration-200 hover:border-green-400/50"
                        placeholder="Enter your phone number"
                      />
                    </div>
                    {errors.phone && (
                      <p className="text-red-400 text-sm mt-1">{errors.phone.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {isEditing && (
                <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 pt-8 border-t border-green-500/20">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex items-center justify-center space-x-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-3 rounded-none font-semibold hover:from-green-700 hover:to-emerald-700 transition-all duration-200 disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:scale-105 border border-green-500/50"
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span>{isLoading ? 'Saving...' : 'Save Changes'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false)
                      fetchUserProfile()
                      setMessage('')
                    }}
                    className="px-8 py-3 border border-green-500/30 text-white/80 rounded-none font-semibold hover:bg-green-500/20 hover:text-green-400 transition-all duration-200 hover:border-green-400/50"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </form>
          </div>
        )

      case 'address':
        return (
          <div className="p-6">
            <div className="space-y-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-green-500/20 border border-green-500/30 rounded-none flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-green-400" />
                </div>
                <h3 className="text-xl font-semibold text-white">Address Information</h3>
              </div>
              
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-white/80">
                    Street Address
                  </label>
                  <div className="relative group">
                    <MapPin className="absolute left-3 top-3 text-white/60 w-5 h-5 group-focus-within:text-green-400 transition-colors" />
                    <textarea
                      {...register('address')}
                      rows={3}
                      disabled={!isEditing}
                      className="w-full pl-10 pr-4 py-3 border border-green-500/30 rounded-none focus:ring-2 focus:ring-green-400 focus:border-transparent disabled:bg-black/20 disabled:text-white/60 bg-black/20 text-white transition-all duration-200 hover:border-green-400/50 resize-none"
                      placeholder="Enter your street address"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-white/80">
                      City
                    </label>
                    <input
                      {...register('city')}
                      type="text"
                      disabled={!isEditing}
                      className="w-full px-4 py-3 border border-green-500/30 rounded-none focus:ring-2 focus:ring-green-400 focus:border-transparent disabled:bg-black/20 disabled:text-white/60 bg-black/20 text-white transition-all duration-200 hover:border-green-400/50"
                      placeholder="City"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-white/80">
                      State
                    </label>
                    <input
                      {...register('state')}
                      type="text"
                      disabled={!isEditing}
                      className="w-full px-4 py-3 border border-green-500/30 rounded-none focus:ring-2 focus:ring-green-400 focus:border-transparent disabled:bg-black/20 disabled:text-white/60 bg-black/20 text-white transition-all duration-200 hover:border-green-400/50"
                      placeholder="State"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-white/80">
                      Postal Code
                    </label>
                    <input
                      {...register('postal_code')}
                      type="text"
                      disabled={!isEditing}
                      className="w-full px-4 py-3 border border-green-500/30 rounded-none focus:ring-2 focus:ring-green-400 focus:border-transparent disabled:bg-black/20 disabled:text-white/60 bg-black/20 text-white transition-all duration-200 hover:border-green-400/50"
                      placeholder="Postal Code"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                {isEditing && (
                  <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 pt-8 border-t border-green-500/20">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex items-center justify-center space-x-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-3 rounded-none font-semibold hover:from-green-700 hover:to-emerald-700 transition-all duration-200 disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:scale-105 border border-green-500/50"
                    >
                      {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      <span>{isLoading ? 'Saving...' : 'Save Address'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(false)
                        fetchUserProfile()
                        setMessage('')
                      }}
                      className="px-8 py-3 border border-green-500/30 text-white/80 rounded-none font-semibold hover:bg-green-500/20 hover:text-green-400 transition-all duration-200 hover:border-green-400/50"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </form>
            </div>
          </div>
        )

      case 'orders':
        return (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-500/20 border border-green-500/30 rounded-none flex items-center justify-center">
                  <Package className="w-5 h-5 text-green-400" />
                </div>
                <h3 className="text-xl font-semibold text-white">My Orders</h3>
              </div>
              <div className="text-sm text-white/70">
                {orders.length} {orders.length === 1 ? 'order' : 'orders'}
              </div>
            </div>

            {ordersLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-green-400" />
                <span className="ml-2 text-white/70">Loading orders...</span>
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-white/30 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">No orders yet</h3>
                <p className="text-white/70 mb-6">Start shopping to see your orders here</p>
                <Link
                  href="/products"
                  className="inline-flex items-center space-x-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-none font-medium hover:from-green-700 hover:to-emerald-700 transition-all duration-200"
                >
                  <span>Browse Products</span>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order.id} className="bg-black/20 border border-green-500/20 rounded-none p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-4">
                      <div className="flex items-center space-x-4 mb-4 lg:mb-0">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(order.status)}
                          <span className={`px-3 py-1 rounded-none text-xs font-medium border ${getStatusColor(order.status)}`}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </span>
                        </div>
                        <div>
                          <p className="text-white font-semibold">Order #{order.order_number}</p>
                          <p className="text-white/70 text-sm">
                            {new Date(order.created_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-semibold">₹{order.total_amount}</p>
                        <p className="text-white/70 text-sm">{order.order_items?.length || 0} items</p>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="space-y-3 mb-4">
                      {order.order_items?.slice(0, 2).map((item: {
                        id: string
                        product_name: string
                        variant_color: string
                        variant_size: string
                        quantity: number
                        total_price: number
                      }) => (
                        <div key={item.id} className="flex items-center space-x-4 bg-black/20 p-3 rounded-none">
                          <div className="w-12 h-12 bg-green-500/20 border border-green-500/30 rounded-none flex items-center justify-center">
                            <Package className="w-6 h-6 text-green-400" />
                          </div>
                          <div className="flex-1">
                            <p className="text-white font-medium">{item.product_name}</p>
                            <p className="text-white/70 text-sm">
                              {item.variant_color} • {item.variant_size} • Qty: {item.quantity}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-white font-medium">₹{item.total_price}</p>
                          </div>
                        </div>
                      ))}
                      {order.order_items && order.order_items.length > 2 && (
                        <p className="text-white/70 text-sm text-center">
                          +{order.order_items.length - 2} more items
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                      <button
                        onClick={() => router.push(`/orders/${order.id}`)}
                        className="flex items-center justify-center space-x-2 bg-green-500/20 text-green-400 px-4 py-2 rounded-none font-medium hover:bg-green-500/30 transition-all duration-200 border border-green-500/30"
                      >
                        <Eye className="w-4 h-4" />
                        <span>View Details</span>
                      </button>
                      {order.status === 'delivered' && (
                        <button className="flex items-center justify-center space-x-2 bg-blue-500/20 text-blue-400 px-4 py-2 rounded-none font-medium hover:bg-blue-500/30 transition-all duration-200 border border-blue-500/30">
                          <Star className="w-4 h-4" />
                          <span>Rate Order</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )

      case 'settings':
        return (
          <div className="p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-green-500/20 border border-green-500/30 rounded-none flex items-center justify-center">
                <Settings className="w-5 h-5 text-green-400" />
              </div>
              <h3 className="text-xl font-semibold text-white">Settings</h3>
            </div>

            <div className="space-y-6">
              {/* Notification Settings */}
              <div className="bg-black/20 border border-green-500/20 rounded-none p-6">
                <h4 className="text-lg font-semibold text-white mb-4">Notifications</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">Order Updates</p>
                      <p className="text-white/70 text-sm">Get notified about order status changes</p>
                    </div>
                    <button className="w-12 h-6 bg-green-500 rounded-full relative">
                      <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5"></div>
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">Promotional Emails</p>
                      <p className="text-white/70 text-sm">Receive offers and promotional content</p>
                    </div>
                    <button className="w-12 h-6 bg-gray-600 rounded-full relative">
                      <div className="w-5 h-5 bg-white rounded-full absolute left-0.5 top-0.5"></div>
                    </button>
                  </div>
                </div>
              </div>

              {/* Privacy Settings */}
              <div className="bg-black/20 border border-green-500/20 rounded-none p-6">
                <h4 className="text-lg font-semibold text-white mb-4">Privacy</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">Profile Visibility</p>
                      <p className="text-white/70 text-sm">Make your profile visible to other users</p>
                    </div>
                    <button className="w-12 h-6 bg-gray-600 rounded-full relative">
                      <div className="w-5 h-5 bg-white rounded-full absolute left-0.5 top-0.5"></div>
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">Data Analytics</p>
                      <p className="text-white/70 text-sm">Help improve our service with usage data</p>
                    </div>
                    <button className="w-12 h-6 bg-green-500 rounded-full relative">
                      <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5"></div>
                    </button>
                  </div>
                </div>
              </div>

              {/* Account Actions */}
              <div className="bg-black/20 border border-green-500/20 rounded-none p-6">
                <h4 className="text-lg font-semibold text-white mb-4">Account</h4>
                <div className="space-y-4">
                  <button className="w-full text-left p-4 border border-yellow-500/30 rounded-none hover:bg-yellow-500/10 transition-colors">
                    <p className="text-yellow-400 font-medium">Change Password</p>
                    <p className="text-white/70 text-sm">Update your account password</p>
                  </button>
                  <button className="w-full text-left p-4 border border-red-500/30 rounded-none hover:bg-red-500/10 transition-colors">
                    <p className="text-red-400 font-medium">Delete Account</p>
                    <p className="text-white/70 text-sm">Permanently delete your account and data</p>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
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
              <h1 className="text-xl font-bold text-white">My Profile</h1>
              <div></div>
            </div>
          </div>
        </header>
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Hero Section */}
          <div className="relative overflow-hidden bg-black/40 backdrop-blur-lg border border-green-500/30 rounded-none p-8 mb-8">
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
              <div className="absolute -top-4 -left-4 w-24 h-24 bg-green-400/10 rounded-full animate-pulse"></div>
              <div className="absolute top-1/2 right-8 w-16 h-16 bg-green-400/5 rounded-full animate-bounce delay-300"></div>
              <div className="absolute bottom-4 left-1/3 w-20 h-20 bg-green-400/5 rounded-full animate-pulse delay-700"></div>
            </div>

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between">
              <div className="flex items-center space-x-6 mb-6 md:mb-0">
                <div className="relative group">
                  <div className="w-24 h-24 bg-green-500/20 border border-green-500/30 rounded-none flex items-center justify-center backdrop-blur-sm shadow-xl group-hover:scale-110 transition-transform duration-300">
                    <User className="w-12 h-12 text-green-400" />
                  </div>
                  <button className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-none flex items-center justify-center shadow-lg hover:scale-110 transition-transform duration-200">
                    <Camera className="w-4 h-4 text-white" />
                  </button>
                </div>
                
                <div className="text-white">
                  <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-white to-green-100 bg-clip-text text-transparent">
                    {user?.full_name || 'Welcome'}
                  </h1>
                  <p className="text-white/80 text-lg">{user?.email}</p>
                  <div className="flex items-center mt-2 space-x-4">
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="text-sm text-white/90">Premium Member</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4 text-white/70" />
                      <span className="text-sm text-white/70">
                        Since {new Date(user?.created_at || '').getFullYear()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">{orders.length}</div>
                  <div className="text-sm text-white/70">Orders</div>
                </div>
                <div className="w-px h-12 bg-green-500/20"></div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">₹{orders.reduce((sum, order) => sum + Number(order.total_amount), 0).toLocaleString()}</div>
                  <div className="text-sm text-white/70">Total Spent</div>
                </div>
                <div className="w-px h-12 bg-green-500/20"></div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">8</div>
                  <div className="text-sm text-white/70">Wishlist</div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar Navigation */}
            <div className="lg:col-span-1">
              <div className="bg-black/40 backdrop-blur-lg border border-green-500/30 rounded-none overflow-hidden">
                <div className="p-6 border-b border-green-500/20">
                  <h2 className="text-lg font-semibold text-white">Account Menu</h2>
                </div>
                
                <nav className="p-2">
                  {menuItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-none text-left transition-all duration-200 group ${
                        activeTab === item.id
                          ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg transform scale-[1.02] border border-green-500/50'
                          : 'text-white/80 hover:bg-green-500/20 hover:text-green-400'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <item.icon className={`w-5 h-5 ${
                          activeTab === item.id ? 'text-white' : 'text-white/60 group-hover:text-green-400'
                        }`} />
                        <span className="font-medium">{item.label}</span>
                      </div>
                      
                      <ChevronRight className={`w-4 h-4 transition-transform ${
                        activeTab === item.id ? 'text-white rotate-90' : 'text-white/60'
                      }`} />
                    </button>
                  ))}
                  
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center space-x-3 px-4 py-3 rounded-none text-left text-red-400 hover:bg-red-500/20 transition-all duration-200 group mt-4 border-t border-green-500/20"
                  >
                    <LogOut className="w-5 h-5" />
                    <span className="font-medium">Sign Out</span>
                  </button>
                </nav>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              <div className="bg-black/40 backdrop-blur-lg border border-green-500/30 rounded-none overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-green-500/20 bg-black/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-white">
                        {activeTab === 'profile' && 'Profile Information'}
                        {activeTab === 'address' && 'Address Management'}
                        {activeTab === 'orders' && 'Order History'}
                        {activeTab === 'settings' && 'Account Settings'}
                      </h2>
                      <p className="text-white/70 mt-1">
                        {activeTab === 'profile' && 'Manage your personal information'}
                        {activeTab === 'address' && 'Update your delivery addresses'}
                        {activeTab === 'orders' && 'View and track your orders'}
                        {activeTab === 'settings' && 'Configure your account preferences'}
                      </p>
                    </div>
                    {(activeTab === 'profile' || activeTab === 'address') && !isEditing && (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center space-x-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-none font-medium hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 border border-green-500/50"
                      >
                        <Edit3 className="w-4 h-4" />
                        <span>Edit {activeTab === 'profile' ? 'Profile' : 'Address'}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Success/Error Messages */}
                {message && (
                  <div className={`mx-6 mt-6 p-4 rounded-none border ${
                    message.includes('Error') 
                      ? 'bg-red-500/20 text-red-400 border-red-500/30' 
                      : 'bg-green-500/20 text-green-400 border-green-500/30'
                  } animate-in slide-in-from-top duration-300`}>
                    <div className="flex items-center justify-between">
                      <span>{message}</span>
                      <button
                        onClick={() => setMessage('')}
                        className="text-current hover:opacity-70"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Tab Content */}
                {renderTabContent()}
              </div>
            </div>
          </div>
        </main>
        
        <Footer />
      </div>
    </div>
  )
}