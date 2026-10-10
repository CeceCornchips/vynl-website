import { auth } from '@clerk/nextjs/server';
import { sql } from '@/lib/db';

async function ensureTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS settings (
      key VARCHAR(100) PRIMARY KEY,
      value TEXT,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await ensureTable();
    const rows = (await sql`SELECT key, value FROM settings`) as {
      key: string;
      value: string | null;
    }[];

    const settings: Record<string, string | null> = {};
    for (const row of rows) {
      settings[row.key] = row.value;
    }

    return Response.json({ ok: true, settings });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return upsertSetting(request);
}

export async function PATCH(request: Request) {
  return upsertSetting(request);
}

async function upsertSetting(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await ensureTable();
    const body = (await request.json()) as
      | { key: string; value: string | null }
      | { settings: Record<string, string | null> };
    const updates =
      'settings' in body
        ? Object.entries(body.settings ?? {})
        : [[(body as { key: string }).key, (body as { value: string | null }).value]];

    if (updates.length === 0) {
      return Response.json({ ok: false, error: 'Missing key/value updates' }, { status: 400 });
    }
    for (const [key, value] of updates) {
      if (!key?.trim()) continue;
      await sql`
        INSERT INTO settings (key, value, updated_at)
        VALUES (${key}, ${value ?? null}, NOW())
        ON CONFLICT (key) DO UPDATE
          SET value = EXCLUDED.value,
              updated_at = NOW()
      `;
    }

    return Response.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
