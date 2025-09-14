'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useStore } from '@/store/useStore'
import { Product } from '@/lib/supabase'
import { Search, Filter, Grid, List, ShoppingCart, Heart, Star, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import Header from '@/app/components/Header'
import Footer from '@/app/components/Footer'

export default function ProductsPage() {
  const { user, isAuthenticated } = useStore()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState('name')

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching products:', error)
        // For demo purposes, show some mock products
        setProducts([
          {
            id: '1',
            name: 'Premium Cotton T-Shirt',
            description: 'Comfortable and stylish cotton t-shirt perfect for everyday wear.',
            base_price: 1299,
            category: 'T-Shirts',
            image_url: '/api/placeholder/300/400',
            stock_quantity: 50,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: '2',
            name: 'Designer Jeans',
            description: 'High-quality denim jeans with modern fit and style.',
            base_price: 2499,
            category: 'Jeans',
            image_url: '/api/placeholder/300/400',
            stock_quantity: 30,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: '3',
            name: 'Casual Hoodie',
            description: 'Warm and comfortable hoodie for casual outings.',
            base_price: 1899,
            category: 'Hoodies',
            image_url: '/api/placeholder/300/400',
            stock_quantity: 25,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: '4',
            name: 'Formal Shirt',
            description: 'Professional formal shirt for office and business meetings.',
            base_price: 1799,
            category: 'Shirts',
            image_url: '/api/placeholder/300/400',
            stock_quantity: 40,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: '5',
            name: 'Sports Jacket',
            description: 'Lightweight sports jacket for active lifestyle.',
            base_price: 3299,
            category: 'Jackets',
            image_url: '/api/placeholder/300/400',
            stock_quantity: 15,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: '6',
            name: 'Summer Dress',
            description: 'Elegant summer dress perfect for special occasions.',
            base_price: 2199,
            category: 'Dresses',
            image_url: '/api/placeholder/300/400',
            stock_quantity: 20,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ])
      } else {
        setProducts(data || [])
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return a.base_price - b.base_price
      case 'price-high':
        return b.base_price - a.base_price
      case 'name':
        return a.name.localeCompare(b.name)
      default:
        return 0
    }
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/80">Loading products...</p>
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
        <Header />
        
        <main>
          {/* Hero Section */}
          <div className="bg-black/40 backdrop-blur-lg border-b border-green-500/20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2">
                    Welcome back, {user?.full_name || 'Fashion Lover'}!
                  </h1>
                  <p className="text-white/80">Discover our latest premium collection</p>
                </div>
                <div className="mt-4 sm:mt-0">
                  <span className="inline-flex items-center px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-none text-sm font-medium text-green-400">
                    {products.length} Products Available
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mb-8">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-black/40 border border-green-500/30 rounded-none text-white placeholder-white/50 focus:ring-2 focus:ring-green-400 focus:border-green-400 backdrop-blur-sm"
                />
              </div>

              {/* Controls */}
              <div className="flex items-center gap-4">
                {/* Sort */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-3 bg-black/40 border border-green-500/30 rounded-none text-white focus:ring-2 focus:ring-green-400 focus:border-green-400 backdrop-blur-sm"
                >
                  <option value="name" className="bg-black text-white">Sort by Name</option>
                  <option value="price-low" className="bg-black text-white">Price: Low to High</option>
                  <option value="price-high" className="bg-black text-white">Price: High to Low</option>
                </select>

                {/* View Mode */}
                <div className="flex border border-green-500/30 rounded-none overflow-hidden backdrop-blur-sm">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-3 transition-colors ${viewMode === 'grid' ? 'bg-green-600 text-white' : 'bg-black/40 text-white/80 hover:bg-green-500/20'}`}
                  >
                    <Grid className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-3 transition-colors ${viewMode === 'list' ? 'bg-green-600 text-white' : 'bg-black/40 text-white/80 hover:bg-green-500/20'}`}
                  >
                    <List className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Products Grid */}
            {sortedProducts.length === 0 ? (
              <div className="text-center py-16">
                <div className="bg-black/40 backdrop-blur-lg border border-green-500/30 rounded-none p-8 max-w-md mx-auto">
                  <Search className="w-16 h-16 text-white/40 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">No products found</h3>
                  <p className="text-white/70">Try adjusting your search terms</p>
                </div>
              </div>
            ) : (
              <div className={`grid gap-6 ${
                viewMode === 'grid' 
                  ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
                  : 'grid-cols-1'
              }`}>
                {sortedProducts.map((product) => (
                  <div
                    key={product.id}
                    className={`bg-black/40 backdrop-blur-lg border border-green-500/30 rounded-none hover:border-green-400/50 transition-all duration-300 overflow-hidden group ${
                      viewMode === 'list' ? 'flex' : ''
                    }`}
                  >
                    <div className={`${viewMode === 'list' ? 'w-48 flex-shrink-0' : 'aspect-square'} relative overflow-hidden bg-green-500/10`}>
                      <img
                        src={product.image_url || '/api/placeholder/400/500'}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/api/placeholder/400/500';
                        }}
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <button className="absolute top-3 right-3 p-2 bg-black/60 hover:bg-black/80 rounded-none transition-colors backdrop-blur-sm border border-green-500/30">
                        <Heart className="w-5 h-5 text-white/80 hover:text-red-400" />
                      </button>
                      {product.stock_quantity < 10 && product.stock_quantity > 0 && (
                        <div className="absolute top-3 left-3 bg-yellow-500/90 text-black text-xs font-bold px-2 py-1 rounded-none">
                          Only {product.stock_quantity} left!
                        </div>
                      )}
                      {product.stock_quantity === 0 && (
                        <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                          <span className="text-white font-bold text-lg">OUT OF STOCK</span>
                        </div>
                      )}
                    </div>
                    
                    <div className={`p-6 ${viewMode === 'list' ? 'flex-1' : ''}`}>
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-semibold text-white text-lg group-hover:text-green-400 transition-colors">{product.name}</h3>
                        <span className="text-xs text-green-400 bg-green-500/20 border border-green-500/30 px-2 py-1 rounded-none">
                          {product.category}
                        </span>
                      </div>
                      
                      <p className="text-white/70 text-sm mb-4 line-clamp-2">
                        {product.description}
                      </p>
                      
                      <div className="flex items-center mb-4">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                          ))}
                        </div>
                        <span className="text-sm text-white/60 ml-2">(4.5)</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-2xl font-bold text-white">
                            ₹{product.base_price.toLocaleString()}
                          </span>
                          <div className="text-sm text-white/60">
                            {product.stock_quantity > 0 ? (
                              <span className="text-green-400">In Stock ({product.stock_quantity})</span>
                            ) : (
                              <span className="text-red-400">Out of Stock</span>
                            )}
                          </div>
                        </div>
                        
                        <Link
                          href={`/products/${product.id}`}
                          className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-4 py-2 rounded-none transition-all duration-200 flex items-center gap-2 border border-green-500/50 hover:border-green-400"
                        >
                          <ShoppingCart className="w-4 h-4" />
                          View Details
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
        
        <Footer />
      </div>
    </div>
  )
}