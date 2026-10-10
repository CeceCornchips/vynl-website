import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const runtime = "nodejs";

/**
 * Authentication is handled entirely by src/middleware.ts.
 * Requests that reach this handler have already passed session verification.
 */
export async function GET() {
  try {
    const [totalRes, todayRes, weekRes, monthRes, byDeviceRes, recentRes, trendRes] =
      await Promise.all([
        sql`SELECT COUNT(*)::int AS count FROM guide_downloads WHERE guide_name = 'gel-x-retention-guide'`,
        sql`SELECT COUNT(*)::int AS count FROM guide_downloads WHERE downloaded_at >= CURRENT_DATE`,
        sql`SELECT COUNT(*)::int AS count FROM guide_downloads WHERE downloaded_at >= date_trunc('week', NOW())`,
        sql`SELECT COUNT(*)::int AS count FROM guide_downloads WHERE downloaded_at >= date_trunc('month', NOW())`,
        sql`SELECT device_type, COUNT(*)::int AS count FROM guide_downloads GROUP BY device_type`,
        sql`SELECT id, downloaded_at, device_type, ip_address FROM guide_downloads ORDER BY downloaded_at DESC LIMIT 10`,
        sql`
          SELECT
            DATE(downloaded_at)::text AS date,
            COUNT(*)::int AS count
          FROM guide_downloads
          WHERE downloaded_at >= NOW() - INTERVAL '30 days'
          GROUP BY DATE(downloaded_at)
          ORDER BY date ASC
        `,
      ]);

    const byDevice = { mobile: 0, tablet: 0, desktop: 0 };
    for (const row of byDeviceRes) {
      const key = row.device_type as keyof typeof byDevice;
      if (key in byDevice) byDevice[key] = row.count as number;
    }

    return NextResponse.json({
      total_downloads: (totalRes[0]?.count as number) ?? 0,
      downloads_today: (todayRes[0]?.count as number) ?? 0,
      downloads_this_week: (weekRes[0]?.count as number) ?? 0,
      downloads_this_month: (monthRes[0]?.count as number) ?? 0,
      by_device: byDevice,
      recent_downloads: recentRes.map((r) => ({
        id: r.id,
        downloaded_at: r.downloaded_at,
        device_type: r.device_type,
        ip_address: r.ip_address,
      })),
      daily_trend: trendRes.map((r) => ({
        date: r.date,
        count: r.count,
      })),
    });
  } catch (err) {
    console.error("[admin/guide-stats] DB error:", err);
    return NextResponse.json({ error: "Database error." }, { status: 500 });
  }
}
