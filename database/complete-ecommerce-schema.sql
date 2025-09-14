-- i1Fashion E-Commerce Complete Database Schema
-- Run this SQL in your Supabase SQL Editor
-- This schema includes all tables and functionality for the complete e-commerce application

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- CORE TABLES
-- =============================================

-- User Profiles Table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    full_name TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    postal_code TEXT,
    date_of_birth DATE,
    gender TEXT CHECK (gender IN ('male', 'female', 'other')),
    profile_image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    phone_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Categories Table
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    image_url TEXT,
    parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products Table
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    short_description TEXT,
    base_price DECIMAL(10,2) NOT NULL CHECK (base_price >= 0),
    compare_price DECIMAL(10,2) CHECK (compare_price >= base_price),
    cost_price DECIMAL(10,2) CHECK (cost_price >= 0),
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    brand TEXT,
    sku TEXT UNIQUE,
    barcode TEXT,
    weight DECIMAL(8,2),
    dimensions JSONB, -- {length, width, height}
    image_url TEXT,
    gallery_images TEXT[], -- Array of image URLs
    stock_quantity INTEGER DEFAULT 0 CHECK (stock_quantity >= 0),
    low_stock_threshold INTEGER DEFAULT 10,
    track_inventory BOOLEAN DEFAULT true,
    allow_backorder BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    meta_title TEXT,
    meta_description TEXT,
    tags TEXT[],
    rating_average DECIMAL(3,2) DEFAULT 0 CHECK (rating_average >= 0 AND rating_average <= 5),
    rating_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Product Variants Table (for colors, sizes, etc.)
CREATE TABLE IF NOT EXISTS product_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- e.g., "Red - Large", "Blue - Medium"
    color TEXT NOT NULL,
    size TEXT NOT NULL,
    material TEXT,
    stock_quantity INTEGER DEFAULT 0 CHECK (stock_quantity >= 0),
    price_adjustment DECIMAL(10,2) DEFAULT 0,
    weight_adjustment DECIMAL(8,2) DEFAULT 0,
    sku TEXT UNIQUE,
    barcode TEXT,
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(product_id, color, size)
);

-- Product Attributes Table (for additional product properties)
CREATE TABLE IF NOT EXISTS product_attributes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    attribute_name TEXT NOT NULL,
    attribute_value TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Shopping Cart Table
CREATE TABLE IF NOT EXISTS cart_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, product_id, variant_id)
);

-- Wishlist Table
CREATE TABLE IF NOT EXISTS wishlist_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);

-- =============================================
-- ORDER MANAGEMENT TABLES
-- =============================================

-- Orders Table
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    order_number TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')),
    
    -- Pricing
    subtotal DECIMAL(10,2) NOT NULL CHECK (subtotal >= 0),
    tax_amount DECIMAL(10,2) DEFAULT 0 CHECK (tax_amount >= 0),
    shipping_amount DECIMAL(10,2) DEFAULT 0 CHECK (shipping_amount >= 0),
    discount_amount DECIMAL(10,2) DEFAULT 0 CHECK (discount_amount >= 0),
    total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount >= 0),
    
    -- Payment
    payment_method TEXT NOT NULL DEFAULT 'cash_on_delivery' CHECK (payment_method IN ('cash_on_delivery', 'credit_card', 'debit_card', 'upi', 'net_banking', 'wallet')),
    payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded', 'partially_refunded')),
    payment_id TEXT,
    payment_gateway TEXT,
    
    -- Customer Information
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    
    -- Shipping Information
    shipping_address TEXT NOT NULL,
    shipping_city TEXT NOT NULL,
    shipping_state TEXT NOT NULL,
    shipping_postal_code TEXT NOT NULL,
    shipping_country TEXT DEFAULT 'India',
    
    -- Billing Information (if different from shipping)
    billing_address TEXT,
    billing_city TEXT,
    billing_state TEXT,
    billing_postal_code TEXT,
    billing_country TEXT DEFAULT 'India',
    
    -- Tracking
    tracking_number TEXT,
    carrier TEXT,
    estimated_delivery_date DATE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    
    -- Notes and metadata
    notes TEXT,
    admin_notes TEXT,
    metadata JSONB,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order Items Table
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
    
    -- Product details (stored for historical purposes)
    product_name TEXT NOT NULL,
    product_sku TEXT,
    variant_name TEXT,
    variant_color TEXT NOT NULL,
    variant_size TEXT NOT NULL,
    
    -- Pricing and quantity
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
    total_price DECIMAL(10,2) NOT NULL CHECK (total_price >= 0),
    
    -- Additional details
    weight DECIMAL(8,2),
    image_url TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order Status History Table
