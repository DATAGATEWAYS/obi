import {NextRequest, NextResponse} from "next/server";

export const dynamic = "force-dynamic";

const api = process.env.API_URL!;

export async function GET(req: NextRequest) {
    const {searchParams} = new URL(req.url);
    const privy_id = searchParams.get("privy_id");

    if (!privy_id) {
        return NextResponse.json({error: "privy_id is required"}, {status: 400});
    }

    const url = `${api}/quiz/minted?privy_id=${encodeURIComponent(privy_id)}`;

    const r = await fetch(url, {cache: "no-store"});

    const body = await r.text();
    return new NextResponse(body, {
        status: r.status,
        headers: {
            "content-type": r.headers.get("content-type") || "application/json",
        },
    });
}
