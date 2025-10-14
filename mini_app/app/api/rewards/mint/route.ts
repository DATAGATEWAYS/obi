import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const api = process.env.API_URL!;
  const r = await fetch(`${api}/rewards/mint`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const t = await r.text();
  return new NextResponse(t, { status: r.status, headers: { "Content-Type": r.headers.get("Content-Type") || "application/json" }});
}
