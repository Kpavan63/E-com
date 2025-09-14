import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendOrderStatusUpdateEmail } from '@/lib/email'

// Create a server-side Supabase client with service role for admin operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Missing Supabase configuration for admin orders API.')
}

const adminClient = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
})

export async function GET() {
  try {
    const { data: orders, error } = await adminClient
      .from('orders')
      .select(`
        id,
        user_id,
        order_number,
        status,
        subtotal,
        tax_amount,
        shipping_amount,
        discount_amount,
        total_amount,
        payment_method,
        payment_status,
        customer_name,
        customer_email,
        customer_phone,
        shipping_address,
        shipping_city,
        shipping_state,
        shipping_postal_code,
        shipping_country,
        tracking_number,
        carrier,
        created_at,
        order_items (
          id,
          product_id,
          variant_id,
          product_name,
          variant_color,
          variant_size,
          quantity,
          unit_price,
          total_price
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Admin GET orders error:', error)
      return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
    }

    return NextResponse.json({ success: true, orders: orders || [] })
  } catch (err) {
    console.error('Admin GET orders exception:', err)
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, status, tracking_number, carrier } = body || {}

    if (!id) {
      return NextResponse.json({ error: 'Order id is required' }, { status: 400 })
    }

    const update: Record<string, any> = { updated_at: new Date().toISOString() }
    if (status) update.status = status
    if (tracking_number !== undefined) update.tracking_number = tracking_number
    if (carrier !== undefined) update.carrier = carrier

    const { data: updatedOrder, error } = await adminClient
      .from('orders')
      .update(update)
      .eq('id', id)
      .select('*')
      .single()

    if (error || !updatedOrder) {
      console.error('Admin PATCH update order error:', error)
      return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
    }

    // Send status update email if status changed
    try {
      if (status) {
        await sendOrderStatusUpdateEmail(updatedOrder as any, status)
      }
    } catch (emailErr) {
      console.error('Order status update email error:', emailErr)
    }

    return NextResponse.json({ success: true, order: updatedOrder })
  } catch (err) {
    console.error('Admin PATCH orders exception:', err)
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 })
  }
}
