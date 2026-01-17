import { z } from 'zod';

export const createClientSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    birthDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
});

export const updateClientSchema = createClientSchema.partial();

export const clientIdParamSchema = z.object({
    id: z.string().transform(Number),
});

export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
