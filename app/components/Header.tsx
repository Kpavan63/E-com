'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useStore } from '@/store/useStore'
import { 
  User, 
  ShoppingCart, 
  Package, 
  Search, 
  Menu, 
  X,
  Home,
  Grid3X3
} from 'lucide-react'

export default function Header() {
  const { 
    cartCount, 
    isAuthenticated, 
    user, 
    isMobileMenuOpen, 
    toggleMobileMenu,
    toggleSearch,
    toggleCart 
  } = useStore()
  
  const [isSearchVisible, setIsSearchVisible] = useState(false)

  return (
    <>
      {/* Desktop Header */}
      <header className="hidden lg:flex items-center justify-between px-6 py-4 bg-black/80 backdrop-blur-lg border-b border-green-500/20 sticky top-0 z-50">
        {/* Left Side - Brand */}
        <div className="flex items-center">
          <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent hover:from-green-300 hover:to-emerald-400 transition-all duration-300">
            i1Fashion
          </Link>
        </div>

        {/* Right Side - Navigation */}
        <div className="flex items-center space-x-6">
          {/* Search */}
          <div className="relative">
            <button
              onClick={() => setIsSearchVisible(!isSearchVisible)}
              className="p-2 hover:bg-green-500/20 rounded-none transition-colors border border-green-500/30 hover:border-green-400/50"
            >
              <Search className="w-5 h-5 text-white/80 hover:text-green-400 transition-colors" />
            </button>
            
            {isSearchVisible && (
              <div className="absolute right-0 top-12 w-80 bg-black/90 backdrop-blur-lg shadow-2xl rounded-none border border-green-500/30 p-4">
                <div className="flex items-center space-x-2">
                  <Search className="w-4 h-4 text-green-400" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    className="flex-1 outline-none text-sm bg-transparent text-white placeholder-white/50 border-b border-green-500/30 focus:border-green-400 pb-1"
                    autoFocus
                  />
                </div>
              </div>
            )}
          </div>

          {/* Profile */}
          <Link 
            href={isAuthenticated ? "/profile" : "/auth/login"}
            className="p-2 hover:bg-green-500/20 rounded-none transition-colors relative border border-green-500/30 hover:border-green-400/50"
          >
            <User className="w-5 h-5 text-white/80 hover:text-green-400 transition-colors" />
            {isAuthenticated && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            )}
          </Link>

          {/* Cart */}
          <Link
            href="/cart"
            className="p-2 hover:bg-green-500/20 rounded-none transition-colors relative border border-green-500/30 hover:border-green-400/50"
          >
            <ShoppingCart className="w-5 h-5 text-white/80 hover:text-green-400 transition-colors" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs rounded-none w-5 h-5 flex items-center justify-center border border-green-400/50">
                {cartCount}
              </span>
            )}
          </Link>

          {/* Orders */}
          <Link 
            href="/orders"
            className="p-2 hover:bg-green-500/20 rounded-none transition-colors border border-green-500/30 hover:border-green-400/50"
          >
            <Package className="w-5 h-5 text-white/80 hover:text-green-400 transition-colors" />
          </Link>
        </div>
      </header>

      {/* Mobile Header */}
      <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-black/80 backdrop-blur-lg border-b border-green-500/20 sticky top-0 z-50">
        {/* Left Side - Brand */}
        <Link href="/" className="text-xl font-bold bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
          i1Fashion
        </Link>

        {/* Right Side - Profile Only */}
        <Link 
          href={isAuthenticated ? "/profile" : "/auth/login"}
          className="p-2 hover:bg-green-500/20 rounded-none transition-colors relative border border-green-500/30"
        >
          <User className="w-5 h-5 text-white/80" />
          {isAuthenticated && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          )}
        </Link>
      </header>

      {/* Mobile Bottom Navigation Dock - Enhanced */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-xl border-t-2 border-green-500/40 z-50 shadow-2xl">
        <div className="flex items-center justify-around py-3 px-2">
          {/* Home */}
          <Link 
            href={isAuthenticated ? "/products" : "/"}
            className="flex flex-col items-center py-2 px-3 text-white/80 hover:text-green-400 transition-all duration-200 hover:scale-110 active:scale-95"
          >
            <div className="relative">
              <Home className="w-6 h-6" />
              <div className="absolute inset-0 bg-green-400/20 rounded-full blur-sm opacity-0 hover:opacity-100 transition-opacity"></div>
            </div>
            <span className="text-xs mt-1 font-medium">Home</span>
          </Link>

          {/* Products/Categories */}
          <Link 
            href="/products"
            className="flex flex-col items-center py-2 px-3 text-white/80 hover:text-green-400 transition-all duration-200 hover:scale-110 active:scale-95"
          >
            <div className="relative">
              <Package className="w-6 h-6" />
              <div className="absolute inset-0 bg-green-400/20 rounded-full blur-sm opacity-0 hover:opacity-100 transition-opacity"></div>
            </div>
            <span className="text-xs mt-1 font-medium">Products</span>
          </Link>

          {/* Cart */}
          <Link
            href="/cart"
            className="flex flex-col items-center py-2 px-3 text-white/80 hover:text-green-400 transition-all duration-200 hover:scale-110 active:scale-95 relative"
          >
            <div className="relative">
              <ShoppingCart className="w-6 h-6" />
              <div className="absolute inset-0 bg-green-400/20 rounded-full blur-sm opacity-0 hover:opacity-100 transition-opacity"></div>
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center border-2 border-black font-bold animate-pulse">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </div>
            <span className="text-xs mt-1 font-medium">Cart</span>
          </Link>

          {/* Orders */}
          <Link 
            href="/orders"
            className="flex flex-col items-center py-2 px-3 text-white/80 hover:text-green-400 transition-all duration-200 hover:scale-110 active:scale-95"
          >
            <div className="relative">
              <Package className="w-6 h-6" />
              <div className="absolute inset-0 bg-green-400/20 rounded-full blur-sm opacity-0 hover:opacity-100 transition-opacity"></div>
            </div>
            <span className="text-xs mt-1 font-medium">Orders</span>
          </Link>

          {/* Profile */}
          <Link 
            href={isAuthenticated ? "/profile" : "/auth/login"}
            className="flex flex-col items-center py-2 px-3 text-white/80 hover:text-green-400 transition-all duration-200 hover:scale-110 active:scale-95 relative"
          >
            <div className="relative">
              <User className="w-6 h-6" />
              <div className="absolute inset-0 bg-green-400/20 rounded-full blur-sm opacity-0 hover:opacity-100 transition-opacity"></div>
              {isAuthenticated && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse border-2 border-black"></div>
              )}
            </div>
            <span className="text-xs mt-1 font-medium">Profile</span>
          </Link>
        </div>
        
        {/* Bottom safe area for newer phones */}
        <div className="h-safe-area-inset-bottom bg-black/95"></div>
      </nav>

      {/* Mobile Search Modal */}
      {isSearchVisible && (
        <div className="lg:hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-50">
          <div className="bg-black/90 backdrop-blur-lg m-4 rounded-none border border-green-500/30 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Search Products</h3>
              <button
                onClick={() => setIsSearchVisible(false)}
                className="p-1 hover:bg-green-500/20 rounded-none border border-green-500/30"
              >
                <X className="w-5 h-5 text-white/80" />
              </button>
            </div>
            <div className="flex items-center space-x-2 border border-green-500/30 rounded-none px-3 py-2 bg-black/50">
              <Search className="w-4 h-4 text-green-400" />
              <input
                type="text"
                placeholder="Search products..."
                className="flex-1 outline-none bg-transparent text-white placeholder-white/50"
                autoFocus
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}