"use client";
import {useEffect, useRef, useState} from "react";
import {usePrivy} from "@privy-io/react-auth";
import {useRouter} from "next/navigation";

type Msg = { role: "user" | "assistant" | "system"; text: string; typing?: boolean; html?: boolean; };

const SUGGESTIONS = [
    "What's a wallet?",
    "How do I create a wallet?",
    "What's a scam to avoid?",
    "What is Polygon?",
];

function getGreeting(): string {
    const h = new Date().getHours();
    if (h < 12) return "Ask Obi anything";
    if (h < 18) return "Ask Obi anything";
    return "Ask Obi anything";
}

export default function ChatClient() {
    const router = useRouter();
    const {user, ready, authenticated} = usePrivy();
    const [typingStep, setTypingStep] = useState(0);
    type ChatDTO = { id: number; name: string };

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [chats, setChats] = useState<ChatDTO[]>([]);

    const [msgs, setMsgs] = useState<Msg[]>([
        {role: "assistant", text: "Hey, what would you like to learn today?"},
    ]);
    const [input, setInput] = useState("");
    const [sending, setSending] = useState(false);
    const listRef = useRef<HTMLDivElement>(null);
    const [chatId, setChatId] = useState<number | null>(null);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [dots, setDots] = useState(1);
    useEffect(() => {
        if (!loadingHistory) {
            setDots(1);
            return;
        }
        const id = setInterval(() => setDots(d => (d % 3) + 1), 400);
        return () => clearInterval(id);
    }, [loadingHistory]);

    const scrollToBottom = (smooth = false) => {
        const el = listRef.current;
        if (!el) return;
        el.scrollTo({top: el.scrollHeight, behavior: smooth ? "smooth" : "auto"});
    };

    const [typingDots, setTypingDots] = useState(1);
    useEffect(() => {
        if (!sending) {
            setTypingDots(1);
            return;
        }
        const id = setInterval(() => setTypingDots(d => (d % 3) + 1), 400);
        return () => clearInterval(id);
    }, [sending]);

    const showSuggestions = !loadingHistory && !msgs.some(m => m.role === "user");

    function getUserInitial(): string {
        const t = (typeof window !== "undefined" ? (window as any).Telegram : null)?.WebApp?.initDataUnsafe?.user;
        if (t?.first_name) return String(t.first_name).charAt(0).toUpperCase();
        if (t?.username) return String(t.username).charAt(0).toUpperCase();
        try {
            const u = localStorage.getItem("username");
            if (u) return u.charAt(0).toUpperCase();
        } catch {
        }
        return "U";
    }

    useEffect(() => {
        const hasTyping = msgs.some(m => m.typing);
        if (!hasTyping) {
            setTypingStep(0);
            return;
        }
        const id = setInterval(() => setTypingStep(s => (s + 1) % 4), 400);
        return () => clearInterval(id);
    }, [msgs]);

    // autoscroll
    useEffect(() => {
        const id = requestAnimationFrame(() => scrollToBottom(true));
        return () => cancelAnimationFrame(id);
    }, [msgs.length, sending]);

    function getTgId(): number | null {
        const p: any = user as any;
        const fromPrivy =
            p?.telegram?.telegramUserId ??
            p?.telegram?.id ??
            null;

        if (fromPrivy) return Number(fromPrivy) || null;

        const w = globalThis as any;
        const fromInitData = w?.Telegram?.WebApp?.initDataUnsafe?.user?.id;
        return fromInitData ? Number(fromInitData) : null;
    }

    async function send(text?: string) {
        const q = (text ?? input).trim();
        if (!q || sending) return;

        setMsgs(m => [...m, {role: "user", text: q}]);
        setInput("");

        void renameChatByFirstQuestion(q);

        setSending(true);

        try {
            const tgId = getTgId();
            if (!tgId) {
                setMsgs(m => {
                    const n = [...m];
                    const msg = {
                        role: "system",
                        text:
                            "I couldn’t detect your Telegram ID. Please open the mini app from the bot or log in with Telegram.",
                    } as Msg;
                    n.push(msg);
                    return n;
                });
                return;
            }

            const r = await fetch("/api/chat/ask", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({telegram_id: tgId, question: q, chat_id: chatId}),
            });

            let data: any;
            const ct = r.headers.get("content-type") || "";
            data = ct.includes("application/json") ? await r.json() : await r.text();

            let raw =
                typeof data === "string"
                    ? data
                    : data?.answer ?? data?.text ?? data?.message ?? "";

            if (!raw) raw = "Sorry, I couldn't generate a response.";

            const html = raw.replace(/\n/g, "<br/>");

            setMsgs(m => [...m, {role: "assistant", text: html, html: true}]);

        } catch (e: any) {
            setMsgs(m => {
                const n = [...m];
                const msg: Msg = {
                    role: "system",
                    text: `Request failed: ${String(e?.message || e)}`,
                };
                n.push(msg);
                return n;
            });
        } finally {
            setSending(false);
        }
    }

    useEffect(() => {
        const tgId = getTgId();
        if (!tgId) return;
        (async () => {
            const r = await fetch("/api/chat/create", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({telegram_id: tgId, name: "New chat"}),
            });
            const j = await r.json();
            if (r.ok && j?.id) {
                setChatId(Number(j.id));
                refreshChats();
            }
        })();
    }, [ready]);

    async function refreshChats() {
        const tgId = getTgId();
        if (!tgId) return;
        const r = await fetch(`/api/chat/list?telegram_id=${tgId}`, {cache: "no-store"});
        if (!r.ok) return;
        const items: ChatDTO[] = await r.json();
        setChats(items);
    }

    useEffect(() => {
        refreshChats();
    }, [chatId]);

    async function loadHistory(currentChatId: number) {
        const tgId = getTgId();
        if (!tgId) return;
        setLoadingHistory(true);
        try {
            const r = await fetch(`/api/chat/history?telegram_id=${tgId}&chat_id=${currentChatId}&limit=100`, {cache: "no-store"});
            if (!r.ok) return;
            const items: Msg[] = await r.json();
            setMsgs(items.length ? items : [{role: "assistant", text: "Hey, what would you like to learn today?"}]);
            requestAnimationFrame(() => scrollToBottom(false));
        } finally {
            setLoadingHistory(false);
        }
    }

    useEffect(() => {
        if (chatId) loadHistory(chatId);
    }, [chatId]);

    async function renameChatByFirstQuestion(firstQuestion: string) {
        const tgId = getTgId();
        if (!chatId || !tgId) return;
        const current = chats.find(c => c.id === chatId);
        if (!current || current.name !== "New chat") return;

        const newName = firstQuestion.slice(0, 25) + "...";

        setChats(cs => cs.map(c => (c.id === chatId ? {...c, name: newName} : c)));

        try {
            await fetch("/api/chat/update", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({telegram_id: tgId, chat_id: chatId, name: newName}),
            });
        } catch (_) {
        } finally {
            refreshChats();
        }
    }

    return (
        <main style={{
            display: "grid",
            gridTemplateRows: showSuggestions ? "1fr auto auto" : "1fr auto",
            height: "100dvh",
            background: "#EEE8C9",
            overflow: "hidden"
        }}>

            <div
                ref={listRef}
                style={{
                    position: "relative",
                    overflowY: "auto",
                    display: "flex",
                    flexDirection: "column",
                    minHeight: 0,
                }}
            >

                {/* header + messages */}
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 16px"
                }}>
                    <img
                        onClick={() => setSidebarOpen(o => !o)}
                        src="/chat/history.svg"
                        width={26}
                        height={26}
                        style={{flex: "0 0 26px"}}
                        alt=""
                    />
                    <div style={{fontWeight: 700, color: "#859E4F"}}>{getGreeting()}</div>
                    <img
                        onClick={() => router.push("/dashboard")}
                        src="/chat/close.svg"
                        width={26}
                        height={26}
                        style={{flex: "0 0 26px"}}
                        alt=""
                    />
                </div>
                <div style={{position: "relative"}}>
                    {msgs.map((m, i) => {
                        const isUser = m.role === "user";
                        return (
                            <div
                                key={i}
                                style={{
                                    display: "flex",
                                    justifyContent: isUser ? "flex-end" : "flex-start",
                                    alignItems: "flex-end",
                                    gap: 8,
                                    padding: "6px 12px",
                                }}
                            >
                                {/* bots avatar */}
                                {!isUser && (
                                    <img
                                        src="/chat/obi_icon.svg"
                                        alt="Obi"
                                        width={26}
                                        height={26}
                                        style={{
                                            flex: "0 0 26px",
                                            cursor: "pointer"
                                        }}
                                    />
                                )}

                                {/* bubble */}
                                <div
                                    style={{
                                        maxWidth: "78%",
                                        padding: "10px 12px",
                                        borderRadius: 14,
                                        background: isUser ? "#FFFFFF" : "#FAF2DD",
                                        color: "#2b2b2b",
                                        whiteSpace: "pre-wrap",
                                        overflowWrap: "anywhere",
                                        wordBreak: "break-word",
                                        boxShadow: "0 1px 3px rgba(0,0,0,.06)",
                                    }}
                                    dangerouslySetInnerHTML={m.html ? {__html: m.text} : undefined}
                                >
                                    {m.html ? null : m.text}
                                </div>

                                {/* users avatar */}
                                {isUser && (
                                    <div
                                        aria-label="You"
                                        style={{
                                            width: 26,
                                            height: 26,
                                            borderRadius: "50%",
                                            backgroundImage: "url(/chat/user_icon.svg)",
                                            backgroundSize: "cover",
                                            backgroundPosition: "center",
                                            display: "grid",
                                            placeItems: "center",
                                            fontFamily: "Satoshi, system-ui, sans-serif",
                                            fontWeight: 700,
                                            fontSize: 12,
                                            color: "#437338",
                                            lineHeight: 1,
                                            flex: "0 0 26px",
                                        }}
                                    >
                                        {getUserInitial()}
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {/* status typing… */}
                    {sending && (
                        <div
                            aria-live="polite"
                            role="status"
                            style={{
                                display: "flex",
                                justifyContent: "flex-start",
                                alignItems: "flex-end",
                                gap: 8,
                                padding: "6px 12px",
                                color: "#979797",
                                fontStyle: "italic",
                            }}
                        >
                            <img
                                src="/chat/obi_icon.svg"
                                alt="Obi"
                                width={26}
                                height={26}
                                style={{flex: "0 0 26px"}}
                            />
                            <div>typing{'.'.repeat(typingDots)}</div>
                        </div>
                    )}
                </div>

                {
                    loadingHistory && (
                        <div className="chat-loader" aria-live="polite" aria-busy="true">
                            <p>loading chats{'.'.repeat(dots)}</p>
                        </div>
                    )
                }
            </div>

            {/* quick suggestions */
            }
            {
                showSuggestions  && (
                    <div style={{display: "flex", gap: 8, flexWrap: "wrap", padding: "0 12px 8px"}}>
                        {SUGGESTIONS.map((s) => (
                            <button
                                key={s}
                                onClick={() => send(s)}
                                disabled={sending}
                                style={{
                                    border: "1px solid #ADC178",
                                    padding: "8px 10px",
                                    borderRadius: 18,
                                    background: "none",
                                    color: "#859E4F",
                                    fontWeight: 400,
                                    cursor: "pointer"
                                }}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                )
            }

            {/* composer */
            }
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    send();
                }}
                style={{display: "flex", gap: 8, padding: 12}}
            >
                <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask anything about crypto..."
                    disabled={sending}
                    style={{
                        flex: 1,
                        padding: "12px 14px",
                        borderRadius: 18,
                        border: "1px solid #ddd",
                        outline: "none",
                        background: "#fff",
                    }}
                />
                <button
                    type="submit"
                    disabled={sending || !input.trim()}
                    style={{
                        padding: "10px 16px",
                        borderRadius: 18,
                        border: 0,
                        background: "#6b8749",
                        color: "#F0EAD2",
                        cursor: "pointer",
                        minWidth: 64
                    }}
                >
                    {sending ? "…" : "Send"}
                </button>
            </form>
            {/* LEFT DRAWER */
            }
            <div
                onClick={() => setSidebarOpen(false)}
                style={{
                    position: "fixed",
                    inset: 0,
                    background: sidebarOpen ? "rgba(0,0,0,.15)" : "transparent",
                    pointerEvents: sidebarOpen ? "auto" : "none",
                    transition: "background .2s ease",
                    zIndex: 50,
                }}
            >
                <aside
                    onClick={(e) => e.stopPropagation()}
                    style={{
                        position: "absolute",
                        left: 0, top: 0, bottom: 0,
                        width: 280,
                        background: "#F0EAD2",
                        boxShadow: "2px 0 12px rgba(0,0,0,.08)",
                        transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)",
                        transition: "transform .2s ease",
                        display: "flex",
                        flexDirection: "column",
                    }}
                >
                    <div style={{padding: 12, borderBottom: "1px solid #eee", fontWeight: 700, color: "#6d7d4f"}}>
                        Your chats
                    </div>

                    <div style={{padding: 8, display: "grid", gap: 6, overflowY: "auto"}}>
                        {chats.map(c => (
                            <button
                                key={c.id}
                                onClick={() => {
                                    setChatId(c.id);
                                    setSidebarOpen(false);
                                    loadHistory(c.id);
                                }}
                                style={{
                                    textAlign: "left",
                                    background: "#FAF2DD",
                                    color: "#6C584C",
                                    padding: "10px 12px",
                                    borderRadius: 12,
                                    cursor: "pointer",
                                    border: chatId === c.id ? "2px solid #859E4F" : "2px solid transparent",
                                    fontWeight: chatId === c.id ? 700 : 600
                                }}
                            >
                                {c.name}
                            </button>
                        ))}
                    </div>

                    <div style={{marginTop: "auto", padding: 12, borderTop: "1px solid #eee"}}>
                        <button
                            onClick={async () => {
                                const tgId = getTgId();
                                if (!tgId) return;
                                const r = await fetch("/api/chat/create", {
                                    method: "POST",
                                    headers: {"Content-Type": "application/json"},
                                    body: JSON.stringify({telegram_id: tgId, name: "New chat"}),
                                });
                                const j = await r.json();
                                if (r.ok && j?.id) {
                                    setChatId(Number(j.id));
                                    await refreshChats();
                                    setSidebarOpen(false);
                                }
                            }}
                            style={{background: "#6b8749", color: "#F0EAD2", width: "100%"}}
                        >
                            + Add chat
                        </button>
                    </div>
                </aside>
            </div>
        </main>
    )
        ;
}