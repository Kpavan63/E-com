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
  User, 
  Phone, 
  ArrowLeft, 
  Sparkles, 
  Shield, 
  Zap,
  CheckCircle,
  Star,
  Gift,
  Crown,
  Heart
} from 'lucide-react'

const registerSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type RegisterFormData = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const router = useRouter()
  const { setUser } = useStore()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema)
  })

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      // Check if user already exists in auth.users via RPC or auth API
      // We'll let Supabase handle duplicate email checking during signup

      // Send OTP via our custom API
      const response = await fetch('/api/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: data.email,
          full_name: data.full_name,
          type: 'signup'
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'Failed to send verification code')
        return
      }

      setSuccess('Verification code sent to your email! Redirecting...')
      
      setTimeout(() => {
        const params = new URLSearchParams({
          email: data.email,
          full_name: data.full_name,
          phone: data.phone,
          password: data.password
        })
        
        router.push(`/auth/verify-otp?${params.toString()}`)
      }, 2000)

    } catch (err) {
      console.error('Registration error:', err)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="h-screen bg-black relative overflow-hidden fixed inset-0">
      {/* Linear Gradient Green Elements in Different Positions */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-5 left-5 w-72 h-72 bg-gradient-to-br from-lime-400/25 via-green-500/15 to-transparent rounded-full blur-2xl"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-emerald-400/30 via-green-600/20 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 left-10 w-80 h-80 bg-gradient-to-tr from-green-500/25 via-lime-400/15 to-transparent rounded-full blur-2xl"></div>
        <div className="absolute bottom-0 right-20 w-64 h-64 bg-gradient-to-tl from-emerald-600/30 via-green-400/20 to-transparent rounded-full blur-xl"></div>
        <div className="absolute top-1/3 left-1/4 w-48 h-48 bg-gradient-to-r from-green-300/20 to-emerald-500/15 rounded-full blur-xl"></div>
        <div className="absolute bottom-1/3 right-1/4 w-56 h-56 bg-gradient-to-l from-lime-500/20 to-green-400/15 rounded-full blur-2xl"></div>
      </div>

      <div className="relative z-10 h-full">
        <div className="bg-black/80 backdrop-blur-sm border border-green-500/30 rounded-none h-full shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 h-full">
            
            {/* Left Side - Branding & Benefits */}
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
                      <Crown className="w-6 h-6 text-white" />
                    </div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-green-200 to-emerald-200 bg-clip-text text-transparent">
                      Join i1Fashion
                    </h1>
                  </div>
                  <p className="text-xl text-white/80 leading-relaxed">
                    Create your account and unlock exclusive access to premium fashion collections, 
                    special discounts, and personalized shopping experiences.
                  </p>
                </div>
              </div>

              <div className="max-w-md space-y-4">
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center backdrop-blur-sm">
                    <Gift className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Welcome Bonus</h3>
                    <p className="text-white/70 text-sm">Get 20% off on your first purchase + free shipping</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center backdrop-blur-sm">
                    <Heart className="w-5 h-5 text-pink-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Exclusive Access</h3>
                    <p className="text-white/70 text-sm">Early access to new collections and member-only sales</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center backdrop-blur-sm">
                    <Star className="w-5 h-5 text-yellow-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Loyalty Rewards</h3>
                    <p className="text-white/70 text-sm">Earn points with every purchase and unlock special rewards</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center backdrop-blur-sm">
                    <Shield className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Secure & Safe</h3>
                    <p className="text-white/70 text-sm">Your personal information is protected with bank-level security</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 max-w-md w-full">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="flex -space-x-2">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full border-2 border-white"></div>
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full border-2 border-white"></div>
                    <div className="w-10 h-10 bg-gradient-to-r from-pink-400 to-red-400 rounded-full border-2 border-white"></div>
                  </div>
                  <div>
                    <div className="text-white font-semibold">50,000+ Happy Members</div>
                    <div className="text-white/70 text-sm">Join our growing fashion community</div>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                  ))}
                  <span className="text-white/80 text-sm ml-2">4.9/5 Customer Rating</span>
                </div>
              </div>
            </div>

            {/* Right Side - Registration Form */}
            <div className="flex flex-col lg:justify-start lg:pt-16 justify-start p-4 sm:p-6 lg:p-12 overflow-y-auto min-h-full">
              <Link
                href="/"
                className="lg:hidden inline-flex items-center text-white/80 hover:text-white mb-6 transition-colors group flex-shrink-0"
              >
                <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                Back to Home
              </Link>

              {/* Cool Registration Card Design */}
              <div className="bg-black/70 backdrop-blur-lg border-2 border-green-500/50 rounded-none p-4 sm:p-6 shadow-2xl max-w-2xl mx-auto w-full relative overflow-hidden flex-shrink-0">
                {/* Card Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 via-emerald-500/5 to-green-500/10 pointer-events-none"></div>
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-400 to-transparent"></div>
                <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-400 to-transparent"></div>
                
                <div className="relative z-10">
                  <div className="text-center mb-4 sm:mb-6">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-green-400 to-emerald-600 rounded-none flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg border border-green-500/50 relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-green-400/20 to-emerald-600/20 animate-pulse"></div>
                      <User className="w-6 h-6 sm:w-8 sm:h-8 text-white relative z-10" />
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">Create Account</h2>
                    <p className="text-white/80 text-sm sm:text-base">Join i1Fashion and start your style journey</p>
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

                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 sm:space-y-4">
                    {/* First Row - Name and Email */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div className="space-y-2">
                        <label className="block text-white/90 text-sm font-medium">
                          Full Name
                        </label>
                        <div className="relative group">
                          <User className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-white/50 w-4 h-4 sm:w-5 sm:h-5 group-focus-within:text-green-400 transition-colors" />
                          <input
                            {...register('full_name')}
                            type="text"
                            className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 bg-black/50 border-2 border-green-500/30 rounded-none text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-400 backdrop-blur-sm transition-all duration-200 hover:bg-black/70 hover:border-green-400/60 text-sm sm:text-base"
                            placeholder="Enter your full name"
                          />
                        </div>
                        {errors.full_name && (
                          <p className="text-red-400 text-sm mt-1 animate-in slide-in-from-left duration-200">{errors.full_name.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="block text-white/90 text-sm font-medium">
                          Email Address
                        </label>
                        <div className="relative group">
                          <Mail className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-white/50 w-4 h-4 sm:w-5 sm:h-5 group-focus-within:text-green-400 transition-colors" />
                          <input
                            {...register('email')}
                            type="email"
                            className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 bg-black/50 border-2 border-green-500/30 rounded-none text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-400 backdrop-blur-sm transition-all duration-200 hover:bg-black/70 hover:border-green-400/60 text-sm sm:text-base"
                            placeholder="Enter your email"
                          />
                        </div>
                        {errors.email && (
                          <p className="text-red-400 text-sm mt-1 animate-in slide-in-from-left duration-200">{errors.email.message}</p>
                        )}
                      </div>
                    </div>

                    {/* Second Row - Phone (Full Width) */}
                    <div className="space-y-2">
                      <label className="block text-white/90 text-sm font-medium">
                        Phone Number
                      </label>
                      <div className="relative group">
                        <Phone className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-white/50 w-4 h-4 sm:w-5 sm:h-5 group-focus-within:text-green-400 transition-colors" />
                        <input
                          {...register('phone')}
                          type="tel"
                          className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 bg-black/50 border-2 border-green-500/30 rounded-none text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-400 backdrop-blur-sm transition-all duration-200 hover:bg-black/70 hover:border-green-400/60 text-sm sm:text-base"
                          placeholder="Enter your phone number"
                        />
                      </div>
                      {errors.phone && (
                        <p className="text-red-400 text-sm mt-1 animate-in slide-in-from-left duration-200">{errors.phone.message}</p>
                      )}
                    </div>

                    {/* Third Row - Passwords */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div className="space-y-2">
                        <label className="block text-white/90 text-sm font-medium">
                          Password
                        </label>
                        <div className="relative group">
                          <Lock className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-white/50 w-4 h-4 sm:w-5 sm:h-5 group-focus-within:text-green-400 transition-colors" />
                          <input
                            {...register('password')}
                            type={showPassword ? 'text' : 'password'}
                            className="w-full pl-10 sm:pl-12 pr-10 sm:pr-12 py-2.5 sm:py-3 bg-black/50 border-2 border-green-500/30 rounded-none text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-400 backdrop-blur-sm transition-all duration-200 hover:bg-black/70 hover:border-green-400/60 text-sm sm:text-base"
                            placeholder="Create a password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white/80 transition-colors"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                          </button>
                        </div>
                        {errors.password && (
                          <p className="text-red-400 text-sm mt-1 animate-in slide-in-from-left duration-200">{errors.password.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="block text-white/90 text-sm font-medium">
                          Confirm Password
                        </label>
                        <div className="relative group">
                          <Lock className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-white/50 w-4 h-4 sm:w-5 sm:h-5 group-focus-within:text-green-400 transition-colors" />
                          <input
                            {...register('confirmPassword')}
                            type={showConfirmPassword ? 'text' : 'password'}
                            className="w-full pl-10 sm:pl-12 pr-10 sm:pr-12 py-2.5 sm:py-3 bg-black/50 border-2 border-green-500/30 rounded-none text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-400 backdrop-blur-sm transition-all duration-200 hover:bg-black/70 hover:border-green-400/60 text-sm sm:text-base"
                            placeholder="Confirm your password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white/80 transition-colors"
                          >
                            {showConfirmPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                          </button>
                        </div>
                        {errors.confirmPassword && (
                          <p className="text-red-400 text-sm mt-1 animate-in slide-in-from-left duration-200">{errors.confirmPassword.message}</p>
                        )}
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-2.5 sm:py-3 px-4 sm:px-6 rounded-none font-semibold hover:from-green-700 hover:to-emerald-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl border border-green-500/50 hover:border-green-400 relative overflow-hidden group text-sm sm:text-base"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-green-400/0 via-green-400/20 to-green-400/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                      {isLoading ? (
                        <div className="flex items-center justify-center space-x-2 relative z-10">
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          <span>Creating Account...</span>
                        </div>
                      ) : (
                        <span className="relative z-10">Create Account</span>
                      )}
                    </button>
                  </form>

                  <div className="relative my-4 sm:my-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-green-500/30"></div>
                    </div>
                    <div className="relative flex justify-center text-xs sm:text-sm">
                      <span className="px-3 sm:px-4 bg-black text-white/60">Already have an account?</span>
                    </div>
                  </div>

                  <div className="text-center">
                    <Link
                      href="/auth/login"
                      className="inline-flex items-center justify-center w-full py-2.5 sm:py-3 px-4 sm:px-6 border-2 border-green-500/40 text-white rounded-none font-medium hover:bg-green-500/10 transition-all duration-200 backdrop-blur-sm group hover:border-green-400/60 relative overflow-hidden text-sm sm:text-base"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-green-400/0 via-green-400/10 to-green-400/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                      <span className="relative z-10">Sign In Instead</span>
                      <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 ml-2 group-hover:rotate-12 transition-transform relative z-10" />
                    </Link>
                  </div>
                </div>
              </div>

              <div className="lg:hidden mt-4 sm:mt-6 grid grid-cols-2 gap-3 sm:gap-4 text-white max-w-2xl mx-auto flex-shrink-0 pb-4">
                <div className="text-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-black/60 border border-green-500/40 rounded-none flex items-center justify-center mx-auto mb-2 backdrop-blur-sm">
                    <Gift className="w-4 h-4 sm:w-6 sm:h-6 text-green-400" />
                  </div>
                  <div className="text-xs sm:text-sm">20% Off</div>
                </div>
                <div className="text-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-black/60 border border-green-500/40 rounded-none flex items-center justify-center mx-auto mb-2 backdrop-blur-sm">
                    <Heart className="w-4 h-4 sm:w-6 sm:h-6 text-green-400" />
                  </div>
                  <div className="text-xs sm:text-sm">Exclusive</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}