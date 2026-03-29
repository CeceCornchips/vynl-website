/**
 * One-off script to fetch Square Catalog items and log each service's
 * variation IDs and team member IDs.
 *
 * Usage:
 *   npx ts-node scripts/get-square-ids.ts
 *
 * Delete this file after you've copied the IDs into .env.local.
 */

import * as https from "https";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const token = process.env.SQUARE_ACCESS_TOKEN;
if (!token) {
  console.error("Error: SQUARE_ACCESS_TOKEN is not set in .env.local");
  process.exit(1);
}

const isProduction = process.env.NEXT_PUBLIC_SQUARE_ENV === "production";
const host = isProduction
  ? "connect.squareup.com"
  : "connect.squareupsandbox.com";

function squareRequest(
  method: "GET" | "POST",
  path: string,
  body?: object
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : undefined;
    const options = {
      hostname: host,
      path,
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "Square-Version": "2024-01-18",
        ...(payload ? { "Content-Length": Buffer.byteLength(payload) } : {}),
      },
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          reject(new Error(`Failed to parse response: ${data}`));
        }
      });
    });

    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });
}

interface CatalogObject {
  type: string;
  id: string;
  item_data?: {
    name?: string;
    variations?: CatalogObject[];
  };
  item_variation_data?: {
    name?: string;
    item_id?: string;
  };
}

interface CatalogListResponse {
  objects?: CatalogObject[];
  errors?: Array<{ detail: string }>;
}

interface TeamMember {
  id: string;
  display_name?: string;
  given_name?: string;
  family_name?: string;
  status?: string;
}

interface TeamMembersResponse {
  team_members?: TeamMember[];
  errors?: Array<{ detail: string }>;
}

async function main() {
  const env = isProduction ? "production" : "sandbox";
  console.log(`\nFetching Square Catalog (${env} → ${host})...\n`);

  // ── Catalog Items ──────────────────────────────────────────────────────────
  const catalogRes = (await squareRequest(
    "GET",
    "/v2/catalog/list?types=ITEM"
  )) as CatalogListResponse;

  if (catalogRes.errors?.length) {
    console.error("Catalog API errors:", catalogRes.errors);
    process.exit(1);
  }

  const items = catalogRes.objects ?? [];

  if (items.length === 0) {
    console.log("No catalog items found.");
  } else {
    console.log("═══════════════════════════════════════════════════");
    console.log("  CATALOG ITEMS & VARIATION IDs");
    console.log("═══════════════════════════════════════════════════");

    for (const item of items) {
      if (item.type !== "ITEM") continue;
      const name = item.item_data?.name ?? "(unnamed)";
      const variations = item.item_data?.variations ?? [];

      console.log(`\nService: ${name}`);
      console.log(`  Item ID: ${item.id}`);

      if (variations.length === 0) {
        console.log("  Variations: (none)");
      } else {
        for (const v of variations) {
          const varName = v.item_variation_data?.name ?? "Regular";
          console.log(`  Variation "${varName}": ${v.id}`);
          console.log(
            `    → SQUARE_${name.toUpperCase().replace(/\s+/g, "_")}_${varName.toUpperCase().replace(/\s+/g, "_")}_VARIATION_ID=${v.id}`
          );
        }
      }
    }
  }

  // ── Team Members ───────────────────────────────────────────────────────────
  console.log("\n");
  console.log("═══════════════════════════════════════════════════");
  console.log("  TEAM MEMBERS");
  console.log("═══════════════════════════════════════════════════");

  // Square requires POST /v2/team-members/search to list members
  const teamRes = (await squareRequest("POST", "/v2/team-members/search", {
    limit: 100,
  })) as TeamMembersResponse;

  if (teamRes.errors?.length) {
    console.error("Team API errors:", teamRes.errors);
  } else {
    const members = teamRes.team_members ?? [];

    if (members.length === 0) {
      console.log("\nNo team members found.");
    } else {
      for (const m of members) {
        const displayName =
          m.display_name ??
          [m.given_name, m.family_name].filter(Boolean).join(" ") ??
          "(unnamed)";
        console.log(`\n  ${displayName} (${m.status ?? "UNKNOWN"})`);
        console.log(`    ID: ${m.id}`);
        console.log(`    → SQUARE_TEAM_MEMBER_ID=${m.id}`);
      }
    }
  }

  console.log("\n");
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
