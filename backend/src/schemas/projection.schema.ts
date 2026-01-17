import { z } from 'zod';

export const lifeStatusEnum = z.enum(['ALIVE', 'DEAD', 'INVALID']);

export const createProjectionSchema = z.object({
    simulationId: z.number().int().positive(),
    status: lifeStatusEnum,
    endYear: z.number().int().min(2024).max(2100).default(2060),
});

export type CreateProjectionInput = z.infer<typeof createProjectionSchema>;
export type LifeStatus = z.infer<typeof lifeStatusEnum>;
