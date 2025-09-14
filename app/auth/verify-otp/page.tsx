'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useStore } from '@/store/useStore'
import { ArrowLeft, Mail, RefreshCw } from 'lucide-react'

function VerifyOTPContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { setUser } = useStore()
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [isLoading, setIsLoading] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [timeLeft, setTimeLeft] = useState(60)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const email = searchParams.get('email') || ''
  const fullName = searchParams.get('full_name') || ''
  const phone = searchParams.get('phone') || ''
  const password = searchParams.get('password') || ''

  useEffect(() => {
    if (!email) {
      router.push('/auth/register')
      return
    }

    // Start countdown timer
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [email, router])

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return

    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').slice(0, 6)
    const newOtp = [...otp]
    
    for (let i = 0; i < pastedData.length && i < 6; i++) {
      if (/^\d$/.test(pastedData[i])) {
        newOtp[i] = pastedData[i]
      }
    }
    
    setOtp(newOtp)
    
    // Focus the next empty input or the last input
    const nextEmptyIndex = newOtp.findIndex(digit => digit === '')
    const focusIndex = nextEmptyIndex === -1 ? 5 : nextEmptyIndex
    inputRefs.current[focusIndex]?.focus()
  }

  const handleVerifyOTP = async () => {
    const otpCode = otp.join('')
    
    if (otpCode.length !== 6) {
      setError('Please enter the complete 6-digit code')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      // Verify OTP using our custom API
      const verifyResponse = await fetch('/api/send-otp', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          otp: otpCode
        }),
      })

      const verifyResult = await verifyResponse.json()

      if (!verifyResponse.ok) {
        setError(verifyResult.error || 'Invalid verification code')
        return
      }

      // OTP verified successfully, now create the user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: undefined, // Disable email confirmation
          data: {
            email_verified: true,
            full_name: fullName,
            phone: phone
          }
        }
      })

      if (authError) {
        // Check if user already exists
        if (authError.message.includes('already registered')) {
          setError('An account with this email already exists. Please sign in instead.')
          setTimeout(() => {
            router.push('/auth/login')
          }, 2000)
          return
        }
        setError(authError.message)
        return
      }

      if (authData.user) {
        // Manually confirm the user using our API
        const confirmResponse = await fetch('/api/confirm-user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email }),
        })

        if (!confirmResponse.ok) {
          console.error('Failed to confirm user')
        }

        // Create or update user profile with email_verified flag
        const { error: profileError } = await supabase
          .from('user_profiles')
          .upsert({
            user_id: authData.user.id,
            full_name: fullName,
            phone: phone,
            email_verified: true,
          }, {
            onConflict: 'user_id'
          })

        if (profileError) {
          console.error('Profile creation error:', profileError)
        }

        // Sign in the user immediately after successful verification
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        })

        if (signInError) {
          console.error('Auto sign-in error:', signInError)
          setSuccess('Account created successfully! Please sign in.')
          setTimeout(() => {
            router.push('/auth/login')
          }, 2000)
        } else {
          setSuccess('Email verified successfully! Account created. Redirecting...')
          
          // Redirect to products page instead of home
          setTimeout(() => {
            router.push('/products')
          }, 2000)
        }
      }
    } catch (err) {
      console.error('OTP verification error:', err)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendOTP = async () => {
    if (timeLeft > 0) return

    setIsResending(true)
    setError('')
    setSuccess('')

    try {
      // Resend OTP using our custom API
      const response = await fetch('/api/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          full_name: fullName,
          type: 'signup'
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'Failed to resend verification code')
      } else {
        setSuccess('Verification code sent successfully!')
        setTimeLeft(60)
        setOtp(['', '', '', '', '', ''])
        inputRefs.current[0]?.focus()
      }
    } catch (err) {
      console.error('Resend OTP error:', err)
      setError('Failed to resend verification code. Please try again.')
    } finally {
      setIsResending(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Back Button */}
        <Link
          href="/auth/register"
          className="inline-flex items-center text-white/80 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Register
        </Link>

        {/* OTP Verification Form */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Verify Your Email</h1>
            <p className="text-white/80 mb-2">
              We&apos;ve sent a 6-digit verification code to
            </p>
            <p className="text-purple-300 font-medium">{email}</p>
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 mb-6">
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-3 mb-6">
              <p className="text-green-200 text-sm">{success}</p>
            </div>
          )}

          <div className="space-y-6">
            {/* OTP Input */}
            <div>
              <label className="block text-white/90 text-sm font-medium mb-4 text-center">
                Enter Verification Code
              </label>
              <div className="flex justify-center space-x-3" onPaste={handlePaste}>
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => {
                      inputRefs.current[index] = el
                    }}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value.replace(/\D/g, ''))}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-12 h-12 text-center text-xl font-bold bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                ))}
              </div>
            </div>

            {/* Verify Button */}
            <button
              onClick={handleVerifyOTP}
              disabled={isLoading || otp.join('').length !== 6}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Verifying...' : 'Verify Email'}
            </button>

            {/* Resend Code */}
            <div className="text-center">
              <p className="text-white/80 text-sm mb-2">
                Didn&apos;t receive the code?
              </p>
              {timeLeft > 0 ? (
                <p className="text-purple-300 text-sm">
                  Resend code in {formatTime(timeLeft)}
                </p>
              ) : (
                <button
                  onClick={handleResendOTP}
                  disabled={isResending}
                  className="inline-flex items-center text-purple-300 hover:text-purple-200 text-sm font-medium transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 mr-1 ${isResending ? 'animate-spin' : ''}`} />
                  {isResending ? 'Sending...' : 'Resend Code'}
                </button>
              )}
            </div>

            {/* Change Email */}
            <div className="text-center pt-4 border-t border-white/20">
              <p className="text-white/80 text-sm">
                Wrong email address?{' '}
                <Link
                  href="/auth/register"
                  className="text-purple-300 hover:text-purple-200 font-medium transition-colors"
                >
                  Go back and change it
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Loading...</h1>
            <p className="text-white/80">Please wait while we prepare your verification page.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function VerifyOTPPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <VerifyOTPContent />
    </Suspense>
  )
}