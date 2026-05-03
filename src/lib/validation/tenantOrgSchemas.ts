import { z } from 'zod';

export const tenantOrganizationUpdateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Organization name is required')
    .max(200, 'Organization name is too long'),
});

export type TenantOrganizationUpdateFormValues = z.infer<
  typeof tenantOrganizationUpdateSchema
>;
