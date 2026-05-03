import { z } from 'zod';

import { TASK_STATUS_VALUES } from '@/lib/api/types/responses';

const TASK_FILTER_STATUS_VALUES = ['ALL', ...TASK_STATUS_VALUES] as const;

/** MongoDB ObjectId string — matches tenant user ids from GET /tenant/users. */
const tenantUserIdString = z
  .string()
  .regex(/^[a-f\d]{24}$/i, 'Invalid assignee');

export const taskCreateSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Task title is required')
    .max(200, 'Task title must be 200 characters or fewer'),
  description: z
    .string()
    .trim()
    .max(5000, 'Description must be 5000 characters or fewer')
    .optional(),
  status: z.enum(TASK_STATUS_VALUES),
  assignedTo: z.union([z.literal(''), tenantUserIdString]),
});

export type TaskCreateFormValues = z.infer<typeof taskCreateSchema>;

/** Edit modal: core fields + attachment URLs (full replacement list on save). */
export const taskEditSchema = z
  .object({
    title: taskCreateSchema.shape.title,
    description: taskCreateSchema.shape.description,
    status: taskCreateSchema.shape.status,
    assignedTo: taskCreateSchema.shape.assignedTo,
    /** Objects so react-hook-form `useFieldArray` types correctly (primitive arrays are not supported). */
    attachmentUrls: z.array(z.object({ url: z.string() })).max(50),
  })
  .superRefine((data, ctx) => {
    data.attachmentUrls.forEach((entry, index) => {
      const trimmed = entry.url.trim();
      if (trimmed.length === 0) {
        return;
      }
      try {
        const parsed = new URL(trimmed);
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
          ctx.addIssue({
            code: 'custom',
            message: 'Use http:// or https://',
            path: ['attachmentUrls', index, 'url'],
          });
        }
      } catch {
        ctx.addIssue({
          code: 'custom',
          message: 'Invalid URL',
          path: ['attachmentUrls', index, 'url'],
        });
      }
    });
  });

export type TaskEditFormValues = z.infer<typeof taskEditSchema>;

export const taskFilterSchema = z.object({
  search: z
    .string()
    .trim()
    .max(120, 'Search text must be 120 characters or fewer')
    .optional(),
  status: z.enum(TASK_FILTER_STATUS_VALUES),
});

export type TaskFilterFormValues = z.infer<typeof taskFilterSchema>;
