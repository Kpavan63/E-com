import nodemailer from 'nodemailer'
import { Order, OrderItem } from './supabase'

// Gmail SMTP configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD, // Use App Password, not regular password
  },
})

interface OrderEmailData {
  order: Order
  orderItems: (OrderItem & {
    product_name: string
    variant_color: string
    variant_size: string
  })[]
}

export async function sendOrderConfirmationEmail({ order, orderItems }: OrderEmailData) {
  try {
    const orderItemsHtml = orderItems.map(item => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">
          ${item.product_name}
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">
          ${item.variant_color}
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">
          ${item.variant_size}
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">
          ${item.quantity}
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">
          ₹${item.unit_price.toFixed(2)}
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">
          ₹${item.total_price.toFixed(2)}
        </td>
      </tr>
    `).join('')

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Order Confirmation - i1Fashion</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .order-details { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th { background: #f4f4f4; padding: 12px; text-align: left; border-bottom: 2px solid #ddd; }
          .total { font-size: 18px; font-weight: bold; color: #667eea; }
          .footer { text-align: center; padding: 20px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>i1Fashion</h1>
            <h2>Order Confirmation</h2>
          </div>
          
          <div class="content">
            <p>Dear ${order.customer_name},</p>
            <p>Thank you for your order! We're excited to confirm that we've received your order and it's being processed.</p>
            
            <div class="order-details">
              <h3>Order Details</h3>
              <p><strong>Order Number:</strong> ${order.order_number}</p>
              <p><strong>Order Date:</strong> ${new Date(order.created_at).toLocaleDateString()}</p>
              <p><strong>Payment Method:</strong> Cash on Delivery</p>
              <p><strong>Order Status:</strong> ${order.status.charAt(0).toUpperCase() + order.status.slice(1)}</p>
            </div>

            <div class="order-details">
              <h3>Shipping Address</h3>
              <p>
                ${order.customer_name}<br>
                ${order.shipping_address}<br>
                ${order.shipping_city}, ${order.shipping_state} ${order.shipping_postal_code}<br>
                Phone: ${order.customer_phone}
              </p>
            </div>

            <div class="order-details">
              <h3>Order Items</h3>
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Color</th>
                    <th>Size</th>
                    <th>Quantity</th>
                    <th>Unit Price</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${orderItemsHtml}
                </tbody>
              </table>
              <p class="total">Total Amount: ₹${order.total_amount.toFixed(2)}</p>
            </div>

            <div class="order-details">
              <h3>What's Next?</h3>
              <p>• We'll process your order within 1-2 business days</p>
              <p>• You'll receive a shipping confirmation email once your order is dispatched</p>
              <p>• Payment will be collected upon delivery (Cash on Delivery)</p>
              <p>• Expected delivery: 3-7 business days</p>
            </div>

            <p>If you have any questions about your order, please don't hesitate to contact us.</p>
            <p>Thank you for choosing i1Fashion!</p>
          </div>

          <div class="footer">
            <p>© 2024 i1Fashion - i1Agency CEO</p>
            <p>This is an automated email. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `

    const mailOptions = {
      from: `"i1Fashion" <${process.env.GMAIL_USER}>`,
      to: order.customer_email,
      subject: `Order Confirmation - ${order.order_number} | i1Fashion`,
      html: emailHtml,
    }

    const result = await transporter.sendMail(mailOptions)
    console.log('Order confirmation email sent:', result.messageId)
    return { success: true, messageId: result.messageId }
  } catch (error) {
    console.error('Error sending order confirmation email:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error occurred' }
  }
}

export async function sendOrderStatusUpdateEmail(order: Order, newStatus: string) {
  try {
    const statusMessages: Record<string, string> = {
      confirmed: 'Your order has been confirmed and is being prepared.',
      processing: 'Your order is currently being processed.',
      shipped: 'Great news! Your order has been shipped and is on its way.',
      delivered: 'Your order has been delivered successfully.',
      cancelled: 'Your order has been cancelled. If you have any questions, please contact us.'
    }

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Order Update - i1Fashion</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .status-update { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; text-align: center; }
          .status { font-size: 24px; font-weight: bold; color: #667eea; margin: 10px 0; }
          .footer { text-align: center; padding: 20px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>i1Fashion</h1>
            <h2>Order Status Update</h2>
          </div>
          
          <div class="content">
            <p>Dear ${order.customer_name},</p>
            
            <div class="status-update">
              <h3>Order #${order.order_number}</h3>
              <div class="status">${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}</div>
              <p>${statusMessages[newStatus] || 'Your order status has been updated.'}</p>
            </div>

            <p>Thank you for choosing i1Fashion!</p>
          </div>

          <div class="footer">
            <p>© 2024 i1Fashion - i1Agency CEO</p>
          </div>
        </div>
      </body>
      </html>
    `

    const mailOptions = {
      from: `"i1Fashion" <${process.env.GMAIL_USER}>`,
      to: order.customer_email,
      subject: `Order Update - ${order.order_number} | i1Fashion`,
      html: emailHtml,
    }

    const result = await transporter.sendMail(mailOptions)
    console.log('Order status update email sent:', result.messageId)
    return { success: true, messageId: result.messageId }
  } catch (error) {
    console.error('Error sending order status update email:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error occurred' }
  }
}