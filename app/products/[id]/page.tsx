'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { supabase, Product, ProductVariant } from '@/lib/supabase'
import { useStore } from '@/store/useStore'
import { useNotifications } from '@/app/components/NotificationSystem'
import { 
  ArrowLeft, 
  ShoppingCart, 
  Heart, 
  Share2, 
  Star, 
  Truck, 
  Shield, 
  RotateCcw,
  Loader2,
  AlertCircle,
  Plus,
  Minus,
  Zap
} from 'lucide-react'

interface ProductWithVariants extends Product {
  variants: ProductVariant[]
}

// 🚀 PERFORMANCE CACHE - In-memory cache for lightning-fast access
const productCache = new Map<string, { data: ProductWithVariants; timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes cache

// 🚀 PREFETCH QUEUE - Preload related products
const prefetchQueue = new Set<string>()

export default function ProductPage() {
  const params = useParams()
  const router = useRouter()
  const { addToCart, cartCount } = useStore()
  const { addNotification } = useNotifications()
  const [product, setProduct] = useState<ProductWithVariants | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null)
  const [selectedColor, setSelectedColor] = useState<string>('')
  const [selectedSize, setSelectedSize] = useState<string>('')
  const [quantity, setQuantity] = useState(1)
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [fetchTime, setFetchTime] = useState<number>(0)
  const [isAddingToCart, setIsAddingToCart] = useState(false)

  // 🚀 OPTIMIZED FETCH with multiple performance strategies
  const fetchProduct = useCallback(async (productId: string) => {
    const startTime = performance.now()
    
    try {
      setLoading(true)
      setError(null)

      // 🚀 STRATEGY 1: Check cache first (INSTANT)
      const cached = productCache.get(productId)
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        console.log('🚀 CACHE HIT - Lightning fast load!')
        setProduct(cached.data)
        setFetchTime(performance.now() - startTime)
        
        // Set default selections
        if (cached.data.variants.length > 0) {
          const firstVariant = cached.data.variants[0]
          setSelectedColor(firstVariant.color)
          setSelectedSize(firstVariant.size)
          setSelectedVariant(firstVariant)
        }
        setLoading(false)
        return
      }

      // 🚀 STRATEGY 2: Try to fetch product with variants first, then without variants
      let productData = null
      
      try {
        // First try with variants
        const { data: productWithVariants, error: variantError } = await supabase
          .from('products')
          .select(`
            id,
            name,
            description,
            base_price,
            category_id,
            image_url,
            stock_quantity,
            is_active,
            created_at,
            updated_at,
            variants:product_variants(
              id,
              product_id,
              color,
              size,
              stock_quantity,
              price_adjustment,
              is_active,
              created_at
            )
          `)
          .eq('id', productId)
          .eq('is_active', true)
          .single()

        if (productWithVariants) {
          productData = productWithVariants
        }
      } catch (variantError) {
        console.log('Product with variants not found, trying without variants...')
      }

      // If no product with variants, try without variants
      if (!productData) {
        try {
          const { data: productOnly, error: productError } = await supabase
            .from('products')
            .select(`
              id,
              name,
              description,
              base_price,
              category_id,
              image_url,
              stock_quantity,
              is_active,
              created_at,
              updated_at
            `)
            .eq('id', productId)
            .eq('is_active', true)
            .single()

          if (productOnly) {
            productData = {
              ...productOnly,
              variants: [] // No variants available
            }
          }
        } catch (productError) {
          console.error('Product not found:', productError)
        }
      }

      if (productData) {
        // Resolve category name from categories table
        let categoryName = 'Category'
        try {
          if ((productData as any).category_id) {
            const { data: cat } = await supabase
              .from('categories')
              .select('name')
              .eq('id', (productData as any).category_id)
              .single()
            if (cat?.name) categoryName = cat.name
          }
        } catch (catErr) {
          // ignore category errors
        }

        // Add missing fields for TypeScript compatibility
        const productWithDefaults = {
          ...productData,
          category: categoryName,
          created_at: productData.created_at || new Date().toISOString(),
          updated_at: productData.updated_at || new Date().toISOString(),
          variants: (productData.variants || []).map(variant => ({
            ...variant,
            created_at: variant.created_at || new Date().toISOString()
          }))
        }

        // 🚀 STRATEGY 4: Cache the result for future requests
        productCache.set(productId, {
          data: productWithDefaults,
          timestamp: Date.now()
        })

        setProduct(productWithDefaults)
        setFetchTime(performance.now() - startTime)
        
        // Set default selections
        if (productWithDefaults.variants.length > 0) {
          const firstVariant = productWithDefaults.variants[0]
          setSelectedColor(firstVariant.color)
          setSelectedSize(firstVariant.size)
          setSelectedVariant(firstVariant)
        } else {
          // Create a default variant for products without variants
          const defaultVariant = {
            id: 'default',
            product_id: productData.id,
            color: 'default',
            size: 'one-size',
            stock_quantity: productData.stock_quantity,
            price_adjustment: 0,
            is_active: true,
            created_at: new Date().toISOString()
          }
          setSelectedVariant(defaultVariant)
          setSelectedColor('default')
          setSelectedSize('one-size')
        }

        // Show success notification
        addNotification({
          type: 'success',
          title: 'Product Loaded',
          message: `${productData.name} loaded successfully`,
          duration: 3000
        })

        // 🚀 STRATEGY 5: Background prefetch related products
        try {
          const { data: relatedProducts } = await supabase
            .from('products')
            .select('id, category_id')
            .eq('is_active', true)
            .eq('category_id', (productData as any).category_id)
            .neq('id', productId)
            .limit(3)

          if (relatedProducts) {
            relatedProducts.forEach(p => {
              if (!prefetchQueue.has(p.id)) {
                prefetchQueue.add(p.id)
                // Prefetch in background without blocking UI
                setTimeout(() => prefetchProduct(p.id), 100)
              }
            })
          }
        } catch (relatedError) {
          console.log('Failed to fetch related products')
        }

      } else {
        addNotification({
          type: 'error',
          title: 'Product Not Found',
          message: 'The product you are looking for does not exist or is no longer available',
          duration: 5000
        })
        throw new Error('Product not found in database')
      }

    } catch (err) {
      console.error('Error fetching product:', err)
      setError('Product not found')
      setFetchTime(performance.now() - startTime)
    } finally {
      setLoading(false)
    }
  }, [])

  // 🚀 Background prefetch function
  const prefetchProduct = useCallback(async (productId: string) => {
    try {
      const { data } = await supabase
        .from('products')
        .select(`
          id,
          name,
          description,
          base_price,
          category_id,
          image_url,
          stock_quantity,
          is_active,
          created_at,
          updated_at,
          variants:product_variants!inner(
            id,
            product_id,
            color,
            size,
            stock_quantity,
            price_adjustment,
            is_active,
            created_at
          )
        `)
        .eq('id', productId)
        .eq('is_active', true)
        .eq('variants.is_active', true)
        .single()

      if (data) {
        // Resolve category name
        let categoryName = 'Category'
        try {
          if ((data as any).category_id) {
            const { data: cat } = await supabase
              .from('categories')
              .select('name')
              .eq('id', (data as any).category_id)
              .single()
            if (cat?.name) categoryName = cat.name
          }
        } catch {}

        // Add missing fields for TypeScript compatibility
        const productWithDefaults = {
          ...data,
          category: categoryName,
          created_at: data.created_at || new Date().toISOString(),
          updated_at: data.updated_at || new Date().toISOString(),
          variants: (data.variants || []).map(variant => ({
            ...variant,
            created_at: variant.created_at || new Date().toISOString()
          }))
        }

        productCache.set(productId, {
          data: productWithDefaults,
          timestamp: Date.now()
        })
        console.log(`🚀 Prefetched product ${productId}`)
      }
    } catch (error) {
      console.log(`Failed to prefetch product ${productId}`)
    }
  }, [])

  useEffect(() => {
    if (params.id) {
      fetchProduct(params.id as string)
    }
  }, [params.id, fetchProduct])

  
  const handleVariantChange = (color: string, size: string) => {
    const variant = product?.variants.find(v => v.color === color && v.size === size)
    if (variant) {
      setSelectedVariant(variant)
      setSelectedColor(color)
      setSelectedSize(size)
    }
  }

  const handleAddToCart = async () => {
    if (!product || !selectedVariant || isAddingToCart) return

    setIsAddingToCart(true)

    try {
      // Real API call to add item to cart
      const { user } = useStore.getState()
      
      if (!user) {
        addNotification({
          type: 'warning',
          title: 'Login Required',
          message: 'Please login to add items to your cart',
          duration: 4000
        })
        router.push('/auth/login')
        return
      }

      const cartItem = {
        id: `cart-${Date.now()}`,
        user_id: user.id,
        product_id: product.id,
        variant_id: selectedVariant.id,
        quantity: quantity,
        created_at: new Date().toISOString(),
        product: product,
        variant: selectedVariant
      }

      // Add to local cart store
      addToCart(cartItem)

      // Optionally sync with Supabase cart table
      try {
        await supabase
          .from('cart_items')
          .upsert({
            user_id: user.id,
            product_id: product.id,
            variant_id: selectedVariant.id,
            quantity: quantity,
            unit_price: getCurrentPrice()
          }, {
            onConflict: 'user_id,product_id,variant_id'
          })
      } catch (dbError) {
        console.log('Cart sync to database failed, but item added to local cart')
      }

      // Show success notification
      addNotification({
        type: 'success',
        title: 'Added to Cart!',
        message: `${product.name} (${selectedColor}, ${selectedSize}) x${quantity} added to your cart`,
        duration: 4000,
        action: {
          label: 'View Cart',
          onClick: () => router.push('/cart')
        }
      })

      // Show success state briefly
      await new Promise(resolve => setTimeout(resolve, 500))
      
    } catch (error) {
      console.error('Error adding to cart:', error)
      addNotification({
        type: 'error',
        title: 'Failed to Add to Cart',
        message: 'Something went wrong. Please try again.',
        duration: 4000
      })
    } finally {
      setIsAddingToCart(false)
    }
  }

  const getAvailableColors = () => {
    if (!product) return []
    return [...new Set(product.variants.map(v => v.color))]
  }

  const getAvailableSizes = (color: string) => {
    if (!product) return []
    return product.variants
      .filter(v => v.color === color && v.stock_quantity > 0)
      .map(v => v.size)
  }

  const getCurrentPrice = () => {
    if (!product || !selectedVariant) return product?.base_price || 0
    return product.base_price + (selectedVariant.price_adjustment || 0)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-green-400 mx-auto mb-4" />
          <p className="text-white/80">Loading product...</p>
        </div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Product Not Found</h2>
          <p className="text-white/70 mb-6">The product you&apos;re looking for doesn&apos;t exist.</p>
          <Link
            href="/"
            className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-none hover:from-green-700 hover:to-emerald-700 transition-colors border border-green-500/50"
          >
            Back to Home
          </Link>
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
              <button
                onClick={() => router.back()}
                className="flex items-center text-white/80 hover:text-green-400 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back
              </button>
              <div className="flex items-center space-x-4">
                {/* Cart Icon */}
                <Link
                  href="/cart"
                  className="p-2 rounded-none border border-green-500/30 text-white/80 hover:border-green-400/50 transition-colors relative"
                >
                  <ShoppingCart className="w-5 h-5" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs rounded-none w-5 h-5 flex items-center justify-center border border-green-400/50">
                      {cartCount}
                    </span>
                  )}
                </Link>
                <button
                  onClick={() => setIsWishlisted(!isWishlisted)}
                  className={`p-2 rounded-none border transition-colors ${
                    isWishlisted 
                      ? 'bg-green-600 border-green-500 text-white' 
                      : 'border-green-500/30 text-white/80 hover:border-green-400/50'
                  }`}
                >
                  <Heart className="w-5 h-5" />
                </button>
                <button className="p-2 rounded-none border border-green-500/30 text-white/80 hover:border-green-400/50 transition-colors">
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            
            {/* Product Image */}
            <div className="space-y-4">
              <div className="relative aspect-[3/4] bg-black/40 border border-green-500/30 rounded-none overflow-hidden">
                <Image
                  src={product.image_url || '/placeholder-product.jpg'}
                  alt={product.name}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </div>

            {/* Product Details */}
            <div className="space-y-6">
              {/* Product Info */}
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 border border-green-500/30 rounded-none">
                    {product.category}
                  </span>
                  {/* 🚀 PERFORMANCE INDICATOR */}
                  {fetchTime > 0 && (
                    <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-none flex items-center space-x-1">
                      <Zap className="w-3 h-3" />
                      <span>{fetchTime.toFixed(0)}ms</span>
                    </span>
                  )}
                  <div className="flex items-center space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                    ))}
                    <span className="text-white/60 text-sm ml-2">(4.8)</span>
                  </div>
                </div>
                
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
                  {product.name}
                </h1>
                
                <div className="flex items-center space-x-4 mb-6">
                  <span className="text-3xl font-bold text-green-400">
                    ₹{getCurrentPrice().toFixed(2)}
                  </span>
                  {selectedVariant?.price_adjustment && selectedVariant.price_adjustment > 0 && (
                    <span className="text-lg text-white/60 line-through">
                      ₹{product.base_price.toFixed(2)}
                    </span>
                  )}
                </div>

                <p className="text-white/80 leading-relaxed">
                  {product.description}
                </p>
              </div>

              {/* Color Selection */}
              <div>
                <h3 className="text-white font-semibold mb-3">Color: <span className="text-green-400 capitalize">{selectedColor}</span></h3>
                <div className="flex items-center space-x-3">
                  {getAvailableColors().map((color) => (
                    <button
                      key={color}
                      onClick={() => {
                        setSelectedColor(color)
                        const availableSizes = getAvailableSizes(color)
                        if (availableSizes.length > 0) {
                          handleVariantChange(color, availableSizes[0])
                          setSelectedSize(availableSizes[0])
                        }
                      }}
                      className={`w-10 h-10 rounded-none border-2 transition-all ${
                        selectedColor === color 
                          ? 'border-green-400 scale-110' 
                          : 'border-green-500/30 hover:border-green-400/50'
                      }`}
                      style={{ 
                        backgroundColor: color.toLowerCase() === 'white' ? '#ffffff' : 
                                       color.toLowerCase() === 'black' ? '#000000' :
                                       color.toLowerCase() === 'gray' ? '#808080' :
                                       color.toLowerCase() === 'grey' ? '#808080' :
                                       color.toLowerCase()
                      }}
                      title={color}
                    />
                  ))}
                </div>
              </div>

              {/* Size Selection */}
              <div>
                <h3 className="text-white font-semibold mb-3">Size: <span className="text-green-400">{selectedSize}</span></h3>
                <div className="flex items-center space-x-3">
                  {getAvailableSizes(selectedColor).map((size) => (
                    <button
                      key={size}
                      onClick={() => handleVariantChange(selectedColor, size)}
                      className={`px-4 py-2 border rounded-none transition-all ${
                        selectedSize === size 
                          ? 'border-green-400 bg-green-500/20 text-green-400' 
                          : 'border-green-500/30 text-white/80 hover:border-green-400/50'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity */}
              <div>
                <h3 className="text-white font-semibold mb-3">Quantity</h3>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center border border-green-500/30 rounded-none">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="p-2 text-white/80 hover:text-green-400 transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="px-4 py-2 text-white font-semibold">{quantity}</span>
                    <button
                      onClick={() => setQuantity(Math.min(selectedVariant?.stock_quantity || 1, quantity + 1))}
                      className="p-2 text-white/80 hover:text-green-400 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <span className="text-white/60 text-sm">
                    {selectedVariant?.stock_quantity} available
                  </span>
                </div>
              </div>

              {/* Add to Cart */}
              <div className="space-y-4">
                <button
                  onClick={handleAddToCart}
                  disabled={!selectedVariant || selectedVariant.stock_quantity === 0 || isAddingToCart}
                  className={`w-full py-4 px-6 rounded-none font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed border relative overflow-hidden group ${
                    isAddingToCart 
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 border-blue-500/50' 
                      : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 border-green-500/50'
                  } text-white`}
                >
                  {/* Shimmer Effect */}
                  <div className={`absolute inset-0 bg-gradient-to-r from-green-400/0 via-green-400/20 to-green-400/0 translate-x-[-100%] transition-transform duration-700 ${
                    !isAddingToCart ? 'group-hover:translate-x-[100%]' : ''
                  }`}></div>
                  
                  {/* Loading Wave Effect */}
                  {isAddingToCart && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse"></div>
                  )}
                  
                  <div className="flex items-center justify-center space-x-2 relative z-10">
                    {isAddingToCart ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Adding to Cart...</span>
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-5 h-5" />
                        <span>Add to Cart</span>
                      </>
                    )}
                  </div>
                  
                  {/* Progress Bar */}
                  {isAddingToCart && (
                    <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-blue-400 to-purple-400 w-full">
                      <div className="h-full bg-gradient-to-r from-white/50 to-transparent animate-pulse"></div>
                    </div>
                  )}
                </button>
              </div>

              {/* Features */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-green-500/20">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-500/20 border border-green-500/30 rounded-none flex items-center justify-center">
                    <Truck className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <div className="text-white font-semibold text-sm">Free Shipping</div>
                    <div className="text-white/60 text-xs">On orders over ₹999</div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-500/20 border border-green-500/30 rounded-none flex items-center justify-center">
                    <Shield className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <div className="text-white font-semibold text-sm">Secure Payment</div>
                    <div className="text-white/60 text-xs">100% protected</div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-500/20 border border-green-500/30 rounded-none flex items-center justify-center">
                    <RotateCcw className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <div className="text-white font-semibold text-sm">Easy Returns</div>
                    <div className="text-white/60 text-xs">30-day policy</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}