import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

const databaseUrl = process.env.DATABASE_URL;

/**
 * Neon SQL tag. Without DATABASE_URL it throws on first query rather than at
 * import, so routes that can work without the database (e.g. the waitlist,
 * which also saves to Resend) keep working, and builds don't need a real URL.
 */
export const sql: NeonQueryFunction<false, false> = databaseUrl
  ? neon(databaseUrl)
  : (((..._args: unknown[]) => {
      throw new Error("DATABASE_URL environment variable is not set.");
    }) as unknown as NeonQueryFunction<false, false>);
