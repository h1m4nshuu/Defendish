import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export const sendOTPEmail = async (email: string, otp: string): Promise<void> => {
  try {
    // For development: Log OTP to console
    console.log('\n🔐 ==================== OTP VERIFICATION ====================');
    console.log(`📧 Email: ${email}`);
    console.log(`🔢 OTP Code: ${otp}`);
    console.log(`⏰ Valid for: 10 minutes`);
    console.log('===========================================================\n');

    // Skip actual email sending if no email config
    if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER) {
      console.log('⚠️  Email service not configured. OTP displayed above for testing.');
      return;
    }

    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'Defendish App <noreply@defendish.com>',
      to: email,
      subject: 'Verify Your Defendish Account',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Verify Your Account</h2>
          <p>Thank you for signing up with Defendish - Your Family Food Safety Assistant.</p>
          <p>Your verification code is:</p>
          <div style="background-color: #f3f4f6; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 20px 0;">
            ${otp}
          </div>
          <p>This code will expire in 10 minutes.</p>
          <p>If you didn't request this code, please ignore this email.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px;">
            Defendish - Keeping your family safe, one ingredient at a time.
          </p>
        </div>
      `,
    });
    console.log(`OTP email sent to ${email}`);
  } catch (error) {
    console.error('Error sending OTP email:', error);
    throw new Error('Failed to send OTP email');
  }
};

export const sendExpiryAlert = async (
  email: string,
  productName: string,
  expiryDate: Date,
  daysRemaining: number
): Promise<void> => {
  try {
    let subject = '';
    let message = '';

    if (daysRemaining === 0) {
      subject = `⚠️ Product Expired Today: ${productName}`;
      message = `The product <strong>${productName}</strong> has expired today.`;
    } else if (daysRemaining === 1) {
      subject = `⚠️ Product Expiring Tomorrow: ${productName}`;
      message = `The product <strong>${productName}</strong> will expire tomorrow.`;
    } else {
      subject = `🔔 Product Expiring Soon: ${productName}`;
      message = `The product <strong>${productName}</strong> will expire in ${daysRemaining} days.`;
    }

    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'Defendish App <noreply@defendish.com>',
      to: email,
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">Expiry Alert</h2>
          <p>${message}</p>
          <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Product:</strong> ${productName}</p>
            <p style="margin: 10px 0 0 0;"><strong>Expiry Date:</strong> ${expiryDate.toLocaleDateString()}</p>
          </div>
          <p>Please check this product before consumption.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px;">
            Defendish - Keeping your family safe, one ingredient at a time.
          </p>
        </div>
      `,
    });
    console.log(`Expiry alert sent for ${productName} to ${email}`);
  } catch (error) {
    console.error('Error sending expiry alert:', error);
  }
};
