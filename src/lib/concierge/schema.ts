import { sql } from '@/lib/db';

let migration: Promise<void> | null = null;

/**
 * Tables for the Instagram DM concierge. Only adds new tables; nothing
 * existing changes. Concurrent callers share one run.
 */
export function ensureConciergeSchema(): Promise<void> {
  migration ??= createTables().catch((err) => {
    migration = null; // try again next time
    throw err;
  });
  return migration;
}

async function createTables(): Promise<void> {

  await sql`
    CREATE TABLE IF NOT EXISTS dm_conversations (
      id SERIAL PRIMARY KEY,
      ig_user_id TEXT NOT NULL UNIQUE,
      ig_username TEXT,
      display_name TEXT,
      client_id INTEGER,
      status TEXT NOT NULL DEFAULT 'open',
      handoff_reason TEXT,
      bot_paused_until TIMESTAMPTZ,
      greeted BOOLEAN NOT NULL DEFAULT false,
      last_client_message_at TIMESTAMPTZ,
      last_message_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS dm_messages (
      id SERIAL PRIMARY KEY,
      conversation_id INTEGER NOT NULL REFERENCES dm_conversations(id) ON DELETE CASCADE,
      ig_message_id TEXT UNIQUE,
      direction TEXT NOT NULL,
      sender TEXT NOT NULL,
      text TEXT,
      attachments JSONB NOT NULL DEFAULT '[]',
      sent_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS dm_messages_conversation_idx
      ON dm_messages (conversation_id, sent_at)
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS dm_drafts (
      id SERIAL PRIMARY KEY,
      conversation_id INTEGER NOT NULL REFERENCES dm_conversations(id) ON DELETE CASCADE,
      reply_to_message_id INTEGER REFERENCES dm_messages(id) ON DELETE SET NULL,
      text TEXT NOT NULL,
      dm_type TEXT,
      needs_owner BOOLEAN NOT NULL DEFAULT false,
      urgency TEXT NOT NULL DEFAULT 'normal',
      owner_note TEXT,
      blocked_reason TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      sent_text TEXT,
      edited BOOLEAN NOT NULL DEFAULT false,
      model TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      decided_at TIMESTAMPTZ
    )
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS dm_drafts_conversation_idx
      ON dm_drafts (conversation_id, status)
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS dm_agent_runs (
      id SERIAL PRIMARY KEY,
      conversation_id INTEGER REFERENCES dm_conversations(id) ON DELETE CASCADE,
      draft_id INTEGER REFERENCES dm_drafts(id) ON DELETE SET NULL,
      model TEXT,
      model_calls INTEGER NOT NULL DEFAULT 0,
      input_tokens INTEGER NOT NULL DEFAULT 0,
      output_tokens INTEGER NOT NULL DEFAULT 0,
      cache_read_tokens INTEGER NOT NULL DEFAULT 0,
      cache_write_tokens INTEGER NOT NULL DEFAULT 0,
      cost_usd NUMERIC(10, 6),
      tool_calls JSONB NOT NULL DEFAULT '[]',
      stop_reason TEXT,
      duration_ms INTEGER,
      error TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS dm_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

}
