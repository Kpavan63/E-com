'use client'

import Link from 'next/link'
import { ArrowRight, Sparkles, Truck, Shield, Star, Zap, Crown, TrendingUp } from 'lucide-react'

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-black min-h-screen">
      {/* Animated Grid Background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(rgba(34, 197, 94, 0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(34, 197, 94, 0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }}></div>
      </div>

      {/* Floating Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-20 w-4 h-4 bg-green-400/60 rounded-none animate-pulse"></div>
        <div className="absolute top-40 right-32 w-6 h-6 bg-emerald-500/40 rounded-none animate-bounce delay-300"></div>
        <div className="absolute bottom-32 left-16 w-3 h-3 bg-lime-400/50 rounded-none animate-pulse delay-700"></div>
        <div className="absolute bottom-20 right-20 w-5 h-5 bg-green-500/60 rounded-none animate-bounce delay-1000"></div>
        <div className="absolute top-1/2 left-10 w-2 h-2 bg-emerald-400/70 rounded-none animate-pulse delay-500"></div>
        <div className="absolute top-1/3 right-10 w-4 h-4 bg-green-300/50 rounded-none animate-bounce delay-200"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[80vh]">
          
          {/* Left Side - Main Content */}
          <div className="space-y-6">
            {/* Trending Badge */}
            <div className="inline-flex items-center px-4 py-2 bg-black/60 backdrop-blur-lg rounded-none text-white text-xs font-medium border border-green-500/50 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 via-emerald-500/5 to-green-500/10"></div>
              <TrendingUp className="w-3 h-3 mr-2 text-green-400" />
              <span className="relative z-10">Premium Collection</span>
              <Star className="w-3 h-3 ml-2 text-green-400 animate-pulse" />
            </div>

            {/* Main Heading */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
              <span className="block">Next-Gen</span>
              <span className="block bg-gradient-to-r from-green-400 via-emerald-500 to-lime-400 bg-clip-text text-transparent relative">
                i1Fashion
                <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-green-400 to-transparent"></div>
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-green-400 to-transparent"></div>
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg text-white/80 leading-relaxed max-w-lg">
              Discover premium clothing with cutting-edge fashion technology. 
              Style redefined for the modern era.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="#products"
                className="group bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-3 rounded-none font-semibold hover:from-green-700 hover:to-emerald-700 transition-all duration-300 flex items-center justify-center border border-green-500/50 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-green-400/0 via-green-400/20 to-green-400/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                <span className="relative z-10">Explore Collection</span>
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform relative z-10" />
              </Link>
              <Link
                href="/auth/login"
                className="group border border-green-500/50 text-white px-8 py-3 rounded-none font-semibold hover:bg-green-500/10 transition-all duration-300 flex items-center justify-center backdrop-blur-sm relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-green-400/0 via-green-400/10 to-green-400/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                <span className="relative z-10">Sign In</span>
              </Link>
            </div>

            {/* Quick Stats */}
            <div className="flex items-center space-x-8 pt-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">50K+</div>
                <div className="text-white/60 text-xs">Customers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">4.9★</div>
                <div className="text-white/60 text-xs">Rating</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">24/7</div>
                <div className="text-white/60 text-xs">Support</div>
              </div>
            </div>
          </div>

          {/* Right Side - Features Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="group p-6 bg-black/40 backdrop-blur-lg border border-green-500/30 hover:border-green-400/60 transition-all duration-300 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <Truck className="w-8 h-8 text-green-400 mb-3 group-hover:scale-110 transition-transform duration-300" />
                <h3 className="text-white font-semibold mb-2 group-hover:text-green-400 transition-colors">Free Delivery</h3>
                <p className="text-white/60 text-sm">Lightning-fast shipping worldwide</p>
              </div>
            </div>
            
            <div className="group p-6 bg-black/40 backdrop-blur-lg border border-green-500/30 hover:border-green-400/60 transition-all duration-300 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <Shield className="w-8 h-8 text-green-400 mb-3 group-hover:scale-110 transition-transform duration-300" />
                <h3 className="text-white font-semibold mb-2 group-hover:text-green-400 transition-colors">Quality Assured</h3>
                <p className="text-white/60 text-sm">Premium materials & craftsmanship</p>
              </div>
            </div>
            
            <div className="group p-6 bg-black/40 backdrop-blur-lg border border-green-500/30 hover:border-green-400/60 transition-all duration-300 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <Zap className="w-8 h-8 text-green-400 mb-3 group-hover:scale-110 transition-transform duration-300" />
                <h3 className="text-white font-semibold mb-2 group-hover:text-green-400 transition-colors">AI-Powered</h3>
                <p className="text-white/60 text-sm">Smart fashion recommendations</p>
              </div>
            </div>
            
            <div className="group p-6 bg-black/40 backdrop-blur-lg border border-green-500/30 hover:border-green-400/60 transition-all duration-300 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <Crown className="w-8 h-8 text-green-400 mb-3 group-hover:scale-110 transition-transform duration-300" />
                <h3 className="text-white font-semibold mb-2 group-hover:text-green-400 transition-colors">VIP Access</h3>
                <p className="text-white/60 text-sm">Exclusive member benefits</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom CTA Strip */}
        <div className="mt-12 p-6 bg-gradient-to-r from-green-500/10 via-emerald-500/5 to-green-500/10 border border-green-500/30 backdrop-blur-lg relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-green-400/10 to-transparent"></div>
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between">
            <div>
              <h3 className="text-white font-bold text-lg mb-1">Ready to Transform Your Style?</h3>
              <p className="text-white/70 text-sm">Join thousands of fashion-forward individuals</p>
            </div>
            <Link
              href="/auth/register"
              className="mt-4 md:mt-0 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-none font-semibold transition-colors duration-300 border border-green-500/50"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}