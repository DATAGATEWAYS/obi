import {NextRequest, NextResponse} from "next/server";

const api = process.env.API_URL;

export async function GET(req: NextRequest) {
    const {searchParams} = new URL(req.url);
    const privy_id = searchParams.get("privy_id");
    if (!privy_id) {
        return NextResponse.json({error: "privy_id is required"}, {status: 400});
    }

    const r = await fetch(`${api}/wallets/by-privy?privy_id=${encodeURIComponent(privy_id)}`, {
        cache: "no-store",
    });

    const data = await r.json().catch(() => ({}));
    return NextResponse.json(data, {status: r.status});
}