CREATE TABLE IF NOT EXISTS order_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    notes TEXT,
    changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- ADMIN AND MANAGEMENT TABLES
-- =============================================

-- Admin Users Table
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin', 'manager', 'staff')),
    permissions JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customer Support Tickets
CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    ticket_number TEXT UNIQUE NOT NULL,
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    category TEXT NOT NULL DEFAULT 'general' CHECK (category IN ('general', 'order', 'product', 'payment', 'shipping', 'return')),
    assigned_to UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email Templates Table
CREATE TABLE IF NOT EXISTS email_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    subject TEXT NOT NULL,
    html_content TEXT NOT NULL,
    text_content TEXT,
    variables JSONB DEFAULT '[]', -- Array of variable names
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email Logs Table
CREATE TABLE IF NOT EXISTS email_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient_email TEXT NOT NULL,
    sender_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    template_id UUID REFERENCES email_templates(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'bounced')),
    error_message TEXT,
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- REVIEWS AND RATINGS
-- =============================================

-- Product Reviews Table
CREATE TABLE IF NOT EXISTS product_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title TEXT,
    review_text TEXT,
    is_verified_purchase BOOLEAN DEFAULT false,
    is_approved BOOLEAN DEFAULT false,
    helpful_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- COUPONS AND DISCOUNTS
-- =============================================

-- Coupon tables removed as requested

-- =============================================
-- INVENTORY MANAGEMENT
-- =============================================

-- Inventory Transactions Table
CREATE TABLE IF NOT EXISTS inventory_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('purchase', 'sale', 'adjustment', 'return', 'damage', 'transfer')),
    quantity_change INTEGER NOT NULL,
    quantity_before INTEGER NOT NULL,
    quantity_after INTEGER NOT NULL,
    unit_cost DECIMAL(10,2),
    total_cost DECIMAL(10,2),
    reference_id UUID, -- Could reference order_id, return_id, etc.
    reference_type TEXT,
    notes TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- ANALYTICS AND REPORTING
-- =============================================

