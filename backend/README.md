# Python Backend (FastAPI) for i1Fashion

This guide explains how to add a Python (FastAPI) backend to your existing Next.js + Supabase project while preserving the current logic and flows:

- Supabase remains your database, auth, and storage provider
- Customer: place orders (create orders + order_items)
- Admin: list/manage orders, update status (Confirmed, Processing, Shipped, Delivered, Cancelled), set tracking number and carrier
- Email notifications: order confirmation and status updates via Gmail
- Next.js frontend talks to Python backend via HTTP (using Next.js rewrites for seamless paths)

The backend uses the Supabase Service Role key on the server side for admin operations (bypassing RLS as needed), while customer endpoints can accept a user token later if you want fine-grained access control.

---

## 1) Directory Layout

Create a new folder `backend/` at the repository root with the following structure:

```
backend/
  app/
    main.py
    api/
      orders.py
      admin.py
    core/
      config.py
      supabase.py
      email.py
    models/
      schemas.py
  requirements.txt
  .env            # backend-only env vars (never commit)
```

---

## 2) Python Dependencies

Create `backend/requirements.txt`:

```
fastapi==0.114.2
uvicorn[standard]==0.30.6
pydantic==2.9.2
pydantic-settings==2.5.2
supabase==2.6.0
httpx==0.27.2
aiosmtplib==3.0.2
python-multipart==0.0.9
```

Install:

```
cd backend
python -m venv .venv
. .venv/Scripts/activate   # Windows PowerShell: .venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

---

## 3) Environment Variables (backend/.env)

Create `backend/.env` (do not commit). Mirror what you use in `.env.local` for Next.js, plus the Service Role key:

```
# Supabase
SUPABASE_URL=https://YOUR-PROJECT.supabase.co
SUPABASE_ANON_KEY=...                     # optional for user-token validation later
SUPABASE_SERVICE_ROLE_KEY=...             # required for admin endpoints

# Admin
ADMIN_PIN=6300                            # optional: quick admin guard header (see admin API)

# Email (Gmail App Password)
GMAIL_USER=i1agency12@gmail.com
GMAIL_APP_PASSWORD=...                    # app password

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

Notes:
- Only the Python backend should use the `SUPABASE_SERVICE_ROLE_KEY`. Never expose it to the browser.
- Keep `ADMIN_PIN` only if you want a simple extra guard; you can also validate admin via `admin_users` in DB.

---

## 4) App Settings and Clients (app/core)

Create `app/core/config.py` (Pydantic settings loader for env):

```python
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List

class Settings(BaseSettings):
    SUPABASE_URL: str
    SUPABASE_ANON_KEY: str | None = None
    SUPABASE_SERVICE_ROLE_KEY: str

    ADMIN_PIN: str | None = None

    GMAIL_USER: str
    GMAIL_APP_PASSWORD: str

    ALLOWED_ORIGINS: List[str] = []

    model_config = SettingsConfigDict(env_file="backend/.env", env_file_encoding="utf-8", case_sensitive=False)

settings = Settings()
```

Create `app/core/supabase.py` (service-role client):

```python
from supabase import create_client, Client
from .config import settings

supabase_admin: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
```

Create `app/core/email.py` (email helpers):

```python
import aiosmtplib
from email.message import EmailMessage
from .config import settings

async def send_email(to: str, subject: str, html: str):
    msg = EmailMessage()
    msg["From"] = f"i1Fashion <{settings.GMAIL_USER}>"
    msg["To"] = to
    msg["Subject"] = subject
    msg.set_content("This email requires an HTML capable client.")
    msg.add_alternative(html, subtype="html")

    await aiosmtplib.send(
        msg,
        hostname="smtp.gmail.com",
        port=587,
        start_tls=True,
        username=settings.GMAIL_USER,
        password=settings.GMAIL_APP_PASSWORD,
    )
```

---

## 5) Models/Schemas (app/models/schemas.py)

Define request/response models matching your current flows:

```python
from pydantic import BaseModel
from typing import List, Optional

class OrderItemIn(BaseModel):
    product_id: str
    variant_id: str
    quantity: int
    unit_price: float
    product_name: str
    variant_color: str
    variant_size: str

class CreateOrderIn(BaseModel):
    user_id: str
    customer_name: str
    customer_email: str
    customer_phone: str
    shipping_address: str
    shipping_city: str
    shipping_state: str
    shipping_postal_code: str
    items: List[OrderItemIn]

class UpdateOrderIn(BaseModel):
    id: str
    status: Optional[str] = None
    tracking_number: Optional[str] = None
    carrier: Optional[str] = None
```

---

## 6) Orders API (app/api/orders.py)

Customer-facing endpoints to create and list orders. This mirrors your current checkout logic and orders page.

