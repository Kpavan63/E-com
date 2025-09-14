'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Product, ProductVariant } from '@/lib/supabase'
import { ShoppingCart, Eye } from 'lucide-react'
import { useStore } from '@/store/useStore'

interface ProductCardProps {
  product: Product & {
    variants: ProductVariant[]
  }
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useStore()
  const [isHovered, setIsHovered] = useState(false)

  // Get available colors from variants
  const availableColors = [...new Set(product.variants.map(v => v.color))]
  
  // Check if product is in stock
  const isInStock = product.variants.some(v => v.stock_quantity > 0)
  
  // Get the lowest price (base price + minimum variant adjustment)
  const minPriceAdjustment = Math.min(...product.variants.map(v => v.price_adjustment || 0))
  const displayPrice = product.base_price + minPriceAdjustment

  const handleQuickAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Find the first available variant
    const availableVariant = product.variants.find(v => v.stock_quantity > 0)
    if (!availableVariant) return

    // For demo purposes, we'll create a mock cart item
    // In a real app, this would be handled differently
    const cartItem = {
      id: `cart-${Date.now()}`,
      user_id: 'demo-user',
      product_id: product.id,
      variant_id: availableVariant.id,
      quantity: 1,
      created_at: new Date().toISOString(),
      product: product,
      variant: availableVariant
    }

    addToCart(cartItem)
  }

  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Navigate to product page
    window.location.href = `/products/${product.id}`
  }

  return (
    <div 
      className="group relative bg-black/60 backdrop-blur-lg border border-green-500/30 rounded-none hover:border-green-400/60 transition-all duration-300 overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link href={`/products/${product.id}`}>
        {/* Product Image */}
        <div className="relative aspect-[3/4] overflow-hidden bg-black/40">
          <Image
            src={product.image_url || '/placeholder-product.jpg'}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          />
          
          {/* Out of Stock Overlay */}
          {!isInStock && (
            <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center">
              <span className="text-white font-semibold text-lg">Out of Stock</span>
            </div>
          )}

          {/* Quick Actions Overlay */}
          {isInStock && (
            <div className={`absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center space-x-4 transition-opacity duration-300 ${
              isHovered ? 'opacity-100' : 'opacity-0'
            }`}>
              <button
                onClick={handleQuickAddToCart}
                className="bg-green-600 hover:bg-green-700 text-white p-3 rounded-none border border-green-500/50 transition-colors"
                title="Add to Cart"
              >
                <ShoppingCart className="w-5 h-5" />
              </button>
              <button
                onClick={handleQuickView}
                className="bg-black/80 hover:bg-black text-white p-3 rounded-none border border-green-500/50 hover:border-green-400 transition-colors"
                title="Quick View"
              >
                <Eye className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="p-3 sm:p-4">
          {/* Product Name */}
          <h3 className="font-semibold text-white mb-2 text-sm sm:text-base line-clamp-2 group-hover:text-green-400 transition-colors">
            {product.name}
          </h3>

          {/* Price */}
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <span className="text-base sm:text-lg font-bold text-green-400">
              ₹{displayPrice.toFixed(2)}
            </span>
            {product.variants.length > 1 && (
              <span className="text-xs sm:text-sm text-white/60">
                + variants
              </span>
            )}
          </div>

          {/* Available Colors - Hidden on mobile for space */}
          {availableColors.length > 0 && (
            <div className="hidden sm:flex items-center space-x-1 mb-2">
              <span className="text-xs text-white/60 mr-2">Colors:</span>
              {availableColors.slice(0, 3).map((color, index) => (
                <div
                  key={index}
                  className="w-3 h-3 sm:w-4 sm:h-4 rounded-none border border-green-500/30"
                  style={{ 
                    backgroundColor: color.toLowerCase() === 'white' ? '#ffffff' : 
                                   color.toLowerCase() === 'black' ? '#000000' :
                                   color.toLowerCase() === 'gray' ? '#808080' :
                                   color.toLowerCase() === 'grey' ? '#808080' :
                                   color.toLowerCase() === 'blue' ? '#3b82f6' :
                                   color.toLowerCase() === 'navy' ? '#1e3a8a' :
                                   color.toLowerCase() === 'khaki' ? '#c4a484' :
                                   color.toLowerCase() === 'olive' ? '#808000' :
                                   color.toLowerCase()
                  }}
                  title={color}
                />
              ))}
              {availableColors.length > 3 && (
                <span className="text-xs text-white/60">+{availableColors.length - 3}</span>
              )}
            </div>
          )}

          {/* Stock Status */}
          <div className="flex items-center justify-between">
            <span className={`text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-none border ${
              isInStock 
                ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                : 'bg-red-500/20 text-red-400 border-red-500/30'
            }`}>
              {isInStock ? 'In Stock' : 'Out of Stock'}
            </span>
            
            {/* Category */}
            <span className="text-xs text-white/60 capitalize">
              {product.category}
            </span>
          </div>
        </div>
      </Link>
    </div>
  )
}