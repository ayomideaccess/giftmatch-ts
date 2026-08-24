import { Router } from "express";

const pickRoutes:Router = Router();

import { protect } from "../middlewares/auth.middleware.js";
import {
	identifyParticipant,
	makePick,
	viewResults,
} from "../controllers/pick.js";
import validate from "../middlewares/validate.js";
import { identifySchema, makePickSchema } from "../schemas/pick.js";

pickRoutes.post("/:eventId", validate(identifySchema), identifyParticipant);
pickRoutes.post("/make/:eventId", validate(makePickSchema), makePick);
pickRoutes.get("/results/:eventId", protect, viewResults);

export default pickRoutes;