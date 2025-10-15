import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { privy_id } = await req.json();
    if (!privy_id) {
      return NextResponse.json({ error: "privy_id_required" }, { status: 400 });
    }
    const api = process.env.API_URL!;
    if (!api) {
      return NextResponse.json({ error: "API_URL_not_set" }, { status: 500 });
    }

    const r = await fetch(`${api}/quiz/claim`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ privy_id }),
      cache: "no-store",
    });

    const text = await r.text();
    let data: any;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }

    return NextResponse.json(data, { status: r.status });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? "claim_proxy_failed" },
      { status: 500 }
    );
  }
}
