import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

// Gmail SMTP configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER || process.env.GMAIL_USER,
    pass: process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD,
  },
})

// Generate a 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// Store OTP temporarily in memory (for demo purposes)
// In production, you might want to use Redis or similar
const otpStore = new Map<string, { otp: string, expires: number }>()

// Clean expired OTPs
function cleanExpiredOTPs() {
  const now = Date.now()
  for (const [email, data] of otpStore.entries()) {
    if (now > data.expires) {
      otpStore.delete(email)
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Clean expired OTPs first
    cleanExpiredOTPs()

    // Generate OTP
    const otp = generateOTP()

    // Store OTP in memory with 10 minutes expiration
    const expiresAt = Date.now() + (10 * 60 * 1000) // 10 minutes
    otpStore.set(email, { otp, expires: expiresAt })

    // Prepare email content using the template
    const emailHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your Email - i1Fashion</title>
          <style>
              * {
                  margin: 0;
                  padding: 0;
                  box-sizing: border-box;
              }
              
              body {
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                  line-height: 1.6;
                  color: #333;
                  background-color: #f8fafc;
              }
              
              .container {
                  max-width: 600px;
                  margin: 0 auto;
                  background-color: #ffffff;
                  border-radius: 12px;
                  overflow: hidden;
                  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
              }
              
              .header {
                  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                  padding: 40px 30px;
                  text-align: center;
              }
              
              .logo {
                  font-size: 32px;
                  font-weight: bold;
                  color: #ffffff;
                  margin-bottom: 10px;
              }
              
              .header-subtitle {
                  color: rgba(255, 255, 255, 0.9);
                  font-size: 16px;
              }
              
              .content {
                  padding: 40px 30px;
              }
              
              .welcome-text {
                  font-size: 24px;
                  font-weight: 600;
                  color: #1a202c;
                  margin-bottom: 20px;
                  text-align: center;
              }
              
              .description {
                  font-size: 16px;
                  color: #4a5568;
                  margin-bottom: 30px;
                  text-align: center;
                  line-height: 1.6;
              }
              
              .otp-container {
                  background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
                  border: 2px dashed #cbd5e0;
                  border-radius: 12px;
                  padding: 30px;
                  text-align: center;
                  margin: 30px 0;
              }
              
              .otp-label {
                  font-size: 14px;
                  color: #718096;
                  margin-bottom: 10px;
                  text-transform: uppercase;
                  letter-spacing: 1px;
                  font-weight: 600;
              }
              
              .otp-code {
                  font-size: 36px;
                  font-weight: bold;
                  color: #667eea;
                  letter-spacing: 8px;
                  font-family: 'Courier New', monospace;
                  margin: 10px 0;
              }
              
              .otp-note {
                  font-size: 12px;
                  color: #a0aec0;
                  margin-top: 10px;
              }
              
              .instructions {
                  background-color: #f7fafc;
                  border-left: 4px solid #667eea;
                  padding: 20px;
                  margin: 30px 0;
                  border-radius: 0 8px 8px 0;
              }
              
              .instructions h3 {
                  color: #2d3748;
                  font-size: 16px;
                  margin-bottom: 10px;
              }
              
              .instructions p {
                  color: #4a5568;
                  font-size: 14px;
                  margin-bottom: 8px;
              }
              
              .security-note {
                  background-color: #fef5e7;
                  border: 1px solid #f6e05e;
                  border-radius: 8px;
                  padding: 15px;
                  margin: 20px 0;
              }
              
              .security-note p {
                  color: #744210;
                  font-size: 14px;
                  margin: 0;
              }
              
              .footer {
                  background-color: #f7fafc;
                  padding: 30px;
                  text-align: center;
                  border-top: 1px solid #e2e8f0;
              }
              
              .footer-text {
                  color: #718096;
                  font-size: 14px;
                  margin-bottom: 15px;
              }
              
              .social-links {
                  margin: 20px 0;
              }
              
              .social-links a {
                  display: inline-block;
                  margin: 0 10px;
                  color: #667eea;
                  text-decoration: none;
                  font-size: 14px;
              }
              
              .company-info {
                  color: #a0aec0;
                  font-size: 12px;
                  margin-top: 20px;
              }
              
              @media (max-width: 600px) {
                  .container {
                      margin: 0;
                      border-radius: 0;
                  }
                  
                  .header, .content, .footer {
                      padding: 30px 20px;
                  }
                  
                  .otp-code {
                      font-size: 28px;
                      letter-spacing: 4px;
                  }
                  
                  .welcome-text {
                      font-size: 20px;
                  }
              }
          </style>
      </head>
      <body>
          <div class="container">
              <!-- Header -->
              <div class="header">
                  <div class="logo">i1Fashion</div>
                  <div class="header-subtitle">Premium Clothing E-Commerce</div>
              </div>
              
              <!-- Content -->
              <div class="content">
                  <h1 class="welcome-text">Welcome to i1Fashion!</h1>
                  <p class="description">
                      Thank you for joining our fashion community. To complete your registration and start shopping, 
                      please verify your email address using the code below.
                  </p>
                  
                  <!-- OTP Code -->
                  <div class="otp-container">
                      <div class="otp-label">Your Verification Code</div>
                      <div class="otp-code">${otp}</div>
                      <div class="otp-note">This code will expire in 10 minutes</div>
                  </div>
                  
                  <!-- Instructions -->
                  <div class="instructions">
                      <h3>How to verify your email:</h3>
                      <p>1. Return to the i1Fashion verification page</p>
                      <p>2. Enter the 6-digit code shown above</p>
                      <p>3. Click "Verify Email" to complete your registration</p>
                  </div>
                  
                  <!-- Security Note -->
                  <div class="security-note">
                      <p>
                          <strong>Security Note:</strong> If you didn't create an account with i1Fashion, 
                          please ignore this email. Your email address will not be used for any purpose.
                      </p>
                  </div>
              </div>
              
              <!-- Footer -->
              <div class="footer">
                  <p class="footer-text">
                      Need help? Contact our support team at 
                      <a href="mailto:support@i1fashion.com" style="color: #667eea;">support@i1fashion.com</a>
                  </p>
                  
                  <div class="social-links">
                      <a href="#">Facebook</a>
                      <a href="#">Instagram</a>
                      <a href="#">Twitter</a>
                  </div>
                  
                  <div class="company-info">
                      <p>© 2025 i1Fashion. All rights reserved.</p>
                      <p>This email was sent to ${email}</p>
                  </div>
              </div>
          </div>
      </body>
      </html>
    `

    // Send email
    const mailOptions = {
      from: `"i1Fashion" <${process.env.SMTP_USER || process.env.GMAIL_USER}>`,
      to: email,
      subject: 'Verify Your Email - i1Fashion',
      html: emailHtml,
    }

    const result = await transporter.sendMail(mailOptions)
    console.log('OTP email sent:', result.messageId)

    return NextResponse.json({
      success: true,
      message: 'OTP sent successfully',
      messageId: result.messageId
    })

  } catch (error) {
    console.error('Error sending OTP:', error)
    return NextResponse.json(
      { error: 'Failed to send OTP' },
      { status: 500 }
    )
  }
}

// Verify OTP endpoint
export async function PUT(request: NextRequest) {
  try {
    const { email, otp } = await request.json()

    if (!email || !otp) {
      return NextResponse.json(
        { error: 'Email and OTP are required' },
        { status: 400 }
      )
    }

    // Clean expired OTPs first
    cleanExpiredOTPs()

    // Get OTP from memory store
    const storedOtpData = otpStore.get(email)

    if (!storedOtpData) {
      return NextResponse.json(
        { error: 'Invalid or expired OTP' },
        { status: 400 }
      )
    }

    // Check if OTP is expired
    const now = Date.now()
    if (now > storedOtpData.expires) {
      // Remove expired OTP
      otpStore.delete(email)
      return NextResponse.json(
        { error: 'OTP has expired' },
        { status: 400 }
      )
    }

    // Check if OTP matches
    if (storedOtpData.otp !== otp) {
      return NextResponse.json(
        { error: 'Invalid OTP' },
        { status: 400 }
      )
    }

    // OTP is valid, remove it from memory
    otpStore.delete(email)

    return NextResponse.json({
      success: true,
      message: 'OTP verified successfully'
    })

  } catch (error) {
    console.error('Error verifying OTP:', error)
    return NextResponse.json(
      { error: 'Failed to verify OTP' },
      { status: 500 }
    )
  }
}