```python
from fastapi import APIRouter, HTTPException
from datetime import datetime
from ..core.supabase import supabase_admin
from ..core.email import send_email
from ..models.schemas import CreateOrderIn

router = APIRouter(prefix="/orders", tags=["orders"])

@router.post("")
async def create_order(payload: CreateOrderIn):
    # Compute totals
    subtotal = sum(i.unit_price * i.quantity for i in payload.items)
    tax_amount = 0
    shipping_amount = 0
    discount_amount = 0
    total_amount = subtotal + tax_amount + shipping_amount - discount_amount

    now = datetime.utcnow()
    order_number = f"ORD-{now.strftime('%Y%m%d')}-{str(int(now.timestamp()))[-4:]}"

    # Insert order
    order_insert = {
        "user_id": payload.user_id,
        "order_number": order_number,
        "status": "pending",
        "subtotal": subtotal,
        "tax_amount": tax_amount,
        "shipping_amount": shipping_amount,
        "discount_amount": discount_amount,
        "total_amount": total_amount,
        "payment_method": "cash_on_delivery",
        "payment_status": "pending",
        "customer_name": payload.customer_name,
        "customer_email": payload.customer_email,
        "customer_phone": payload.customer_phone,
        "shipping_address": payload.shipping_address,
        "shipping_city": payload.shipping_city,
        "shipping_state": payload.shipping_state,
        "shipping_postal_code": payload.shipping_postal_code,
        "shipping_country": "India",
    }

    order_res = supabase_admin.table("orders").insert(order_insert).select("*").execute()
    if not order_res.data:
        raise HTTPException(status_code=500, detail="Failed to create order")
    order = order_res.data[0]

    # Insert order items
    items_insert = []
    for i in payload.items:
        items_insert.append({
            "order_id": order["id"],
            "product_id": i.product_id,
            "variant_id": i.variant_id,
            "product_name": i.product_name,
            "variant_name": f"{i.variant_color} - {i.variant_size}",
            "variant_color": i.variant_color,
            "variant_size": i.variant_size,
            "quantity": i.quantity,
            "unit_price": i.unit_price,
            "total_price": i.unit_price * i.quantity,
        })

    supabase_admin.table("order_items").insert(items_insert).execute()

    # Send order confirmation email (HTML similar to your Node template)
    try:
        html = f"""
        <h2>Order Confirmation - {order_number}</h2>
        <p>Hi {payload.customer_name}, thanks for your order.</p>
        <p>Total: ₹{total_amount:.2f}</p>
        <p>Status: Pending</p>
        """
        await send_email(payload.customer_email, f"Order Confirmation - {order_number}", html)
    except Exception:
        pass

    return {"success": True, "order": {"id": order["id"], "order_number": order_number, "total_amount": total_amount, "status": "pending"}}

@router.get("")
async def list_user_orders(user_id: str):
    res = supabase_admin.from_("orders").select("""
        id, order_number, total_amount, status, payment_method, payment_status,
        customer_name, created_at,
        order_items (id, product_name, variant_color, variant_size, quantity, unit_price, total_price)
    """).eq("user_id", user_id).order("created_at", desc=True).execute()
    return {"success": True, "orders": res.data or []}
```

---

## 7) Admin API (app/api/admin.py)

Admin endpoints to list all orders and update status/tracking. This matches what your admin dashboard expects.

```python
from fastapi import APIRouter, Header, HTTPException
from typing import Optional
from ..core.config import settings
from ..core.supabase import supabase_admin
from ..core.email import send_email
from ..models.schemas import UpdateOrderIn

router = APIRouter(prefix="/admin", tags=["admin"])

# Optional simple guard with ADMIN_PIN sent as header X-Admin-PIN
async def _check_admin_pin(pin: Optional[str]):
    if settings.ADMIN_PIN and pin != settings.ADMIN_PIN:
        raise HTTPException(status_code=401, detail="Unauthorized")

@router.get("/orders")
async def list_orders(x_admin_pin: Optional[str] = Header(default=None)):
    await _check_admin_pin(x_admin_pin)
    res = supabase_admin.from_("orders").select("""
        id, user_id, order_number, status, subtotal, tax_amount, shipping_amount, discount_amount,
        total_amount, payment_method, payment_status, customer_name, customer_email, customer_phone,
        shipping_address, shipping_city, shipping_state, shipping_postal_code, shipping_country,
        tracking_number, carrier, created_at,
        order_items (id, product_id, variant_id, product_name, variant_color, variant_size, quantity, unit_price, total_price)
    """).order("created_at", desc=True).execute()
    return {"success": True, "orders": res.data or []}

@router.patch("/orders")
async def update_order(payload: UpdateOrderIn, x_admin_pin: Optional[str] = Header(default=None)):
    await _check_admin_pin(x_admin_pin)
    if not payload.id:
        raise HTTPException(status_code=400, detail="Order id is required")

    update: dict = {}
    if payload.status is not None:
        update["status"] = payload.status
    if payload.tracking_number is not None:
        update["tracking_number"] = payload.tracking_number
    if payload.carrier is not None:
        update["carrier"] = payload.carrier

    res = supabase_admin.table("orders").update(update).eq("id", payload.id).select("*").execute()
    if not res.data:
        raise HTTPException(status_code=500, detail="Failed to update order")

    order = res.data[0]

    # Send status update email
    try:
        if payload.status:
            html = f"""
            <h2>Order Update - #{order['order_number']}</h2>
            <p>Status: <strong>{payload.status.title()}</strong></p>
            {f"<p>Tracking: {payload.tracking_number} ({payload.carrier})</p>" if payload.tracking_number else ""}
            """
            await send_email(order["customer_email"], f"Order Update - {order['order_number']}", html)
    except Exception:
        pass

    return {"success": True, "order": order}
```

