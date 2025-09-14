const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing')
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'Set' : 'Missing')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testConnection() {
  console.log('Testing Supabase connection...')
  
  try {
    // Test basic connection
    const { data, error } = await supabase
      .from('products')
      .select('count')
      .limit(1)
    
    if (error) {
      if (error.message.includes('relation "products" does not exist')) {
        console.log('❌ Database tables not found. Please run the database setup SQL in Supabase.')
        console.log('📝 Go to your Supabase dashboard > SQL Editor and run the contents of database/fixed-setup.sql')
        return false
      } else {
        console.error('❌ Database error:', error.message)
        return false
      }
    }
    
    console.log('✅ Database connection successful!')
    console.log('✅ Products table exists!')
    
    // Test if we have products
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name')
      .limit(5)
    
    if (productsError) {
      console.error('❌ Error fetching products:', productsError.message)
      return false
    }
    
    if (products && products.length > 0) {
      console.log(`✅ Found ${products.length} products in database:`)
      products.forEach(product => {
        console.log(`  - ${product.name}`)
      })
    } else {
      console.log('⚠️  No products found in database. The setup SQL should have inserted sample products.')
    }
    
    return true
    
  } catch (err) {
    console.error('❌ Connection test failed:', err.message)
    return false
  }
}

async function main() {
  console.log('🚀 i1Fashion Database Setup Test')
  console.log('================================')
  
  const success = await testConnection()
  
  if (success) {
    console.log('\n✅ Database is ready!')
    console.log('Your app should now be able to load products from the database.')
  } else {
    console.log('\n❌ Database setup required!')
    console.log('\nNext steps:')
    console.log('1. Go to your Supabase dashboard')
    console.log('2. Navigate to SQL Editor')
    console.log('3. Run the contents of database/fixed-setup.sql')
    console.log('4. Run this script again to verify')
  }
}

main().catch(console.error)