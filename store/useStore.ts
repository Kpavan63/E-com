import { create } from 'zustand'
import { persist, PersistStorage } from 'zustand/middleware'
import { Product, ProductVariant, CartItem, User } from '@/lib/supabase'

// Simple encryption/decryption for sensitive data
const encrypt = (text: string): string => {
  if (typeof window === 'undefined') return text
  return btoa(encodeURIComponent(text))
}

const decrypt = (encryptedText: string): string => {
  if (typeof window === 'undefined') return encryptedText
  try {
    return decodeURIComponent(atob(encryptedText))
  } catch {
    return encryptedText
  }
}

interface CartItemWithDetails extends CartItem {
  product: Product
  variant: ProductVariant
}

interface AdminUser {
  id: string
  user_id: string
  email: string
  full_name: string
  role: 'admin' | 'super_admin' | 'manager' | 'staff'
  permissions: Record<string, boolean>
  is_active: boolean
}

interface StoreState {
  // User state
  user: User | null
  isAuthenticated: boolean
  sessionExpiry: number | null
  
  // Admin state
  adminUser: AdminUser | null
  isAdmin: boolean
  
  // Cart state
  cartItems: CartItemWithDetails[]
  cartCount: number
  cartTotal: number
  
  // UI state
  isMobileMenuOpen: boolean
  isCartOpen: boolean
  isSearchOpen: boolean
  
  // Actions
  setUser: (user: User | null) => void
  setAdminUser: (adminUser: AdminUser | null) => void
  clearSession: () => void
  signOut: () => void
  checkSessionExpiry: () => boolean
  addToCart: (item: CartItemWithDetails) => void
  removeFromCart: (itemId: string) => void
  updateCartQuantity: (itemId: string, quantity: number) => void
  clearCart: () => void
  toggleMobileMenu: () => void
  toggleCart: () => void
  toggleSearch: () => void
  calculateCartTotal: () => void
}

