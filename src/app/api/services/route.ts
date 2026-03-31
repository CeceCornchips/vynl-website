import { sql } from '@/lib/db';
import type { Service } from '@/types/database';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const format = url.searchParams.get('format');

    const services = (await sql`
      SELECT * FROM services
      WHERE is_active = true
        AND is_deleted = false
      ORDER BY display_order ASC, price_cents ASC
    `) as Service[];

    // Always return both: a flat array AND the nested shape so all consumers work.
    // BookingFlow.tsx reads the top-level array (services is also a key for backwards compat)
    return Response.json({ ok: true, services } as const);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ ok: false, error: message, services: [] }, { status: 500 });
  }
}
