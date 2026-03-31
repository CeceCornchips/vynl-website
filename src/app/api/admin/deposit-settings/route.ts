import { auth } from '@clerk/nextjs/server';
import { sql } from '@/lib/db';

async function ensureDepositSettingsTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS deposit_settings (
      id                     INT          PRIMARY KEY DEFAULT 1,
      default_deposit_amount NUMERIC(10,2) NOT NULL DEFAULT 30.00,
      deposit_type           TEXT         NOT NULL DEFAULT 'fixed'
                               CHECK (deposit_type IN ('fixed', 'percentage')),
      updated_at             TIMESTAMPTZ  NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    INSERT INTO deposit_settings (id, default_deposit_amount, deposit_type)
    VALUES (1, 30.00, 'fixed')
    ON CONFLICT (id) DO NOTHING
  `;
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }
  try {
    await ensureDepositSettingsTable();
    const rows = await sql`SELECT * FROM deposit_settings WHERE id = 1`;
    const setting = rows[0] as {
      id: number;
      default_deposit_amount: string;
      deposit_type: string;
      updated_at: string;
    } | undefined;
    return Response.json({
      ok: true,
      depositSettings: setting
        ? {
            id: setting.id,
            default_deposit_amount: parseFloat(setting.default_deposit_amount),
            deposit_type: setting.deposit_type as 'fixed' | 'percentage',
            updated_at: setting.updated_at,
          }
        : { id: 1, default_deposit_amount: 30, deposit_type: 'fixed' },
    });
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }
  try {
    await ensureDepositSettingsTable();
    const body = (await request.json()) as {
      default_deposit_amount?: number;
      deposit_type?: 'fixed' | 'percentage';
    };

    const { default_deposit_amount, deposit_type } = body;

    if (default_deposit_amount != null && (isNaN(default_deposit_amount) || default_deposit_amount < 0)) {
      return Response.json({ ok: false, error: 'Invalid deposit amount.' }, { status: 400 });
    }
    if (deposit_type && deposit_type !== 'fixed' && deposit_type !== 'percentage') {
      return Response.json({ ok: false, error: 'Invalid deposit type.' }, { status: 400 });
    }

    await sql`
      INSERT INTO deposit_settings (id, default_deposit_amount, deposit_type, updated_at)
      VALUES (
        1,
        ${default_deposit_amount ?? 30},
        ${deposit_type ?? 'fixed'},
        NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        default_deposit_amount = EXCLUDED.default_deposit_amount,
        deposit_type           = EXCLUDED.deposit_type,
        updated_at             = NOW()
    `;

    const rows = await sql`SELECT * FROM deposit_settings WHERE id = 1`;
    const setting = rows[0] as {
      default_deposit_amount: string;
      deposit_type: string;
    };

    return Response.json({
      ok: true,
      depositSettings: {
        id: 1,
        default_deposit_amount: parseFloat(setting.default_deposit_amount),
        deposit_type: setting.deposit_type,
      },
    });
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
