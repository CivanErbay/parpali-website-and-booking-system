import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
  },
  auth: {
    // /manage runs on a shared restaurant tablet/laptop that should just
    // stay logged in — a real "forever" session isn't possible with a JWT
    // (it always needs a finite tokenExpiration), so 10 years is the
    // practical stand-in. There's no per-device "remember me" toggle: every
    // login on this single-use-case tool is long-lived by default.
    tokenExpiration: 315360000, // 10 Jahre
    cookies: { sameSite: 'Lax' },
  },
  fields: [
    // Email is added by default via `auth: true`. Add custom fields here.
  ],
}
