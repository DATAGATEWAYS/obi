import crypto from "crypto";

// Verify Telegram WebApp initData using HMAC(secret="WebAppData"→bot token)
function verifyTelegramInitData(initData, botToken, maxAgeSec = 600) {
  if (!initData) return { ok: false, reason: "empty_init_data" };
  if (!botToken) return { ok: false, reason: "missing_bot_token" };

  const token = botToken.trim();

  // raw pairs: "k=v&k2=v2&..."; find hash, build data_check_string
  const pairs = initData.split("&").filter(Boolean);

  const hashIdx = pairs.findIndex((s) => s.startsWith("hash="));
  if (hashIdx === -1) return { ok: false, reason: "missing_hash" };
  const hash = pairs[hashIdx].slice("hash=".length);
  pairs.splice(hashIdx, 1); // remove hash

  // sort lexicographically and join with '\n' -> data_check_string
  pairs.sort((a, b) => a.localeCompare(b));
  const dataCheckString = pairs.join("\n");

  // secret_key = HMAC_SHA256(bot_token, key="WebAppData")
  const secret = crypto.createHmac("sha256", "WebAppData").update(token).digest();

  // computed = HMAC_SHA256(data_check_string, key=secret)
  const computed = crypto.createHmac("sha256", secret).update(dataCheckString).digest("hex");

  if (computed !== hash) {
    return { ok: false, reason: "hash_mismatch" };
  }

  // Optional: freshness check (auth_date)
  const authPair = pairs.find((s) => s.startsWith("auth_date="));
  if (authPair) {
    const authDate = Number(authPair.slice("auth_date=".length));
    if (!Number.isFinite(authDate)) return { ok: false, reason: "invalid_auth_date" };
    const now = Math.floor(Date.now() / 1000);
    if (now - authDate > maxAgeSec) {
      return { ok: false, reason: "expired", age: now - authDate };
    }
  }

  // Optional: parse user for convenience
  const userPair = pairs.find((s) => s.startsWith("user="));
  let user = null;
  if (userPair) {
    const encoded = userPair.slice("user=".length);
    try {
      user = JSON.parse(decodeURIComponent(encoded));
    } catch {}
  }

  return { ok: true, user };
}

export async function POST(req) {
  try {
    const { initData = "" } = await req.json().catch(() => ({}));
    const res = verifyTelegramInitData(initData, process.env.TELEGRAM_BOT_TOKEN, 600);
    return new Response(JSON.stringify(res), {
      status: res.ok ? 200 : 400,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ ok: false, reason: "server_error", error: String(e) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}