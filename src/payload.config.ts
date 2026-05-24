import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { s3Storage } from '@payloadcms/storage-s3'
import path from 'path'
import { buildConfig, type Plugin } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Pages } from './collections/Pages'
import { MenuItems } from './collections/MenuItems'
import { Tables } from './collections/Tables'
import { Reservations } from './collections/Reservations'
import { Inquiries } from './collections/Inquiries'
import { Testimonials } from './collections/Testimonials'
import { Events } from './collections/Events'
import { Navigation } from './globals/Navigation'
import { Footer } from './globals/Footer'
import { OpeningHours } from './globals/OpeningHours'
import { BookingSettings } from './globals/BookingSettings'
import { ContactInfo } from './globals/ContactInfo'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

/**
 * Hetzner S3-compatible Object Storage — see ADR-0008 (inherited from SOTER baseline).
 * Loaded only when all required env vars are present, so the project still
 * boots in environments without S3 (forks, dev without creds) and falls back
 * to Payload's local `/media/` storage.
 */
const s3Plugin = (): Plugin | null => {
  const { S3_BUCKET, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, S3_ENDPOINT, S3_REGION } = process.env
  if (!S3_BUCKET || !S3_ACCESS_KEY_ID || !S3_SECRET_ACCESS_KEY || !S3_ENDPOINT || !S3_REGION) {
    return null
  }
  return s3Storage({
    collections: {
      media: true,
    },
    bucket: S3_BUCKET,
    config: {
      credentials: {
        accessKeyId: S3_ACCESS_KEY_ID,
        secretAccessKey: S3_SECRET_ACCESS_KEY,
      },
      region: S3_REGION,
      endpoint: S3_ENDPOINT,
      forcePathStyle: true,
    },
  })
}

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users, Media, Pages, MenuItems, Tables, Reservations, Inquiries, Testimonials, Events],
  globals: [Navigation, Footer, OpeningHours, BookingSettings, ContactInfo],
  localization: {
    locales: [
      { label: 'Deutsch', code: 'de' },
      { label: 'English', code: 'en' },
    ],
    defaultLocale: 'de',
    fallback: true,
  },
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: mongooseAdapter({
    url: process.env.DATABASE_URI || '',
  }),
  sharp,
  plugins: [s3Plugin()].filter((p): p is Plugin => p !== null),
})
