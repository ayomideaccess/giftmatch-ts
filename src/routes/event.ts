import { Router } from "express";

const eventRoutes:Router = Router();

import { createEventSchema } from "../schemas/event.js";
import validate from "../middlewares/validate.js";
import { protect } from "../middlewares/auth.middleware.js";
import { createEvent, getAllEvents, getEventById, updateEvent, deleteEvent } from '../controllers/event.js';

eventRoutes.post('/', protect, validate(createEventSchema), createEvent);
eventRoutes.get('/all', protect, getAllEvents);
eventRoutes.get('/:id', protect, getEventById);
eventRoutes.patch('/:id', protect, updateEvent);
eventRoutes.delete('/:id', protect, deleteEvent);

export default eventRoutes;