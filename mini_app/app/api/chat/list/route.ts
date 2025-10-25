export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const api = process.env.API_URL;
    if (!api) {
      return new Response(JSON.stringify({ ok: false, reason: "missing_API_URL" }), { status: 500 });
    }

    const { searchParams } = new URL(req.url);
    const telegramId = searchParams.get("telegram_id");
    if (!telegramId) {
      return new Response(JSON.stringify({ ok: false, reason: "missing_telegram_id" }), { status: 400 });
    }

    const upstream = `${api}/chat/list?telegram_id=${encodeURIComponent(telegramId)}`;
    const r = await fetch(upstream, { method: "GET", headers: { Accept: "application/json" }, cache: "no-store" });

    const text = await r.text();
    return new Response(text, { status: r.status, headers: { "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(
      JSON.stringify({ ok: false, reason: "proxy_failed", detail: String(e?.message || e) }),
      { status: 500 }
    );
  }
}