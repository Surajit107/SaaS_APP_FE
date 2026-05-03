import type { TaskStatus } from '@/lib/api/Api';
import type { TaskFilter } from './taskBoard.types';

/** Radix Select rejects empty string as item value; map form '' to this sentinel. */
export const ASSIGNED_TO_NONE_SELECT_VALUE = '__unassigned__';

export const BOARD_COLUMNS: ReadonlyArray<{
  status: TaskStatus;
  title: string;
  subtitle: string;
}> = [
  {
    status: 'TODO',
    title: 'To Do',
    subtitle: 'Captured and ready for execution',
  },
  {
    status: 'IN_PROGRESS',
    title: 'In Progress',
    subtitle: 'Actively worked by the team',
  },
  {
    status: 'BLOCKED',
    title: 'Blocked',
    subtitle: 'Waiting on dependency or decision',
  },
  {
    status: 'DONE',
    title: 'Done',
    subtitle: 'Completed and locked',
  },
];

export const STATUS_LABELS: Record<TaskFilter, string> = {
  ALL: 'All statuses',
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  BLOCKED: 'Blocked',
  DONE: 'Done',
};