-- Page Views Table (for analytics)
CREATE TABLE IF NOT EXISTS page_views (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    page_url TEXT NOT NULL,
    page_title TEXT,
    referrer TEXT,
    user_agent TEXT,
    ip_address INET,
    session_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Product Views Table
CREATE TABLE IF NOT EXISTS product_views (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    session_id TEXT,
    ip_address INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- User Profiles Indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email_verified ON user_profiles(email_verified);
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_active ON user_profiles(is_active);

-- Categories Indexes
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_is_active ON categories(is_active);

-- Products Indexes
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON products(is_featured);
CREATE INDEX IF NOT EXISTS idx_products_stock_quantity ON products(stock_quantity);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_rating_average ON products(rating_average DESC);
CREATE INDEX IF NOT EXISTS idx_products_base_price ON products(base_price);

-- Product Variants Indexes
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_is_active ON product_variants(is_active);
CREATE INDEX IF NOT EXISTS idx_product_variants_stock_quantity ON product_variants(stock_quantity);

-- Cart Items Indexes
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON cart_items(product_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_created_at ON cart_items(created_at);

-- Orders Indexes
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);

-- Order Items Indexes
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

-- Reviews Indexes
CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id ON product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_user_id ON product_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_is_approved ON product_reviews(is_approved);
CREATE INDEX IF NOT EXISTS idx_product_reviews_rating ON product_reviews(rating);

-- =============================================
-- FUNCTIONS AND TRIGGERS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to generate order numbers
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
BEGIN
    RETURN 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('order_number_seq')::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Function to generate ticket numbers
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TEXT AS $$
BEGIN
    RETURN 'TKT-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('ticket_number_seq')::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Function to update product rating
CREATE OR REPLACE FUNCTION update_product_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE products 
    SET 
        rating_average = (
            SELECT COALESCE(AVG(rating), 0) 
            FROM product_reviews 
            WHERE product_id = NEW.product_id AND is_approved = true
        ),
        rating_count = (
            SELECT COUNT(*) 
            FROM product_reviews 
            WHERE product_id = NEW.product_id AND is_approved = true
        )
    WHERE id = NEW.product_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update inventory after order
CREATE OR REPLACE FUNCTION update_inventory_on_order()
RETURNS TRIGGER AS $$
BEGIN
    -- Update product stock
    UPDATE products 
    SET stock_quantity = stock_quantity - NEW.quantity
    WHERE id = NEW.product_id;
    
    -- Update variant stock
    UPDATE product_variants 
    SET stock_quantity = stock_quantity - NEW.quantity
    WHERE id = NEW.variant_id;
    
    -- Log inventory transaction
    INSERT INTO inventory_transactions (
        product_id, variant_id, type, quantity_change, 
        quantity_before, quantity_after, reference_id, reference_type
    ) VALUES (
        NEW.product_id, NEW.variant_id, 'sale', -NEW.quantity,
        (SELECT stock_quantity + NEW.quantity FROM product_variants WHERE id = NEW.variant_id),
        (SELECT stock_quantity FROM product_variants WHERE id = NEW.variant_id),
        NEW.order_id, 'order'
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- CREATE SEQUENCES
-- =============================================

CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1;
CREATE SEQUENCE IF NOT EXISTS ticket_number_seq START 1;

-- =============================================
-- CREATE TRIGGERS
-- =============================================

-- Updated_at triggers
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_product_variants_updated_at BEFORE UPDATE ON product_variants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cart_items_updated_at BEFORE UPDATE ON cart_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_admin_users_updated_at BEFORE UPDATE ON admin_users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_support_tickets_updated_at BEFORE UPDATE ON support_tickets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_email_templates_updated_at BEFORE UPDATE ON email_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_product_reviews_updated_at BEFORE UPDATE ON product_reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- Coupon trigger removed

-- Product rating trigger
CREATE TRIGGER update_product_rating_trigger AFTER INSERT OR UPDATE ON product_reviews FOR EACH ROW EXECUTE FUNCTION update_product_rating();

-- Inventory update trigger
CREATE TRIGGER update_inventory_on_order_trigger AFTER INSERT ON order_items FOR EACH ROW EXECUTE FUNCTION update_inventory_on_order();

-- Order status history trigger
CREATE OR REPLACE FUNCTION log_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO order_status_history (order_id, status, notes)
        VALUES (NEW.id, NEW.status, 'Status changed from ' || OLD.status || ' to ' || NEW.status);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_order_status_change_trigger AFTER UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION log_order_status_change();

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;
-- Coupon RLS removed
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_views ENABLE ROW LEVEL SECURITY;

-- User Profiles Policies
CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all profiles" ON user_profiles FOR SELECT USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND is_active = true)
);

-- Categories Policies (public read access)
CREATE POLICY "Anyone can view active categories" ON categories FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage categories" ON categories FOR ALL USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND is_active = true)
);

-- Products Policies (public read access)
CREATE POLICY "Anyone can view active products" ON products FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage products" ON products FOR ALL USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND is_active = true)
);

-- Product Variants Policies (public read access)
CREATE POLICY "Anyone can view active variants" ON product_variants FOR SELECT USING (
    is_active = true AND EXISTS (SELECT 1 FROM products WHERE id = product_id AND is_active = true)
);
CREATE POLICY "Admins can manage variants" ON product_variants FOR ALL USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND is_active = true)
);

-- Product Attributes Policies
CREATE POLICY "Anyone can view product attributes" ON product_attributes FOR SELECT USING (
    EXISTS (SELECT 1 FROM products WHERE id = product_id AND is_active = true)
);
CREATE POLICY "Admins can manage product attributes" ON product_attributes FOR ALL USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND is_active = true)
);

-- Cart Items Policies
CREATE POLICY "Users can manage own cart" ON cart_items FOR ALL USING (auth.uid() = user_id);

-- Wishlist Policies
CREATE POLICY "Users can manage own wishlist" ON wishlist_items FOR ALL USING (auth.uid() = user_id);

-- Orders Policies
CREATE POLICY "Users can view own orders" ON orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create orders" ON orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all orders" ON orders FOR SELECT USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND is_active = true)
);
CREATE POLICY "Admins can update orders" ON orders FOR UPDATE USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND is_active = true)
);

-- Order Items Policies
CREATE POLICY "Users can view own order items" ON order_items FOR SELECT USING (
    EXISTS (SELECT 1 FROM orders WHERE id = order_id AND user_id = auth.uid())
);
CREATE POLICY "Users can create order items" ON order_items FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM orders WHERE id = order_id AND user_id = auth.uid())
);
CREATE POLICY "Admins can view all order items" ON order_items FOR SELECT USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND is_active = true)
);

