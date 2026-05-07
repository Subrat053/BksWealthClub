// import { transporter } from "../../config/email.config.js";

import { transporter } from "../../config/email.js";

const FROM = (process.env.MAIL_FROM || process.env.MAIL_USER || "").replace(
  /^"|"$/g,
  "",
);
const CLIENT_BASE_URL =
  process.env.CLIENT_URL || process.env.BASE_URL || "http://localhost:5173";

// ─── OTP Mail ─────────────────────────────────────────────
export const sendOtpEmail = async (email, otp) => {
  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: "Your OTP for Registration",
    text: `Use the OTP below to complete your registration. It expires in 10 minutes. OTP: ${otp}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2 style="color:#1e327d">Verify Your Email</h2>
        <p>Use the OTP below to complete your registration. It expires in <strong>10 minutes</strong>.</p>
        <div style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#1e327d;margin:24px 0">
          ${otp}
        </div>
        <p style="color:#888;font-size:12px">If you didn't request this, ignore this email.</p>
      </div>
    `,
  });
};

// ─── Verification Link Mail ────────────────────────────────
export const sendVerificationEmail = async (email, fullName, memberId, token) => {
  const link = `${CLIENT_BASE_URL}/verify-email?token=${token}`;

  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: "Action Required: Verify Your BksWealthClub Account",
    text: `Hello ${fullName}! Your account with Member ID: ${memberId} has been created. To start using BksWealthClub, please verify your email by clicking here: ${link}. This link expires in 24 hours.`,
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden; background-color: #ffffff;">
        <div style="background-color: #1e327d; padding: 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 1px;">Welcome to BksWealthClub</h1>
        </div>
        <div style="padding: 40px 30px;">
          <h2 style="color: #333333; margin-top: 0;">Hello ${fullName},</h2>
          <p style="color: #555555; line-height: 1.6; font-size: 16px;">
            Thank you for joining <strong>BksWealthClub</strong>. Your account has been successfully created with the following details:
          </p>
          <div style="background-color: #f8f9fa; border-left: 4px solid #1e327d; padding: 15px; margin: 25px 0;">
            <p style="margin: 5px 0; color: #333;"><strong>User Name:</strong> ${fullName}</p>
            <p style="margin: 5px 0; color: #333;"><strong>Member ID:</strong> ${memberId}</p>
          </div>
          <p style="color: #555555; line-height: 1.6; font-size: 16px;">
            To activate your account and start your journey with us, please click the button below to verify your email address.
          </p>
          <div style="text-align: center; margin: 35px 0;">
            <a href="${link}" style="display: inline-block; padding: 14px 35px; background-color: #1e327d; color: #ffffff; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              Verify My Account
            </a>
          </div>
          <p style="color: #888888; font-size: 14px; line-height: 1.6;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <a href="${link}" style="color: #1e327d; word-break: break-all;">${link}</a>
          </p>
          <hr style="border: 0; border-top: 1px solid #eeeeee; margin: 30px 0;">
          <p style="color: #777777; font-size: 13px; margin-bottom: 0;">
            <strong>Note:</strong> This verification link will expire in 24 hours. After verification, you will be able to access your dashboard and manage your wealth.
          </p>
        </div>
        <div style="background-color: #f4f4f4; padding: 20px; text-align: center; color: #999999; font-size: 12px;">
          &copy; ${new Date().getFullYear()} BksWealthClub. All rights reserved.<br>
          This is an automated email, please do not reply.
        </div>
      </div>
    `,
  });
};

export const sendCredentialsEmail = async (email, fullName, password) => {
  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: "Your account is verified - login credentials",
    text: `Welcome, ${fullName}! Your email has been verified. Email: ${email}. Password: ${password}. Login at ${CLIENT_BASE_URL}/login`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2 style="color:#1e327d">Welcome, ${fullName}!</h2>
        <p>Your email has been verified successfully. You can now login to the site.</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Password:</strong> ${password}</p>
        <a href="${CLIENT_BASE_URL}/login" style="display:inline-block;margin:24px 0;padding:12px 28px;background:#1e327d;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold">
          Login Now
        </a>
      </div>
    `,
  });
};

// ─── Welcome Mail ──────────────────────────────────────────
export const sendWelcomeEmail = async (
  email,
  fullName,
  referralCode,
  password = "",
) => {
  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: "Welcome! Registration Successful 🎉",
    text: `Welcome, ${fullName}! Your account has been created. Email: ${email}. Password: ${password ? password : "The password you set during registration"}. Referral code: ${referralCode}. Login: ${CLIENT_BASE_URL}/login`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2 style="color:#1e327d">Welcome, ${fullName}!</h2>
        <p>Your account has been successfully created. You can now log in and start using the platform.</p>
        <p>Use the following credentials to login:</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Password:</strong> ${password ? password : "The password you set during registration"}</p>
        <p>Your referral code is: <strong>${referralCode}</strong></p>
        <a href="${CLIENT_BASE_URL}/login" style="display:inline-block;margin:24px 0;padding:12px 28px;background:#1e327d;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold">
          Login Now
        </a>
      </div>
    `,
  });
};
