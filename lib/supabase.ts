import { createClient } from '@supabase/supabase-js'

// Environment variables - required for production
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.')
}

// Create Supabase client with realtime enabled
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})

// Storage bucket configuration
export const STORAGE_BUCKET = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || 'product-images'

// Helper function to get public URL for uploaded images
export const getImageUrl = (path: string) => {
  const { data } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(path)
  
  return data.publicUrl
}

// Helper function to upload image to Supabase storage
export const uploadImage = async (file: File, path: string) => {
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false
    })

  return { data, error }
}

// Helper function to delete image from Supabase storage
export const deleteImage = async (path: string) => {
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .remove([path])

  return { data, error }
}

// Realtime subscription helper
export const subscribeToTable = (table: string, callback: (payload: Record<string, unknown>) => void) => {
  return supabase
    .channel(`public:${table}`)
    .on('postgres_changes', { event: '*', schema: 'public', table }, callback)
    .subscribe()
}

// Database Types
export interface User {
  id: string
  email: string
  full_name: string
  phone: string
  created_at: string
}

export interface UserProfile {
  id: string
  user_id: string
  full_name: string
  phone: string
  address: string
  city: string
  state: string
  postal_code: string
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  name: string
  description: string
  base_price: number
  category: string
  image_url: string
  stock_quantity: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ProductVariant {
  id: string
  product_id: string
  color: string
  size: string
  stock_quantity: number
  price_adjustment: number
  is_active: boolean
  created_at: string
}

export interface CartItem {
  id: string
  user_id: string
  product_id: string
  variant_id: string
  quantity: number
  created_at: string
}

export interface Order {
  id: string
  user_id: string
  order_number: string
  total_amount: number
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  payment_method: 'cash_on_delivery'
  payment_status: 'pending' | 'paid' | 'failed'
  shipping_address: string
  shipping_city: string
  shipping_state: string
  shipping_postal_code: string
  customer_name: string
  customer_phone: string
  customer_email: string
  created_at: string
  updated_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  variant_id: string
  quantity: number
  unit_price: number
  total_price: number
  product_name: string
  variant_color: string
  variant_size: string
  created_at: string
}

export interface AdminUser {
  id: string
  email: string
  full_name: string
  role: 'admin' | 'super_admin'
  is_active: boolean
  created_at: string
}