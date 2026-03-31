import { sql } from '@/lib/db';
import { ensureBusinessProfileTables } from '@/lib/business-profile-migration';

export interface BusinessProfile {
  id: number;
  business_name: string | null;
  tagline: string | null;
  description: string | null;
  abn: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  address_line1: string | null;
  address_line2: string | null;
  suburb: string | null;
  state: string | null;
  postcode: string | null;
  country: string;
  logo_url: string | null;
  cover_image_url: string | null;
  gallery_urls: string[];
  facebook_url: string | null;
  instagram_url: string | null;
  tiktok_url: string | null;
  google_business_url: string | null;
  timezone: string;
  currency: string;
  date_format: string;
  time_format: string;
  week_starts_on: string;
  getting_here_note: string | null;
  amenities: string[];
  highlights: string[];
  online_booking_enabled: boolean;
  booking_lead_time_hours: number;
  booking_advance_days: number;
  updated_at: string;
}

export interface BusinessHour {
  id: number;
  day_of_week: string;
  is_open: boolean;
  open_time: string;
  close_time: string;
}

export const BUSINESS_HOURS_ORDER = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
] as const;

const PROFILE_DEFAULTS: Omit<BusinessProfile, 'id' | 'updated_at'> = {
  business_name: null,
  tagline: null,
  description: null,
  abn: null,
  phone: null,
  email: null,
  website: null,
  address_line1: null,
  address_line2: null,
  suburb: null,
  state: null,
  postcode: null,
  country: 'Australia',
  logo_url: null,
  cover_image_url: null,
  gallery_urls: [],
  facebook_url: null,
  instagram_url: null,
  tiktok_url: null,
  google_business_url: null,
  timezone: 'Australia/Sydney',
  currency: 'AUD',
  date_format: 'DD/MM/YYYY',
  time_format: '12h',
  week_starts_on: 'Monday',
  getting_here_note: null,
  amenities: [],
  highlights: [],
  online_booking_enabled: true,
  booking_lead_time_hours: 2,
  booking_advance_days: 60,
};

export async function getBusinessProfile(): Promise<BusinessProfile> {
  await ensureBusinessProfileTables();
  const rows = (await sql`SELECT * FROM business_profile WHERE id = 1 LIMIT 1`) as Record<
    string,
    unknown
  >[];
  const row = rows[0];
  if (!row) {
    return { id: 1, ...PROFILE_DEFAULTS, updated_at: new Date().toISOString() };
  }
  return {
    ...PROFILE_DEFAULTS,
    ...row,
    gallery_urls: Array.isArray(row.gallery_urls) ? (row.gallery_urls as string[]) : [],
    amenities: Array.isArray(row.amenities) ? (row.amenities as string[]) : [],
    highlights: Array.isArray(row.highlights) ? (row.highlights as string[]) : [],
    online_booking_enabled: row.online_booking_enabled !== false,
    booking_lead_time_hours: Number(row.booking_lead_time_hours ?? 2),
    booking_advance_days: Number(row.booking_advance_days ?? 60),
  } as BusinessProfile;
}

export async function getBusinessHours(): Promise<BusinessHour[]> {
  await ensureBusinessProfileTables();
  const rows = (await sql`
    SELECT * FROM business_hours
    ORDER BY CASE day_of_week
      WHEN 'Monday'    THEN 1
      WHEN 'Tuesday'   THEN 2
      WHEN 'Wednesday' THEN 3
      WHEN 'Thursday'  THEN 4
      WHEN 'Friday'    THEN 5
      WHEN 'Saturday'  THEN 6
      WHEN 'Sunday'    THEN 7
      ELSE 8
    END
  `) as BusinessHour[];
  return rows;
}

/** Map business_hours rows → working_hours JSON used by the settings/availability system */
export function businessHoursToWorkingHoursJson(hours: BusinessHour[]): string {
  const dayKeyMap: Record<string, string> = {
    Monday: 'mon', Tuesday: 'tue', Wednesday: 'wed', Thursday: 'thu',
    Friday: 'fri', Saturday: 'sat', Sunday: 'sun',
  };
  const result: Record<string, { enabled: boolean; start: string; end: string }> = {};
  for (const h of hours) {
    const key = dayKeyMap[h.day_of_week];
    if (key) {
      result[key] = {
        enabled: h.is_open,
        start: h.open_time,
        end: h.close_time,
      };
    }
  }
  return JSON.stringify(result);
}
