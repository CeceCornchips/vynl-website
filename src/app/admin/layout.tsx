import { AdminNav } from '@/components/admin-nav';
import { AdminShell } from '@/components/admin-shell';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  let pendingCount = 0;
  try {
    const rows = await sql`
      SELECT COUNT(*)::int AS pending_count
      FROM bookings
      WHERE status = 'pending'
    `;
    pendingCount = (rows[0] as { pending_count: number })?.pending_count ?? 0;
  } catch {
    // Migration not yet run — bookings table has the old schema. Show 0 until migration is applied.
  }

  return (
    <AdminShell>
      <div className="flex min-h-screen bg-muted/30">
        <AdminNav pendingCount={pendingCount} />

        <div className="flex-1 lg:ml-60 flex flex-col min-h-screen">
          <div className="lg:hidden h-14 shrink-0" />
          <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </AdminShell>
  );
}
