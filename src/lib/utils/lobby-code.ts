/**
 * Generate a 6-character lobby code.
 * Uses uppercase letters + digits, excluding ambiguous chars: 0/O, 1/I, L
 */
const SAFE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

export function generateLobbyCode(): string {
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += SAFE_CHARS[Math.floor(Math.random() * SAFE_CHARS.length)]
  }
  return code
}

export function isValidLobbyCode(code: string): boolean {
  return /^[A-Z0-9]{6}$/.test(code)
}
