import type { JsonLd } from './structured-data';

/**
 * Renders a JSON-LD graph as a `<script type="application/ld+json">`. Server
 * Component, so the payload is inlined into the static HTML with no client cost.
 */
export function JsonLdScript({ data }: { data: JsonLd | JsonLd[] }) {
  return (
    <script
      type="application/ld+json"
      // Serialized structured data is our own, non-user content — safe to inline.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
