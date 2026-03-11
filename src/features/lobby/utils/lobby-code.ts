/**
 * Characters used for lobby codes.
 * Ambiguous characters (0/O, 1/I, L) are excluded to prevent read errors.
 */
const SAFE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

/**
 * Generates a random 6-character lobby code.
 *
 * Codes are URL-safe, uppercase and easy to read aloud — ambiguous characters
 * (0/O, 1/I, L) are excluded.
 */
export function generateLobbyCode(): string {
    let code = ''
    for (let i = 0; i < 6; i++) {
        code += SAFE_CHARS[Math.floor(Math.random() * SAFE_CHARS.length)]
    }
    return code
}

/**
 * Returns `true` if `code` is a valid 6-character uppercase alphanumeric code.
 */
export function isValidLobbyCode(code: string): boolean {
    return /^[A-Z0-9]{6}$/.test(code)
}