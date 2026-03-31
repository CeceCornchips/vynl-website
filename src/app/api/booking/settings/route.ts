import { formatInTimeZone } from 'date-fns-tz';
import { sql } from '@/lib/db';
import { addCalendarDaysYmd } from '@/lib/booking-availability';
import {
  BOOKING_SETTINGS_KEYS,
  BUSINESS_TIMEZONE,
  parseBookingSettings,
} from '@/lib/booking-settings';
import { ensureSettingsTable } from '@/lib/settings-db';

/**
 * Public booking configuration (no auth). Admin edits the same keys via POST /api/admin/settings.
 * The public book page cannot use GET /api/admin/settings because that route requires Clerk auth.
 */
export async function GET() {
  try {
    await ensureSettingsTable();
    const rows = (await sql`SELECT key, value FROM settings`) as {
      key: string;
      value: string | null;
    }[];

    const allowed = new Set<string>(BOOKING_SETTINGS_KEYS);
    const settings: Record<string, string | null> = {};
    for (const row of rows) {
      if (allowed.has(row.key)) {
        settings[row.key] = row.value;
      }
    }

    const parsed = parseBookingSettings(settings);

    const now = new Date();
    const todayYmd = formatInTimeZone(now, BUSINESS_TIMEZONE, 'yyyy-MM-dd');
    const maxBookableYmd = addCalendarDaysYmd(todayYmd, parsed.advanceBookingDays);

    return Response.json({
      ok: true,
      settings,
      parsed,
      todayYmd,
      maxBookableYmd,
      timezone: BUSINESS_TIMEZONE,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
