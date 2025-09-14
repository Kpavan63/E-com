# i1Fashion Node/Next.js Application Guide

This document summarizes the current Next.js + Supabase implementation in this repository. It covers environment setup, project structure, API endpoints, admin panel flows, orders lifecycle, email notifications, and common issues. It reflects the logic implemented in the codebase.


## 1) Tech Stack

- Next.js (App Router) + TypeScript
- Supabase (Auth, Postgres DB, Storage, Realtime)
- Zustand (client state with persistence and light encryption for user info)
- Tailwind CSS (styles in globals.css and components)
- Lucide React icons
- SMTP (Gmail App Password) for transactional emails


## 2) Environment Variables (.env.local)

The application requires the following variables (see `.env.local`):

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=...                               # project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=...                          # anon public key
SUPABASE_SERVICE_ROLE_KEY=...                              # used server-side only

# NextAuth (optional legacy)
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3001

# Admin PIN (for admin login endpoint)
ADMIN_PIN=6300

# Email (Gmail App Password)
GMAIL_USER=i1agency12@gmail.com
GMAIL_APP_PASSWORD=...

# Optional: Storage bucket name override (defaults to 'product-images')
# NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET=product-images
```

Important:
- The Service Role key is only used in server-side routes (never on the client).
- Ensure the Supabase storage bucket `product-images` exists (created by the SQL schema) and RLS policies from the schema are enabled.


## 3) Project Structure (selected)

```
app/
  layout.tsx
  page.tsx
  globals.css
  components/
    AuthProvider.tsx                # hydrates user/admin from Supabase session
    NotificationSystem.tsx          # UI notifications (success/warn/error)
    ProductCard.tsx                 # product card linking to details
    ProductGrid.tsx                 # product listing with variants
  products/[id]/page.tsx            # product details (fetch by id, resolve category_id)
  cart/page.tsx
  checkout/page.tsx                 # writes orders + order_items directly to Supabase
  orders/page.tsx                   # user's My Orders (queries by user_id)
  order-success/page.tsx
  auth/login/page.tsx               # user login (Supabase auth)
  auth/register/page.tsx            # OTP flow; verify-otp route exists
  admin/
    login/page.tsx                  # admin login via PIN -> sets adminUser in store
    page.tsx                        # main admin dashboard (products, orders, customers)
  api/
    admin/
      login/route.ts                # validates ADMIN_PIN
      products/route.ts             # GET, POST, PUT, DELETE products
      orders/route.ts               # GET orders (service role), PATCH status + emails
    orders/route.ts                 # POST create order; GET list by user_id
    send-email/route.ts             # (present) email utilities
    send-otp/route.ts               # OTP utilities
    confirm-user/route.ts           # (present)

database/
  complete-ecommerce-schema.sql     # full DB schema, RLS, storage buckets

lib/
  supabase.ts                       # browser Supabase client, storage helpers
  email.ts                          # Gmail SMTP send: confirmation + status update

store/
  useStore.ts                       # Zustand store (user, admin, cart)

