export const runtime = "nodejs";

export async function POST(req: Request) {
  const api = process.env.AI_API_URL!;
  const body = await req.text();
  const r = await fetch(`${api}/users/onboarding/complete`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    cache: "no-store",
  });
  const text = await r.text();
  return new Response(text, { status: r.status, headers: { "Content-Type": "application/json" } });
}