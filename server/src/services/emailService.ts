import nodemailer from 'nodemailer';
import crypto from 'crypto';

// Email transporter configuration
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

// Generate verification code (6-digit)
export const generateVerificationCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Generate password reset code (6-digit)
export const generatePasswordResetCode = (): { code: string; expiresAt: Date } => {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now
  return { code, expiresAt };
};

// Send verification email
export const sendVerificationEmail = async (
  email: string, 
  firstName: string, 
  verificationCode: string
): Promise<void> => {
  const transporter = createTransporter();
  
  const mailOptions = {
    from: {
      name: 'EmployMe',
      address: process.env.SMTP_USER || 'noreply@employme.com'
    },
    to: email,
    subject: 'Verify Your Email - EmployMe',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4f46e5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .verification-code { 
            font-size: 32px; 
            font-weight: bold; 
            text-align: center; 
            padding: 20px; 
            background: white; 
            border: 2px solid #4f46e5; 
            border-radius: 8px; 
            margin: 20px 0;
            letter-spacing: 4px;
            color: #4f46e5;
          }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to EmployMe!</h1>
          </div>
          <div class="content">
            <h2>Hello ${firstName}!</h2>
            <p>Thank you for signing up for EmployMe. To complete your registration and start exploring job opportunities, please enter the verification code below:</p>
            
            <div class="verification-code">
              ${verificationCode}
            </div>
            
            <p><strong>This verification code will expire in 15 minutes.</strong></p>
            
            <p>If you didn't create an account with EmployMe, you can safely ignore this email.</p>
          </div>
          <div class="footer">
            <p>© 2025 EmployMe. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Verification email sent successfully to:', email);
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw new Error('Failed to send verification email');
  }
};

// Send password reset email
export const sendPasswordResetEmail = async (
  email: string, 
  firstName: string, 
  resetCode: string
): Promise<void> => {
  const transporter = createTransporter();
  
  const mailOptions = {
    from: {
      name: 'EmployMe',
      address: process.env.SMTP_USER || 'noreply@employme.com'
    },
    to: email,
    subject: 'Password Reset Request - EmployMe',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .reset-code { 
            font-size: 32px; 
            font-weight: bold; 
            text-align: center; 
            padding: 20px; 
            background: white; 
            border: 2px solid #dc2626; 
            border-radius: 8px; 
            margin: 20px 0;
            letter-spacing: 4px;
            color: #dc2626;
          }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset</h1>
          </div>
          <div class="content">
            <h2>Hello ${firstName}!</h2>
            <p>We received a request to reset your password for your EmployMe account. Please use the code below to reset your password:</p>
            
            <div class="reset-code">
              ${resetCode}
            </div>
            
            <p><strong>This reset code will expire in 15 minutes.</strong></p>
            
            <p>If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.</p>
          </div>
          <div class="footer">
            <p>© 2025 EmployMe. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Password reset email sent successfully to:', email);
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw new Error('Failed to send password reset email');
  }
};

// Send welcome email after verification
export const sendWelcomeEmail = async (
  email: string, 
  firstName: string
): Promise<void> => {
  const transporter = createTransporter();
  
  const mailOptions = {
    from: {
      name: 'EmployMe',
      address: process.env.SMTP_USER || 'noreply@employme.com'
    },
    to: email,
    subject: 'Welcome to EmployMe!',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to EmployMe</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #10b981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Welcome to EmployMe!</h1>
          </div>
          <div class="content">
            <h2>Hello ${firstName}!</h2>
            <p>Your email has been successfully verified! Welcome to the EmployMe community.</p>
            
            <p>Here's what you can do next:</p>
            <ul>
              <li>Complete your profile to attract employers</li>
              <li>Browse thousands of job opportunities</li>
              <li>Apply to jobs that match your skills</li>
              <li>Save jobs for later review</li>
              <li>Get job recommendations based on your preferences</li>
            </ul>
            
            <div style="text-align: center;">
              <a href="${process.env.CLIENT_URL}/dashboard" class="button">Start Exploring Jobs</a>
            </div>
            
            <p>If you have any questions, feel free to contact our support team.</p>
          </div>
          <div class="footer">
            <p>© 2025 EmployMe. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Welcome email sent successfully to:', email);
  } catch (error) {
    console.error('Error sending welcome email:', error);
    // Don't throw error for welcome email failures
  }
};
