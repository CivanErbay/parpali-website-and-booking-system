import posthog from 'posthog-js';

let initialised = false;

export function getPostHog() {
  if (!initialised && typeof window !== 'undefined') {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;
    if (key) {
      posthog.init(key, {
        api_host: host,
        person_profiles: 'identified_only',
      });
    }
    initialised = true;
  }
  return posthog;
}

export function capture(event: string, properties?: Record<string, unknown>) {
  if (!event) return;
  getPostHog().capture(event, properties);
}
