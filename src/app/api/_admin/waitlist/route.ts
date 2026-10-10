import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const runtime = "nodejs";

/**
 * Authentication is handled entirely by src/middleware.ts.
 * Requests that reach this handler have already passed session verification.
 */
export async function GET() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS waitlist (
        id          SERIAL PRIMARY KEY,
        name        TEXT NOT NULL,
        email       TEXT NOT NULL,
        type        TEXT NOT NULL,
        notified    BOOLEAN DEFAULT FALSE,
        notified_at TIMESTAMPTZ,
        created_at  TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(email, type)
      )
    `;

    const entries = await sql`
      SELECT id, name, email, type, notified, notified_at, created_at
      FROM waitlist
      ORDER BY created_at DESC
    `;
    return NextResponse.json({ entries });
  } catch (err) {
    console.error("[admin/waitlist] DB error:", err);
    return NextResponse.json({ error: "Database error." }, { status: 500 });
  }
}
