import { auth } from '@clerk/nextjs/server';
import { sql } from '@/lib/db';
import { getBusinessHours, businessHoursToWorkingHoursJson, type BusinessHour } from '@/lib/business-profile';
import { ensureBusinessProfileTables } from '@/lib/business-profile-migration';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

  try {
    const hours = await getBusinessHours();
    return Response.json({ ok: true, hours });
  } catch (err) {
    return Response.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

  try {
    await ensureBusinessProfileTables();
    const body = (await request.json()) as { hours: Partial<BusinessHour>[] };
    const rows = body.hours ?? [];

    for (const row of rows) {
      if (!row.day_of_week) continue;
      await sql`
        INSERT INTO business_hours (day_of_week, is_open, open_time, close_time)
        VALUES (
          ${row.day_of_week},
          ${row.is_open ?? true},
          ${row.open_time ?? '08:00'},
          ${row.close_time ?? '17:00'}
        )
        ON CONFLICT (day_of_week) DO UPDATE SET
          is_open    = EXCLUDED.is_open,
          open_time  = EXCLUDED.open_time,
          close_time = EXCLUDED.close_time
      `;
    }

    // Sync to settings.working_hours so the existing availability logic sees the change
    const updatedHours = await getBusinessHours();
    const workingHoursJson = businessHoursToWorkingHoursJson(updatedHours);
    await sql`
      INSERT INTO settings (key, value, updated_at)
      VALUES ('working_hours', ${workingHoursJson}, NOW())
      ON CONFLICT (key) DO UPDATE SET
        value      = EXCLUDED.value,
        updated_at = NOW()
    `;

    return Response.json({ ok: true, hours: updatedHours });
  } catch (err) {
    return Response.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
