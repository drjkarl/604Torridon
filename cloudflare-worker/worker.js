// Relays the "I'm interested" form from the 604torridon site to Telegram.
// The bot token and chat id are never exposed to the browser: they live only
// as Worker secrets (set with `wrangler secret put`), never in this file.
//
// Expects env bindings:
//   TELEGRAM_BOT_TOKEN  - secret
//   TELEGRAM_CHAT_ID    - secret
//   ALLOWED_ORIGIN      - plain var, e.g. "https://drjkarl.github.io"

function corsHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function escapeHtml(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export default {
  async fetch(request, env) {
    const origin = env.ALLOWED_ORIGIN || "*";

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders(origin) });
    }

    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405, headers: corsHeaders(origin) });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ ok: false, error: "Invalid JSON" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
      });
    }

    const name = typeof body.name === "string" ? body.name.trim() : "";
    const phone = typeof body.phone === "string" ? body.phone.trim() : "";
    const preference = body.preference === "text" ? "Text" : body.preference === "call" ? "Call" : "";

    if (!name || !phone || !preference) {
      return new Response(
        JSON.stringify({ ok: false, error: "Name, phone, and call/text preference are required." }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders(origin) } }
      );
    }

    if (name.length > 100 || phone.length > 30) {
      return new Response(JSON.stringify({ ok: false, error: "Input too long." }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
      });
    }

    const message = [
      "<b>New interest in 604 Torridon Lane</b>",
      `Name: ${escapeHtml(name)}`,
      `Phone: ${escapeHtml(phone)}`,
      `Prefers: ${preference}`,
    ].join("\n");

    const tgResp = await fetch(
      `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: env.TELEGRAM_CHAT_ID,
          text: message,
          parse_mode: "HTML",
        }),
      }
    );

    if (!tgResp.ok) {
      return new Response(JSON.stringify({ ok: false, error: "Failed to deliver notification." }), {
        status: 502,
        headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
    });
  },
};
