import { Router } from "express";

const requestRoutes:Router = Router();

import { protect } from "../middlewares/auth.middleware.js";
import { sendSpecialRequest } from "../controllers/request.js";
import validate from "../middlewares/validate.js";
import { specialRequestSchema} from "../schemas/request.js";

requestRoutes.post('/:eventId', validate(specialRequestSchema), sendSpecialRequest);

export default requestRoutes;
