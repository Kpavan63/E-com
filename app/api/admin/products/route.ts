import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET - Fetch all products
export async function GET(request: NextRequest) {
  try {
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching products:', error)
      return NextResponse.json(
        { error: 'Failed to fetch products' },
        { status: 500 }
      )
    }

    return NextResponse.json({ products })
  } catch (error) {
    console.error('Products API error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

// POST - Create new product
export async function POST(request: NextRequest) {
  try {
    const productData = await request.json()

    // Validate required fields
    if (!productData.name || !productData.base_price || !productData.category) {
      return NextResponse.json(
        { error: 'Missing required fields: name, base_price, category' },
        { status: 400 }
      )
    }

    // Generate slug from name
    const slug = productData.name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')

    const newProduct = {
      name: productData.name,
      description: productData.description || '',
      base_price: parseFloat(productData.base_price),
      category: productData.category,
      stock_quantity: parseInt(productData.stock_quantity) || 0,
      image_url: productData.image_url || '/api/placeholder/400/500',
      is_active: productData.is_active !== undefined ? productData.is_active : true,
      slug,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data: product, error } = await supabase
      .from('products')
      .insert([newProduct])
      .select()
      .single()

    if (error) {
      console.error('Error creating product:', error)
      return NextResponse.json(
        { error: 'Failed to create product' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      product,
      message: 'Product created successfully' 
    })
  } catch (error) {
    console.error('Create product API error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

// PUT - Update product
export async function PUT(request: NextRequest) {
  try {
    const productData = await request.json()

    if (!productData.id) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      )
    }

    const updateData: any = {
      name: productData.name,
      description: productData.description,
      base_price: parseFloat(productData.base_price),
      category: productData.category,
      stock_quantity: parseInt(productData.stock_quantity),
      image_url: productData.image_url,
      is_active: productData.is_active,
      updated_at: new Date().toISOString()
    }

    // Update slug if name changed
    if (productData.name) {
      updateData.slug = productData.name
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
    }

    const { data: product, error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', productData.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating product:', error)
      return NextResponse.json(
        { error: 'Failed to update product' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      product,
      message: 'Product updated successfully' 
    })
  } catch (error) {
    console.error('Update product API error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

// DELETE - Delete product
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('id')

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId)

    if (error) {
      console.error('Error deleting product:', error)
      return NextResponse.json(
        { error: 'Failed to delete product' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true,
      message: 'Product deleted successfully' 
    })
  } catch (error) {
    console.error('Delete product API error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}