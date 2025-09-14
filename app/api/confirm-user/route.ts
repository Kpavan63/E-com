import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Create admin client with service role key
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Get user by email
    const { data: users, error: getUserError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (getUserError) {
      console.error('Error getting users:', getUserError)
      return NextResponse.json(
        { error: 'Failed to find user' },
        { status: 500 }
      )
    }

    const user = users.users.find(u => u.email === email)
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Manually confirm the user's email
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      { 
        email_confirm: true,
        user_metadata: {
          ...user.user_metadata,
          email_verified: true
        }
      }
    )

    if (error) {
      console.error('Error confirming user:', error)
      return NextResponse.json(
        { error: 'Failed to confirm user' },
        { status: 500 }
      )
    }

    // Also update the user_profiles table
    const { error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .upsert({
        user_id: user.id,
        email_verified: true,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })

    if (profileError) {
      console.error('Error updating profile email_verified:', profileError)
    }

    return NextResponse.json({
      success: true,
      message: 'User confirmed successfully',
      user: data.user
    })

  } catch (error) {
    console.error('Error in confirm-user API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}