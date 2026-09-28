/**
 * Web-App-Manifest nur für das Dashboard: scope `/manage`, damit die öffentliche
 * Website nie im App-Modus landet. Liegt unter /manage, weil dieser Pfad in
 * Traefik vom Basic-Auth ausgenommen ist (Manifest-Requests senden keine Credentials).
 */
export function GET() {
  const manifest = {
    name: 'Parpali · Reservierungen',
    short_name: 'Parpali',
    id: '/manage',
    start_url: '/manage',
    scope: '/manage',
    display: 'standalone',
    orientation: 'any',
    background_color: '#f5f0e4',
    theme_color: '#1f2e1f',
    lang: 'de',
    icons: [
      { src: '/manage/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/manage/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/manage/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
  return new Response(JSON.stringify(manifest), {
    headers: { 'Content-Type': 'application/manifest+json' },
  })
}
