import { z } from 'zod';

export const insuranceTypeEnum = z.enum(['LIFE', 'DISABILITY']);

export const createInsuranceSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    type: insuranceTypeEnum,
    startDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
    durationMonths: z.number().int().positive(),
    premium: z.number().min(0),
    insuredValue: z.number().positive(),
    simulationId: z.number().int().positive(),
});

export const updateInsuranceSchema = z.object({
    name: z.string().min(1).optional(),
    type: insuranceTypeEnum.optional(),
    startDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
    durationMonths: z.number().int().positive().optional(),
    premium: z.number().min(0).optional(),
    insuredValue: z.number().positive().optional(),
});

export const insuranceIdParamSchema = z.object({
    id: z.string().transform(Number),
});

export const insuranceQuerySchema = z.object({
    simulationId: z.string().transform(Number).optional(),
});

export type CreateInsuranceInput = z.infer<typeof createInsuranceSchema>;
export type UpdateInsuranceInput = z.infer<typeof updateInsuranceSchema>;