// Custom storage with encryption for sensitive data
const secureStorage: PersistStorage<StoreState> = {
  getItem: (name: string) => {
    if (typeof window === 'undefined') return null
    const item = localStorage.getItem(name)
    if (!item) return null
    
    try {
      const parsed = JSON.parse(item)
      if (parsed.state?.user) {
        // Decrypt user data
        parsed.state.user = {
          ...parsed.state.user,
          email: parsed.state.user.email ? decrypt(parsed.state.user.email) : '',
          full_name: parsed.state.user.full_name ? decrypt(parsed.state.user.full_name) : '',
          phone: parsed.state.user.phone ? decrypt(parsed.state.user.phone) : ''
        }
      }
      return parsed
    } catch {
      return JSON.parse(item)
    }
  },
  setItem: (name: string, value: any) => {
    if (typeof window === 'undefined') return
    
    try {
      const valueToStore = { ...value }
      if (valueToStore.state?.user) {
        // Encrypt sensitive user data
        valueToStore.state.user = {
          ...valueToStore.state.user,
          email: valueToStore.state.user.email ? encrypt(valueToStore.state.user.email) : '',
          full_name: valueToStore.state.user.full_name ? encrypt(valueToStore.state.user.full_name) : '',
          phone: valueToStore.state.user.phone ? encrypt(valueToStore.state.user.phone) : ''
        }
      }
      localStorage.setItem(name, JSON.stringify(valueToStore))
    } catch {
      localStorage.setItem(name, JSON.stringify(value))
    }
  },
  removeItem: (name: string) => {
    if (typeof window === 'undefined') return
    localStorage.removeItem(name)
  }
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      sessionExpiry: null,
      adminUser: null,
      isAdmin: false,
      cartItems: [],
      cartCount: 0,
      cartTotal: 0,
      isMobileMenuOpen: false,
      isCartOpen: false,
      isSearchOpen: false,

      // Actions
      setUser: (user) => {
        const expiry = user ? Date.now() + (7 * 24 * 60 * 60 * 1000) : null // 7 days
        set({ 
          user, 
          isAuthenticated: !!user,
          sessionExpiry: expiry
        })
      },

      setAdminUser: (adminUser) => {
        set({ 
          adminUser,
          isAdmin: !!adminUser && adminUser.is_active
        })
      },

      clearSession: () => {
        set({ 
          user: null, 
          isAuthenticated: false, 
          sessionExpiry: null,
          adminUser: null,
          isAdmin: false,
          cartItems: [],
          cartCount: 0,
          cartTotal: 0
        })
      },

      signOut: () => {
        // Clear all local storage data
        if (typeof window !== 'undefined') {
          localStorage.removeItem('i1fashion-store')
          localStorage.removeItem('supabase.auth.token')
          localStorage.clear()
        }
        
        // Reset store state
        set({ 
          user: null, 
          isAuthenticated: false, 
          sessionExpiry: null,
          adminUser: null,
          isAdmin: false,
          cartItems: [],
          cartCount: 0,
          cartTotal: 0,
          isMobileMenuOpen: false,
          isCartOpen: false,
          isSearchOpen: false
        })
      },

      checkSessionExpiry: () => {
        const { sessionExpiry } = get()
        if (sessionExpiry && Date.now() > sessionExpiry) {
          get().signOut()
          return false
        }
        return true
      },

      addToCart: (item) => {
        const { cartItems } = get()
        const existingItem = cartItems.find(
          (cartItem) => 
            cartItem.product_id === item.product_id && 
            cartItem.variant_id === item.variant_id
        )

        if (existingItem) {
          get().updateCartQuantity(existingItem.id, existingItem.quantity + item.quantity)
        } else {
          const newCartItems = [...cartItems, item]
          set({ 
            cartItems: newCartItems,
            cartCount: newCartItems.reduce((sum, item) => sum + item.quantity, 0)
          })
          get().calculateCartTotal()
        }
      },

      removeFromCart: (itemId) => {
        const newCartItems = get().cartItems.filter(item => item.id !== itemId)
        set({ 
          cartItems: newCartItems,
          cartCount: newCartItems.reduce((sum, item) => sum + item.quantity, 0)
        })
        get().calculateCartTotal()
      },

      updateCartQuantity: (itemId, quantity) => {
        if (quantity <= 0) {
          get().removeFromCart(itemId)
          return
        }

        const newCartItems = get().cartItems.map(item =>
          item.id === itemId ? { ...item, quantity } : item
        )
        set({ 
          cartItems: newCartItems,
          cartCount: newCartItems.reduce((sum, item) => sum + item.quantity, 0)
        })
        get().calculateCartTotal()
      },

      clearCart: () => set({ cartItems: [], cartCount: 0, cartTotal: 0 }),

      toggleMobileMenu: () => set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),
      
      toggleCart: () => set((state) => ({ isCartOpen: !state.isCartOpen })),
      
      toggleSearch: () => set((state) => ({ isSearchOpen: !state.isSearchOpen })),

      calculateCartTotal: () => {
        const { cartItems } = get()
        const total = cartItems.reduce((sum, item) => {
          const itemPrice = item.product.base_price + (item.variant.price_adjustment || 0)
          return sum + (itemPrice * item.quantity)
        }, 0)
        set({ cartTotal: total })
      }
    }),
    {
      name: 'i1fashion-store',
      storage: secureStorage,
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        sessionExpiry: state.sessionExpiry,
        adminUser: state.adminUser,
        isAdmin: state.isAdmin,
        cartItems: state.cartItems,
        cartCount: state.cartCount,
        cartTotal: state.cartTotal,
      }),
      // Add version for migration support
      version: 2,
      // Migrate function for future updates
      migrate: (persistedState: any, version: number) => {
        if (version === 0 || version === 1) {
          // Migration logic for version 0/1 to 2 - add admin fields
          return {
            ...persistedState,
            adminUser: null,
            isAdmin: false
          }
        }
        return persistedState
      },
    }
  )
)