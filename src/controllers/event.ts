import { type Request, type Response } from "express";
import prismaClient from '../config/prisma.js';
import AppError from "../utils/AppError.js";

const createEvent = async (req: Request, res: Response) => {
    const { title, description, participants, startDate, deadline } = req.body;

    const participantList = participants
        .split(',')
        .map((name: string) => ({
            name: name.trim()
        }));

    const newEvent = await prismaClient.event.create({
        data: {
            title,
            description,
            startDate: new Date(startDate),
            deadline: new Date(deadline),
            createdById: req.admin!.id,
            participants: {
                create: participantList
            }
        },
        include: {
            participants: true
        }
    });

    res.status(201).json(newEvent);
};

const getAllEvents = async (req: Request, res: Response) => {
    const events = await prismaClient.event.findMany({
        where: {
            createdById: req.admin!.id
        },
        include: {
            createdBy: {
                select: {
                    firstName: true,
                    lastName: true,
                    email: true
                }
            }
        }
    });

    if (events.length === 0) {
        throw new AppError("No events found", 404);
    }

    res.status(200).json(events);
};

const getEventById = async (req: Request, res: Response) => {
    const { id } = req.params;

    const event = await prismaClient.event.findUnique({
        where: {
            id: Number(id)
        },
        include: {
            createdBy: {
                select: {
                    firstName: true,
                    lastName: true,
                    email: true
                }
            }
        }
    });

    if (!event) {
        throw new AppError("Event not found", 404);
    }

    res.status(200).json(event);
};

const updateEvent = async (req: Request, res: Response) => {
    const { id } = req.params;

    const event = await prismaClient.event.findFirst({
        where: {
            id: Number(id),
            createdById: req.admin!.id
        }
    });

    if (!event) {
        throw new AppError("Event not found", 404);
    }

    const updatedEvent = await prismaClient.event.update({
        where: {
            id: Number(id)
        },
        data: req.body
    });

    res.status(200).json(updatedEvent);
};

const deleteEvent = async (req: Request, res: Response) => {
    const { id } = req.params;

    const event = await prismaClient.event.findFirst({
        where: {
            id: Number(id),
            createdById: req.admin!.id
        }
    });

    if (!event) {
        throw new AppError("Event not found", 404);
    }

    const hasPicked = await prismaClient.pick.findFirst({
        where: {
            eventId: Number(id),
            pickedName: {
                not: ""
            }
        }
    });

    if (hasPicked) {
        throw new AppError("You cannot delete this event", 400);
    }

    await prismaClient.event.delete({
        where: {
            id: Number(id)
        }
    });

    res.status(200).json({
        message: "Event deleted successfully"
    });
};

export { createEvent, getAllEvents, getEventById, updateEvent, deleteEvent };