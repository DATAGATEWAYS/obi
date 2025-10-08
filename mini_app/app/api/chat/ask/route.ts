export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const api = process.env.AI_API_URL;
    if (!api) {
      return new Response(JSON.stringify({ ok: false, reason: "missing_AI_API_URL" }), { status: 500 });
    }
    const body = await req.text();
    const r = await fetch(`${api}/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      cache: "no-store",
    });
    const text = await r.text();
    return new Response(text, { status: r.status, headers: { "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(
      JSON.stringify({ ok: false, reason: "proxy_failed", detail: String(e?.message || e) }),
      { status: 500 }
    );
  }
}