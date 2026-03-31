import { sql } from '@/lib/db';
import type { Service } from '@/types/database';

export async function GET() {
  try {
    const services = (await sql`SELECT * FROM services ORDER BY created_at ASC`) as Service[];
    return Response.json({ ok: true, count: services.length, services });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
