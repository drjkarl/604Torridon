# 604 Torridon Lane — FSBO site

Static site for selling 604 Torridon Lane, Simpsonville, SC 29681 by owner.

## Structure

- `index.html`, `css/`, `js/` — the site itself.
- `data/listing.json` — editable listing facts, price, and terms. **Edit this before launch** — several fields are placeholders marked `TODO - confirm`.
- `data/photos.json` — gallery manifest, auto-generated from the Google Photos album. Don't hand-edit; it's overwritten by the sync.
- `scripts/sync_photos.py` + `.github/workflows/sync-photos.yml` — pulls the current photos from the public Google Photos share link every 6 hours (and on demand via the Actions tab → "Sync gallery photos" → Run workflow) and commits `data/photos.json` if the album changed.
- `cloudflare-worker/` — the small relay that receives interest-form submissions and forwards them to Telegram, keeping the bot token off the public site. See its `README.md` to deploy.

## Before going live

1. Fill in the `TODO` fields in `data/listing.json` (beds/baths, square footage, year built, parcel ID, tax amount, schools, description, features).
2. Deploy the Cloudflare Worker (`cloudflare-worker/README.md`) and put its URL into `FORM_ENDPOINT` in `js/main.js`.
3. Rotate the Telegram bot token via `@BotFather` once the Worker is holding the new one (the original was shared in plaintext chat).
4. Enable GitHub Pages for this repo (Settings → Pages → Deploy from branch → `main` / root).
