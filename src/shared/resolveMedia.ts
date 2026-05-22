/**
 * Resolve a media-ish prop to a URL string. Components accept either a
 * bare URL (legacy / hardcoded demo data) or a populated Payload Media
 * document. See ADR-0009.
 */
export type MediaDoc = {
  id?: string
  url?: string | null
  alt?: string | null
  width?: number | null
  height?: number | null
}

export type MediaInput = string | MediaDoc | null | undefined

export function resolveMediaSrc(input: MediaInput): string | undefined {
  if (!input) return undefined
  if (typeof input === 'string') return input
  return input.url ?? undefined
}

export function resolveMediaAlt(input: MediaInput, fallback?: string): string {
  if (input && typeof input !== 'string') {
    return input.alt ?? fallback ?? ''
  }
  return fallback ?? ''
}
