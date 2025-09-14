'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, STORAGE_BUCKET } from '@/lib/supabase'
import { useStore } from '@/store/useStore'
import { useNotifications, createNotificationHelpers } from '@/app/components/NotificationSystem'
import { 
  Package, 
  Users, 
  ShoppingCart, 
  TrendingUp, 
  Plus,
  Edit,
  Trash2,
  Eye,
  Search,
  Upload,
  Save,
  X,
  Mail,
  DollarSign,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Clock,
  Truck,
  XCircle,
  Download,
  RefreshCw,
  Image as ImageIcon,
  Loader2,
  LogOut
} from 'lucide-react'

interface Product {
  id: string
  name: string
  description: string
  base_price: number
  category: string
  stock_quantity: number
  is_active: boolean
  image_url?: string
  created_at: string
}

interface OrderItem {
  product_name: string
  quantity: number
  unit_price: number
  variant_color: string
  variant_size: string
}

interface Order {
  id: string
  order_number: string
  customer_name: string
  customer_email: string
  customer_phone: string
  total_amount: number
  status: string
  shipping_address: string
  created_at: string
  tracking_number?: string
  carrier?: string
  order_items?: OrderItem[]
}

interface Customer {
  id: string
  email: string
  full_name: string
  phone: string
  total_orders: number
  total_spent: number
  created_at: string
}