-- Order Status History Policies
CREATE POLICY "Users can view own order status history" ON order_status_history FOR SELECT USING (
    EXISTS (SELECT 1 FROM orders WHERE id = order_id AND user_id = auth.uid())
);
CREATE POLICY "Admins can manage order status history" ON order_status_history FOR ALL USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND is_active = true)
);

-- Admin Users Policies
CREATE POLICY "Admins can view admin users" ON admin_users FOR SELECT USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND is_active = true)
);
CREATE POLICY "Super admins can manage admin users" ON admin_users FOR ALL USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND role = 'super_admin' AND is_active = true)
);

-- Support Tickets Policies
CREATE POLICY "Users can view own tickets" ON support_tickets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create tickets" ON support_tickets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage all tickets" ON support_tickets FOR ALL USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND is_active = true)
);

-- Product Reviews Policies
CREATE POLICY "Anyone can view approved reviews" ON product_reviews FOR SELECT USING (is_approved = true);
CREATE POLICY "Users can create reviews" ON product_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reviews" ON product_reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all reviews" ON product_reviews FOR ALL USING (
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND is_active = true)
);

-- Coupon policies removed

-- =============================================
-- STORAGE POLICIES
-- =============================================

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES 
    ('product-images', 'product-images', true),
    ('category-images', 'category-images', true),
    ('user-avatars', 'user-avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Product images policies
CREATE POLICY "Anyone can view product images" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');
CREATE POLICY "Admins can upload product images" ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'product-images' AND 
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND is_active = true)
);
CREATE POLICY "Admins can update product images" ON storage.objects FOR UPDATE USING (
    bucket_id = 'product-images' AND 
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND is_active = true)
);
CREATE POLICY "Admins can delete product images" ON storage.objects FOR DELETE USING (
    bucket_id = 'product-images' AND 
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND is_active = true)
);

-- Category images policies
CREATE POLICY "Anyone can view category images" ON storage.objects FOR SELECT USING (bucket_id = 'category-images');
CREATE POLICY "Admins can manage category images" ON storage.objects FOR ALL USING (
    bucket_id = 'category-images' AND 
    EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid() AND is_active = true)
);

