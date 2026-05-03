import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const tenantRegisterSchema = z
  .object({
  organizationName: z
    .string()
    .trim()
    .min(1, 'Organization name is required')
    .max(120, 'Organization name is too long'),
  displayName: z
    .string()
    .trim()
    .min(1, 'Display name is required')
    .max(120, 'Display name is too long'),
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .email('Enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(256, 'Password is too long'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
})
  .refine((values) => values.password === values.confirmPassword, {
  path: ['confirmPassword'],
  message: 'Passwords do not match',
});

export type TenantRegisterFormValues = z.infer<typeof tenantRegisterSchema>;

export const acceptInviteSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(256, 'Password is too long'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });

export type AcceptInviteFormValues = z.infer<typeof acceptInviteSchema>;
