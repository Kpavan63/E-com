'use client'

import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useStore } from '@/store/useStore'

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setAdminUser, checkSessionExpiry, signOut } = useStore()

  useEffect(() => {
    // Check session expiry on app load
    const isSessionValid = checkSessionExpiry()
    
    if (!isSessionValid) {
      // Session expired, sign out from Supabase too
      supabase.auth.signOut()
      return
    }

    // Rehydrate admin session from localStorage if present
    try {
      if (typeof window !== 'undefined') {
        const adminFlag = localStorage.getItem('i1fashion-is-admin')
        const adminUserStr = localStorage.getItem('i1fashion-admin-user')
        if (adminFlag === 'true' && adminUserStr) {
          const adminUserObj = JSON.parse(adminUserStr)
          setAdminUser(adminUserObj)
        }
      }
    } catch {}

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user) {
          // Get user profile
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', session.user.id)
            .single()

          // Set user data
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            full_name: profile?.full_name || '',
            phone: profile?.phone || '',
            created_at: session.user.created_at || ''
          })

          // Check if user is admin
          const { data: adminData } = await supabase
            .from('admin_users')
            .select('*')
            .eq('user_id', session.user.id)
            .eq('is_active', true)
            .single()

          if (adminData) {
            setAdminUser(adminData)
          }
        }
      } catch (error) {
        console.error('Error getting initial session:', error)
      }
    }

    getInitialSession()

    // Listen for auth changes with real-time updates
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id || 'no user')
        
        if (event === 'INITIAL_SESSION') {
          // Handle initial session load
          if (session?.user) {
            try {
              // Get user profile
              const { data: profile } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('user_id', session.user.id)
                .single()

              setUser({
                id: session.user.id,
                email: session.user.email || '',
                full_name: profile?.full_name || '',
                phone: profile?.phone || '',
                created_at: session.user.created_at || ''
              })

              // Check if user is admin
              const { data: adminData } = await supabase
                .from('admin_users')
                .select('*')
                .eq('user_id', session.user.id)
                .eq('is_active', true)
                .single()

              if (adminData) {
                setAdminUser(adminData)
              }
            } catch (error) {
              console.error('Error handling initial session:', error)
            }
          }
        } else if (event === 'SIGNED_IN' && session?.user) {
          try {
            // Get user profile
            const { data: profile } = await supabase
              .from('user_profiles')
              .select('*')
              .eq('user_id', session.user.id)
              .single()

            setUser({
              id: session.user.id,
              email: session.user.email || '',
              full_name: profile?.full_name || '',
              phone: profile?.phone || '',
              created_at: session.user.created_at || ''
            })

            // Check if user is admin
            const { data: adminData } = await supabase
              .from('admin_users')
              .select('*')
              .eq('user_id', session.user.id)
              .eq('is_active', true)
              .single()

            if (adminData) {
              setAdminUser(adminData)
            }
          } catch (error) {
            console.error('Error handling sign in:', error)
          }
        } else if (event === 'SIGNED_OUT') {
          signOut()
        } else if (event === 'TOKEN_REFRESHED') {
          console.log('Token refreshed successfully')
          // Update session expiry on token refresh
          const { sessionExpiry } = useStore.getState()
          if (sessionExpiry) {
            setUser(useStore.getState().user) // This will update the expiry
          }
        }
      }
    )

    // Check session expiry every 5 minutes
    const sessionCheckInterval = setInterval(() => {
      const isValid = checkSessionExpiry()
      if (!isValid) {
        console.log('Session expired, signing out...')
        supabase.auth.signOut()
      }
    }, 5 * 60 * 1000) // Check every 5 minutes

    return () => {
      subscription.unsubscribe()
      clearInterval(sessionCheckInterval)
    }
  }, [setUser, setAdminUser, checkSessionExpiry, signOut])

  return <>{children}</>
}