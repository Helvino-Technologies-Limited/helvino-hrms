import { randomBytes } from 'crypto'

export function generateSecretCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no ambiguous chars
  const random = randomBytes(5)
  const code = Array.from(random).map(b => chars[b % chars.length]).join('')
  return `HVN-${code}`
}