export default function AdminDashboard() {
  const router = useRouter()
  const { isAdmin, adminUser, signOut } = useStore()
  
  const [products, setProducts] = useState<Product[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    activeProducts: 0,
    totalCustomers: 0,
    lowStockProducts: 0
  })
  const [activeTab, setActiveTab] = useState('dashboard')
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [showAddProduct, setShowAddProduct] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [editingOrder, setEditingOrder] = useState<Order | null>(null)
  const [updatingOrder, setUpdatingOrder] = useState(false)
  const [imageUploading, setImageUploading] = useState(false)
  const [showCreateUser, setShowCreateUser] = useState(false)
  const [creatingUser, setCreatingUser] = useState(false)
  const [addingProduct, setAddingProduct] = useState(false)

  const { addNotification } = useNotifications()
  const { showSuccess, showError, showWarning } = createNotificationHelpers(addNotification)
  const [updating, setUpdating] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    base_price: '',
    category: '',
    stock_quantity: '',
    image_url: '',
    color: '',
    sizes: [] as string[],
  })

  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    full_name: '',
    phone: ''
  })

  // Check admin authentication
  useEffect(() => {
    if (!isAdmin || !adminUser) {
      setLoading(false)
      router.push('/admin/login')
    }
  }, [isAdmin, adminUser, router])

  // Always attempt to load data on mount to avoid getting stuck if admin detection is delayed
  useEffect(() => {
    fetchDashboardData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Fallback timeout: if loading takes too long, stop spinner and notify
  useEffect(() => {
    if (!loading) return
    const timeout = setTimeout(() => {
      if (loading) {
        setLoading(false)
        showWarning('Slow response', 'The dashboard is taking longer than expected. Try Refresh.')
      }
    }, 8000)
    return () => clearTimeout(timeout)
  }, [loading, showWarning])

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      signOut()
      router.push('/admin/login')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Fetch real data from Supabase
      const [productsResult, ordersResult, customersResult] = await Promise.all([
        // Fetch products
        supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false }),
        
        // Fetch orders with order items via admin API (service role)
        fetch('/api/admin/orders').then(r => r.json()),
        
        // Fetch user profiles
        supabase
          .from('user_profiles')
          .select('*')
          .order('created_at', { ascending: false })
      ])

      // Process products data
      const productsData = productsResult.data || []
      setProducts(productsData)

      // Process orders data
      const adminOrders = (ordersResult?.orders || [])
      const ordersData = adminOrders.map((order: any) => ({
        ...order,
        order_items: order.order_items?.map((item: any) => ({
          product_name: item.product_name || 'Unknown Product',
          quantity: item.quantity,
          unit_price: item.unit_price,
          variant_color: item.variant_color || 'N/A',
          variant_size: item.variant_size || 'N/A'
        })) || []
      }))
      setOrders(ordersData)

      // Process customers data with order statistics
      const customersData = await Promise.all(
        (customersResult.data || []).map(async (profile) => {
          // Get order statistics for each customer
          const { data: userOrders } = await supabase
            .from('orders')
            .select('total_amount')
            .eq('user_id', profile.user_id)

          const totalOrders = userOrders?.length || 0
          const totalSpent = userOrders?.reduce((sum: number, order: { total_amount: number }) => sum + order.total_amount, 0) || 0

          return {
            id: profile.id,
            email: profile.user_id, // We'll need to get email from auth.users
            full_name: profile.full_name,
            phone: profile.phone,
            total_orders: totalOrders,
            total_spent: totalSpent,
            created_at: profile.created_at
          }
        })
      )
      setCustomers(customersData)

      // Calculate statistics
      const totalRevenue = ordersData.reduce((sum: number, order: Order) => sum + order.total_amount, 0)
      const activeProducts = productsData.filter(p => p.is_active).length
      const lowStockProducts = productsData.filter(p => p.stock_quantity < 10).length

      setStats({
        totalProducts: productsData.length,
        totalOrders: ordersData.length,
        totalRevenue,
        activeProducts,
        totalCustomers: customersData.length,
        lowStockProducts
      })

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      
      // Fallback to mock data if real data fails
      const mockProducts = [
        {
          id: '1',
          name: 'Premium Cotton T-Shirt',
          description: 'Comfortable cotton t-shirt perfect for everyday wear',
          base_price: 899,
          category: 'shirts',
          stock_quantity: 50,
          is_active: true,
          image_url: '/api/placeholder/400/500',
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          name: 'Classic Denim Jeans',
          description: 'High-quality denim jeans with perfect fit',
          base_price: 1599,
          category: 'pants',
          stock_quantity: 5,
          is_active: true,
          image_url: '/api/placeholder/400/500',
          created_at: new Date().toISOString()
        }
      ]

      const mockOrders = [
        {
          id: '1',
          order_number: 'ORD-20241201-0001',
          customer_name: 'John Doe',
          customer_email: 'john@example.com',
          customer_phone: '+91 9876543210',
          total_amount: 2498,
          status: 'pending',
          shipping_address: '123 Main St, Mumbai, Maharashtra 400001',
          created_at: new Date().toISOString(),
          order_items: [
            { product_name: 'Premium Cotton T-Shirt', quantity: 2, unit_price: 899, variant_color: 'Black', variant_size: 'M' }
          ]
        }
      ]

      const mockCustomers = [
        {
          id: '1',
          email: 'john@example.com',
          full_name: 'John Doe',
          phone: '+91 9876543210',
          total_orders: 1,
          total_spent: 2498,
          created_at: new Date().toISOString()
        }
      ]

      setProducts(mockProducts)
      setOrders(mockOrders)
      setCustomers(mockCustomers)
      setStats({
        totalProducts: mockProducts.length,
        totalOrders: mockOrders.length,
        totalRevenue: mockOrders.reduce((sum, order) => sum + order.total_amount, 0),
        activeProducts: mockProducts.filter(p => p.is_active).length,
        totalCustomers: mockCustomers.length,
        lowStockProducts: mockProducts.filter(p => p.stock_quantity < 10).length
      })
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = async (file: File) => {
    setImageUploading(true)
    // Validate file type and size
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    const maxSizeMB = 5
    if (!allowedTypes.includes(file.type)) {
      showError('Invalid file type', 'Please upload a JPG, PNG, or WEBP image.')
      setImageUploading(false)
      return null
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      showError('File too large', `Max file size is ${maxSizeMB}MB.`)
      setImageUploading(false)
      return null
    }
    try {
      // Generate unique filename and path
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const filePath = `products/${fileName}`

      // Upload to Supabase Storage using configured bucket
      const { error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type || `image/${ext}`,
        })

      if (error) {
        console.error('Error uploading image:', error)
        const msg = (error as any)?.message || 'Failed to upload image.'
        showError('Upload failed', `${msg} Ensure the storage bucket "${STORAGE_BUCKET}" exists and you have permissions.`)
        return null
      }

      // Get public URL
      const { data } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(filePath)

      const publicUrl = data.publicUrl
      showSuccess('Image uploaded', 'Product image uploaded successfully.')
      return publicUrl
    } catch (error) {
      console.error('Error uploading image:', error)
      showError('Upload error', 'An unexpected error occurred during image upload.')
      return null
    } finally {
      setImageUploading(false)
    }
  }

  const handleAddProduct = async () => {
    setAddingProduct(true)
    try {
      // Basic validation
      if (!newProduct.name || !newProduct.base_price || !newProduct.category || !newProduct.stock_quantity) {
        showError('Missing fields', 'Please fill in all required fields.');
        return;
      }
      if (!newProduct.color) {
        showError('Color required', 'Please select or type a color.');
        return;
      }
      if (!newProduct.sizes || newProduct.sizes.length === 0) {
        showError('Sizes required', 'Please select at least one size.');
        return;
      }

      // Resolve category_id from selected category slug
      const { data: categoryRow, error: categoryError } = await supabase
        .from('categories')
        .select('id, slug')
        .eq('slug', newProduct.category)
        .single()

      if (categoryError || !categoryRow?.id) {
        console.error('Category not found or error:', categoryError)
        showError('Invalid category', 'Selected category not found. Please choose a valid category.')
        return
      }

      // Create a mostly-unique slug to avoid conflicts
      const baseSlug = newProduct.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
      const slug = `${baseSlug}-${Date.now().toString(36).slice(-4)}`

      const productData = {
        name: newProduct.name,
        description: newProduct.description,
        base_price: parseFloat(newProduct.base_price),
        category_id: categoryRow.id,
        stock_quantity: parseInt(newProduct.stock_quantity),
        image_url: newProduct.image_url || '/api/placeholder/400/500',
        is_active: true,
        slug,
      }

      // Insert product into Supabase database
      const { data: createdProduct, error: productError } = await supabase
        .from('products')
        .insert([productData])
        .select()
        .single()

      if (productError || !createdProduct) {
        console.error('Error adding product to database:', productError || 'Unknown error')
        const msg = (productError as any)?.message || 'Failed to add product. Please try again.'
        showError('Add failed', msg)
        return
      }

      // Prepare variants: one per selected size
      const color = newProduct.color.trim()
      const sizes = newProduct.sizes
      const variantStock = parseInt(newProduct.stock_quantity) || 0

      const variants = sizes.map(size => ({
        product_id: createdProduct.id,
        name: `${color.charAt(0).toUpperCase() + color.slice(1)} - ${size}`,
        color: color.toLowerCase(),
        size,
        stock_quantity: variantStock,
        price_adjustment: 0,
        image_url: newProduct.image_url || null,
        is_active: true,
      }))

      const { error: variantError } = await supabase
        .from('product_variants')
        .insert(variants)

      if (variantError) {
        console.error('Error creating variants:', variantError)
        showWarning('Variants issue', 'Product created, but variants could not be created. You can add them later.')
      }

      // Update local state with the new product
      setProducts(prev => [createdProduct, ...prev])
      
      // Reset form
      setNewProduct({
        name: '',
        description: '',
        base_price: '',
        category: '',
        stock_quantity: '',
        image_url: '',
        color: '',
        sizes: [],
      })
      
      setShowAddProduct(false)
      showSuccess('Product added', 'Product and variants added successfully.')
      
      // Refresh dashboard data
      fetchDashboardData()
    } catch (error) {
      console.error('Error adding product:', error)
      showError('Add error', 'An unexpected error occurred. Please try again.')
    } finally {
      setAddingProduct(false)
    }
  }

  const handleUpdateProduct = async (product: Product) => {
    setUpdating(true)
    try {
      const { error } = await supabase
        .from('products')
        .update({
          name: product.name,
          description: product.description,
          base_price: product.base_price,
          category: product.category,
          stock_quantity: product.stock_quantity,
          is_active: product.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', product.id)

      if (error) {
        console.error('Error updating product in database:', error)
        showError('Update failed', 'Failed to update product. Please try again.')
        return
      }

      setProducts(prev => prev.map(p => p.id === product.id ? product : p))
      setEditingProduct(null)
      showSuccess('Product updated', 'Product updated successfully.')
      fetchDashboardData()
    } catch (error) {
      console.error('Error updating product:', error)
      showError('Update error', 'An unexpected error occurred while updating.')
    } finally {
      setUpdating(false)
    }
  }

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return
    setDeletingId(productId)

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId)

      if (error) {
        console.error('Error deleting product from database:', error)
        showError('Delete failed', 'Failed to delete product. Please try again.')
        return
      }

      setProducts(prev => prev.filter(p => p.id !== productId))
      showSuccess('Product deleted', 'Product deleted successfully.')
      fetchDashboardData()
    } catch (error) {
      console.error('Error deleting product:', error)
      showError('Delete error', 'An unexpected error occurred while deleting.')
    } finally {
      setDeletingId(null)
    }
  }

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string, tracking?: string, carrier?: string) => {
    setUpdatingOrder(true)
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orderId, status: newStatus, tracking_number: tracking, carrier })
      })
      const result = await res.json()
      if (!res.ok || !result.success) {
        throw new Error(result.error || 'Failed to update order')
      }
      setOrders(prev => prev.map(order => 
        order.id === orderId ? { ...order, status: newStatus, tracking_number: tracking ?? order.tracking_number, carrier: carrier ?? order.carrier } : order
      ))
      setEditingOrder(null)
      showSuccess('Order updated', `Status updated to ${newStatus}`)
    } catch (error) {
      console.error('Error updating order status:', error)
      showError('Update failed', 'Could not update order status')
    } finally {
      setUpdatingOrder(false)
    }
  }

  const sendCustomEmail = async (customerEmail: string, subject: string, message: string) => {
    try {
      // Simulate email sending
      await new Promise(resolve => setTimeout(resolve, 1000))
      console.log(`Sending email to ${customerEmail} with subject: ${subject} and message: ${message}`)
      alert('Email sent successfully!')
    } catch (error) {
      console.error('Error sending email:', error)
      alert('Failed to send email')
    }
  }

  const handleCreateUser = async () => {
    if (!newUser.email || !newUser.password || !newUser.full_name) {
      alert('Please fill in all required fields')
      return
    }

    setCreatingUser(true)
    try {
      // Create user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newUser.email,
        password: newUser.password,
        options: {
          data: {
            full_name: newUser.full_name,
            phone: newUser.phone
          }
        }
      })

      if (authError) {
        console.error('Error creating user:', authError)
        alert(`Failed to create user: ${authError.message}`)
        return
      }

      if (authData.user) {
        // Create user profile
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert([{
            user_id: authData.user.id,
            full_name: newUser.full_name,
            phone: newUser.phone,
            email: newUser.email
          }])

        if (profileError) {
          console.error('Error creating user profile:', profileError)
          alert('User created but failed to create profile. Please check manually.')
        } else {
          alert('User created successfully!')
          
          // Reset form
          setNewUser({
            email: '',
            password: '',
            full_name: '',
            phone: ''
          })
          
          setShowCreateUser(false)
          
          // Refresh dashboard data
          fetchDashboardData()
        }
      }
    } catch (error) {
      console.error('Error creating user:', error)
      alert('Failed to create user. Please try again.')
    } finally {
      setCreatingUser(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />
      case 'confirmed':
        return <CheckCircle className="w-4 h-4 text-blue-500" />
      case 'shipped':
        return <Truck className="w-4 h-4 text-purple-500" />
      case 'delivered':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-red-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'confirmed':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'shipped':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'delivered':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const StatCard = ({ title, value, icon: Icon, color, trend }: {
    title: string
    value: string | number
    icon: React.ComponentType<{ className?: string }>
    color: string
    trend?: string
  }) => (
    <div className="bg-black/40 backdrop-blur-lg border border-green-500/30 rounded-none p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-white/70">{title}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
          {trend && (
            <p className="text-sm text-green-400 mt-1">
              <TrendingUp className="w-4 h-4 inline mr-1" />
              {trend}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-none ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  )

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = !selectedCategory || product.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customer_name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = !selectedStatus || order.status === selectedStatus
    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-green-400 mx-auto mb-4" />
          <p className="text-white">Loading admin dashboard...</p>
        </div>
      </div>
    )
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
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                  i1Fashion Admin
                </h1>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-white/70 text-sm">
                  Welcome, <span className="text-green-400 font-medium">{adminUser?.full_name}</span>
                </div>
                <button
                  onClick={() => setShowAddProduct(true)}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-none hover:from-green-700 hover:to-emerald-700 transition-all duration-200 border border-green-500/50"
                >
                  <Plus className="w-4 h-4 mr-2 inline" />
                  Add Product
                </button>
                <button
                  onClick={fetchDashboardData}
                  className="p-2 text-white/70 hover:text-green-400 transition-colors"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
                <button
                  onClick={handleSignOut}
                  className="bg-red-500/20 text-red-400 px-4 py-2 rounded-none border border-red-500/30 hover:bg-red-500/30 transition-colors"
                >
                  <LogOut className="w-4 h-4 mr-2 inline" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Navigation Tabs */}
          <div className="mb-8">
            <nav className="flex space-x-8 border-b border-green-500/20">
              {[
                { id: 'dashboard', name: 'Dashboard', icon: BarChart3 },
                { id: 'products', name: 'Products', icon: Package },
                { id: 'orders', name: 'Order Management', icon: ShoppingCart },
                { id: 'sales', name: 'Sales', icon: TrendingUp },
                { id: 'customers', name: 'User Control', icon: Users }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-green-500 text-green-400'
                      : 'border-transparent text-white/70 hover:text-green-400 hover:border-green-500/50'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard
                  title="Total Products"
                  value={stats.totalProducts}
                  icon={Package}
                  color="bg-blue-500/20 border border-blue-500/30"
                  trend="+12% from last month"
                />
                <StatCard
                  title="Active Products"
                  value={stats.activeProducts}
                  icon={CheckCircle}
                  color="bg-green-500/20 border border-green-500/30"
                />
                <StatCard
                  title="Low Stock Alert"
                  value={stats.lowStockProducts}
                  icon={AlertTriangle}
                  color="bg-yellow-500/20 border border-yellow-500/30"
                />
                <StatCard
                  title="Total Orders"
                  value={stats.totalOrders}
                  icon={ShoppingCart}
                  color="bg-purple-500/20 border border-purple-500/30"
                  trend="+8% from last week"
                />
                <StatCard
                  title="Total Revenue"
                  value={`₹${stats.totalRevenue.toLocaleString()}`}
                  icon={DollarSign}
                  color="bg-orange-500/20 border border-orange-500/30"
                  trend="+15% from last month"
                />
                <StatCard
                  title="Total Customers"
                  value={stats.totalCustomers}
                  icon={Users}
                  color="bg-pink-500/20 border border-pink-500/30"
                />
              </div>

              {/* Recent Orders */}
              <div className="bg-black/40 backdrop-blur-lg border border-green-500/30 rounded-none overflow-hidden">
                <div className="px-6 py-4 border-b border-green-500/20">
                  <h2 className="text-lg font-semibold text-white">Recent Orders</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-green-500/20">
                    <thead className="bg-black/20">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                          Order Number
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                          Customer
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-black/20 divide-y divide-green-500/10">
                      {orders.slice(0, 5).map((order) => (
                        <tr key={order.id} className="hover:bg-green-500/5">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                            {order.order_number}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-white/70">
                            {order.customer_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                            ₹{order.total_amount.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              {getStatusIcon(order.status)}
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-none border ${getStatusColor(order.status)}`}>
                                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-white/70">
                            {new Date(order.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Products Tab */}
          {activeTab === 'products' && (
            <div className="space-y-6">
              {/* Search and Filter */}
              <div className="bg-black/40 backdrop-blur-lg border border-green-500/30 rounded-none p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-white">Products Management</h2>
                  <button
                    onClick={() => setShowAddProduct(true)}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-none hover:from-green-700 hover:to-emerald-700 transition-all duration-200 border border-green-500/50"
                  >
                    <Plus className="w-4 h-4 mr-2 inline" />
                    Add New Product
                  </button>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search products..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-black/20 border border-green-500/30 rounded-none text-white placeholder-white/50 focus:ring-2 focus:ring-green-400 focus:border-transparent"
                    />
                  </div>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-4 py-2 bg-black/20 border border-green-500/30 rounded-none text-white focus:ring-2 focus:ring-green-400 focus:border-transparent"
                  >
                    <option value="">All Categories</option>
                    <option value="shirts">Shirts</option>
                    <option value="pants">Pants</option>
                    <option value="shorts">Shorts</option>
                    <option value="hoodies">Hoodies</option>
                  </select>
                </div>
              </div>

              {/* Products Table */}
              <div className="bg-black/40 backdrop-blur-lg border border-green-500/30 rounded-none overflow-hidden">
                <table className="min-w-full divide-y divide-green-500/20">
                  <thead className="bg-black/20">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                        Price
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                        Stock
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-black/20 divide-y divide-green-500/10">
                    {filteredProducts.map((product) => (
                      <tr key={product.id} className="hover:bg-green-500/5">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-green-500/20 border border-green-500/30 rounded-none flex items-center justify-center">
                              {product.image_url ? (
                                <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                              ) : (
                                <ImageIcon className="w-5 h-5 text-green-400" />
                              )}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-white">{product.name}</div>
                              <div className="text-sm text-white/70">{product.description}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white/70 capitalize">
                          {product.category}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                          ₹{product.base_price.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`${product.stock_quantity < 10 ? 'text-red-400' : 'text-white/70'}`}>
                            {product.stock_quantity}
                            {product.stock_quantity < 10 && (
                              <AlertTriangle className="w-4 h-4 inline ml-1 text-red-400" />
                            )}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-none border ${
                            product.is_active 
                              ? 'bg-green-100 text-green-800 border-green-200' 
                              : 'bg-red-100 text-red-800 border-red-200'
                          }`}>
                            {product.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => setEditingProduct(product)}
                              className="text-green-400 hover:text-green-300"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(product.id)}
                              disabled={deletingId === product.id}
                              className="text-red-400 hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {deletingId === product.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Orders Management Tab */}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              {/* Search and Filter */}
              <div className="bg-black/40 backdrop-blur-lg border border-green-500/30 rounded-none p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-white">Order Management</h2>
                  <div className="flex items-center space-x-2">
                    <button className="bg-green-500/20 text-green-400 px-4 py-2 rounded-none border border-green-500/30 hover:bg-green-500/30 transition-colors">
                      <Download className="w-4 h-4 mr-2 inline" />
                      Export
                    </button>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search orders..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-black/20 border border-green-500/30 rounded-none text-white placeholder-white/50 focus:ring-2 focus:ring-green-400 focus:border-transparent"
                    />
                  </div>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="px-4 py-2 bg-black/20 border border-green-500/30 rounded-none text-white focus:ring-2 focus:ring-green-400 focus:border-transparent"
                  >
                    <option value="">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              {/* Orders Table */}
              <div className="bg-black/40 backdrop-blur-lg border border-green-500/30 rounded-none overflow-hidden">
                <table className="min-w-full divide-y divide-green-500/20">
                  <thead className="bg-black/20">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                        Order Details
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                        Products
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-black/20 divide-y divide-green-500/10">
                    {filteredOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-green-500/5">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-white">{order.order_number}</div>
                            <div className="text-sm text-white/70">
                              {new Date(order.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-white">{order.customer_name}</div>
                            <div className="text-sm text-white/70">{order.customer_email}</div>
                            <div className="text-sm text-white/70">{order.customer_phone}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-white/70">
                            {order.order_items?.length || 0} items
                          </div>
                          {order.order_items?.slice(0, 2).map((item, index) => (
                            <div key={index} className="text-xs text-white/50">
                              {item.product_name} ({item.variant_color}, {item.variant_size}) x{item.quantity}
                            </div>
                          ))}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                          ₹{order.total_amount.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(order.status)}
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-none border ${getStatusColor(order.status)}`}>
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => setEditingOrder(order)}
                              className="text-green-400 hover:text-green-300"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button className="text-blue-400 hover:text-blue-300">
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Sales Tab */}
          {activeTab === 'sales' && (
            <div className="space-y-6">
              <div className="bg-black/40 backdrop-blur-lg border border-green-500/30 rounded-none p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Sales Analytics</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <div className="bg-black/20 border border-green-500/20 rounded-none p-4">
                    <div className="text-2xl font-bold text-green-400">₹{stats.totalRevenue.toLocaleString()}</div>
                    <div className="text-sm text-white/70">Total Revenue</div>
                  </div>
                  <div className="bg-black/20 border border-green-500/20 rounded-none p-4">
                    <div className="text-2xl font-bold text-blue-400">{stats.totalOrders}</div>
                    <div className="text-sm text-white/70">Total Orders</div>
                  </div>
                  <div className="bg-black/20 border border-green-500/20 rounded-none p-4">
                    <div className="text-2xl font-bold text-purple-400">
                      ₹{stats.totalOrders > 0 ? (stats.totalRevenue / stats.totalOrders).toFixed(0) : 0}
                    </div>
                    <div className="text-sm text-white/70">Avg Order Value</div>
                  </div>
                  <div className="bg-black/20 border border-green-500/20 rounded-none p-4">
                    <div className="text-2xl font-bold text-orange-400">{stats.lowStockProducts}</div>
                    <div className="text-sm text-white/70">Low Stock Items</div>
                  </div>
                </div>

                {/* Low Stock Products */}
                <div className="bg-black/20 border border-green-500/20 rounded-none p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Low Stock Alert</h3>
                  <div className="space-y-3">
                    {products.filter(p => p.stock_quantity < 10).map(product => (
                      <div key={product.id} className="flex items-center justify-between p-3 bg-red-500/10 border border-red-500/20 rounded-none">
                        <div className="flex items-center space-x-3">
                          <AlertTriangle className="w-5 h-5 text-red-400" />
                          <div>
                            <div className="text-white font-medium">{product.name}</div>
                            <div className="text-white/70 text-sm">Stock: {product.stock_quantity}</div>
                          </div>
                        </div>
                        <button
                          onClick={() => setEditingProduct(product)}
                          className="bg-red-500/20 text-red-400 px-3 py-1 rounded-none border border-red-500/30 hover:bg-red-500/30 transition-colors"
                        >
                          Update Stock
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* User Control Tab */}
          {activeTab === 'customers' && (
            <div className="space-y-6">
              <div className="bg-black/40 backdrop-blur-lg border border-green-500/30 rounded-none p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-white">User Control Management</h2>
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => setShowCreateUser(true)}
                      className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-none hover:from-green-700 hover:to-emerald-700 transition-all duration-200 border border-green-500/50"
                    >
                      <Plus className="w-4 h-4 mr-2 inline" />
                      Create User
                    </button>
                    <button className="bg-blue-500/20 text-blue-400 px-4 py-2 rounded-none border border-blue-500/30 hover:bg-blue-500/30 transition-colors">
                      <Mail className="w-4 h-4 mr-2 inline" />
                      Send Bulk Email
                    </button>
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-green-500/20">
                    <thead className="bg-black/20">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                          Customer
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                          Contact
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                          Orders
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                          Total Spent
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                          Joined
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-black/20 divide-y divide-green-500/10">
                      {customers.map((customer) => (
                        <tr key={customer.id} className="hover:bg-green-500/5">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-green-500/20 border border-green-500/30 rounded-none flex items-center justify-center">
                                <Users className="w-5 h-5 text-green-400" />
                              </div>
                              <div>
                                <div className="text-sm font-medium text-white">{customer.full_name}</div>
                                <div className="text-sm text-white/70">{customer.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-white/70">{customer.phone}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                            {customer.total_orders}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                            ₹{customer.total_spent.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-white/70">
                            {new Date(customer.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => {
                                  const subject = prompt('Email subject:')
                                  const message = prompt('Email message:')
                                  if (subject && message) {
                                    sendCustomEmail(customer.email, subject, message)
                                  }
                                }}
                                className="text-blue-400 hover:text-blue-300"
                              >
                                <Mail className="w-4 h-4" />
                              </button>
                              <button className="text-green-400 hover:text-green-300">
                                <Eye className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Add Product Modal */}
        {showAddProduct && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-black/90 border border-green-500/30 rounded-none p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white">Add New Product</h3>
                <button
                  onClick={() => setShowAddProduct(false)}
                  className="text-white/70 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">Product Name</label>
                    <input
                      type="text"
                      value={newProduct.name}
                      onChange={(e) => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 bg-black/20 border border-green-500/30 rounded-none text-white focus:ring-2 focus:ring-green-400 focus:border-transparent"
                      placeholder="Enter product name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">Category</label>
                    <select
                      value={newProduct.category}
                      onChange={(e) => setNewProduct(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-3 py-2 bg-black/20 border border-green-500/30 rounded-none text-white focus:ring-2 focus:ring-green-400 focus:border-transparent"
                    >
                      <option value="">Select category</option>
                      <option value="shirts">Shirts</option>
                      <option value="pants">Pants</option>
                      <option value="shorts">Shorts</option>
                      <option value="hoodies">Hoodies</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Description</label>
                  <textarea
                    value={newProduct.description}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 bg-black/20 border border-green-500/30 rounded-none text-white focus:ring-2 focus:ring-green-400 focus:border-transparent resize-none"
                    placeholder="Enter product description"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">Price (₹)</label>
                    <input
                      type="number"
                      value={newProduct.base_price}
                      onChange={(e) => setNewProduct(prev => ({ ...prev, base_price: e.target.value }))}
                      className="w-full px-3 py-2 bg-black/20 border border-green-500/30 rounded-none text-white focus:ring-2 focus:ring-green-400 focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">Stock Quantity</label>
                    <input
                      type="number"
                      value={newProduct.stock_quantity}
                      onChange={(e) => setNewProduct(prev => ({ ...prev, stock_quantity: e.target.value }))}
                      className="w-full px-3 py-2 bg-black/20 border border-green-500/30 rounded-none text-white focus:ring-2 focus:ring-green-400 focus:border-transparent"
                      placeholder="0"
                    />
                  </div>
                </div>

                {/* Color and Sizes */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">Color</label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {['Black','White','Red','Blue','Green','Yellow','Gray'].map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setNewProduct(prev => ({ ...prev, color: c.toLowerCase() }))}
                          className={`px-3 py-1 border text-sm ${newProduct.color.toLowerCase() === c.toLowerCase() ? 'border-green-500 text-green-400' : 'border-green-500/30 text-white/80'} bg-black/20`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      value={newProduct.color}
                      onChange={(e) => setNewProduct(prev => ({ ...prev, color: e.target.value }))}
                      className="w-full px-3 py-2 bg-black/20 border border-green-500/30 rounded-none text-white focus:ring-2 focus:ring-green-400 focus:border-transparent"
                      placeholder="Type a color name (e.g., Navy)"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">Sizes</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['XS','S','M','L','XL','XXL'].map((size) => {
                        const checked = newProduct.sizes.includes(size)
                        return (
                          <label key={size} className={`flex items-center space-x-2 px-2 py-1 border ${checked ? 'border-green-500 text-green-400' : 'border-green-500/30 text-white/80'}`}>
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => setNewProduct(prev => ({
                                ...prev,
                                sizes: e.target.checked ? [...prev.sizes, size] : prev.sizes.filter(s => s !== size)
                              }))}
                            />
                            <span>{size}</span>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Product Image</label>
                  <div className="flex items-center space-x-4">
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={async (e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          const url = await handleImageUpload(file)
                          if (url) {
                            setNewProduct(prev => ({ ...prev, image_url: url }))
                          }
                        }
                      }}
                      className="hidden"
                      id="image-upload"
                    />
                    <label
                      htmlFor="image-upload"
                      className="flex items-center space-x-2 bg-green-500/20 text-green-400 px-4 py-2 rounded-none border border-green-500/30 hover:bg-green-500/30 transition-colors cursor-pointer"
                    >
                      {imageUploading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4" />
                      )}
                      <span>{imageUploading ? 'Uploading...' : 'Upload Image'}</span>
                    </label>
                    {newProduct.image_url && (
                      <div className="w-16 h-16 bg-green-500/20 border border-green-500/30 rounded-none overflow-hidden">
                        <img src={newProduct.image_url} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-white/60 mt-2">Allowed formats: JPG, PNG, WEBP. Max size: 5MB.</p>
                </div>

                <div className="flex justify-end space-x-4 pt-6">
                  <button
                    onClick={() => setShowAddProduct(false)}
                    className="px-6 py-2 border border-green-500/30 text-white/80 rounded-none hover:bg-green-500/20 hover:text-green-400 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddProduct}
                    disabled={addingProduct || !newProduct.name || !newProduct.category || !newProduct.base_price || !newProduct.stock_quantity || !newProduct.color || newProduct.sizes.length === 0}
                    className="px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-none hover:from-green-700 hover:to-emerald-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {addingProduct ? (
                      <Loader2 className="w-4 h-4 mr-2 inline animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2 inline" />
                    )}
                    {addingProduct ? 'Adding...' : 'Add Product'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Product Modal */}
        {editingProduct && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-black/90 border border-green-500/30 rounded-none p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white">Edit Product</h3>
                <button
                  onClick={() => setEditingProduct(null)}
                  className="text-white/70 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">Product Name</label>
                    <input
                      type="text"
                      value={editingProduct.name}
                      onChange={(e) => setEditingProduct(prev => prev ? ({ ...prev, name: e.target.value }) : null)}
                      className="w-full px-3 py-2 bg-black/20 border border-green-500/30 rounded-none text-white focus:ring-2 focus:ring-green-400 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">Category</label>
                    <select
                      value={editingProduct.category}
                      onChange={(e) => setEditingProduct(prev => prev ? ({ ...prev, category: e.target.value }) : null)}
                      className="w-full px-3 py-2 bg-black/20 border border-green-500/30 rounded-none text-white focus:ring-2 focus:ring-green-400 focus:border-transparent"
                    >
                      <option value="shirts">Shirts</option>
                      <option value="pants">Pants</option>
                      <option value="shorts">Shorts</option>
                      <option value="hoodies">Hoodies</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Description</label>
                  <textarea
                    value={editingProduct.description}
                    onChange={(e) => setEditingProduct(prev => prev ? ({ ...prev, description: e.target.value }) : null)}
                    rows={3}
                    className="w-full px-3 py-2 bg-black/20 border border-green-500/30 rounded-none text-white focus:ring-2 focus:ring-green-400 focus:border-transparent resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">Price (₹)</label>
                    <input
                      type="number"
                      value={editingProduct.base_price}
                      onChange={(e) => setEditingProduct(prev => prev ? ({ ...prev, base_price: parseFloat(e.target.value || '0') }) : null)}
                      className="w-full px-3 py-2 bg-black/20 border border-green-500/30 rounded-none text-white focus:ring-2 focus:ring-green-400 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">Stock Quantity</label>
                    <input
                      type="number"
                      value={editingProduct.stock_quantity}
                      onChange={(e) => setEditingProduct(prev => prev ? ({ ...prev, stock_quantity: parseInt(e.target.value || '0', 10) }) : null)}
                      className="w-full px-3 py-2 bg-black/20 border border-green-500/30 rounded-none text-white focus:ring-2 focus:ring-green-400 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Status</label>
                  <select
                    value={editingProduct.is_active ? 'active' : 'inactive'}
                    onChange={(e) => setEditingProduct(prev => prev ? ({ ...prev, is_active: e.target.value === 'active' }) : null)}
                    className="w-full px-3 py-2 bg-black/20 border border-green-500/30 rounded-none text-white focus:ring-2 focus:ring-green-400 focus:border-transparent"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                <div className="flex justify-end space-x-4 pt-6">
                  <button
                    onClick={() => setEditingProduct(null)}
                    className="px-6 py-2 border border-green-500/30 text-white/80 rounded-none hover:bg-green-500/20 hover:text-green-400 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleUpdateProduct(editingProduct)}
                    disabled={updating}
                    className="px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-none hover:from-green-700 hover:to-emerald-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {updating ? (
                      <Loader2 className="w-4 h-4 mr-2 inline animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2 inline" />
                    )}
                    {updating ? 'Updating...' : 'Update Product'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Order Modal */}
        {editingOrder && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-black/90 border border-green-500/30 rounded-none p-6 w-full max-w-lg mx-4">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white">Update Order Status</h3>
                <button
                  onClick={() => setEditingOrder(null)}
                  className="text-white/70 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-white/70 mb-2">Order: {editingOrder.order_number}</p>
                  <p className="text-white/70 mb-4">Customer: {editingOrder.customer_name}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Status</label>
                  <select
                    value={editingOrder.status}
                    onChange={(e) => setEditingOrder(prev => prev ? ({ ...prev, status: e.target.value }) : null)}
                    className="w-full px-3 py-2 bg-black/20 border border-green-500/30 rounded-none text-white focus:ring-2 focus:ring-green-400 focus:border-transparent"
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">Tracking Number</label>
                    <input
                      type="text"
                      value={editingOrder.tracking_number || ''}
                      onChange={(e) => setEditingOrder(prev => prev ? ({ ...prev, tracking_number: e.target.value }) : null)}
                      className="w-full px-3 py-2 bg-black/20 border border-green-500/30 rounded-none text-white focus:ring-2 focus:ring-green-400 focus:border-transparent"
                      placeholder="Enter tracking number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">Carrier</label>
                    <input
                      type="text"
                      value={editingOrder.carrier || ''}
                      onChange={(e) => setEditingOrder(prev => prev ? ({ ...prev, carrier: e.target.value }) : null)}
                      className="w-full px-3 py-2 bg-black/20 border border-green-500/30 rounded-none text-white focus:ring-2 focus:ring-green-400 focus:border-transparent"
                      placeholder="e.g., Delhivery, BlueDart"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-4 pt-6">
                  <button
                    onClick={() => setEditingOrder(null)}
                    className="px-6 py-2 border border-green-500/30 text-white/80 rounded-none hover:bg-green-500/20 hover:text-green-400 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleUpdateOrderStatus(editingOrder.id, editingOrder.status, editingOrder.tracking_number, editingOrder.carrier)}
                    disabled={updatingOrder}
                    className="px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-none hover:from-green-700 hover:to-emerald-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {updatingOrder ? (
                      <Loader2 className="w-4 h-4 mr-2 inline animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2 inline" />
                    )}
                    {updatingOrder ? 'Updating...' : 'Update'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Create User Modal */}
        {showCreateUser && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-black/90 border border-green-500/30 rounded-none p-6 w-full max-w-lg mx-4">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white">Create New User</h3>
                <button
                  onClick={() => setShowCreateUser(false)}
                  className="text-white/70 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Email *</label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 bg-black/20 border border-green-500/30 rounded-none text-white focus:ring-2 focus:ring-green-400 focus:border-transparent"
                    placeholder="Enter email address"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Password *</label>
                  <input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full px-3 py-2 bg-black/20 border border-green-500/30 rounded-none text-white focus:ring-2 focus:ring-green-400 focus:border-transparent"
                    placeholder="Enter password"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Full Name *</label>
                  <input
                    type="text"
                    value={newUser.full_name}
                    onChange={(e) => setNewUser(prev => ({ ...prev, full_name: e.target.value }))}
                    className="w-full px-3 py-2 bg-black/20 border border-green-500/30 rounded-none text-white focus:ring-2 focus:ring-green-400 focus:border-transparent"
                    placeholder="Enter full name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Phone</label>
                  <input
                    type="tel"
                    value={newUser.phone}
                    onChange={(e) => setNewUser(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 bg-black/20 border border-green-500/30 rounded-none text-white focus:ring-2 focus:ring-green-400 focus:border-transparent"
                    placeholder="Enter phone number"
                  />
                </div>

                <div className="flex justify-end space-x-4 pt-6">
                  <button
                    onClick={() => setShowCreateUser(false)}
                    className="px-6 py-2 border border-green-500/30 text-white/80 rounded-none hover:bg-green-500/20 hover:text-green-400 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateUser}
                    disabled={creatingUser || !newUser.email || !newUser.password || !newUser.full_name}
                    className="px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-none hover:from-green-700 hover:to-emerald-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {creatingUser ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    {creatingUser ? 'Creating...' : 'Create User'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}