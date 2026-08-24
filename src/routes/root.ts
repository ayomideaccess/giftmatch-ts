import { Router } from "express";
import authRoutes from "./auth.js";
import eventRoutes from './event.js';
import pickRoutes from "./pick.js";
import requestRoutes from "./request.js";

const rootRouter: Router = Router();

rootRouter.use('/auth', authRoutes);
rootRouter.use('/event', eventRoutes);
rootRouter.use('/pick', pickRoutes);
rootRouter.use('/request', requestRoutes);

export default rootRouter;