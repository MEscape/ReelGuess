/**
 * Lobby code generation and validation utilities.
 *
 * Ambiguous characters (0/O, 1/I, L) are excluded to prevent read errors
 * when codes are shared verbally or written by hand.
 */

const SAFE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

/**
 * Generates a random 6-character lobby code.
 * URL-safe, uppercase, easy to read aloud.
 */
export function generateLobbyCode(): string {
    let code = ''
    for (let i = 0; i < 6; i++) {
        code += SAFE_CHARS[Math.floor(Math.random() * SAFE_CHARS.length)]
    }
    return code
}
