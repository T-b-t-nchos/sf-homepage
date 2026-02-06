# Security Guide

This project is configured to fail closed for sensitive endpoints.

## Feature Toggles
- `LT1_VOTE_ENABLED=false` by default.
- `LT1_PRESENTER_CANCEL_ENABLED=false` by default.
- `LT1_SUBMIT_ENABLED=true` by default.
- `VITE_LT1_VOTE_ENABLED=false` hides the vote page in frontend.

## Required Secrets
- `SESSION_SECRET`: minimum 32 bytes.
- `DISCORD_CLIENT_SECRET`: OAuth secret.
- `DISCORD_WEBHOOK_URL`: server-side only.

## Recommended Production Settings
- `TRUST_PROXY=true`
- `TRUSTED_PROXY_PROVIDER=vercel` or `cloudflare`
- `KV_REST_API_URL` and `KV_REST_API_TOKEN` for atomic vote deduplication.

## Incident Response
1. Disable affected endpoints immediately:
   - set `LT1_VOTE_ENABLED=false`
   - set `LT1_PRESENTER_CANCEL_ENABLED=false`
   - set `LT1_SUBMIT_ENABLED=false` if needed
2. Rotate secrets:
   - `SESSION_SECRET`
   - `DISCORD_CLIENT_SECRET`
   - `DISCORD_WEBHOOK_URL`
3. Review provider logs:
   - Vercel request logs
   - Discord webhook access patterns
4. Re-enable features only after root cause is confirmed.

## Notes
- `.env` must never be committed.
- Keep dependency and runtime updates current.
