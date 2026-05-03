import type { TaskStatus } from '@/lib/api/Api';

export type TaskFilter = TaskStatus | 'ALL';

export type DraftAttachment = {
  publicId: string;
  secureUrl: string;
  mimeType: string;
  originalName: string;
  bytes: number;
};
