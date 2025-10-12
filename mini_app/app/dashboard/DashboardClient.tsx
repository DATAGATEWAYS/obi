"use client";
import React, {useEffect, useState} from "react";
import {usePrivy} from "@privy-io/react-auth";
import {useRouter} from "next/navigation";

/* ---------- palette for good contrast (works in dark TG too) ---------- */
const COLORS = {
    cardBg: "#ffffff",
    quizBorder: "#b58752",
    optionBg: "#F0F5E6",
    optionBorder: "#D6E3C7",
    optionText: "#2B2B2B",
    optionBgSelected: "#E6F0D9",
    optionBorderSelected: "#6B8749",
    radioAccent: "#2F6B33",
    ctaBg: "#2f6b33",
    ctaText: "#ffffff",
};

/* ---------- utils ---------- */
function titleByHour(h: number) {
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
}

function sanitize(s?: string | null) {
    return (s ?? "").replace(/^@/, "").trim();
}

/* ---------- types for quiz api ---------- */
type QuizState = {
    finished: boolean;
    locked: boolean;
    index: number | null;
    total: number;
    title?: string | null;
    question?: string | null;
    options?: string[] | null;
    selected_index?: number | null;
};

export default function DashboardClient() {
    const router = useRouter();
    const {user, authenticated, ready} = usePrivy();

    /* name anti-flicker */
    const [username, setUsername] = useState<string>(() => {
        if (typeof window === "undefined") return "";
        return (
            sanitize(sessionStorage.getItem("onb_username")) ||
            sanitize(localStorage.getItem("onb_username")) ||
            ""
        );
    });
    const [nameLoaded, setNameLoaded] = useState<boolean>(() => {
        if (typeof window === "undefined") return false;
        const cached =
            sessionStorage.getItem("onb_username") ||
            localStorage.getItem("onb_username");
        return !!cached;
    });
    useEffect(() => {
        if (!ready || !authenticated || nameLoaded) return;
        const privyId = user?.id;
        if (!privyId) return;
        (async () => {
            try {
                const r = await fetch(
                    `/api/users/has-username?privy_id=${encodeURIComponent(privyId)}`,
                    {cache: "no-store"}
                );
                if (r.ok) {
                    const j = await r.json();
                    const name = sanitize(j?.username);
                    if (name) {
                        setUsername(name);
                        localStorage.setItem("onb_username", name);
                    }
                }
            } finally {
                setNameLoaded(true);
            }
        })();
    }, [ready, authenticated, user, nameLoaded]);

    const greetTitle = titleByHour(new Date().getHours());
    const Skeleton = (
        <span
            aria-hidden
            style={{
                display: "inline-block",
                width: 90,
                height: "1em",
                borderRadius: 6,
                background: "linear-gradient(90deg, #eee 25%, #f6f6f6 37%, #eee 63%)",
                backgroundSize: "400% 100%",
                animation: "skeleton 1.2s ease-in-out infinite",
            }}
        />
    );

    return (
        <main style={{padding: 16, maxWidth: 420, margin: "0 auto"}}>
            <style>{`
        @keyframes skeleton {
          0% { background-position: 100% 0; }
          100% { background-position: 0 0; }
        }
      `}</style>

            {/* greeting + profile */}
            <div style={{display: "flex", alignItems: "center", justifyContent: "space-between"}}>
                <h2 style={{color: "#6d7d4f", fontWeight: 700, margin: 0}}>
                    {greetTitle},{" "}
                    {nameLoaded ? (username || "friend") : Skeleton}!
                </h2>
                <button
                    onClick={() => router.push("/profile")}
                    aria-label="Open profile"
                    title="Open profile"
                    style={{
                        fontSize: 28,
                        lineHeight: 1,
                        background: "none",
                        border: 0,
                        cursor: "pointer",
                        padding: 4,
                        borderRadius: 8,
                    }}
                >
                    🕶️
                </button>
            </div>

            {/* tiny calendar dummy */}
            <div style={{display: "flex", gap: 8, margin: "12px 0 16px"}}>
                {["Mon 18", "Tue 19", "Wed 20", "Fri 22", "Sat 23", "Sun 24"].map((d) => (
                    <div
                        key={d}
                        style={{
                            padding: "6px 10px",
                            borderRadius: 12,
                            background: "#f3eed6",
                            color: "#7a6a56",
                            fontSize: 12,
                        }}
                    >
                        {d}
                    </div>
                ))}
            </div>

            {/* QUIZ (server-driven) */}
            <QuizCard privyId={user?.id || ""} ready={ready && authenticated}/>

            {/* CTA */}
            <a
                href="/chat"
                style={{
                    display: "block",
                    textAlign: "center",
                    marginTop: 16,
                    padding: 14,
                    borderRadius: 12,
                    background: COLORS.ctaBg,
                    color: COLORS.ctaText,
                    textDecoration: "none",
                }}
            >
                Ask a question
            </a>

            {/* Explore */}
            <h4 style={{marginTop: 24, color: "#7a6a56"}}>Explore Polygon Community</h4>
            <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12}}>
                <a
                    href="#"
                    style={{
                        padding: 24,
                        borderRadius: 16,
                        background: COLORS.cardBg,
                        textAlign: "center",
                        color: "#6d7d4f",
                        textDecoration: "none",
                        boxShadow: "0 2px 8px rgba(0,0,0,.06)",
                    }}
                >
                    Grants
                </a>
                <a
                    href="#"
                    style={{
                        padding: 24,
                        borderRadius: 16,
                        background: COLORS.cardBg,
                        textAlign: "center",
                        color: "#6d7d4f",
                        textDecoration: "none",
                        boxShadow: "0 2px 8px rgba(0,0,0,.06)",
                    }}
                >
                    dApps
                </a>
            </div>
        </main>
    );
}

