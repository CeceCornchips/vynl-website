import { auth } from '@clerk/nextjs/server';
import { sql } from '@/lib/db';
import { ensureServicesAdminSchema } from '@/lib/admin-services';

type ReorderItem = {
  id: string;
  display_order: number;
  category?: string | null;
};

export async function PATCH(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await ensureServicesAdminSchema();
    const body = (await request.json()) as { updates?: ReorderItem[] };

    if (!Array.isArray(body.updates) || body.updates.length === 0) {
      return Response.json({ ok: false, error: 'No reorder updates provided.' }, { status: 400 });
    }

    for (const item of body.updates) {
      if (!item.id?.trim()) continue;
      await sql`
        UPDATE services
        SET
          display_order = ${Math.max(0, item.display_order)},
          category = CASE
            WHEN ${typeof item.category === 'string' || item.category === null}
              THEN ${item.category?.trim() ?? null}
            ELSE category
          END,
          updated_at = NOW()
        WHERE id = ${item.id}
      `;
    }

    return Response.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
