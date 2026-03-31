import type { BookingStatus } from '@/types/database';

export type CalendarView = 'month' | 'week' | 'day' | 'agenda';

export type CalBooking = {
  id: string;
  customer_id: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  service_id: string | null;
  service_name: string;
  booking_date: string;
  booking_time: string;
  address: string;
  notes: string | null;
  status: BookingStatus;
  deposit_paid: boolean;
  deposit_amount_cents: number;
  stripe_payment_intent_id: string | null;
  google_calendar_event_id: string | null;
  calendar_duration_minutes: number | null;
  inspo_images?: string[] | null;
  addons?: string[] | null;
  created_at?: string;
  updated_at?: string;
  service_duration_minutes: number | null;
};

export function effectiveDurationMins(b: CalBooking): number {
  return (
    b.calendar_duration_minutes ??
    b.service_duration_minutes ??
    60
  );
}
