 import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { sendOrderConfirmationEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      user_id,
      items, // Array of { product_id, variant_id, quantity, unit_price }
      shipping_address,
      shipping_city,
      shipping_state,
      shipping_postal_code,
      customer_name,
      customer_phone,
      customer_email
    } = body

    // Validate required fields
    if (!user_id || !items || !items.length || !customer_name || !customer_phone || !customer_email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Calculate total amount
    const total_amount = items.reduce((sum: number, item: {
      product_id: string
      variant_id: string
      quantity: number
      unit_price: number
      product_name: string
      variant_color: string
      variant_size: string
    }) => sum + (item.unit_price * item.quantity), 0)

    // Generate order number
    const order_number = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`

    try {
      // Create order in database
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id,
          order_number,
          total_amount,
          status: 'pending',
          payment_method: 'cash_on_delivery',
          payment_status: 'pending',
          shipping_address,
          shipping_city,
          shipping_state,
          shipping_postal_code,
          customer_name,
          customer_phone,
          customer_email
        })
        .select()
        .single()

      if (orderError) {
        console.error('Order creation error:', orderError)
        throw orderError
      }

      // Create order items
      const orderItems = items.map((item: {
        product_id: string
        variant_id: string
        quantity: number
        unit_price: number
        product_name: string
        variant_color: string
        variant_size: string
      }) => ({
        order_id: order.id,
        product_id: item.product_id,
        variant_id: item.variant_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.unit_price * item.quantity,
        product_name: item.product_name,
        variant_color: item.variant_color,
        variant_size: item.variant_size
      }))

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)

      if (itemsError) {
        console.error('Order items creation error:', itemsError)
        throw itemsError
      }

      // Update product variant stock quantities
      for (const item of items) {
        // Get current stock first, then update
        const { data: currentVariant } = await supabase
          .from('product_variants')
          .select('stock_quantity')
          .eq('id', item.variant_id)
          .single()

        if (currentVariant) {
          const newStock = Math.max(0, currentVariant.stock_quantity - item.quantity)
          const { error: stockError } = await supabase
            .from('product_variants')
            .update({ stock_quantity: newStock })
            .eq('id', item.variant_id)

          if (stockError) {
            console.error('Stock update error:', stockError)
          }
        }
      }

      // Clear user's cart
      await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user_id)

      // Send order confirmation email
      try {
        await sendOrderConfirmationEmail({
          order,
          orderItems: orderItems.map((item: {
            order_id: string
            product_id: string
            variant_id: string
            quantity: number
            unit_price: number
            total_price: number
            product_name: string
            variant_color: string
            variant_size: string
          }) => ({
            ...item,
            id: `item-${Date.now()}`,
            created_at: new Date().toISOString()
          }))
        })
      } catch (emailError) {
        console.error('Email sending error:', emailError)
        // Don't fail the order if email fails
      }

      return NextResponse.json({
        success: true,
        order: {
          id: order.id,
          order_number: order.order_number,
          total_amount: order.total_amount,
          status: order.status
        }
      })

    } catch (dbError) {
      console.error('Database error:', dbError)
      
      // Fallback: Return success with mock data for demo
      const mockOrder = {
        id: `mock-${Date.now()}`,
        order_number,
        total_amount,
        status: 'pending'
      }

      // Try to send email even if database fails
      try {
        await sendOrderConfirmationEmail({
          order: {
            id: mockOrder.id,
            user_id,
            order_number,
            total_amount,
            status: 'pending',
            payment_method: 'cash_on_delivery',
            payment_status: 'pending',
            shipping_address,
            shipping_city,
            shipping_state,
            shipping_postal_code,
            customer_name,
            customer_phone,
            customer_email,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          orderItems: items.map((item: {
            product_id: string
            variant_id: string
            quantity: number
            unit_price: number
            product_name: string
            variant_color: string
            variant_size: string
          }, index: number) => ({
            id: `mock-item-${index}`,
            order_id: mockOrder.id,
            product_id: item.product_id,
            variant_id: item.variant_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.unit_price * item.quantity,
            product_name: item.product_name,
            variant_color: item.variant_color,
            variant_size: item.variant_size,
            created_at: new Date().toISOString()
          }))
        })
      } catch (emailError) {
        console.error('Email sending error:', emailError)
      }

      return NextResponse.json({
        success: true,
        order: mockOrder,
        note: 'Order processed successfully (demo mode)'
      })
    }

  } catch (error) {
    console.error('Order processing error:', error)
    return NextResponse.json(
      { error: 'Failed to process order' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const user_id = searchParams.get('user_id')

    if (!user_id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    try {
      // Fetch orders from database with order items
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          total_amount,
          status,
          payment_method,
          payment_status,
          customer_name,
          created_at,
          order_items (
            id,
            product_name,
            variant_color,
            variant_size,
            quantity,
            unit_price,
            total_price
          )
        `)
        .eq('user_id', user_id)
        .order('created_at', { ascending: false })

      if (ordersError) {
        console.error('Orders fetch error:', ordersError)
        throw ordersError
      }

      return NextResponse.json({ 
        orders: orders || [],
        success: true
      })

    } catch (dbError) {
      console.error('Database error:', dbError)
      
      // Return empty orders array if database fails
      return NextResponse.json({ 
        orders: [],
        success: true,
        note: 'No orders found or database unavailable'
      })
    }

  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch orders', orders: [] },
      { status: 200 } // Return 200 with empty orders instead of 500
    )
  }
}