// import { transporter } from "../../config/email.config.js";

import { transporter} from "../../config/email.js";

const FROM = (process.env.MAIL_FROM || process.env.MAIL_USER || "").replace(/^"|"$/g, "");
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
export const sendVerificationEmail = async (email, fullName, token) => {
  const link = `${CLIENT_BASE_URL}/verify-email?token=${token}`;

  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: "Verify Your Account",
    text: `Hello, ${fullName}! An account has been created for you. Verify it here: ${link}. This link expires in 24 hours.`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2 style="color:#1e327d">Hello, ${fullName}!</h2>
        <p>An account has been created for you. Click the button below to verify your email and activate your account.</p>
        <a href="${link}" style="display:inline-block;margin:24px 0;padding:12px 28px;background:#1e327d;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold">
          Verify Email
        </a>
        <p style="color:#555;font-size:13px">After verification, you will receive another email with your login credentials.</p>
        <p style="color:#888;font-size:12px">This link expires in 24 hours.</p>
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
export const sendWelcomeEmail = async (email, fullName, referralCode, password="") => {
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