import crypto from "crypto";

function verifyTelegramInitData(initData, botToken, maxAgeSec = 600) {
  if (!initData) return { ok: false, reason: "empty_init_data" };
  if (!botToken) return { ok: false, reason: "missing_bot_token" };

  const token = botToken.trim();

  const pairs = initData.split("&").filter(Boolean);

  const hashIdx = pairs.findIndex((s) => s.startsWith("hash="));
  if (hashIdx === -1) return { ok: false, reason: "missing_hash" };
  const receivedHashHex = pairs[hashIdx].slice("hash=".length);
  pairs.splice(hashIdx, 1);

  pairs.sort((a, b) => a.localeCompare(b));
  const dataCheckString = pairs.join("\n");

  const secretKey = crypto.createHmac("sha256", "WebAppData").update(token).digest();

  const computedHashHex = crypto.createHmac("sha256", secretKey).update(dataCheckString).digest("hex");

  try {
    const a = Buffer.from(receivedHashHex, "hex");
    const b = Buffer.from(computedHashHex, "hex");
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      return { ok: false, reason: "hash_mismatch" };
    }
  } catch {
    return { ok: false, reason: "invalid_hash" };
  }

  const authPair = pairs.find((s) => s.startsWith("auth_date="));
  if (authPair) {
    const authDate = Number(authPair.slice("auth_date=".length));
    if (!Number.isFinite(authDate)) return { ok: false, reason: "invalid_auth_date" };
    const age = Math.floor(Date.now() / 1000) - authDate;
    if (age > maxAgeSec) return { ok: false, reason: "expired", age };
  }

  const userPair = pairs.find((s) => s.startsWith("user="));
  let user = null;
  if (userPair) {
    try {
      user = JSON.parse(decodeURIComponent(userPair.slice("user=".length)));
    } catch { /* ignore */ }
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