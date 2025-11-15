import nodemailer from "nodemailer";
import crypto from "crypto";

// Email transporter configuration
const createTransporter = () => {
  const config = {
    host: process.env.SMTP_HOST || "sandbox.smtp.mailtrap.io",
    port: parseInt(process.env.SMTP_PORT || "2525"),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    // Additional configuration for better reliability
    connectionTimeout: 60000, // 60 seconds
    greetingTimeout: 30000, // 30 seconds
    socketTimeout: 60000, // 60 seconds
    // For development with Mailtrap
    tls: {
      rejectUnauthorized: false,
    },
  };

  console.log("Creating email transporter with config:", {
    host: config.host,
    port: config.port,
    user: config.auth.user ? "***hidden***" : "not set",
    pass: config.auth.pass ? "***hidden***" : "not set",
  });

  return nodemailer.createTransport(config);
};

// Generate verification code (6-digit)
export const generateVerificationCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Generate password reset code (6-digit)
export const generatePasswordResetCode = (): {
  code: string;
  expiresAt: Date;
} => {
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
      name: "EmployMe",
      address:
        process.env.MAIL_FROM ||
        process.env.SMTP_USER ||
        "noreply@employme.com",
    },
    to: email,
    subject: "Verify Your Email - EmployMe",
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
    `,
  };

  try {
    console.log("Attempting to send verification email to:", email);
    console.log("Email configuration:", {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      from: process.env.MAIL_FROM || process.env.SMTP_USER,
    });

    const info = await transporter.sendMail(mailOptions);
    console.log("Verification email sent successfully to:", email);
    console.log("Message ID:", info.messageId);
  } catch (error: any) {
    console.error("Error sending verification email:", error);
    console.error("Error details:", {
      message: error?.message,
      code: error?.code,
      errno: error?.errno,
      stack: error?.stack,
    });
    throw new Error(
      `Failed to send verification email: ${error?.message || "Unknown error"}`
    );
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
      name: "EmployMe",
      address:
        process.env.MAIL_FROM ||
        process.env.SMTP_USER ||
        "noreply@employme.com",
    },
    to: email,
    subject: "Password Reset Request - EmployMe",
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
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Password reset email sent successfully to:", email);
  } catch (error) {
    console.error("Error sending password reset email:", error);
    throw new Error("Failed to send password reset email");
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
      name: "EmployMe",
      address:
        process.env.MAIL_FROM ||
        process.env.SMTP_USER ||
        "noreply@employme.com",
    },
    to: email,
    subject: "Welcome to EmployMe!",
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
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Welcome email sent successfully to:", email);
  } catch (error) {
    console.error("Error sending welcome email:", error);
    // Don't throw error for welcome email failures
  }
};

// Send job application notification to employer
export const sendJobApplicationNotification = async (
  employerEmail: string,
  employerName: string,
  jobTitle: string,
  applicantName: string,
  companyName: string
): Promise<void> => {
  const transporter = createTransporter();

  const mailOptions = {
    from: {
      name: "EmployMe",
      address:
        process.env.MAIL_FROM ||
        process.env.SMTP_USER ||
        "noreply@employme.com",
    },
    to: employerEmail,
    subject: `New Job Application - ${jobTitle}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Job Application</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f59e0b; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .job-details { 
            background: white; 
            padding: 20px; 
            border-radius: 8px; 
            margin: 20px 0;
            border-left: 4px solid #f59e0b;
          }
          .button { 
            display: inline-block; 
            background: #f59e0b; 
            color: white; 
            padding: 12px 30px; 
            text-decoration: none; 
            border-radius: 6px; 
            margin: 20px 0; 
          }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📋 New Job Application</h1>
          </div>
          <div class="content">
            <h2>Hello ${employerName}!</h2>
            <p>Great news! You have received a new application for your job posting.</p>
            
            <div class="job-details">
              <h3>📝 Application Details:</h3>
              <p><strong>Job Position:</strong> ${jobTitle}</p>
              <p><strong>Company:</strong> ${companyName}</p>
              <p><strong>Applicant:</strong> ${applicantName}</p>
              <p><strong>Applied:</strong> ${new Date().toLocaleDateString()}</p>
            </div>
            
            <div style="text-align: center;">
              <a href="${
                process.env.CLIENT_URL
              }/employer/applications" class="button">Review Application</a>
            </div>
            
            <p>We recommend reviewing applications promptly to maintain engagement with quality candidates.</p>
          </div>
          <div class="footer">
            <p>© 2025 EmployMe. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(
      "Job application notification sent to employer:",
      employerEmail
    );
  } catch (error) {
    console.error("Error sending job application notification:", error);
    throw error; // Re-throw to handle in controller if needed
  }
};

