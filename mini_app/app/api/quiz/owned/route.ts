import { NextRequest, NextResponse } from "next/server";

const api = process.env.API_URL!;

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const privy_id = url.searchParams.get("privy_id");
  if (!privy_id) {
    return NextResponse.json({ error: "Missing privy_id" }, { status: 400 });
  }

  const upstream = `${api}/quiz/owned?privy_id=${encodeURIComponent(
    privy_id
  )}`;

  const r = await fetch(upstream, { cache: "no-store" });
  const body = await r.text();

  return new NextResponse(body, {
    status: r.status,
    headers: {
      "content-type": r.headers.get("content-type") ?? "application/json",
    },
  });
}
