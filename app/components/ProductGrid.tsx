'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase, Product, ProductVariant, subscribeToTable } from '@/lib/supabase'
import ProductCard from './ProductCard'
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react'

interface ProductWithVariants extends Product {
  variants: ProductVariant[]
  category_name?: string
}

export default function ProductGrid() {
  const [products, setProducts] = useState<ProductWithVariants[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  const ITEMS_PER_PAGE = 12

  const fetchProducts = useCallback(async (pageNum = 1, append = false) => {
    try {
      if (!append) {
        setLoading(true)
        setError(null)
      } else {
        setLoadingMore(true)
      }

      // Simplified query for better compatibility
      const { data: productsData, error: productsError } = await supabase
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
          product_variants(
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
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .range((pageNum - 1) * ITEMS_PER_PAGE, pageNum * ITEMS_PER_PAGE - 1)

      if (productsError) {
        throw productsError
      }

      const formattedProducts = (productsData || []).map(product => ({
        ...product,
        category: 'clothing', // Default category
        category_name: 'Clothing',
        variants: (product.product_variants || []).filter(variant => variant.is_active)
      }))

      if (append) {
        setProducts(prev => [...prev, ...formattedProducts])
      } else {
        setProducts(formattedProducts)
      }

      setHasMore(formattedProducts.length === ITEMS_PER_PAGE)
    } catch (err) {
      console.error('Error fetching products:', err)
      setError(err instanceof Error ? err.message : 'Failed to load products')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [])

  const loadMoreProducts = () => {
    if (!loadingMore && hasMore) {
      const nextPage = page + 1
      setPage(nextPage)
      fetchProducts(nextPage, true)
    }
  }

  useEffect(() => {
    fetchProducts()

    // Set up real-time subscriptions
    const productsSubscription = subscribeToTable('products', (payload) => {
      console.log('Products updated:', payload)
      // Refresh products when changes occur
      fetchProducts()
    })

    const variantsSubscription = subscribeToTable('product_variants', (payload) => {
      console.log('Product variants updated:', payload)
      // Refresh products when variants change
      fetchProducts()
    })

    return () => {
      productsSubscription.unsubscribe()
      variantsSubscription.unsubscribe()
    }
  }, [fetchProducts])

  if (loading) {
    return (
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-black">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-green-400" />
            <span className="ml-2 text-white/80">Loading products...</span>
          </div>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-black">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-16 text-center">
            <div className="bg-black/60 backdrop-blur-lg border border-green-500/30 rounded-none p-8">
              <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Error Loading Products</h3>
              <p className="text-white/70 mb-4">{error}</p>
              <button
                onClick={() => fetchProducts()}
                className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-2 rounded-none hover:from-green-700 hover:to-emerald-700 transition-colors border border-green-500/50"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section id="products" className="py-12 px-4 sm:px-6 lg:px-8 bg-black relative">
      {/* Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-green-500/10 rounded-full blur-xl"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center px-4 py-2 bg-black/60 backdrop-blur-lg rounded-none text-white text-xs font-medium mb-6 border border-green-500/50">
            <span>Featured Collection</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Premium <span className="bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">Products</span>
          </h2>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">
            Discover our carefully curated collection of premium clothing. 
            Each piece is selected for quality, style, and modern aesthetics.
          </p>
        </div>

        {/* Products Grid */}
        {products.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="bg-black/60 backdrop-blur-lg border border-green-500/30 rounded-none p-8 max-w-md mx-auto">
              <div className="text-white/60 mb-4">
                <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">No Products Available</h3>
              <p className="text-white/70">Check back soon for new arrivals!</p>
            </div>
          </div>
        )}

        {/* Load More Button */}
        {products.length > 0 && hasMore && (
          <div className="text-center mt-10">
            <button 
              onClick={loadMoreProducts}
              disabled={loadingMore}
              className="bg-black/60 backdrop-blur-lg border border-green-500/30 text-white px-8 py-3 rounded-none hover:bg-green-500/10 hover:border-green-400/50 transition-all duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center"
            >
              {loadingMore ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Loading...
                </>
              ) : (
                'Load More Products'
              )}
            </button>
          </div>
        )}
      </div>
    </section>
  )
}