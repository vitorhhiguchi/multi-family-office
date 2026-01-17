import { z } from 'zod';

export const assetTypeEnum = z.enum(['FINANCIAL', 'REAL_ESTATE']);

export const createFinancingSchema = z.object({
    startDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
    installments: z.number().int().positive(),
    interestRate: z.number().min(0),
    downPayment: z.number().min(0),
});

export const createAssetSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    type: assetTypeEnum,
    simulationId: z.number().int().positive(),
    initialValue: z.number().min(0),
    initialDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
    financing: createFinancingSchema.optional(),
});

export const updateAssetSchema = z.object({
    name: z.string().min(1).optional(),
});

export const assetIdParamSchema = z.object({
    id: z.string().transform(Number),
});

export const assetQuerySchema = z.object({
    simulationId: z.string().transform(Number).optional(),
});

export const createAssetRecordSchema = z.object({
    value: z.number(),
    date: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
});

export const updateAssetRecordSchema = z.object({
    value: z.number().optional(),
    date: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
});

export const recordIdParamSchema = z.object({
    id: z.string().transform(Number),
    recordId: z.string().transform(Number),
});

export type CreateAssetInput = z.infer<typeof createAssetSchema>;
export type UpdateAssetInput = z.infer<typeof updateAssetSchema>;
export type CreateAssetRecordInput = z.infer<typeof createAssetRecordSchema>;
export type UpdateAssetRecordInput = z.infer<typeof updateAssetRecordSchema>;