/* ===========================
   Quiz Card (DB-backed)
   =========================== */
function QuizCard({privyId, ready}: { privyId: string; ready: boolean }) {
    const [loading, setLoading] = useState(true);
    const [state, setState] = useState<QuizState | null>(null);
    const [selected, setSelected] = useState<number | null>(null);
    const [banner, setBanner] = useState<"correct" | "wrong" | "locked" | "finished" | null>(null);

    useEffect(() => {
        if (!ready || !privyId) return;
        (async () => {
            setLoading(true);
            try {
                const r = await fetch(`/api/quiz/state?privy_id=${encodeURIComponent(privyId)}`, {cache: "no-store"});
                const s: QuizState = await r.json();
                setState(s);
                if (s.finished) setBanner("finished");
                else if (s.locked) {
                    setBanner("locked");
                    if (typeof s.selected_index === "number") setSelected(s.selected_index);
                } else {
                    setBanner(null);
                    setSelected(null);
                }
            } finally {
                setLoading(false);
            }
        })();
    }, [ready, privyId]);

    if (!ready || !privyId) {
        return (
            <div style={{
                background: COLORS.cardBg,
                borderRadius: 16,
                padding: 16,
                boxShadow: "0 2px 8px rgba(0,0,0,.06)"
            }}>
                <h3 style={{margin: 0, color: "#6d7d4f"}}>Quiz of the day:</h3>
                <p style={{margin: "8px 0 12px"}}>Loading…</p>
            </div>
        );
    }

    if (loading || !state) {
        return (
            <div style={{
                background: COLORS.cardBg,
                borderRadius: 16,
                padding: 16,
                boxShadow: "0 2px 8px rgba(0,0,0,.06)"
            }}>
                <h3 style={{margin: 0, color: "#6d7d4f"}}>Quiz of the day:</h3>
                <p style={{margin: "8px 0 12px"}}>Loading…</p>
            </div>
        );
    }

    if (state.finished) {
        return (
            <div style={{
                background: COLORS.cardBg,
                borderRadius: 18,
                padding: 16,
                border: `4px solid ${COLORS.quizBorder}`,
                boxShadow: "0 2px 0 rgba(0,0,0,.08)"
            }}>
                <div style={{fontWeight: 700, color: "#6b5235", marginBottom: 8}}>Quiz of the day:</div>
                <div style={{
                    padding: 12,
                    borderRadius: 12,
                    background: "#eef7e8",
                    color: "#2f6b33",
                    fontWeight: 700,
                    textAlign: "center"
                }}>
                    Hooray! You’ve answered all questions 🎉
                </div>
            </div>
        );
    }

    function handleTryAgain() {
        setSelected(null);
        setBanner(null);
    }

    const disabled = state.locked || banner === "correct" || banner === "wrong";

    async function choose(i: number) {
        if (disabled) return;
        setSelected(i);
        const r = await fetch("/api/quiz/answer", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({privy_id: privyId, option_index: i}),
        });
        const j = await r.json();
        if (j?.correct) {
            setBanner("correct");
            setState(s => s ? {...s, locked: true} : s);
        } else if (j?.locked) {
            setBanner("locked");
            setState(s => s ? {...s, locked: true} : s);
        } else {
            setBanner("wrong");
        }
    }

    return (
        <div style={{background: COLORS.cardBg, borderRadius: 16, padding: 16, boxShadow: "0 2px 8px rgba(0,0,0,.06)"}}>
            <h3 style={{margin: 0, color: "#6d7d4f"}}>Quiz of the day:</h3>
            <p style={{margin: "8px 0 12px", color: "#4e5939"}}>{state.question}</p>

            <div style={{display: "grid", gap: 10}}>
                {(state.options || []).map((opt, i) => {
                    const isSelected = selected === i;
                    return (
                        <label
                            key={i}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                                padding: "12px 14px",
                                borderRadius: 12,
                                background: isSelected ? COLORS.optionBgSelected : COLORS.optionBg,
                                border: `1.5px solid ${isSelected ? COLORS.optionBorderSelected : COLORS.optionBorder}`,
                                cursor: disabled ? "default" : "pointer",
                                color: COLORS.optionText,
                                fontWeight: 500,
                            }}
                        >
                            <input
                                type="radio"
                                name={`q-${state.index}`}
                                checked={isSelected}
                                disabled={disabled}
                                onChange={() => choose(i)}
                                style={{accentColor: COLORS.radioAccent, width: 18, height: 18}}
                            />
                            <span>{opt}</span>
                        </label>
                    );
                })}
            </div>

            {/* banners */}
            {banner === "correct" && (
                <div style={{
                    marginTop: 10, padding: "10px 12px", borderRadius: 10,
                    background: "#dff3d9", color: "#2f6b33", textAlign: "center", fontWeight: 700
                }}>
                    You were right! Claim reward here
                </div>
            )}
            {banner === "wrong" && (
                <button
                    type="button"
                    onClick={handleTryAgain}
                    style={{
                        width: "100%",
                        marginTop: 10,
                        padding: "10px 12px",
                        borderRadius: 10,
                        background: "#7e2b2b",
                        color: "#fff",
                        fontWeight: 700,
                        border: "none",
                        cursor: "pointer",
                    }}
                >
                    Wrong answer, try again
                </button>
            )}
            {banner === "locked" && (
                <div style={{
                    marginTop: 10, padding: "10px 12px", borderRadius: 10,
                    background: "#eef7e8", color: "#2f6b33", textAlign: "center", fontWeight: 700
                }}>
                    You’ve already answered today
                </div>
            )}
        </div>
    );
}