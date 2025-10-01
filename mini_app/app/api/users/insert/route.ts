export const runtime = "nodejs";

export async function POST(req: Request) {
  const api = process.env.API_URL;
  if (!api) {
    return new Response(JSON.stringify({ ok: false, reason: "missing_API_URL" }), {
      status: 500, headers: { "Content-Type": "application/json" }
    });
  }

  const body = await req.text();
  const r = await fetch(`${api}/users/insert`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    cache: "no-store",
  });

  const text = await r.text();
  return new Response(text, {
    status: r.status,
    headers: { "Content-Type": "application/json" }
  });
}
