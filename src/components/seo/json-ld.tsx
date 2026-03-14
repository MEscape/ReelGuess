// ─────────────────────────────────────────────────────────────────────────────
// JsonLd — Reusable JSON-LD structured data injector
// ─────────────────────────────────────────────────────────────────────────────

type Props = {
    schema: Record<string, unknown>
}

/**
 * Server Component that injects a JSON-LD <script> tag.
 * Usage: <JsonLd schema={mySchema} />
 */
export function JsonLd({ schema }: Props) {
    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
    )
}

