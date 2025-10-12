export const runtime = "nodejs";

export async function GET(req: Request) {
  const api = process.env.API_URL!;
  const u = new URL(req.url);
  const privy_id = u.searchParams.get("privy_id") || "";
  const from = u.searchParams.get("from") || "";
  const to = u.searchParams.get("to") || "";
  const r = await fetch(`${api}/quiz/week?privy_id=${encodeURIComponent(privy_id)}&date_from=${from}&date_to=${to}`, { cache: "no-store" });
  const text = await r.text();
  return new Response(text, {
    status: r.status,
    headers: { "Content-Type": r.headers.get("content-type") || "application/json" },
  });
}
