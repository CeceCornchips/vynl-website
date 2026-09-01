import type { JsonLdObject } from "@/lib/seo";

interface JsonLdProps {
  /** One schema node, or several to emit in a single graph script. */
  data: JsonLdObject | JsonLdObject[];
}

/**
 * Renders structured data as a plain <script type="application/ld+json">.
 *
 * Deliberately not next/script: this must be in the server-rendered HTML so
 * crawlers that don't execute JavaScript still see it. next/script defers or
 * injects client-side, which is exactly what we don't want here.
 */
export function JsonLd({ data }: JsonLdProps) {
  const nodes = Array.isArray(data) ? data : [data];
  // Escaping "<" stops a stray "</script>" inside any string field from
  // closing the tag early. JSON.parse still reads < as "<".
  const json = JSON.stringify(nodes.length === 1 ? nodes[0] : nodes).replace(/</g, "\\u003c");

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
