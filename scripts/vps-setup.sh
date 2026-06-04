#!/usr/bin/env bash
# One-time VPS bootstrap for parpali-website on Hostinger.
# Assumes Traefik is already running on the VPS (joined via the external
# `traefik` network — see the soter-website setup; same VPS).
#
# Run on the VPS as root: bash scripts/vps-setup.sh
set -euo pipefail

DEPLOY_DIR="/srv/parpali-website"
DOMAIN="parpali.de"

echo "==> Creating deploy directory at $DEPLOY_DIR ..."
mkdir -p "$DEPLOY_DIR"

# Copy docker-compose.yml if this script is run from the repo root
if [ -f "docker-compose.yml" ]; then
  cp docker-compose.yml "$DEPLOY_DIR/docker-compose.yml"
fi

# Confirm the Traefik network exists; if not, point at the soter docs.
if ! docker network inspect root_default >/dev/null 2>&1; then
  echo "ERROR: Traefik network 'root_default' is missing. Bring up the Traefik stack first."
  exit 1
fi

cat <<EOF

==> Done. Next steps:

  1. Create $DEPLOY_DIR/.env with the production secrets:
       PAYLOAD_SECRET=...
       DATABASE_URI=mongodb+srv://.../parpali
       S3_BUCKET=parpali-media
       S3_ACCESS_KEY_ID=...
       S3_SECRET_ACCESS_KEY=...
       S3_ENDPOINT=https://hel1.your-objectstorage.com
       S3_REGION=hel1
       SMTP_HOST=mail.privateemail.com
       SMTP_PORT=465
       SMTP_USER=reservierung@$DOMAIN
       SMTP_PASS=...
       SMTP_FROM=Parpali <reservierung@$DOMAIN>
       NEXT_PUBLIC_SITE_URL=https://$DOMAIN

  2. Point DNS A records for $DOMAIN and www.$DOMAIN at this VPS IP.

  3. Push to main on GitHub to trigger the first deployment.

  4. Verify: curl -I https://$DOMAIN

EOF
