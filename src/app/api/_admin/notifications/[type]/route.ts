import { auth } from '@clerk/nextjs/server';
import { sql } from '@/lib/db';
import { getNotificationSetting, ensureNotificationsTable } from '@/lib/notifications-migration';

interface Params {
  params: Promise<{ type: string }>;
}

export async function GET(_req: Request, { params }: Params) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { type } = await params;
    const setting = await getNotificationSetting(type);
    if (!setting) {
      return Response.json({ ok: false, error: 'Notification type not found.' }, { status: 404 });
    }
    return Response.json({ ok: true, setting });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: Params) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { type } = await params;
    await ensureNotificationsTable();

    const body = (await request.json()) as {
      enabled?: boolean;
      subject?: string;
      body?: string;
      send_offset_hours?: number;
    };

    const rows = (await sql`
      UPDATE notification_settings
      SET
        enabled           = COALESCE(${body.enabled ?? null}, enabled),
        subject           = COALESCE(${body.subject ?? null}, subject),
        body              = COALESCE(${body.body ?? null}, body),
        send_offset_hours = COALESCE(${body.send_offset_hours ?? null}, send_offset_hours),
        updated_at        = NOW()
      WHERE notification_type = ${type}
      RETURNING *
    `) as { id: number }[];

    if (rows.length === 0) {
      return Response.json({ ok: false, error: 'Notification type not found.' }, { status: 404 });
    }

    return Response.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
