import crypto from "crypto";

function verifyTelegramInitData(initData, botToken, maxAgeSec = 600) {
  if (!initData) return { ok: false, reason: "empty_init_data" };
  if (!botToken) return { ok: false, reason: "missing_bot_token" };

  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) return { ok: false, reason: "missing_hash" };

  // Build data-check string (all params except 'hash', sorted by key)
  const entries = [];
  for (const [k, v] of params.entries()) {
    if (k === "hash") continue;
    entries.push(`${k}=${v}`);
  }
  entries.sort();
  const dataCheckString = entries.join("\n");

  // Secret key = SHA256(bot_token), HMAC over dataCheckString
  const secret = crypto.createHash("sha256").update(botToken).digest();
  const hmac = crypto.createHmac("sha256", secret).update(dataCheckString).digest("hex");

  if (hmac !== hash) {
    return { ok: false, reason: "hash_mismatch" };
  }

  // Optional: freshness check
  const authDate = Number(params.get("auth_date") || 0);
  if (!Number.isFinite(authDate) || authDate <= 0) {
    return { ok: false, reason: "invalid_auth_date" };
  }
  const now = Math.floor(Date.now() / 1000);
  if (now - authDate > maxAgeSec) {
    return { ok: false, reason: "expired", age: now - authDate };
  }

  // Parse 'user' JSON if present
  let userObj = null;
  const userStr = params.get("user");
  if (userStr) {
    try {
      userObj = JSON.parse(userStr);
    } catch {
      userObj = null;
    }
  }

  return {
    ok: true,
    query_id: params.get("query_id") || null,
    auth_date: authDate,
    user: userObj
  };
}

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const initData = body?.initData || "";
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const res = verifyTelegramInitData(initData, token, 600);
    return new Response(JSON.stringify(res), {
      status: res.ok ? 200 : 400,
      headers: { "Content-Type": "application/json" }
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, reason: "server_error", error: String(e) }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