next.config.ts                      # images config (Supabase storage host), ESLint flags
```


## 4) Database Schema Overview

Defined in `database/complete-ecommerce-schema.sql`:
- Tables: categories, products, product_variants, user_profiles, orders, order_items, admin_users, etc.
- Key points:
  - products has `category_id` (FK) not `category`. The app resolves category slug to id when creating a product.
  - product_variants has `UNIQUE(product_id, color, size)` and stores stock per variant.
  - orders + order_items store the user_id, customer and shipping info, pricing breakdown, and variants per line.
  - Triggers: inventory update on order_items insert; updated_at columns, etc.
  - Storage buckets: `product-images`, `category-images`, `user-avatars` with RLS policies.


## 5) Supabase Client and Images

`lib/supabase.ts`:
- Creates the client with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Exposes `STORAGE_BUCKET` (defaults to `product-images`).
- Helpers for getPublicUrl, upload, delete from storage.

`next.config.ts`:
- Dynamically allows images from the Supabase project domain derived from `NEXT_PUBLIC_SUPABASE_URL` using `images.domains` and `remotePatterns`.
- After changing next.config.ts, restart the dev server.


## 6) Auth and State

`app/components/AuthProvider.tsx`:
- Loads existing Supabase session on app load and on auth state changes; rehydrates user, checks admin state via `admin_users` table.
- Stores user/admin in Zustand (`store/useStore.ts`).

`store/useStore.ts`:
- Persists user and cart state in localStorage with light encryption for email/full_name/phone.
- Provides cart operations and session expiry management.


## 7) Admin Panel

`app/admin/login/page.tsx`:
- Admin logs in via a 4-digit PIN (default from ADMIN_PIN). Calls `/api/admin/login`.
- Sets admin state in store and persists admin flags in localStorage.

`app/admin/page.tsx`:
- Tabs: Dashboard, Products, Order Management, Sales, Customers.
- Dashboard stats: total products/orders/revenue, active/low stock, customers.
- Recent Orders: top 5 recent from `/api/admin/orders`.
- Products:
  - Add Product: validates fields; resolves `category_id` by slug from `categories` table; creates `products` row with unique-ish slug; uploads image to Supabase Storage; creates `product_variants` for selected sizes; notifies user; refreshes.
  - Edit/Delete Product.
- Orders:
  - Lists all orders with items via `/api/admin/orders` (GET). This route uses `SUPABASE_SERVICE_ROLE_KEY` server-side to bypass RLS in admin context.
  - Edit Order: update status (Pending, Confirmed, Processing, Shipped, Delivered, Cancelled); set `tracking_number` and `carrier`. Calls `/api/admin/orders` (PATCH). On success, local state updates and a status update email is sent to customer.
- Customers: simple listing derived from `user_profiles` + aggregated orders.


## 8) API Endpoints (Next.js route handlers)

- POST `/api/admin/login`
  - Body: `{ pin: string }`
  - Validates against `process.env.ADMIN_PIN`. Returns dummy admin user object for dashboard.

- Products: `/api/admin/products`
  - GET: list all products
  - POST: create product (name, base_price, category, etc.). Generates slug.
  - PUT: update product
  - DELETE: delete product by id

- Orders (Customer): `/api/orders`
  - POST: Create order for a user. Expects `user_id`, items[], customer/shipping fields. Calculates total and inserts `orders` + `order_items`. Sends confirmation email.
  - GET: List orders for a specific user by `user_id` query param. Includes `order_items`.

- Orders (Admin): `/api/admin/orders`
  - GET: Returns all orders with `order_items` for admin dashboard. Uses server-side Supabase client with `SUPABASE_SERVICE_ROLE_KEY`.
  - PATCH: Update order by `{ id, status?, tracking_number?, carrier? }`. Sends status update email on status change.

- Misc routes present: `/api/send-email` (generic), `/api/send-otp`, `/api/confirm-user`. These support the auth flows.


## 9) User-Facing Flows

- Product Listing: `ProductGrid.tsx` fetches products (with variants) and renders `ProductCard`. Cards link to `/products/{id}`.
- Product Details: `app/products/[id]/page.tsx` fetches by `id`, using `category_id` and backfills readable category name by querying `categories`.
- Cart and Checkout: Zustand stores cart; checkout collects customer/shipping details. On submit, it writes an order + items to Supabase and redirects to the success page.
- Order Success: `app/order-success/page.tsx` shows confirmation animation and order number.
- My Orders: `app/orders/page.tsx` queries `/orders` by the logged-in `user_id` and lists items. Refetches when user logs in.


## 10) Emails

`lib/email.ts` (Node server-side):
- sendOrderConfirmationEmail(order, orderItems): HTML email for order confirmation (lists items and total).
- sendOrderStatusUpdateEmail(order, status): HTML email notifying status change. Includes tracking number and carrier when provided.
- Uses Gmail SMTP (App Password). Set `GMAIL_USER` and `GMAIL_APP_PASSWORD` in `.env.local`.


## 11) Running Locally

1) Install dependencies:
```
npm install
# or pnpm install / yarn
```

2) Configure `.env.local` with Supabase project URL & keys and email settings.

3) Ensure database is set up by running the SQL in `database/complete-ecommerce-schema.sql` in Supabase SQL editor.
   - This creates tables, RLS policies, functions, triggers, and storage buckets (`product-images`).

4) Start dev server:
```
npm run dev
```

5) Visit:
- Customer site: `/` (products), `/products/{id}`, `/cart`, `/checkout`, `/orders`
- Admin: `/admin/login` (PIN), `/admin`


## 12) Common Issues & Fixes

- next/image Unconfigured Host:
  - Error: Invalid src prop (...) hostname "<project>.supabase.co" not configured under images.
  - Fix: `next.config.ts` dynamically adds the host from `NEXT_PUBLIC_SUPABASE_URL`. Restart Next dev server after changes.

- Admin orders list empty or failing:
  - Ensure `SUPABASE_SERVICE_ROLE_KEY` is set in `.env.local` and server restarted. The `/api/admin/orders` route relies on it.
  - Check Network tab -> `/api/admin/orders` should return `{ success: true, orders: [...] }`.

- Product add failing due to category:
  - Products use `category_id`. The Add Product form resolves a slug (shirts, pants, etc.) to `categories.id`. Ensure categories table has rows with those slugs (schema inserts them).

- Storage upload fails:
  - Ensure `product-images` bucket exists (schema creates) and RLS policies allow admin uploads.
  - Verify `NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET` matches the bucket name.

- Emails not delivered:
  - Use a Gmail App Password; check spam folder; verify the SMTP credentials.


## 13) Deployment Notes

- Set environment variables on the hosting platform (Supabase URL/keys, service role key for server routes, Gmail app password, ADMIN_PIN).
- Ensure images domain is allowed via next.config.ts.
- Supabase RLS is enabled by the schema; server routes (admin) use service role for privileged actions.


## 14) Extending

- Realtime updates on Orders: subscribe to `orders` channel to auto-refresh admin or customer order status.
- Add more product attributes via `product_attributes` table.
- Add payments integration to replace Cash on Delivery.


## 15) Quick Endpoint Reference

- Admin
  - GET /api/admin/orders -> { success, orders: [ { id, order_number, status, total_amount, order_items: [...] } ] }
  - PATCH /api/admin/orders { id, status, tracking_number?, carrier? } -> { success, order }

- Products
  - GET/POST/PUT/DELETE /api/admin/products

- Customer Orders
  - POST /api/orders { user_id, items[], customer/shipping } -> { success, order }
  - GET  /api/orders?user_id=... -> { success, orders }


This document reflects the current logic and code paths. Use it as a reference for operating the Node/Next.js application and for onboarding new team members.