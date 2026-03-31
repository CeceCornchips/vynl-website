import { auth } from '@clerk/nextjs/server';
import { sql } from '@/lib/db';
import { ensureClientsSchema } from '@/lib/clients-migration';
import type { Client } from '@/types/database';
import { computeClientTags } from '@/types/database';

export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

  try {
    await ensureClientsSchema();

    const url = new URL(request.url);
    const search = url.searchParams.get('search')?.trim().toLowerCase() ?? '';
    const filter = url.searchParams.get('filter')?.trim() ?? 'all';
    const sort = url.searchParams.get('sort')?.trim() ?? 'created_at';

    const clients = (await sql`
      SELECT
        id, full_name, email, phone, notes, tags,
        total_spend_cents, visit_count,
        last_visited_at::text AS last_visited_at,
        is_vip, marketing_opt_in,
        created_at::text AS created_at,
        updated_at::text AS updated_at
      FROM clients
      ORDER BY created_at DESC
    `) as Client[];

    const now = new Date();

    let result = clients.map((c) => ({
      ...c,
      computed_tags: computeClientTags(c),
    }));

    if (search) {
      result = result.filter((c) => {
        const hay = [c.full_name, c.email ?? '', c.phone ?? ''].join(' ').toLowerCase();
        return hay.includes(search);
      });
    }

    if (filter && filter !== 'all') {
      result = result.filter((c) => {
        if (filter === 'vip') return c.computed_tags?.includes('VIP');
        if (filter === 'new') {
          const created = new Date(c.created_at);
          return (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24) <= 30;
        }
        if (filter === 'inactive') return c.computed_tags?.includes('Inactive');
        return true;
      });
    }

    if (sort === 'name') {
      result.sort((a, b) => a.full_name.localeCompare(b.full_name));
    } else if (sort === 'total_spend') {
      result.sort((a, b) => b.total_spend_cents - a.total_spend_cents);
    } else if (sort === 'visit_count') {
      result.sort((a, b) => b.visit_count - a.visit_count);
    } else if (sort === 'last_visit') {
      result.sort((a, b) => {
        if (!a.last_visited_at && !b.last_visited_at) return 0;
        if (!a.last_visited_at) return 1;
        if (!b.last_visited_at) return -1;
        return b.last_visited_at.localeCompare(a.last_visited_at);
      });
    } else {
      result.sort((a, b) => b.created_at.localeCompare(a.created_at));
    }

    const totalClients = clients.length;
    const newThisMonth = clients.filter((c) => {
      const created = new Date(c.created_at);
      return created.getFullYear() === now.getFullYear() && created.getMonth() === now.getMonth();
    }).length;
    const vipClients = clients.filter((c) => c.is_vip || c.total_spend_cents >= 50000).length;
    const avgSpendCents =
      totalClients > 0
        ? Math.round(clients.reduce((sum, c) => sum + c.total_spend_cents, 0) / totalClients)
        : 0;

    return Response.json({
      ok: true,
      clients: result,
      stats: { totalClients, newThisMonth, vipClients, avgSpendCents },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

  try {
    await ensureClientsSchema();

    const body = (await request.json()) as {
      full_name: string;
      email?: string;
      phone?: string;
      notes?: string;
      is_vip?: boolean;
      marketing_opt_in?: boolean;
    };

    if (!body.full_name?.trim()) {
      return Response.json({ ok: false, error: 'Full name is required.' }, { status: 400 });
    }

    const [client] = (await sql`
      INSERT INTO clients (full_name, email, phone, notes, is_vip, marketing_opt_in)
      VALUES (
        ${body.full_name.trim()},
        ${body.email?.trim().toLowerCase() ?? null},
        ${body.phone?.trim() ?? null},
        ${body.notes?.trim() ?? null},
        ${body.is_vip ?? false},
        ${body.marketing_opt_in ?? true}
      )
      RETURNING
        id, full_name, email, phone, notes, tags,
        total_spend_cents, visit_count,
        last_visited_at::text AS last_visited_at,
        is_vip, marketing_opt_in,
        created_at::text AS created_at,
        updated_at::text AS updated_at
    `) as Client[];

    return Response.json({ ok: true, client }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes('unique') || message.includes('duplicate')) {
      return Response.json({ ok: false, error: 'A client with that email already exists.' }, { status: 409 });
    }
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
