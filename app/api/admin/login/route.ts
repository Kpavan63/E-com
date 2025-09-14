import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { pin } = await request.json()

    // Get admin PIN from environment variables
    const adminPin = process.env.ADMIN_PIN || '6300'

    // Validate PIN
    if (pin !== adminPin) {
      return NextResponse.json(
        { error: 'Invalid admin PIN. Access denied.' },
        { status: 401 }
      )
    }

    // Return success with admin user data
    const adminUser = {
      id: 'admin-1',
      user_id: 'admin-user-id',
      email: 'admin@i1fashion.com',
      full_name: 'System Administrator',
      role: 'super_admin',
      permissions: {
        products: true,
        orders: true,
        users: true,
        analytics: true,
        settings: true
      },
      is_active: true,
      created_at: new Date().toISOString(),
      last_login_at: new Date().toISOString()
    }

    const user = {
      id: 'admin-user-id',
      email: 'admin@i1fashion.com',
      full_name: 'System Administrator',
      phone: '',
      created_at: new Date().toISOString()
    }

    return NextResponse.json({
      success: true,
      user,
      adminUser
    })

  } catch (error) {
    console.error('Admin login API error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    )
  }
}