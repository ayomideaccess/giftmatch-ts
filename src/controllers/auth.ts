import { type Request, type Response } from "express";
import bcrypt from 'bcrypt';
import { sendOTPEmail, sendPasswordResetEmail } from '../services/email.service.js';
import { generateOTP } from '../services/otp.service.js';
import AppError from '../utils/AppError.js';
import { generateAccessToken,generateRefreshToken } from '../utils/generateToken.js';
import jwt, { type JwtPayload } from 'jsonwebtoken';
import { prismaClient } from "../app.js";
import { hashSync, compareSync } from "bcrypt";

const registerAdmin = async (req: Request, res: Response) => {
  const { firstName, lastName, email, phoneNo, password } = req.body;

  const existingUser = await prismaClient.admin.findUnique({
    where: { email }
  });

  if (existingUser) {
    throw new AppError("User already exists", 409);
  }

  const otp = generateOTP();
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

  await prismaClient.user.create({
    data: {
      firstName,
      lastName,
      email,
      phoneNo,
      password: hashSync(password, 10),
      otp,
      otpExpiry: otpExpires,
      isVerified: false
    }
  });

  await sendOTPEmail(email, otp);

  res.status(201).json({
    message: "User registered successfully. Check your email for OTP."
  });
};


const verifyOTP = async (req: Request, res: Response): Promise<void> => {
  const { email, otp } = req.body;

  const targetAdmin = await prismaClient.admin.findUnique({
    where: { email },
  });

  if (!targetAdmin) {
    throw new AppError('Admin not found', 404);
  }

  if (targetAdmin.otp !== otp) {
    throw new AppError('Invalid OTP', 400);
  }

  if (new Date(targetAdmin.otpExpiry) < new Date()) {
    throw new AppError('OTP expired', 400);
  }

  await prismaClient.admin.update({
    where: { id: targetAdmin.id },
    data: {
      isVerified: true,
      otp: null,
      otpExpiry: null,
    },
  });

  res.status(200).json({
    message: 'Email verified successfully. You can now log in.',
  });
};

const loginUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { email, password } = req.body;

  const targetAdmin = await prismaClient.admin.findUnique({
    where: { email },
  });

  if (!targetAdmin) {
    throw new AppError('Admin not found', 404);
  }

  if (!targetAdmin.isVerified) {
    throw new AppError('Email not verified', 400);
  }

  if (!compareSync(password, user.password)){
    throw Error("Incorrect password")
  }
  const accessToken = generateAccessToken(targetAdmin.id);
  const refreshToken = generateRefreshToken(targetAdmin.id);

  // await sendLoginEmail(email, admin.firstName);

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.status(200).json({
    message: 'Login successful',
    accessToken,
  });
};

const logoutUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  res.clearCookie('refreshToken');

  res.status(200).json({
    message: 'Logout successful',
  });
};

const forgottenPassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { email } = req.body;

  const admin = await prismaClient.user.findUnique({
    where: {
      email,
    },
  });

  if (!admin) {
    throw new AppError('Admin not found', 404);
  }

  const passwordResetOTP = generateOTP();

  const passResetOTPExpires = new Date(
    Date.now() + 10 * 60 * 1000
  );

  await prismaClient.user.update({
    where: {
      id: admin.id,
    },
    data: {
      passwordResetOTP,
      passwordResetOTPExpiry: passResetOTPExpires,
    },
  });

  await sendPasswordResetEmail(email, passwordResetOTP);

  res.status(200).json({
    message: 'Password reset email sent. Check your email for OTP.',
  });
};

const resendOTP = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { email } = req.body;

  const admin = await prismaClient.admin.findUnique({
    where: {
      email,
    },
  });

  if (!admin) {
    throw new AppError('Admin not found', 404);
  }

  const otp = generateOTP();

  const otpExpires = new Date(
    Date.now() + 10 * 60 * 1000
  );

  await prismaClient.admin.update({
    where: {
      id: admin.id,
    },
    data: {
      otp,
      otpExpiry: otpExpires,
    },
  });

  await sendOTPEmail(email, otp);

  res.status(200).json({
    message: 'Check your email for OTP',
  });
};

const refreshToken = async (
  req: Request,
  res: Response
): Promise<void> => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    throw new AppError('Refresh token not found', 401);
  }

  const decoded = jwt.verify(
    refreshToken,
    process.env.REFRESH_TOKEN_SECRET as string
  ) as JwtPayload & { id: number };

  const accessToken = generateAccessToken(decoded.id);

  res.status(200).json({
    success: true,
    message: 'Access token refreshed successfully',
    accessToken,
  });
};

export {
  registerAdmin,
  verifyOTP,
  loginUser,
}