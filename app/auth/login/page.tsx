'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'
import { useStore } from '@/store/useStore'
import { 
  Eye, 
  EyeOff, 
  Mail, 
  Lock, 
  ArrowLeft, 
  Sparkles, 
  Shield, 
  Zap,
  CheckCircle,
  Star
} from 'lucide-react'

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const { setUser } = useStore()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema)
  })

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (authError) {
        setError(authError.message)
        return
      }

      if (authData.user) {
        // Check if user is an admin
        const { data: adminData } = await supabase
          .from('admin_users')
          .select('*')
          .eq('user_id', authData.user.id)
          .eq('is_active', true)
          .single()

        if (adminData) {
          // User is an admin, redirect to admin panel
          setSuccess('Admin login successful! Redirecting to admin dashboard...')
          setTimeout(() => {
            router.push('/admin')
          }, 1500)
        } else {
          // Regular user login
          setSuccess('Login successful! Redirecting...')
          setTimeout(() => {
            router.push('/products')
          }, 1500)
        }
      }
    } catch (err) {
      console.error('Login error:', err)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="h-screen bg-black relative overflow-hidden fixed inset-0">
      {/* Linear Gradient Green Elements in Different Positions */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-80 h-80 bg-gradient-to-br from-green-400/30 via-emerald-500/20 to-transparent rounded-full blur-2xl"></div>
        <div className="absolute top-10 right-10 w-60 h-60 bg-gradient-to-bl from-lime-400/25 via-green-500/15 to-transparent rounded-full blur-xl"></div>
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-gradient-to-tr from-emerald-600/20 via-green-400/10 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-72 h-72 bg-gradient-to-tl from-green-500/30 via-lime-400/20 to-transparent rounded-full blur-2xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-gradient-to-r from-green-300/15 to-emerald-400/15 rounded-full blur-xl"></div>
      </div>

      <div className="relative z-10 h-full">
        <div className="bg-black/80 backdrop-blur-sm border border-green-500/30 rounded-none h-full shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 h-full">
            
            {/* Left Side - Branding & Features */}
            <div className="hidden lg:flex flex-col justify-center items-center space-y-6 text-white p-12 border-r border-green-500/30">
              <div className="max-w-md text-center space-y-6">
                <Link
                  href="/"
                  className="inline-flex items-center text-white/80 hover:text-white transition-colors group mb-4"
                >
                  <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
                  Back to Home
                </Link>

                <div className="space-y-4">
                  <div className="flex items-center justify-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-none border border-green-500/50 flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-green-200 to-emerald-200 bg-clip-text text-transparent">
                      i1Fashion
                    </h1>
                  </div>
                  <p className="text-xl text-white/80 leading-relaxed">
                    Welcome back to your premium fashion destination. 
                    Experience luxury shopping with exclusive collections.
                  </p>
                </div>
              </div>

              <div className="max-w-md space-y-4">
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center backdrop-blur-sm">
                    <Shield className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Secure Shopping</h3>
                    <p className="text-white/70 text-sm">Your data is protected with enterprise-grade security</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center backdrop-blur-sm">
                    <Zap className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Fast Delivery</h3>
                    <p className="text-white/70 text-sm">Express shipping to your doorstep within 24-48 hours</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center backdrop-blur-sm">
                    <Star className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Premium Quality</h3>
                    <p className="text-white/70 text-sm">Curated collection of high-quality fashion items</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/20 max-w-md w-full">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">50K+</div>
                  <div className="text-sm text-white/70">Happy Customers</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">1000+</div>
                  <div className="text-sm text-white/70">Products</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">4.9★</div>
                  <div className="text-sm text-white/70">Rating</div>
                </div>
              </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="flex flex-col justify-center p-8 lg:p-12">
              <Link
                href="/"
                className="lg:hidden inline-flex items-center text-white/80 hover:text-white mb-8 transition-colors group"
              >
                <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                Back to Home
              </Link>

              {/* Cool Login Card Design */}
              <div className="bg-black/70 backdrop-blur-lg border-2 border-green-500/50 rounded-none p-6 shadow-2xl max-w-md mx-auto w-full relative overflow-hidden">
                {/* Card Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 via-emerald-500/5 to-green-500/10 pointer-events-none"></div>
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-400 to-transparent"></div>
                <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-400 to-transparent"></div>
                
                <div className="relative z-10">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-emerald-600 rounded-none flex items-center justify-center mx-auto mb-4 shadow-lg border border-green-500/50 relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-green-400/20 to-emerald-600/20 animate-pulse"></div>
                      <Lock className="w-8 h-8 text-white relative z-10" />
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-2">Welcome Back</h2>
                    <p className="text-white/80">Sign in to your i1Fashion account</p>
                  </div>

                  {success && (
                    <div className="bg-green-500/20 border border-green-500/50 rounded-none p-4 mb-4 animate-in slide-in-from-top duration-300">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-5 h-5 text-green-400" />
                        <p className="text-green-200 text-sm">{success}</p>
                      </div>
                    </div>
                  )}

                  {error && (
                    <div className="bg-red-500/20 border border-red-500/50 rounded-none p-4 mb-4 animate-in slide-in-from-top duration-300">
                      <p className="text-red-200 text-sm">{error}</p>
                    </div>
                  )}

                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                      <label className="block text-white/90 text-sm font-medium">
                        Email Address
                      </label>
                      <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/50 w-5 h-5 group-focus-within:text-green-400 transition-colors" />
                        <input
                          {...register('email')}
                          type="email"
                          className="w-full pl-12 pr-4 py-3 bg-black/50 border-2 border-green-500/30 rounded-none text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-400 backdrop-blur-sm transition-all duration-200 hover:bg-black/70 hover:border-green-400/60"
                          placeholder="Enter your email"
                        />
                      </div>
                      {errors.email && (
                        <p className="text-red-400 text-sm mt-1 animate-in slide-in-from-left duration-200">{errors.email.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="block text-white/90 text-sm font-medium">
                        Password
                      </label>
                      <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/50 w-5 h-5 group-focus-within:text-green-400 transition-colors" />
                        <input
                          {...register('password')}
                          type={showPassword ? 'text' : 'password'}
                          className="w-full pl-12 pr-12 py-3 bg-black/50 border-2 border-green-500/30 rounded-none text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-400 backdrop-blur-sm transition-all duration-200 hover:bg-black/70 hover:border-green-400/60"
                          placeholder="Enter your password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white/80 transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      {errors.password && (
                        <p className="text-red-400 text-sm mt-1 animate-in slide-in-from-left duration-200">{errors.password.message}</p>
                      )}
                    </div>

                    <div className="text-right">
                      <Link
                        href="/auth/forgot-password"
                        className="text-green-300 hover:text-green-200 text-sm transition-colors hover:underline"
                      >
                        Forgot your password?
                      </Link>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 px-6 rounded-none font-semibold hover:from-green-700 hover:to-emerald-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl border border-green-500/50 hover:border-green-400 relative overflow-hidden group"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-green-400/0 via-green-400/20 to-green-400/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                      {isLoading ? (
                        <div className="flex items-center justify-center space-x-2 relative z-10">
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          <span>Signing In...</span>
                        </div>
                      ) : (
                        <span className="relative z-10">Sign In</span>
                      )}
                    </button>
                  </form>

                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-green-500/30"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-4 bg-black text-white/60">New to i1Fashion?</span>
                    </div>
                  </div>

                  <div className="text-center">
                    <Link
                      href="/auth/register"
                      className="inline-flex items-center justify-center w-full py-3 px-6 border-2 border-green-500/40 text-white rounded-none font-medium hover:bg-green-500/10 transition-all duration-200 backdrop-blur-sm group hover:border-green-400/60 relative overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-green-400/0 via-green-400/10 to-green-400/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                      <span className="relative z-10">Create New Account</span>
                      <Sparkles className="w-4 h-4 ml-2 group-hover:rotate-12 transition-transform relative z-10" />
                    </Link>
                  </div>
                </div>
              </div>

              <div className="lg:hidden mt-8 grid grid-cols-2 gap-4 text-white max-w-md mx-auto">
                <div className="text-center">
                  <div className="w-12 h-12 bg-black/60 border border-green-500/40 rounded-none flex items-center justify-center mx-auto mb-2 backdrop-blur-sm">
                    <Shield className="w-6 h-6 text-green-400" />
                  </div>
                  <div className="text-sm">Secure</div>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-black/60 border border-green-500/40 rounded-none flex items-center justify-center mx-auto mb-2 backdrop-blur-sm">
                    <Zap className="w-6 h-6 text-green-400" />
                  </div>
                  <div className="text-sm">Fast</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}