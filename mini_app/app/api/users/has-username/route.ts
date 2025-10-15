export const runtime = "nodejs";

export const revalidate = 0;
export const dynamic = 'force-dynamic';

const NO_CACHE = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  Pragma: 'no-cache',
  Expires: '0',
};

export async function GET(req: Request) {
  const api = process.env.API_URL;
  const url = new URL(req.url);
  const privy_id = url.searchParams.get("privy_id");
  if (!privy_id) return new Response("missing privy_id", { status: 400 });

  const r = await fetch(`${api}/users/has-username?privy_id=${encodeURIComponent(privy_id)}`, { cache: "no-store" });
  const text = await r.text();
  return new Response(text, { status: r.status, headers: { "Content-Type": "application/json" }, ...NO_CACHE });
}