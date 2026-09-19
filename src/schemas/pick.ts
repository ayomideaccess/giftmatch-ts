import { z } from 'zod';

export const identifySchema = z.object({
  pickerName: z.string().trim().min(3),
});

export const makePickSchema = z.object({
  pickedParticipantId: z.coerce.number().int().positive(),
  pickedName: z.string().trim().min(3),
});