// Send new user registration notification to admin
export const sendNewUserNotificationToAdmin = async (
  userEmail: string,
  userName: string,
  userRole: string
): Promise<void> => {
  const adminEmail = process.env.ADMIN_EMAIL;

  if (!adminEmail) {
    console.warn("ADMIN_EMAIL not configured. Skipping admin notification.");
    return;
  }

  const transporter = createTransporter();

  const mailOptions = {
    from: {
      name: "EmployMe System",
      address:
        process.env.MAIL_FROM ||
        process.env.SMTP_USER ||
        "noreply@employme.com",
    },
    to: adminEmail,
    subject: `New User Registration - ${userRole}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New User Registration</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #7c3aed; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .user-details { 
            background: white; 
            padding: 20px; 
            border-radius: 8px; 
            margin: 20px 0;
            border-left: 4px solid #7c3aed;
          }
          .button { 
            display: inline-block; 
            background: #7c3aed; 
            color: white; 
            padding: 12px 30px; 
            text-decoration: none; 
            border-radius: 6px; 
            margin: 20px 0; 
          }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>👤 New User Registration</h1>
          </div>
          <div class="content">
            <h2>Hello Admin!</h2>
            <p>A new user has registered on the EmployMe platform.</p>
            
            <div class="user-details">
              <h3>👤 User Details:</h3>
              <p><strong>Name:</strong> ${userName}</p>
              <p><strong>Email:</strong> ${userEmail}</p>
              <p><strong>Role:</strong> ${userRole}</p>
              <p><strong>Registration Date:</strong> ${new Date().toLocaleDateString()}</p>
            </div>
            
            <div style="text-align: center;">
              <a href="${
                process.env.CLIENT_URL
              }/admin/users" class="button">View User Details</a>
            </div>
            
            <p>Please monitor new registrations for quality control and platform security.</p>
          </div>
          <div class="footer">
            <p>© 2025 EmployMe. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("New user notification sent to admin:", adminEmail);
  } catch (error) {
    console.error("Error sending new user notification to admin:", error);
    // Don't throw error for admin notifications - it's not critical
  }
};

// Send new job posting notification to admin
export const sendNewJobNotificationToAdmin = async (
  jobTitle: string,
  companyName: string,
  employerName: string,
  employerEmail: string
): Promise<void> => {
  const adminEmail = process.env.ADMIN_EMAIL;

  if (!adminEmail) {
    console.warn("ADMIN_EMAIL not configured. Skipping admin notification.");
    return;
  }

  const transporter = createTransporter();

  const mailOptions = {
    from: {
      name: "EmployMe System",
      address:
        process.env.MAIL_FROM ||
        process.env.SMTP_USER ||
        "noreply@employme.com",
    },
    to: adminEmail,
    subject: `New Job Posting - ${jobTitle}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Job Posting</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #059669; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .job-details { 
            background: white; 
            padding: 20px; 
            border-radius: 8px; 
            margin: 20px 0;
            border-left: 4px solid #059669;
          }
          .button { 
            display: inline-block; 
            background: #059669; 
            color: white; 
            padding: 12px 30px; 
            text-decoration: none; 
            border-radius: 6px; 
            margin: 20px 0; 
          }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>💼 New Job Posting</h1>
          </div>
          <div class="content">
            <h2>Hello Admin!</h2>
            <p>A new job has been posted on the EmployMe platform and is pending review.</p>
            
            <div class="job-details">
              <h3>💼 Job Details:</h3>
              <p><strong>Job Title:</strong> ${jobTitle}</p>
              <p><strong>Company:</strong> ${companyName}</p>
              <p><strong>Posted by:</strong> ${employerName} (${employerEmail})</p>
              <p><strong>Posted Date:</strong> ${new Date().toLocaleDateString()}</p>
            </div>
            
            <div style="text-align: center;">
              <a href="${
                process.env.CLIENT_URL
              }/admin/jobs" class="button">Review Job Posting</a>
            </div>
            
            <p>Please review the job posting for compliance with platform guidelines and approve for publication.</p>
          </div>
          <div class="footer">
            <p>© 2025 EmployMe. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("New job notification sent to admin:", adminEmail);
  } catch (error) {
    console.error("Error sending new job notification to admin:", error);
    // Don't throw error for admin notifications - it's not critical
  }
};

