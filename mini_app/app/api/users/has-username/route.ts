export const runtime = "nodejs";

export async function GET(req: Request) {
  const api = process.env.AI_API_URL!;
  const url = new URL(req.url);
  const telegram_id = url.searchParams.get("telegram_id");
  if (!telegram_id) return new Response("missing privy_id", { status: 400 });

  const r = await fetch(`${api}/users/has-username?telegram_id=${encodeURIComponent(telegram_id)}`, { cache: "no-store" });
  const text = await r.text();
  return new Response(text, { status: r.status, headers: { "Content-Type": "application/json" } });
}