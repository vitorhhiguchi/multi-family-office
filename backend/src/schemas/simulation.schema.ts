import { z } from 'zod';

export const createSimulationSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    startDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
    realRate: z.number().min(0).max(1).default(0.04),
    clientId: z.number().int().positive(),
});

export const updateSimulationSchema = z.object({
    name: z.string().min(1).optional(),
    startDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
    realRate: z.number().min(0).max(1).optional(),
});

export const simulationIdParamSchema = z.object({
    id: z.string().transform(Number),
});

export const simulationQuerySchema = z.object({
    clientId: z.string().transform(Number).optional(),
    includeAllVersions: z.string().transform((v) => v === 'true').optional(),
});

export const duplicateSimulationSchema = z.object({
    name: z.string().min(1, 'New simulation name is required'),
});

export type CreateSimulationInput = z.infer<typeof createSimulationSchema>;
export type UpdateSimulationInput = z.infer<typeof updateSimulationSchema>;
export type DuplicateSimulationInput = z.infer<typeof duplicateSimulationSchema>;
