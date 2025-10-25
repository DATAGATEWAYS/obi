export async function POST(req: Request) {
    const payload = await req.json();
    const api = process.env.API_URL;
    const r = await fetch(`${api}/quiz/mint-first-chat`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(payload),
    });
    const text = await r.text();
    return new Response(text, {
        status: r.status,
        headers: {"Content-Type": r.headers.get("content-type") || "application/json"}
    });
}