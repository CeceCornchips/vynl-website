import { sql } from '@/lib/db';

export async function GET() {
  try {
    const rows = await sql`
      SELECT default_deposit_amount, deposit_type
      FROM deposit_settings
      WHERE id = 1
    `;
    if (rows.length === 0) {
      return Response.json({
        ok: true,
        depositSettings: { default_deposit_amount: 30, deposit_type: 'fixed' },
      });
    }
    const row = rows[0] as { default_deposit_amount: string; deposit_type: string };
    return Response.json({
      ok: true,
      depositSettings: {
        default_deposit_amount: parseFloat(row.default_deposit_amount),
        deposit_type: row.deposit_type as 'fixed' | 'percentage',
      },
    });
  } catch {
    return Response.json({
      ok: true,
      depositSettings: { default_deposit_amount: 30, deposit_type: 'fixed' },
    });
  }
}