---

## 8) FastAPI App Entrypoint (app/main.py)

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .core.config import settings
from .api import orders, admin

app = FastAPI(title="i1Fashion Python API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS or ["*"],
    allow_credentials=True,
    allow_methods=["*"]
    ,allow_headers=["*"]
)

app.include_router(orders.router)
app.include_router(admin.router)
```

Run locally:

```
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API base: http://localhost:8000

---

## 9) Wire Next.js to Python via Rewrites

Update `next.config.ts` to proxy your frontend paths to the Python backend. Add a rewrites function:

```ts
export default {
  async rewrites() {
    return [
      { source: "/api/orders", destination: "http://localhost:8000/orders" },
      { source: "/api/admin/orders", destination: "http://localhost:8000/admin/orders" },
    ]
  },
}
```

Notes:
- Your admin dashboard already calls `/api/admin/orders` (GET for listing, PATCH for updating). With rewrites, these will be served by FastAPI.
- Your customer orders page calls `/api/orders?user_id=...` (GET). Your checkout can continue writing directly to Supabase or switch to POST `/api/orders`.
- If you enable the optional header guard for admin, add the header `X-Admin-PIN: 6300` to those requests (or disable that check).

---

## 10) Align With Current Frontend Logic

- Orders listing (Admin): GET `/api/admin/orders` returns `{ success, orders: [...] }` with `order_items` included. Matches your admin UI consumption.
- Order status update (Admin): PATCH `/api/admin/orders` with `{ id, status, tracking_number?, carrier? }` returns `{ success, order }` and triggers status email.
- Customer order create (Checkout): POST `/api/orders` with `{ user_id, items[], shipping fields, customer fields }`, returns `{ success, order }` and sends confirmation email. You can migrate your checkout to call this endpoint or keep your current direct Supabase insert.
- Customer orders list (My Orders): GET `/api/orders?user_id=...` returns `{ success, orders }` with `order_items` array.

---

## 11) Security

- Keep `SUPABASE_SERVICE_ROLE_KEY` only on the backend.
- Optional: protect admin routes beyond `X-Admin-PIN` by validating that the caller is an authenticated admin user (`admin_users.is_active = true`). You can add a JWT check from Supabase if you forward the user token.
- CORS: set `ALLOWED_ORIGINS` to your Next.js origin(s) and production domain(s).

---

## 12) Emails

- Uses Gmail SMTP with an App Password.
- Confirmation email is sent on order creation.
- Status update email is sent whenever admin changes `status` (and optionally includes `tracking_number` and `carrier`).
- You can port your existing HTML templates for richer content.

---

## 13) Deployment

- Run the Python service behind a process manager or containerize it (Docker) and expose it internally to Next.js via rewrites or an API gateway.
- Set environment variables on the server for both Next.js and FastAPI.
- Ensure outbound SMTP (gmail) is allowed by your hosting provider.

---

## 14) Migration Strategy

1) Stand up FastAPI locally with the endpoints above.
2) Add Next.js rewrites and verify admin dashboard lists and updates orders via FastAPI.
3) Optionally switch Checkout to call POST `/api/orders` instead of writing directly to Supabase.
4) Later, add JWT verification for per-user endpoints and remove any temporary `X-Admin-PIN` guards.

---

## 15) Troubleshooting

- 401 on admin endpoints: ensure `X-Admin-PIN` header matches `ADMIN_PIN` or remove that check.
- 500 on orders listing: verify `SUPABASE_SERVICE_ROLE_KEY` is valid and RLS policies permit access with service role (they do by default).
- Emails not delivered: confirm Gmail App Password, allow less secure app setting is NOT used (App Password only), and check spam.
- CORS error: add your Next.js origin to `ALLOWED_ORIGINS` or set `[*]` for local testing.

---

This backend plan mirrors your current logic and shapes the responses to match your Next.js code, so you can slot it in with minimal frontend changes. Create the files as described, run the service, add the rewrites, and your admin/customer flows will begin using Python immediately.