# Interest-form relay (Cloudflare Worker)

Keeps the Telegram bot token off the public site. The browser posts to this
Worker; the Worker holds the real secrets and forwards to Telegram.

## Deploy

```bash
npm install -g wrangler
cd cloudflare-worker
wrangler login
wrangler secret put TELEGRAM_BOT_TOKEN
wrangler secret put TELEGRAM_CHAT_ID
wrangler deploy
```

`wrangler deploy` prints the Worker's URL (something like
`https://604torridon-interest-form.<your-subdomain>.workers.dev`). Put that
URL into `js/main.js` as `FORM_ENDPOINT`.

If `ALLOWED_ORIGIN` in `wrangler.toml` doesn't match where the site actually
ends up hosted, update it before deploying, or the browser's CORS check will
block submissions.

## Rotate the bot token

Since the original token was shared in plain chat, rotate it once this is
set up: message `@BotFather` → `/mytoken` or `/revoke`, get a new token, and
re-run `wrangler secret put TELEGRAM_BOT_TOKEN` with the new value.
