import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export async function POST(request: NextRequest) {
  try {
    const { to, subject, message } = await request.json()

    // Validate required fields
    if (!to || !subject || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: to, subject, message' },
        { status: 400 }
      )
    }

    // Create transporter (you'll need to configure this with your email service)
    // const transporter = nodemailer.createTransporter({
    //   host: process.env.SMTP_HOST || 'smtp.gmail.com',
    //   port: parseInt(process.env.SMTP_PORT || '587'),
    //   secure: false,
    //   auth: {
    //     user: process.env.SMTP_USER,
    //     pass: process.env.SMTP_PASS,
    //   },
    // })

    // Email template
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
          }
          .container {
            background: white;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #10b981;
          }
          .logo {
            font-size: 28px;
            font-weight: bold;
            color: #10b981;
            margin-bottom: 10px;
          }
          .content {
            margin-bottom: 30px;
            white-space: pre-wrap;
          }
          .footer {
            text-align: center;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 14px;
          }
          .contact-info {
            margin-top: 20px;
            padding: 15px;
            background-color: #f0fdf4;
            border-radius: 6px;
            border-left: 4px solid #10b981;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">i1Fashion</div>
            <p style="margin: 0; color: #6b7280;">Premium Clothing E-Commerce</p>
          </div>
          
          <div class="content">
            ${message}
          </div>
          
          <div class="contact-info">
            <h4 style="margin: 0 0 10px 0; color: #10b981;">Need Help?</h4>
            <p style="margin: 0;">
              Contact our customer support team:<br>
              📧 Email: support@i1fashion.com<br>
              📞 Phone: +91 12345 67890<br>
              🌐 Website: www.i1fashion.com
            </p>
          </div>
          
          <div class="footer">
            <p>© ${new Date().getFullYear()} i1Fashion. All rights reserved.</p>
            <p>This email was sent from i1Fashion Admin Panel.</p>
          </div>
        </div>
      </body>
      </html>
    `

    // Send email
    // const mailOptions = {
    //   from: `"i1Fashion" <${process.env.SMTP_USER}>`,
    //   to: to,
    //   subject: `[i1Fashion] ${subject}`,
    //   html: htmlContent,
    //   text: message, // Plain text fallback
    // }

    // For demo purposes, we'll simulate email sending
    // In production, uncomment the line below:
    // await transporter.sendMail(mailOptions)
    
    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 1000))

    return NextResponse.json({
      success: true,
      message: 'Email sent successfully',
      details: {
        to,
        subject,
        sentAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Email sending error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to send email',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Handle GET requests (for testing)
export async function GET() {
  return NextResponse.json({
    message: 'Email API endpoint is working',
    usage: 'POST to this endpoint with { to, subject, message } to send emails'
  })
}