# Stage 1: Install all dependencies (dev + prod, both needed for build)
FROM node:22-alpine AS deps
RUN npm i -g pnpm@9
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Stage 2: Build
FROM node:22-alpine AS builder
RUN npm i -g pnpm@9
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_* vars must be baked in at build time
ARG NEXT_PUBLIC_POSTHOG_KEY
ARG NEXT_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com
ENV NEXT_PUBLIC_POSTHOG_KEY=$NEXT_PUBLIC_POSTHOG_KEY
ENV NEXT_PUBLIC_POSTHOG_HOST=$NEXT_PUBLIC_POSTHOG_HOST

# Payload requires these env vars to be present during build but won't connect to DB.
# S3 placeholders ensure the S3 plugin is registered so generate:importmap includes
# the S3ClientUploadHandler. Real S3 credentials come from the runtime .env.
ENV PAYLOAD_SECRET=build-placeholder
ENV DATABASE_URI=mongodb://127.0.0.1:27017/build
ENV S3_BUCKET=build-placeholder
ENV S3_ACCESS_KEY_ID=build-placeholder
ENV S3_SECRET_ACCESS_KEY=build-placeholder
ENV S3_ENDPOINT=https://build-placeholder.example.com
ENV S3_REGION=build-placeholder
ENV NODE_ENV=production

RUN pnpm generate:types && pnpm generate:importmap && pnpm build

# Stage 3: Lean runtime image using Next.js standalone output
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
