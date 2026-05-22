/**
 * Shared next/font loaders. Each route group that owns its own <html> applies
 * `fontVariables` to expose --font-fraunces / --font-manrope / --font-space-mono,
 * which tokens.css maps onto the semantic --font-* tokens.
 */
import { Fraunces, Manrope, Space_Mono } from 'next/font/google'

export const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-fraunces',
  display: 'swap',
})

export const manrope = Manrope({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-manrope',
  display: 'swap',
})

export const spaceMono = Space_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-space-mono',
  display: 'swap',
})

export const fontVariables = `${fraunces.variable} ${manrope.variable} ${spaceMono.variable}`
