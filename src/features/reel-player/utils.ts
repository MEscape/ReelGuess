/**
 * Converts any Instagram Reel URL into its `/embed` variant.
 *
 * Strips query params (Instagram embed URLs must be clean) and guards against
 * double-appending `/embed` if the caller already passes an embed URL.
 */
export function toEmbedUrl(url: string): string {
    const clean = url.split('?')[0].replace(/\/$/, '')
    if (clean.endsWith('/embed')) return clean
    return `${clean}/embed`
}