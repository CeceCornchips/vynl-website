import type { BookingStatus } from '@/types/database';

export const STATUS_BLOCK: Record<BookingStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-900 border-yellow-300',
  confirmed: 'bg-blue-100 text-blue-900 border-blue-300',
  in_progress: 'bg-purple-100 text-purple-900 border-purple-300',
  completed: 'bg-green-100 text-green-900 border-green-300',
  cancelled: 'bg-red-50 text-red-800 border-red-200 line-through opacity-80',
};

/** Drag ghost: semi-transparent fill + dashed border (use with border-2 border-dashed). */
export const STATUS_GHOST: Record<BookingStatus, string> = {
  pending: 'bg-yellow-100/50 text-yellow-900 border-yellow-400',
  confirmed: 'bg-blue-100/50 text-blue-900 border-blue-400',
  in_progress: 'bg-purple-100/50 text-purple-900 border-purple-400',
  completed: 'bg-green-100/50 text-green-900 border-green-400',
  cancelled: 'bg-red-50/50 text-red-800 border-red-400',
};

export const STATUS_DOT: Record<BookingStatus, string> = {
  pending: 'bg-yellow-400',
  confirmed: 'bg-blue-500',
  in_progress: 'bg-purple-500',
  completed: 'bg-green-500',
  cancelled: 'bg-red-400',
};

export const NOW_LINE = 'bg-red-500';