-- User avatars policies
CREATE POLICY "Anyone can view user avatars" ON storage.objects FOR SELECT USING (bucket_id = 'user-avatars');
CREATE POLICY "Users can upload own avatar" ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'user-avatars' AND 
    auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "Users can update own avatar" ON storage.objects FOR UPDATE USING (
    bucket_id = 'user-avatars' AND 
    auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "Users can delete own avatar" ON storage.objects FOR DELETE USING (
    bucket_id = 'user-avatars' AND 
    auth.uid()::text = (storage.foldername(name))[1]
);

-- =============================================
-- SAMPLE DATA INSERTION
-- =============================================

-- Insert sample categories
INSERT INTO categories (name, slug, description, is_active) VALUES
    ('Shirts', 'shirts', 'Comfortable and stylish shirts for all occasions', true),
    ('Pants', 'pants', 'High-quality pants and trousers', true),
    ('Shorts', 'shorts', 'Casual and comfortable shorts', true),
    ('Hoodies', 'hoodies', 'Warm and cozy hoodies', true),
    ('Accessories', 'accessories', 'Fashion accessories and more', true)
ON CONFLICT (slug) DO NOTHING;

-- Insert sample products
INSERT INTO products (name, slug, description, short_description, base_price, category_id, image_url, stock_quantity, is_active, is_featured) VALUES
    ('Premium Cotton T-Shirt', 'premium-cotton-t-shirt', 'Comfortable and stylish cotton t-shirt perfect for everyday wear. Made from 100% premium cotton with a soft feel and durable construction.', 'Premium cotton t-shirt for everyday comfort', 899.00, (SELECT id FROM categories WHERE slug = 'shirts'), '/api/placeholder/400/500', 50, true, true),
    ('Classic Denim Jeans', 'classic-denim-jeans', 'High-quality denim jeans with a perfect fit. Features classic styling with modern comfort and durability.', 'Classic fit denim jeans', 1599.00, (SELECT id FROM categories WHERE slug = 'pants'), '/api/placeholder/400/500', 30, true, true),
    ('Formal Dress Shirt', 'formal-dress-shirt', 'Elegant dress shirt perfect for formal occasions. Crisp, clean lines with a professional appearance.', 'Professional dress shirt', 1299.00, (SELECT id FROM categories WHERE slug = 'shirts'), '/api/placeholder/400/500', 25, true, false),
    ('Casual Chino Pants', 'casual-chino-pants', 'Comfortable chino pants for casual and semi-formal wear. Versatile styling that works for any occasion.', 'Versatile chino pants', 1199.00, (SELECT id FROM categories WHERE slug = 'pants'), '/api/placeholder/400/500', 40, true, false),
    ('Summer Cotton Shorts', 'summer-cotton-shorts', 'Lightweight cotton shorts perfect for summer. Breathable fabric with a comfortable fit.', 'Comfortable summer shorts', 699.00, (SELECT id FROM categories WHERE slug = 'shorts'), '/api/placeholder/400/500', 35, true, false),
    ('Premium Hoodie', 'premium-hoodie', 'Warm and comfortable hoodie made from premium materials. Perfect for casual wear and layering.', 'Premium quality hoodie', 1899.00, (SELECT id FROM categories WHERE slug = 'hoodies'), '/api/placeholder/400/500', 20, true, true)
ON CONFLICT (slug) DO NOTHING;

-- Insert sample product variants
INSERT INTO product_variants (product_id, name, color, size, stock_quantity, price_adjustment) VALUES
    -- T-Shirt variants
    ((SELECT id FROM products WHERE slug = 'premium-cotton-t-shirt'), 'Black - Medium', 'black', 'M', 15, 0),
    ((SELECT id FROM products WHERE slug = 'premium-cotton-t-shirt'), 'Black - Large', 'black', 'L', 20, 0),
    ((SELECT id FROM products WHERE slug = 'premium-cotton-t-shirt'), 'White - Medium', 'white', 'M', 18, 0),
    ((SELECT id FROM products WHERE slug = 'premium-cotton-t-shirt'), 'White - Large', 'white', 'L', 22, 0),
    ((SELECT id FROM products WHERE slug = 'premium-cotton-t-shirt'), 'Gray - Extra Large', 'gray', 'XL', 15, 50),

    -- Jeans variants
    ((SELECT id FROM products WHERE slug = 'classic-denim-jeans'), 'Blue - 32', 'blue', '32', 10, 0),
    ((SELECT id FROM products WHERE slug = 'classic-denim-jeans'), 'Blue - 34', 'blue', '34', 12, 0),
    ((SELECT id FROM products WHERE slug = 'classic-denim-jeans'), 'Black - 32', 'black', '32', 8, 100),
    ((SELECT id FROM products WHERE slug = 'classic-denim-jeans'), 'Black - 34', 'black', '34', 10, 100),

    -- Dress Shirt variants
    ((SELECT id FROM products WHERE slug = 'formal-dress-shirt'), 'White - Medium', 'white', 'M', 8, 0),
    ((SELECT id FROM products WHERE slug = 'formal-dress-shirt'), 'White - Large', 'white', 'L', 10, 0),
    ((SELECT id FROM products WHERE slug = 'formal-dress-shirt'), 'Blue - Medium', 'blue', 'M', 7, 0),
    ((SELECT id FROM products WHERE slug = 'formal-dress-shirt'), 'Blue - Large', 'blue', 'L', 9, 0),

    -- Chino Pants variants
    ((SELECT id FROM products WHERE slug = 'casual-chino-pants'), 'Khaki - 32', 'khaki', '32', 12, 0),
    ((SELECT id FROM products WHERE slug = 'casual-chino-pants'), 'Khaki - 34', 'khaki', '34', 15, 0),
    ((SELECT id FROM products WHERE slug = 'casual-chino-pants'), 'Navy - 32', 'navy', '32', 10, 0),
    ((SELECT id FROM products WHERE slug = 'casual-chino-pants'), 'Navy - 34', 'navy', '34', 13, 0),

    -- Shorts variants
    ((SELECT id FROM products WHERE slug = 'summer-cotton-shorts'), 'Khaki - Medium', 'khaki', 'M', 12, 0),
    ((SELECT id FROM products WHERE slug = 'summer-cotton-shorts'), 'Khaki - Large', 'khaki', 'L', 15, 0),
    ((SELECT id FROM products WHERE slug = 'summer-cotton-shorts'), 'Navy - Medium', 'navy', 'M', 10, 0),
    ((SELECT id FROM products WHERE slug = 'summer-cotton-shorts'), 'Navy - Large', 'navy', 'L', 13, 0),

    -- Hoodie variants
    ((SELECT id FROM products WHERE slug = 'premium-hoodie'), 'Black - Medium', 'black', 'M', 8, 0),
    ((SELECT id FROM products WHERE slug = 'premium-hoodie'), 'Black - Large', 'black', 'L', 10, 0),
    ((SELECT id FROM products WHERE slug = 'premium-hoodie'), 'Gray - Medium', 'gray', 'M', 6, 0),
    ((SELECT id FROM products WHERE slug = 'premium-hoodie'), 'Gray - Large', 'gray', 'L', 8, 0)
ON CONFLICT (product_id, color, size) DO NOTHING;

-- Insert sample email templates
INSERT INTO email_templates (name, subject, html_content, text_content, variables) VALUES
    ('order_confirmation', 'Order Confirmation - {{order_number}}', 
     '<h1>Thank you for your order!</h1><p>Your order {{order_number}} has been confirmed.</p>', 
     'Thank you for your order! Your order {{order_number}} has been confirmed.', 
     '["order_number", "customer_name", "total_amount"]'),
    ('order_shipped', 'Your Order Has Been Shipped - {{order_number}}', 
     '<h1>Your order is on the way!</h1><p>Order {{order_number}} has been shipped with tracking number {{tracking_number}}.</p>', 
     'Your order is on the way! Order {{order_number}} has been shipped with tracking number {{tracking_number}}.', 
     '["order_number", "tracking_number", "customer_name"]'),
    ('welcome_email', 'Welcome to i1Fashion!', 
     '<h1>Welcome to i1Fashion!</h1><p>Thank you for joining our community.</p>', 
     'Welcome to i1Fashion! Thank you for joining our community.', 
     '["customer_name"]')
ON CONFLICT (name) DO NOTHING;

-- Sample coupon data removed

-- =============================================
-- VIEWS FOR REPORTING
-- =============================================

-- Sales Summary View
CREATE OR REPLACE VIEW sales_summary AS
SELECT 
    DATE(created_at) as sale_date,
    COUNT(*) as total_orders,
    SUM(total_amount) as total_revenue,
    AVG(total_amount) as average_order_value,
    COUNT(DISTINCT user_id) as unique_customers
FROM orders 
WHERE status NOT IN ('cancelled', 'refunded')
GROUP BY DATE(created_at)
ORDER BY sale_date DESC;

-- Product Performance View
CREATE OR REPLACE VIEW product_performance AS
SELECT 
    p.id,
    p.name,
    p.base_price,
    p.stock_quantity,
    p.rating_average,
    p.rating_count,
    p.view_count,
    COALESCE(SUM(oi.quantity), 0) as total_sold,
    COALESCE(SUM(oi.total_price), 0) as total_revenue
FROM products p
LEFT JOIN order_items oi ON p.id = oi.product_id
LEFT JOIN orders o ON oi.order_id = o.id AND o.status NOT IN ('cancelled', 'refunded')
WHERE p.is_active = true
GROUP BY p.id, p.name, p.base_price, p.stock_quantity, p.rating_average, p.rating_count, p.view_count
ORDER BY total_sold DESC;

-- Customer Analytics View
CREATE OR REPLACE VIEW customer_analytics AS
SELECT 
    u.id as user_id,
    up.full_name,
    u.email as customer_email,
    COUNT(o.id) as total_orders,
    SUM(o.total_amount) as total_spent,
    AVG(o.total_amount) as average_order_value,
    MAX(o.created_at) as last_order_date,
    MIN(o.created_at) as first_order_date
FROM auth.users u
LEFT JOIN user_profiles up ON u.id = up.user_id
LEFT JOIN orders o ON u.id = o.user_id AND o.status NOT IN ('cancelled', 'refunded')
GROUP BY u.id, up.full_name, u.email
HAVING COUNT(o.id) > 0
ORDER BY total_spent DESC;

-- =============================================
-- COMPLETION MESSAGE
-- =============================================

-- Insert a completion log
DO $$
BEGIN
    RAISE NOTICE 'i1Fashion E-Commerce Database Schema Setup Complete!';
    RAISE NOTICE 'Created tables: %, functions: %, triggers: %, policies: %', 
        (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'),
        (SELECT COUNT(*) FROM information_schema.routines WHERE routine_schema = 'public' AND routine_type = 'FUNCTION'),
        (SELECT COUNT(*) FROM information_schema.triggers WHERE trigger_schema = 'public'),
        (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public');
END $$;