// import { transporter } from "../../config/email.config.js";

import { transporter} from "../../config/email.js";

const FROM = process.env.MAIL_FROM;

// ─── OTP Mail ─────────────────────────────────────────────
export const sendOtpEmail = async (email, otp) => {
  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: "Your OTP for Registration",
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

// ─── Verification Link Mail (Admin-created user) ───────────
export const sendVerificationEmail = async (email, fullName, token) => {
  const link = `${process.env.BASE_URL}/verify-email?token=${token}`;

  await transporter.sendMail({
    from: FROM,
    to: email,
    subject: "Verify Your Account",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2 style="color:#1e327d">Hello, ${fullName}!</h2>
        <p>An admin has created an account for you. Click the button below to verify your email and activate your account.</p>
        <a href="${link}" style="display:inline-block;margin:24px 0;padding:12px 28px;background:#1e327d;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold">
          Verify Email
        </a>
        <p style="color:#888;font-size:12px">This link expires in 24 hours.</p>
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
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2 style="color:#1e327d">Welcome, ${fullName}!</h2>
        <p>Your account has been successfully created. You can now log in and start using the platform.</p>
        <p>Use the following credentials to login:</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Password:</strong> ${password ? password : "The password you set during registration"}</p>
        <p>Your referral code is: <strong>${referralCode}</strong></p>
        <a href="${process.env.BASE_URL}/login" style="display:inline-block;margin:24px 0;padding:12px 28px;background:#1e327d;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold">
          Login Now
        </a>
      </div>
    `,
  });
};