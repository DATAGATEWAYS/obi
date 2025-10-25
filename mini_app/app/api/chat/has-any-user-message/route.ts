export async function GET(req: Request) {
    const url = new URL(req.url);
    const telegram_id = url.searchParams.get("telegram_id");
    const api = process.env.API_URL;
    const r = await fetch(`${api}/chat/has-any-user-message?telegram_id=${telegram_id}`, {cache: "no-store"});
    const text = await r.text();
    return new Response(text, {
        status: r.status,
        headers: {"Content-Type": r.headers.get("content-type") || "application/json"}
    });
}
