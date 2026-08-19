import { Router } from "express";
import { registerAdmin } from "../controllers/auth.js";

const authRoutes:Router = Router();

authRoutes.get('/register', registerAdmin)

export default authRoutes;