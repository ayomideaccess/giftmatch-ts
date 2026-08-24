import { type Request, type Response } from "express";
import prismaClient from '../config/prisma.js';
import AppError from "../utils/AppError.js";
import { sendEventCompletionEmail } from "../services/email.service.js";

const identifyParticipant = async (req: Request, res: Response) => {
  const { eventId } = req.params;
  const { pickerName } = req.body;

  const event = await prismaClient.event.findUnique({
    where: {
      id: Number(eventId),
    },
    include: {
      participants: true,
    },
  });

  if (!event) {
    throw new AppError("Event not found", 404);
  }

  const now = new Date();

  if (now < event.startDate) {
    throw new AppError("Event is yet to start", 400);
  }

  if (now > event.deadline) {
    throw new AppError("Event has ended", 400);
  }

  const participant = event.participants.find(
    (p) => p.name.toLowerCase() === pickerName.toLowerCase()
  );

  if (!participant) {
    throw new AppError("Your name is not on the list", 404);
  }

  const existingPick = await prismaClient.pick.findFirst({
    where: {
      eventId: event.id,
      pickerName: participant.name,
    },
  });

  if (existingPick) {
    throw new AppError(
      `You already picked ${existingPick.pickedName}`,
      400
    );
  }

  res.status(200).json({
    message: "Welcome! Please make your pick.",
    eventTitle: event.title,
    description: event.description,
    participants: event.participants,
  });
};

const makePick = async (req: Request, res: Response) => {
  const { eventId } = req.params;
  const { pickerName, pickedParticipantId, pickedName } = req.body;

  const event = await prismaClient.event.findUnique({
    where: {
      id: Number(eventId),
    },
  });

  if (!event) {
    throw new AppError("Event not found", 404);
  }

  const now = new Date();

  if (now < event.startDate) {
    throw new AppError("Event has not started yet", 400);
  }

  if (now > event.deadline) {
    throw new AppError("Event has ended", 400);
  }

  const pickerExists = await prismaClient.participant.findFirst({
    where: {
      eventId: event.id,
      name: {
        equals: pickerName,
        mode: "insensitive",
      },
    },
  });

  if (!pickerExists) {
    throw new AppError("Your name is not on the list", 404);
  }

  const alreadyPicked = await prismaClient.pick.findFirst({
    where: {
      eventId: event.id,
      pickerName: pickerExists.name,
    },
  });

  if (alreadyPicked) {
    throw new AppError(
      `You already picked ${alreadyPicked.pickedName}`,
      400
    );
  }

  const targetParticipant = await prismaClient.participant.findFirst({
    where: {
      id: pickedParticipantId,
      eventId: event.id,
    },
  });

  if (!targetParticipant) {
    throw new AppError("Participant not found", 404);
  }

  if (
    targetParticipant.name.toLowerCase() !==
    pickedName.toLowerCase()
  ) {
    throw new AppError(
      "Picked participant ID and name do not match",
      400
    );
  }

  if (targetParticipant.isPicked) {
    throw new AppError(
      "This person has already been picked",
      400
    );
  }

  if (pickerExists.id === targetParticipant.id) {
    throw new AppError(
      "You cannot pick yourself",
      400
    );
  }

  await prismaClient.$transaction(async (tx) => {
    const updatedParticipant = await tx.participant.updateMany({
      where: {
        id: targetParticipant.id,
        eventId: event.id,
        isPicked: false,
      },
      data: {
        isPicked: true,
      },
    });

    if (updatedParticipant.count === 0) {
      throw new AppError(
        "This participant has already been picked.",
        400
      );
    }

    await tx.pick.create({
      data: {
        eventId: event.id,
        pickerName: pickerExists.name,
        pickedParticipantId: targetParticipant.id,
        pickedName: targetParticipant.name,
      },
    });
  });

  const remainingParticipants = await prismaClient.participant.count({
    where: {
      eventId: event.id,
      isPicked: false,
    },
  });

  if (remainingParticipants === 0) {
    const admin = await prismaClient.admin.findUnique({
      where: {
        id: event.createdById,
      },
    });

    if (admin) {
      const now = new Date()
      await sendEventCompletionEmail(
        admin.email,
        event.title
      );
      await prismaClient.event.update({
      where: {
        id: event.id,
      },
      data: {
        deadline: now,
      },
    });
    }
  }

  res.status(201).json({
    message: `You have successfully picked ${targetParticipant.name}`,
  });
};

const viewResults = async (req: Request, res: Response) => {
  const { eventId } = req.params;

  const event = await prismaClient.event.findUnique({
    where: {
      id: Number(eventId),
    },
    include: {
      participants: true,
    },
  });

  if (!event) {
    throw new AppError("Event not found", 404);
  }

  const picks = await prismaClient.pick.findMany({
    where: {
      eventId: event.id,
    },
  });

  const specialRequests = await prismaClient.specialRequest.findMany({
    where: {
      eventId: event.id,
    },
  });

  const totalParticipants = event.participants.length;

  const totalPicked = event.participants.filter(
    (participant) => participant.isPicked
  ).length;

  const remaining = totalParticipants - totalPicked;

  res.status(200).json({
    eventTitle: event.title,
    status:
      new Date() < event.startDate
        ? "upcoming"
        : new Date() > event.deadline
          ? "completed"
          : "ongoing",
    summary: {
      totalParticipants,
      totalPicked,
      remaining,
    },
    picks,
    specialRequests,
  });
};

export {identifyParticipant, makePick, viewResults};