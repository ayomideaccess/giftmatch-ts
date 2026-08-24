import { Router } from "express";

const authRoutes:Router = Router();

import { registerAdmin, verifyOTP, loginUser, logoutUser, forgottenPassword, resendOTP, refreshToken } from "../controllers/auth.js";
import validate from '../middlewares/validate.js';
import { registerSchema, loginSchema, verifyOtpSchema, forgottenPasswordSchema, resendOTPSchema  } from '../schemas/auth.js';

authRoutes.post('/register', validate(registerSchema), registerAdmin);
authRoutes.post('/verify', validate(verifyOtpSchema), verifyOTP);
authRoutes.post('/login', validate(loginSchema), loginUser);
authRoutes.post('/logout', logoutUser );
authRoutes.post('/forgot-password', validate(forgottenPasswordSchema), forgottenPassword);
authRoutes.post('/resend-otp', validate(resendOTPSchema), resendOTP);
authRoutes.post('/refresh-token', refreshToken);

export default authRoutes;