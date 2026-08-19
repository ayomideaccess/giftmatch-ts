import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

// Send OTP
export const sendOTPEmail = async (
  email: string,
  otp: string
): Promise<void> => {
  await transporter.sendMail({
    from: `"GiftMatch" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: 'Your OTP for GiftMatch',
    html: `
      <h2>Welcome to GiftMatch!</h2>
      <p>Your OTP for verification is:</p>
      <h1 style="color: #6366f1">${otp}</h1>
      <p>This code expires in <strong>10 minutes</strong>.</p>
      <p>If you didn't request this, please ignore this email.</p>
    `,
  });
};

export const sendPasswordResetEmail = async (
  email: string,
  passwordResetOTP: string
): Promise<void> => {
  await transporter.sendMail({
    from: `"GiftMatch" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: 'Password Reset Request',
    html: `
      <h2>Password Reset Request</h2>
      <p>You have requested to reset your password for your GiftMatch account.</p>
      <p>Your OTP for password reset is:</p>
      <h1 style="color: #6366f1">${passwordResetOTP}</h1>
      <p>This code expires in <strong>10 minutes</strong>.</p>
      <p>If you didn't request this, please ignore this email.</p>
    `,
  });
};