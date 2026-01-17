import { z } from 'zod';

export const movementTypeEnum = z.enum(['INCOME', 'EXPENSE']);
export const incomeCategoryEnum = z.enum(['WORK', 'PASSIVE', 'OTHER']);
export const frequencyEnum = z.enum(['ONCE', 'MONTHLY', 'YEARLY']);

export const createMovementSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    type: movementTypeEnum,
    category: incomeCategoryEnum.optional(),
    value: z.number().positive(),
    frequency: frequencyEnum,
    startDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
    endDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional().nullable(),
    simulationId: z.number().int().positive(),
});

export const updateMovementSchema = z.object({
    name: z.string().min(1).optional(),
    type: movementTypeEnum.optional(),
    category: incomeCategoryEnum.optional().nullable(),
    value: z.number().positive().optional(),
    frequency: frequencyEnum.optional(),
    startDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
    endDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional().nullable(),
});

export const movementIdParamSchema = z.object({
    id: z.string().transform(Number),
});

export const movementQuerySchema = z.object({
    simulationId: z.string().transform(Number).optional(),
    type: movementTypeEnum.optional(),
});

export type CreateMovementInput = z.infer<typeof createMovementSchema>;
export type UpdateMovementInput = z.infer<typeof updateMovementSchema>;
