export const runtime = "nodejs";

export async function POST(req: Request) {
  const api = process.env.API_URL!;
  const body = await req.text();
  const r = await fetch(`${api}/quiz/answer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
  const text = await r.text();
  return new Response(text, {
    status: r.status,
    headers: { "Content-Type": r.headers.get("content-type") || "application/json" },
  });
}