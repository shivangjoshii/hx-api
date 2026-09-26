import nodemailer from 'nodemailer';
import { ENV } from './env.js';

const transporter = nodemailer.createTransport({
  host: ENV.SMTP_HOST,
  port: ENV.SMTP_PORT,
  secure: ENV.SMTP_PORT === 465,
  auth: {
    user: ENV.SMTP_USER,
    pass: ENV.SMTP_PASS
  }
});

export const sendVerificationEmail = async (toEmail, otpCode, name = 'Focus Champion') => {
  if (!ENV.SMTP_USER || !ENV.SMTP_PASS) {
    console.log(`[Development Mode OTP for ${toEmail}]: ${otpCode}`);
    return true;
  }

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>HabitX Verification</title>
      </head>
      <body style="margin: 0; padding: 40px 20px; background-color: #0B0B0D; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #F7F7F8;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 520px; background-color: #141416; border: 1px solid #28282D; border-radius: 16px; padding: 32px;">
          <tr>
            <td align="center" style="padding-bottom: 24px;">
              <h1 style="color: #A98AF7; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">HabitX</h1>
              <p style="color: #A3A3AB; font-size: 13px; margin: 6px 0 0 0;">Protect your attention</p>
            </td>
          </tr>
          <tr>
            <td style="padding-bottom: 24px;">
              <h2 style="color: #F7F7F8; font-size: 18px; margin: 0 0 12px 0;">Hello ${name},</h2>
              <p style="color: #A3A3AB; font-size: 14px; line-height: 1.6; margin: 0;">Use the following verification code to secure your HabitX account and activate your attention-management system.</p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding: 24px 0;">
              <div style="background-color: #1C1C20; border: 1px solid #A98AF7; border-radius: 12px; padding: 18px 24px; display: inline-block;">
                <span style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #A98AF7;">${otpCode}</span>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding-top: 12px; border-top: 1px solid #28282D;">
              <p style="color: #777780; font-size: 12px; line-height: 1.5; margin: 0; text-align: center;">This code will expire in 10 minutes. If you did not request this email, you can safely ignore it.</p>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  try {
    const info = await transporter.sendMail({
      from: ENV.EMAIL_FROM,
      to: toEmail,
      subject: `${otpCode} is your HabitX verification code`,
      html
    });
    return info;
  } catch (error) {
    console.error(`Email sending failed: ${error.message}`);
    return false;
  }
};

export const sendPasswordResetEmail = async (toEmail, resetCode, name = 'User') => {
  if (!ENV.SMTP_USER || !ENV.SMTP_PASS) {
    console.log(`[Development Mode Reset OTP for ${toEmail}]: ${resetCode}`);
    return true;
  }

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>HabitX Password Reset</title>
      </head>
      <body style="margin: 0; padding: 40px 20px; background-color: #0B0B0D; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #F7F7F8;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 520px; background-color: #141416; border: 1px solid #28282D; border-radius: 16px; padding: 32px;">
          <tr>
            <td align="center" style="padding-bottom: 24px;">
              <h1 style="color: #A98AF7; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">HabitX</h1>
              <p style="color: #A3A3AB; font-size: 13px; margin: 6px 0 0 0;">Password Reset Request</p>
            </td>
          </tr>
          <tr>
            <td style="padding-bottom: 24px;">
              <h2 style="color: #F7F7F8; font-size: 18px; margin: 0 0 12px 0;">Hello ${name},</h2>
              <p style="color: #A3A3AB; font-size: 14px; line-height: 1.6; margin: 0;">We received a request to reset your password. Use the verification code below to complete the reset process.</p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding: 24px 0;">
              <div style="background-color: #1C1C20; border: 1px solid #A98AF7; border-radius: 12px; padding: 18px 24px; display: inline-block;">
                <span style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #A98AF7;">${resetCode}</span>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding-top: 12px; border-top: 1px solid #28282D;">
              <p style="color: #777780; font-size: 12px; line-height: 1.5; margin: 0; text-align: center;">This code will expire in 10 minutes.</p>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  try {
    const info = await transporter.sendMail({
      from: ENV.EMAIL_FROM,
      to: toEmail,
      subject: `${resetCode} is your HabitX password reset code`,
      html
    });
    return info;
  } catch (error) {
    console.error(`Password reset email failed: ${error.message}`);
    return false;
  }
};