// Send interview scheduling notification to job seeker
export const sendInterviewScheduleNotification = async (
  jobSeekerEmail: string,
  jobSeekerName: string,
  jobTitle: string,
  companyName: string,
  employerEmail: string,
  scheduledDate: string,
  scheduledTime: string,
  interviewDescription: string,
  location: string,
  isVirtual: boolean,
  meetingLink?: string
): Promise<void> => {
  const transporter = createTransporter();

  // Format the date for display
  const interviewDate = new Date(scheduledDate).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Format the time to display AM/PM
  const formatTimeToAMPM = (time: string): string => {
    const timeParts = time.split(":");
    if (timeParts.length < 2 || !timeParts[0] || !timeParts[1]) return time;

    const hours = timeParts[0];
    const minutes = timeParts[1];
    const hour24 = parseInt(hours, 10);
    const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
    const ampm = hour24 >= 12 ? "PM" : "AM";
    return `${hour12}:${minutes} ${ampm}`;
  };

  const formattedTime = formatTimeToAMPM(scheduledTime);

  const mailOptions = {
    from: {
      name: "EmployMe",
      address:
        process.env.MAIL_FROM ||
        process.env.SMTP_USER ||
        "noreply@employme.com",
    },
    to: jobSeekerEmail,
    subject: `Interview Scheduled - ${jobTitle} at ${companyName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Interview Scheduled</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #3b82f6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .interview-details { 
            background: white; 
            padding: 20px; 
            border-radius: 8px; 
            margin: 20px 0;
            border-left: 4px solid #3b82f6;
          }
          .detail-row {
            display: flex;
            justify-content: space-between;
            margin: 10px 0;
            padding: 8px 0;
            border-bottom: 1px solid #e5e7eb;
          }
          .detail-label {
            font-weight: 600;
            color: #374151;
            flex: 1;
          }
          .detail-value {
            flex: 2;
            color: #1f2937;
          }
          .button { 
            display: inline-block; 
            background: #3b82f6; 
            color: white; 
            padding: 12px 30px; 
            text-decoration: none; 
            border-radius: 6px; 
            margin: 20px 0; 
          }
          .meeting-link {
            background: #dbeafe;
            border: 1px solid #3b82f6;
            padding: 15px;
            border-radius: 8px;
            margin: 15px 0;
            text-align: center;
          }
          .meeting-link a {
            color: #3b82f6;
            text-decoration: none;
            font-weight: 600;
          }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
          .important-note {
            background: #fef3c7;
            border: 1px solid #f59e0b;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Interview Scheduled!</h1>
          </div>
          <div class="content">
            <h2>Hello ${jobSeekerName}!</h2>
            <p>Great news! Your application has been reviewed and an interview has been scheduled for the position at ${companyName}.</p>
            
            <div class="interview-details">
              <h3>📅 Interview Details</h3>
              
              <div class="detail-row">
                <div class="detail-label">Position:</div>
                <div class="detail-value">${jobTitle}</div>
              </div>
              
              <div class="detail-row">
                <div class="detail-label">Company:</div>
                <div class="detail-value">${companyName}</div>
              </div>
              
              <div class="detail-row">
                <div class="detail-label">Employer Contact:</div>
                <div class="detail-value">${employerEmail}</div>
              </div>
              
              <div class="detail-row">
                <div class="detail-label">Date:</div>
                <div class="detail-value">${interviewDate}</div>
              </div>
              
              <div class="detail-row">
                <div class="detail-label">Time:</div>
                <div class="detail-value">${formattedTime}</div>
              </div>
              
              <div class="detail-row">
                <div class="detail-label">Type:</div>
                <div class="detail-value">${
                  isVirtual ? "Virtual Interview" : "In-Person Interview"
                }</div>
              </div>
              
              <div class="detail-row">
                <div class="detail-label">Location:</div>
                <div class="detail-value">${location}</div>
              </div>
              
              ${
                interviewDescription
                  ? `
              <div class="detail-row">
                <div class="detail-label">Description:</div>
                <div class="detail-value">${interviewDescription}</div>
              </div>
              `
                  : ""
              }
            </div>
            
            ${
              isVirtual && meetingLink
                ? `
            <div class="meeting-link">
              <p><strong>📹 Virtual Meeting Link:</strong></p>
              <a href="${meetingLink}" target="_blank">${meetingLink}</a>
            </div>
            `
                : ""
            }
            

            
            <div style="text-align: center;">
              <a href="${
                process.env.CLIENT_URL
              }/dashboard" class="button">View Interview Details</a>
            </div>
            
            <p>We wish you the best of luck with your interview! If you have any questions or need to reschedule, please contact the employer directly.</p>
          </div>
          <div class="footer">
            <p>© 2025 EmployMe. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(
      "Interview schedule notification sent to job seeker:",
      jobSeekerEmail
    );
  } catch (error) {
    console.error("Error sending interview schedule notification:", error);
    throw error; // Re-throw to handle in controller if needed
  }
};

// Send interview update notification to job seeker
export const sendInterviewUpdateNotification = async (
  jobSeekerEmail: string,
  jobSeekerName: string,
  jobTitle: string,
  companyName: string,
  employerEmail: string,
  scheduledDate: string,
  scheduledTime: string,
  interviewDescription: string,
  location: string,
  isVirtual: boolean,
  meetingLink?: string
): Promise<void> => {
  const transporter = createTransporter();

  // Format the date for display
  const interviewDate = new Date(scheduledDate).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Format the time to display AM/PM
  const formatTimeToAMPM = (time: string): string => {
    const timeParts = time.split(":");
    if (timeParts.length < 2 || !timeParts[0] || !timeParts[1]) return time;

    const hours = timeParts[0];
    const minutes = timeParts[1];
    const hour24 = parseInt(hours, 10);
    const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
    const ampm = hour24 >= 12 ? "PM" : "AM";
    return `${hour12}:${minutes} ${ampm}`;
  };

  const formattedTime = formatTimeToAMPM(scheduledTime);

  const mailOptions = {
    from: {
      name: "EmployMe",
      address:
        process.env.MAIL_FROM ||
        process.env.SMTP_USER ||
        "noreply@employme.com",
    },
    to: jobSeekerEmail,
    subject: `Interview Updated - ${jobTitle} at ${companyName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Interview Updated</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f59e0b; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .interview-details { 
            background: white; 
            padding: 20px; 
            border-radius: 8px; 
            margin: 20px 0;
            border-left: 4px solid #f59e0b;
          }
          .detail-row {
            display: flex;
            justify-content: space-between;
            margin: 10px 0;
            padding: 8px 0;
            border-bottom: 1px solid #e5e7eb;
          }
          .detail-label {
            font-weight: 600;
            color: #374151;
            flex: 1;
          }
          .detail-value {
            flex: 2;
            color: #1f2937;
          }
          .button { 
            display: inline-block; 
            background: #f59e0b; 
            color: white; 
            padding: 12px 30px; 
            text-decoration: none; 
            border-radius: 6px; 
            margin: 20px 0; 
          }
          .meeting-link {
            background: #dbeafe;
            border: 1px solid #3b82f6;
            padding: 15px;
            border-radius: 8px;
            margin: 15px 0;
            text-align: center;
          }
          .meeting-link a {
            color: #3b82f6;
            text-decoration: none;
            font-weight: 600;
          }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
          .update-notice {
            background: #fef3c7;
            border: 1px solid #f59e0b;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📅 Interview Updated!</h1>
          </div>
          <div class="content">
            <h2>Hello ${jobSeekerName}!</h2>
            
            <div class="update-notice">
              <p><strong>⚠️ Important Update</strong></p>
              <p>Your interview details have been updated. Please review the new information below.</p>
            </div>
            
            <div class="interview-details">
              <h3>📅 Updated Interview Details</h3>
              
              <div class="detail-row">
                <div class="detail-label">Position:</div>
                <div class="detail-value">${jobTitle}</div>
              </div>
              
              <div class="detail-row">
                <div class="detail-label">Company:</div>
                <div class="detail-value">${companyName}</div>
              </div>
              
              <div class="detail-row">
                <div class="detail-label">Employer Contact:</div>
                <div class="detail-value">${employerEmail}</div>
              </div>
              
              <div class="detail-row">
                <div class="detail-label">Date:</div>
                <div class="detail-value">${interviewDate}</div>
              </div>
              
              <div class="detail-row">
                <div class="detail-label">Time:</div>
                <div class="detail-value">${formattedTime}</div>
              </div>
              
              <div class="detail-row">
                <div class="detail-label">Type:</div>
                <div class="detail-value">${
                  isVirtual ? "Virtual Interview" : "In-Person Interview"
                }</div>
              </div>
              
              <div class="detail-row">
                <div class="detail-label">Location:</div>
                <div class="detail-value">${location}</div>
              </div>
              
              ${
                interviewDescription
                  ? `
              <div class="detail-row">
                <div class="detail-label">Description:</div>
                <div class="detail-value">${interviewDescription}</div>
              </div>
              `
                  : ""
              }
            </div>
            
            ${
              isVirtual && meetingLink
                ? `
            <div class="meeting-link">
              <p><strong>📹 Virtual Meeting Link:</strong></p>
              <a href="${meetingLink}" target="_blank">${meetingLink}</a>
            </div>
            `
                : ""
            }
            
            <div style="text-align: center;">
              <a href="${
                process.env.CLIENT_URL
              }/dashboard" class="button">View Interview Details</a>
            </div>
            
            <p>Please make note of these updated details. If you have any questions or concerns about the changes, please contact the employer directly.</p>
          </div>
          <div class="footer">
            <p>© 2025 EmployMe. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(
      "Interview update notification sent to job seeker:",
      jobSeekerEmail
    );
  } catch (error) {
    console.error("Error sending interview update notification:", error);
    throw error; // Re-throw to handle in controller if needed
  }
};

// Test email connection
export const testEmailConnection = async (): Promise<boolean> => {
  try {
    const transporter = createTransporter();
    console.log("Testing email connection...");

    // Verify connection configuration
    await transporter.verify();
    console.log("✅ Email connection test successful!");
    return true;
  } catch (error: any) {
    console.error("❌ Email connection test failed:", error);
    console.error("Connection error details:", {
      message: error?.message,
      code: error?.code,
      errno: error?.errno,
    });
    return false;
  }
};

// Send application status update notification to job seeker
export const sendApplicationStatusUpdateNotification = async (
  jobSeekerEmail: string,
  jobSeekerName: string,
  jobTitle: string,
  companyName: string,
  employerEmail: string,
  newStatus: string,
  previousStatus: string
): Promise<void> => {
  const transporter = createTransporter();

  // Get status display names and colors
  const getStatusConfig = (status: string) => {
    switch (status) {
      case "PENDING":
        return {
          name: "Under Review",
          color: "#f59e0b",
          message: "Your application is being reviewed by our team.",
        };
      case "REVIEWED":
        return {
          name: "Reviewed",
          color: "#3b82f6",
          message:
            "Your application has been reviewed and we're considering your candidacy.",
        };
      case "SHORTLISTED":
        return {
          name: "Shortlisted",
          color: "#10b981",
          message:
            "Congratulations! You've been shortlisted for this position.",
        };
      case "HIRED":
        return {
          name: "Hired",
          color: "#059669",
          message:
            "🎉 Congratulations! You have been selected for this position!",
        };
      case "REJECTED":
        return {
          name: "Not Selected",
          color: "#dc2626",
          message:
            "Unfortunately, we've decided to move forward with other candidates.",
        };
      default:
        return {
          name: status,
          color: "#6b7280",
          message: "Your application status has been updated.",
        };
    }
  };

  const statusConfig = getStatusConfig(newStatus);
  const previousStatusConfig = getStatusConfig(previousStatus);

  const mailOptions = {
    from: {
      name: "EmployMe",
      address:
        process.env.MAIL_FROM ||
        process.env.SMTP_USER ||
        "noreply@employme.com",
    },
    to: jobSeekerEmail,
    subject: `Application Status Update - ${jobTitle} at ${companyName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Application Status Update</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: ${
            statusConfig.color
          }; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .status-details { 
            background: white; 
            padding: 20px; 
            border-radius: 8px; 
            margin: 20px 0;
            border-left: 4px solid ${statusConfig.color};
          }
          .detail-row {
            display: flex;
            justify-content: space-between;
            margin: 10px 0;
            padding: 8px 0;
            border-bottom: 1px solid #e5e7eb;
          }
          .detail-label {
            font-weight: 600;
            color: #374151;
            flex: 1;
          }
          .detail-value {
            flex: 2;
            color: #1f2937;
          }
          .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            color: white;
            background-color: ${statusConfig.color};
          }
          .previous-status {
            text-decoration: line-through;
            opacity: 0.6;
            background-color: #6b7280;
          }
          .button { 
            display: inline-block; 
            background: ${statusConfig.color}; 
            color: white; 
            padding: 12px 30px; 
            text-decoration: none; 
            border-radius: 6px; 
            margin: 20px 0; 
          }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
          .status-message {
            background: #f3f4f6;
            border: 1px solid #d1d5db;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
            font-style: italic;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📄 Application Status Update</h1>
          </div>
          <div class="content">
            <h2>Hello ${jobSeekerName}!</h2>
            <p>We have an update regarding your job application.</p>
            
            <div class="status-details">
              <h3>📋 Application Details</h3>
              
              <div class="detail-row">
                <div class="detail-label">Position:</div>
                <div class="detail-value">${jobTitle}</div>
              </div>
              
              <div class="detail-row">
                <div class="detail-label">Company:</div>
                <div class="detail-value">${companyName}</div>
              </div>
              
              <div class="detail-row">
                <div class="detail-label">Employer Contact:</div>
                <div class="detail-value">${employerEmail}</div>
              </div>
              
              <div class="detail-row">
                <div class="detail-label">Previous Status:</div>
                <div class="detail-value">
                  <span class="status-badge previous-status">${
                    previousStatusConfig.name
                  }</span>
                </div>
              </div>
              
              <div class="detail-row">
                <div class="detail-label">New Status:</div>
                <div class="detail-value">
                  <span class="status-badge">${statusConfig.name}</span>
                </div>
              </div>
              
              <div class="detail-row">
                <div class="detail-label">Updated:</div>
                <div class="detail-value">${new Date().toLocaleDateString()}</div>
              </div>
            </div>
            
            <div class="status-message">
              <strong>Status Update:</strong> ${statusConfig.message}
            </div>
            
            <div style="text-align: center;">
              <a href="${
                process.env.CLIENT_URL
              }/job-seeker/applications" class="button">View Application Details</a>
            </div>
            
            ${
              newStatus === "HIRED"
                ? "<p>We're excited to have you join our team! Please expect further communication regarding next steps.</p>"
                : newStatus === "SHORTLISTED"
                ? "<p>You may be contacted soon for an interview. Please keep an eye on your email and phone.</p>"
                : newStatus === "REJECTED"
                ? "<p>Thank you for your interest in this position. We encourage you to apply for other opportunities that match your skills.</p>"
                : "<p>Thank you for your continued interest. We'll keep you updated on any further developments.</p>"
            }
            
            <p>If you have any questions about your application status, feel free to contact the employer directly.</p>
          </div>
          <div class="footer">
            <p>© 2025 EmployMe. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(
      "Application status update notification sent to job seeker:",
      jobSeekerEmail
    );
  } catch (error) {
    console.error(
      "Error sending application status update notification:",
      error
    );
    throw error;
  }
};

// Send account status change notification to user
export const sendAccountStatusChangeNotification = async (
  userEmail: string,
  userName: string,
  isActive: boolean,
  adminName: string = "Administrator"
): Promise<void> => {
  const transporter = createTransporter();
  const status = isActive ? "activated" : "deactivated";
  const statusAction = isActive ? "Reactivated" : "Deactivated";

  const subject = `Account ${statusAction} - Employ.me`;

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Account Status Update</title>
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
            .content { padding: 40px 30px; }
            .status-badge { display: inline-block; padding: 8px 16px; border-radius: 20px; font-weight: bold; margin: 20px 0; }
            .activated { background-color: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
            .deactivated { background-color: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
            .info-box { background-color: #f8f9fa; border-left: 4px solid #007bff; padding: 15px; margin: 20px 0; border-radius: 4px; }
            .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; font-size: 14px; }
            .button { display: inline-block; background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
            .warning { color: #856404; background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 6px; margin: 20px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Account Status Update</h1>
                <p>Your Employ.me account status has been updated</p>
            </div>
            <div class="content">
                <h2>Hello ${userName}!</h2>
                
                <div class="status-badge ${
                  isActive ? "activated" : "deactivated"
                }">
                    Account ${statusAction}
                </div>
                
                <p>We're writing to inform you that your Employ.me account has been <strong>${status}</strong> by our ${adminName}.</p>
                
                ${
                  isActive
                    ? `
                <div class="info-box">
                    <h3>🎉 Great News!</h3>
                    <p>Your account is now active. You can:</p>
                    <ul>
                        <li>Access your dashboard</li>
                        <li>Browse and apply for jobs</li>
                        <li>Update your profile</li>
                        <li>Use all platform features</li>
                    </ul>
                </div>
                
                <a href="${process.env.CLIENT_URL}/login" class="button">Login to Your Account</a>
                `
                    : `
                <div class="warning">
                    <h3>⚠️ Account Deactivated</h3>
                    <p>Your account access has been temporarily suspended. This means:</p>
                    <ul>
                        <li>You cannot log into your account</li>
                        <li>Your profile is not visible to employers</li>
                        <li>You cannot apply for new jobs</li>
                        <li>Existing applications remain in the system</li>
                    </ul>
                </div>
                
                <p><strong>Need help?</strong> If you believe this action was taken in error or have questions about your account status, please contact our support team.</p>
                `
                }
                
                <div class="info-box">
                    <p><strong>Action taken by:</strong> ${adminName}</p>
                    <p><strong>Date:</strong> ${new Date().toLocaleDateString(
                      "en-US",
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    )}</p>
                </div>
                
                <p>If you have any questions or concerns, please don't hesitate to reach out to our support team.</p>
                
                <p>Best regards,<br>
                The Employ.me Team</p>
            </div>
            <div class="footer">
                <p>© 2024 Employ.me. All rights reserved.</p>
                <p>This is an automated message. Please do not reply to this email.</p>
                <p>If you need assistance, contact us at <a href="mailto:support@employme.com">support@employme.com</a></p>
            </div>
        </div>
    </body>
    </html>
  `;

  const textContent = `
Account Status Update - Employ.me

Hello ${userName}!

Your Employ.me account has been ${status} by our ${adminName}.

${
  isActive
    ? `
Great News! Your account is now active.
You can now access your dashboard and use all platform features.
Login here: ${process.env.CLIENT_URL}/login
`
    : `
Your account access has been temporarily suspended.
- You cannot log into your account
- Your profile is not visible to employers  
- You cannot apply for new jobs
- Existing applications remain in the system

If you believe this action was taken in error, please contact our support team.
`
}

Action taken by: ${adminName}
Date: ${new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })}

Best regards,
The Employ.me Team

---
This is an automated message. Please do not reply to this email.
For assistance, contact us at support@employme.com
  `;

  const mailOptions = {
    from: process.env.FROM_EMAIL || "noreply@employme.com",
    to: userEmail,
    subject: subject,
    text: textContent,
    html: htmlContent,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Account status change notification sent to user:", userEmail);
  } catch (error) {
    console.error("Error sending account status change notification:", error);
    throw error;
  }
};

// Send job deactivation notification to employer
export const sendJobDeactivationNotification = async (
  employerEmail: string,
  employerName: string,
  jobTitle: string,
  jobId: string,
  isActive: boolean,
  adminName: string = "Administrator"
): Promise<void> => {
  const transporter = createTransporter();
  const status = isActive ? "reactivated" : "deactivated";
  const statusAction = isActive ? "Reactivated" : "Deactivated";

  const subject = `Job Listing ${statusAction} - ${jobTitle}`;

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Job Status Update</title>
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
            .content { padding: 40px 30px; }
            .status-badge { display: inline-block; padding: 8px 16px; border-radius: 20px; font-weight: bold; margin: 20px 0; }
            .activated { background-color: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
            .deactivated { background-color: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
            .job-card { background-color: #f8f9fa; border: 1px solid #dee2e6; border-radius: 8px; padding: 20px; margin: 20px 0; }
            .info-box { background-color: #e7f3ff; border-left: 4px solid #007bff; padding: 15px; margin: 20px 0; border-radius: 4px; }
            .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; font-size: 14px; }
            .button { display: inline-block; background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
            .warning { color: #856404; background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 6px; margin: 20px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Job Listing Update</h1>
                <p>Status change notification for your job posting</p>
            </div>
            <div class="content">
                <h2>Hello ${employerName}!</h2>
                
                <div class="status-badge ${
                  isActive ? "activated" : "deactivated"
                }">
                    Job ${statusAction}
                </div>
                
                <p>We're writing to inform you that your job listing has been <strong>${status}</strong> by our ${adminName}.</p>
                
                <div class="job-card">
                    <h3>📋 Job Details</h3>
                    <p><strong>Title:</strong> ${jobTitle}</p>
                    <p><strong>Job ID:</strong> ${jobId}</p>
                    <p><strong>Status:</strong> ${
                      isActive ? "Active" : "Inactive"
                    }</p>
                </div>
                
                ${
                  isActive
                    ? `
                <div class="info-box">
                    <h3>🎉 Job Reactivated!</h3>
                    <p>Your job listing is now active again. This means:</p>
                    <ul>
                        <li>Job seekers can view and apply to this position</li>
                        <li>The listing appears in search results</li>
                        <li>You'll receive notifications for new applications</li>
                        <li>All previous applications are still accessible</li>
                    </ul>
                </div>
                
                <a href="${process.env.CLIENT_URL}/employer/my-jobs" class="button">View Your Jobs</a>
                `
                    : `
                <div class="warning">
                    <h3>⚠️ Job Deactivated</h3>
                    <p>Your job listing has been temporarily deactivated. This means:</p>
                    <ul>
                        <li>Job seekers cannot view or apply to this position</li>
                        <li>The listing doesn't appear in search results</li>
                        <li>Existing applications remain accessible</li>
                        <li>You can still manage current applicants</li>
                    </ul>
                </div>
                
                <p><strong>Need clarification?</strong> If you have questions about why this action was taken or need assistance, please contact our support team.</p>
                `
                }
                
                <div class="info-box">
                    <p><strong>Action taken by:</strong> ${adminName}</p>
                    <p><strong>Date:</strong> ${new Date().toLocaleDateString(
                      "en-US",
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    )}</p>
                </div>
                
                <p>You can always view and manage your job listings from your employer dashboard.</p>
                
                <p>Best regards,<br>
                The Employ.me Team</p>
            </div>
            <div class="footer">
                <p>© 2024 Employ.me. All rights reserved.</p>
                <p>This is an automated message. Please do not reply to this email.</p>
                <p>If you need assistance, contact us at <a href="mailto:support@employme.com">support@employme.com</a></p>
            </div>
        </div>
    </body>
    </html>
  `;

  const textContent = `
Job Listing Update - ${jobTitle}

Hello ${employerName}!

Your job listing "${jobTitle}" has been ${status} by our ${adminName}.

Job Details:
- Title: ${jobTitle}
- Job ID: ${jobId}  
- Status: ${isActive ? "Active" : "Inactive"}

${
  isActive
    ? `
Your job listing is now active again:
- Job seekers can view and apply to this position
- The listing appears in search results
- You'll receive notifications for new applications
- All previous applications are still accessible

Manage your jobs: ${process.env.CLIENT_URL}/employer/my-jobs
`
    : `
Your job listing has been temporarily deactivated:
- Job seekers cannot view or apply to this position
- The listing doesn't appear in search results
- Existing applications remain accessible
- You can still manage current applicants

If you have questions about this action, please contact our support team.
`
}

Action taken by: ${adminName}
Date: ${new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })}

Best regards,
The Employ.me Team

---
This is an automated message. Please do not reply to this email.
For assistance, contact us at support@employme.com
  `;

  const mailOptions = {
    from: process.env.FROM_EMAIL || "noreply@employme.com",
    to: employerEmail,
    subject: subject,
    text: textContent,
    html: htmlContent,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(
      "Job deactivation notification sent to employer:",
      employerEmail
    );
  } catch (error) {
    console.error("Error sending job deactivation notification:", error);
    throw error;
  }
};

// Send employer verification notification
export const sendEmployerVerificationNotification = async (
  employerEmail: string,
  details: {
    companyName: string;
    firstName: string;
    isVerified: boolean;
    rejectionReason?: string;
  }
): Promise<void> => {
  const transporter = createTransporter();

  const { companyName, firstName, isVerified, rejectionReason } = details;

  const subject = isVerified
    ? "🎉 Your Employer Account Has Been Verified!"
    : "Update on Your Employer Account Verification";

  const htmlContent = isVerified
    ? `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .success-badge { background: #22c55e; color: white; padding: 10px 20px; border-radius: 25px; display: inline-block; font-weight: bold; margin: 20px 0; }
    .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .info-box { background: white; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Verification Successful!</h1>
    </div>
    <div class="content">
      <h2>Hello ${firstName},</h2>
      
      <div class="success-badge">✓ VERIFIED EMPLOYER</div>
      
      <p>Great news! Your employer account for <strong>${companyName}</strong> has been verified by our team.</p>
      
      <div class="info-box">
        <h3>What This Means:</h3>
        <ul>
          <li>✅ You can now post job listings</li>
          <li>✅ Your company appears as a verified employer</li>
          <li>✅ Access to all employer features</li>
          <li>✅ Increased visibility and trust from job seekers</li>
        </ul>
      </div>
      
      <p>You're all set to start hiring top talent on Employ.me!</p>
      
      <a href="${process.env.CLIENT_URL}/employer/dashboard" class="button">Go to Your Dashboard</a>
      
      <p>Ready to post your first job? Head to your dashboard and click "Post a Job" to get started.</p>
      
      <p>If you have any questions, our support team is here to help.</p>
      
      <p>Best regards,<br>The Employ.me Team</p>
    </div>
    <div class="footer">
      This is an automated message. Please do not reply to this email.<br>
      For assistance, contact us at support@employme.com
    </div>
  </div>
</body>
</html>
  `
    : `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .warning-badge { background: #ef4444; color: white; padding: 10px 20px; border-radius: 25px; display: inline-block; font-weight: bold; margin: 20px 0; }
    .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .info-box { background: white; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Verification Update</h1>
    </div>
    <div class="content">
      <h2>Hello ${firstName},</h2>
      
      <div class="warning-badge">⚠ VERIFICATION NEEDED</div>
      
      <p>Thank you for your interest in joining Employ.me as an employer. After reviewing your account for <strong>${companyName}</strong>, we need additional information before we can proceed with verification.</p>
      
      ${
        rejectionReason
          ? `
      <div class="info-box">
        <h3>Reason:</h3>
        <p>${rejectionReason}</p>
      </div>
      `
          : ""
      }
      
      <div class="info-box">
        <h3>Next Steps:</h3>
        <ul>
          <li>Review your company profile information</li>
          <li>Ensure all details are accurate and complete</li>
          <li>Provide any additional documentation if requested</li>
          <li>Contact our support team for clarification</li>
        </ul>
      </div>
      
      <a href="${
        process.env.CLIENT_URL
      }/employer/profile" class="button">Update Your Profile</a>
      
      <p>If you believe this is an error or need assistance, please contact our support team at support@employme.com</p>
      
      <p>Best regards,<br>The Employ.me Team</p>
    </div>
    <div class="footer">
      This is an automated message. Please do not reply to this email.<br>
      For assistance, contact us at support@employme.com
    </div>
  </div>
</body>
</html>
  `;

  const textContent = isVerified
    ? `
EMPLOYER ACCOUNT VERIFIED

Hello ${firstName},

Great news! Your employer account for ${companyName} has been verified by our team.

What This Means:
- You can now post job listings
- Your company appears as a verified employer
- Access to all employer features
- Increased visibility and trust from job seekers

You're all set to start hiring top talent on Employ.me!

Go to Your Dashboard: ${process.env.CLIENT_URL}/employer/dashboard

Ready to post your first job? Head to your dashboard and click "Post a Job" to get started.

If you have any questions, our support team is here to help.

Best regards,
The Employ.me Team

---
This is an automated message. Please do not reply to this email.
For assistance, contact us at support@employme.com
  `
    : `
EMPLOYER VERIFICATION UPDATE

Hello ${firstName},

Thank you for your interest in joining Employ.me as an employer. After reviewing your account for ${companyName}, we need additional information before we can proceed with verification.

${rejectionReason ? `Reason: ${rejectionReason}` : ""}

Next Steps:
- Review your company profile information
- Ensure all details are accurate and complete
- Provide any additional documentation if requested
- Contact our support team for clarification

Update Your Profile: ${process.env.CLIENT_URL}/employer/profile

If you believe this is an error or need assistance, please contact our support team at support@employme.com

Best regards,
The Employ.me Team

---
This is an automated message. Please do not reply to this email.
For assistance, contact us at support@employme.com
  `;

  const mailOptions = {
    from: process.env.FROM_EMAIL || "noreply@employme.com",
    to: employerEmail,
    subject: subject,
    text: textContent,
    html: htmlContent,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(
      `Employer verification notification (${
        isVerified ? "approved" : "rejected"
      }) sent to:`,
      employerEmail
    );
  } catch (error) {
    console.error("Error sending employer verification notification:", error);
    throw error;
  }
};
