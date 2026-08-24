import { type Request, type Response } from "express";
import prismaClient from '../config/prisma.js';
import AppError from "../utils/AppError.js";
import { sendSpecialRequestEmail } from "../services/email.service.js";

export const sendSpecialRequest = async (req: Request, res: Response) => {
  const { eventId } = req.params;
  const {
    name,
    emailAdd,
    phone,
    wantToGift,
    description,
  } = req.body;

  const event = await prismaClient.event.findUnique({
    where: {
      id: Number(eventId),
    },
  });

  if (!event) {
    throw new AppError("Event not found", 404);
  }

  const specialRequest =
    await prismaClient.specialRequest.create({
      data: {
        eventId: event.id,
        name,
        emailAdd,
        phone,
        wantToGift,
        description,
      },
    });

  const admin = await prismaClient.admin.findUnique({
    where: {
      id: event.createdById,
    },
  });

  if (!admin) {
    throw new AppError("Admin not found", 404);
  }

  await sendSpecialRequestEmail(
    admin.email,
    name,
    wantToGift,
    description,
    phone,
    emailAdd
  );

  res.status(201).json({
    message: "Special Request sent successfully",
    request: specialRequest,
  });
};