import { z } from 'zod';

export const identifySchema = z.object({
  pickerName: z.string().trim().min(3),
});

export const makePickSchema = z.object({
  pickerName: z.string().trim().min(3),
  pickedParticipantId: z.coerce.number().int().positive(),
  pickedName: z.string().trim().min(3),
});