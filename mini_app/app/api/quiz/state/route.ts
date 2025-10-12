export const runtime = "nodejs";

export async function GET(req: Request) {
  const api = process.env.API_URL!;
  const url = new URL(req.url);
  const privy_id = url.searchParams.get("privy_id") || "";
  const r = await fetch(`${api}/quiz/state?privy_id=${encodeURIComponent(privy_id)}`, {
    cache: "no-store",
  });
  const body = await r.text();
  return new Response(body, {
    status: r.status,
    headers: { "Content-Type": r.headers.get("content-type") || "application/json" },
  });
}