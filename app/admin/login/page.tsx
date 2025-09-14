'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useStore } from '@/store/useStore'
import { 
  Lock, 
  Shield, 
  CheckCircle,
  AlertTriangle,
  Loader2,
  Package,
  ShoppingCart,
  Users,
  BarChart3
} from 'lucide-react'

const adminLoginSchema = z.object({
  pin: z.string().length(4, 'PIN must be exactly 4 digits').regex(/^\d{4}$/, 'PIN must contain only numbers'),
})

type AdminLoginFormData = z.infer<typeof adminLoginSchema>

export default function AdminLoginPage() {
  const router = useRouter()
  const { setUser, setAdminUser } = useStore()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<AdminLoginFormData>({
    resolver: zodResolver(adminLoginSchema)
  })

  const onSubmit = async (data: AdminLoginFormData) => {
    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: data.pin }),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'Login failed')
        return
      }

      if (result.success) {
        setUser(result.user)
        setAdminUser(result.adminUser)

        // Persist admin status across refreshes
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('i1fashion-is-admin', 'true')
            localStorage.setItem('i1fashion-admin-user', JSON.stringify(result.adminUser))
            localStorage.setItem('i1fashion-admin-login-time', Date.now().toString())
          } catch {}
        }

        setSuccess('Admin login successful! Redirecting to dashboard...')
        setTimeout(() => router.push('/admin'), 1200)
      }
    } catch (err) {
      console.error('Admin login error:', err)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-24 -left-24 w-[28rem] h-[28rem] bg-gradient-to-br from-red-400/25 via-orange-500/15 to-transparent rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-[26rem] h-[26rem] bg-gradient-to-tl from-red-500/25 via-pink-400/20 to-transparent rounded-full blur-2xl" />
        <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-56 h-56 bg-gradient-to-r from-orange-300/10 to-red-400/10 rounded-full blur-[80px]" />
      </div>

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 min-h-screen">
        {/* Left panel: content/branding */}
        <aside className="hidden lg:flex flex-col justify-between px-12 py-10 border-r border-red-500/20 bg-black/30">
          <div>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-orange-500 flex items-center justify-center border border-red-500/40">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-red-400 to-orange-300 bg-clip-text text-transparent">
                i1Fashion Admin
              </h1>
            </div>

            <div className="mt-10">
              <h2 className="text-3xl font-extrabold text-white leading-tight">
                Control Center for Operations
              </h2>
              <p className="mt-3 text-white/70 max-w-md">
                Manage products, orders, customers and analytics with an optimized, secure admin workspace.
              </p>

              <div className="mt-8 grid grid-cols-2 gap-4 max-w-xl">
                <div className="bg-black/40 border border-red-500/20 p-4">
                  <div className="flex items-center space-x-3">
                    <Package className="w-5 h-5 text-red-300" />
                    <div>
                      <p className="text-white font-semibold">Catalog</p>
                      <p className="text-xs text-white/60">Products & inventory</p>
                    </div>
                  </div>
                </div>
                <div className="bg-black/40 border border-red-500/20 p-4">
                  <div className="flex items-center space-x-3">
                    <ShoppingCart className="w-5 h-5 text-orange-300" />
                    <div>
                      <p className="text-white font-semibold">Orders</p>
                      <p className="text-xs text-white/60">End-to-end tracking</p>
                    </div>
                  </div>
                </div>
                <div className="bg-black/40 border border-red-500/20 p-4">
                  <div className="flex items-center space-x-3">
                    <Users className="w-5 h-5 text-pink-300" />
                    <div>
                      <p className="text-white font-semibold">Customers</p>
                      <p className="text-xs text-white/60">Profiles & segments</p>
                    </div>
                  </div>
                </div>
                <div className="bg-black/40 border border-red-500/20 p-4">
                  <div className="flex items-center space-x-3">
                    <BarChart3 className="w-5 h-5 text-amber-300" />
                    <div>
                      <p className="text-white font-semibold">Analytics</p>
                      <p className="text-xs text-white/60">KPIs & growth</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10">
            <div className="bg-black/40 border border-red-500/30 p-4">
              <div className="flex items-start space-x-3">
                <Shield className="w-5 h-5 text-red-300 mt-0.5" />
                <div className="text-sm text-white/80">
                  <p className="font-semibold text-white">Security</p>
                  <p className="mt-1">Restricted area. All admin access is monitored and logged.</p>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Right panel: login form */}
        <main className="flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-md">
            <div className="bg-black/80 backdrop-blur-lg border-2 border-red-500/50 rounded-none p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 via-orange-500/5 to-red-500/10 pointer-events-none" />
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-400 to-transparent" />
              <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-400 to-transparent" />

              <div className="relative z-10">
                <div className="mb-8">
                  <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-orange-600 flex items-center justify-center shadow-lg border border-red-500/50 relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-red-400/20 to-orange-600/20 animate-pulse" />
                    <Shield className="w-8 h-8 text-white relative z-10" />
                  </div>
                  <h2 className="mt-4 text-2xl font-bold text-white">Admin Portal</h2>
                  <p className="text-white/80">Secure access to i1Fashion admin dashboard</p>
                </div>

                {success && (
                  <div className="bg-green-500/20 border border-green-500/50 p-4 mb-6 animate-in slide-in-from-top duration-300">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      <p className="text-green-200 text-sm">{success}</p>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="bg-red-500/20 border border-red-500/50 p-4 mb-6 animate-in slide-in-from-top duration-300">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="w-5 h-5 text-red-400" />
                      <p className="text-red-200 text-sm">{error}</p>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div className="space-y-2">
                    <label className="block text-white/90 text-sm font-medium">Admin PIN</label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 w-5 h-5 group-focus-within:text-red-400 transition-colors" />
                      <input
                        {...register('pin')}
                        type="password"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        maxLength={4}
                        className="w-full pl-12 pr-4 py-3 bg-black/50 border-2 border-red-500/30 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-400 backdrop-blur-sm transition-all duration-200 hover:bg-black/70 hover:border-red-400/60 text-center text-2xl tracking-widest"
                        placeholder="••••"
                        onInput={(e) => {
                          const target = e.target as HTMLInputElement
                          target.value = target.value.replace(/[^0-9]/g, '')
                        }}
                      />
                    </div>
                    {errors.pin && (
                      <p className="text-red-400 text-sm mt-1 animate-in slide-in-from-left duration-200">{errors.pin.message}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-red-600 to-orange-600 text-white py-3 px-6 rounded-none font-semibold hover:from-red-700 hover:to-orange-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl border border-red-500/50 hover:border-red-400 relative overflow-hidden group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-red-400/0 via-red-400/20 to-red-400/0 -translate-x-full group-hover:translate-x-0 transition-transform duration-700" />
                    {isLoading ? (
                      <div className="flex items-center justify-center space-x-2 relative z-10">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Authenticating...</span>
                      </div>
                    ) : (
                      <span className="relative z-10 flex items-center justify-center space-x-2">
                        <Shield className="w-5 h-5" />
                        <span>Access Admin Dashboard</span>
                      </span>
                    )}
                  </button>
                </form>

                <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30">
                  <div className="flex items-start space-x-3">
                    <Shield className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-blue-200">
                      <p className="font-medium mb-1">Admin Access PIN</p>
                      <p>
                        PIN: <span className="font-mono bg-blue-500/20 px-3 py-2 rounded text-lg tracking-widest">6300</span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/30">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-yellow-200">
                      <p className="font-medium mb-1">Security Notice</p>
                      <p>
                        This is a restricted area. Only authorized administrators can access this portal. All login attempts are logged and monitored.
                      </p>
                    </div>
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
