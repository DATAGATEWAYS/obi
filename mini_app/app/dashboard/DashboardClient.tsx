"use client";
import React, {useEffect, useState} from "react";
import {usePrivy} from "@privy-io/react-auth";
import {useRouter} from "next/navigation";
import MintPopup from "../components/MintPopup";

/* ---------- palette for good contrast (works in dark TG too) ---------- */
const COLORS = {
    cardBg: "#FAF2DD",
    quizBorder: "#b58752",
    optionBg: "#F0F5E6",
    optionBorder: "#D6E3C7",
    optionText: "#6C584C",
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
    has_unclaimed?: boolean;
};

/* ---------- helpers for week ---------- */
const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const toYMDUTC = (d: Date) => d.toISOString().slice(0, 10); // YYYY-MM-DD (UTC)

const startOfWeekMonUTC = (d: Date) => {
    const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
    const wd = t.getUTCDay();          // Sun=0..Sat=6
    const diff = (wd + 6) % 7;         // Mon=0
    t.setUTCDate(t.getUTCDate() - diff);
    return t;
};

const addUTC = (d: Date, n: number) => {
    const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
    x.setUTCDate(x.getUTCDate() + n);
    return x;
};

function useHasMounted() {
    const [m, setM] = useState(false);
    useEffect(() => setM(true), []);
    return m;
}

/* ---------- UTC countdown to next day ---------- */
type UpdateMode = "minute" | "static";

function useMsToNextUtcMidnight(mode: UpdateMode = "minute") {
    const [ms, setMs] = React.useState(0);

    const tick = React.useCallback(() => {
        const now = new Date();
        const nextUtcMidnight = new Date(Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth(),
            now.getUTCDate() + 1
        ));
        setMs(nextUtcMidnight.getTime() - now.getTime());
    }, []);

    React.useEffect(() => {
        tick();

        if (mode === "static") {
            return;
        }

        const now = new Date();
        const delayToNextMinute =
            (60 - now.getUTCSeconds()) * 1000 - now.getUTCMilliseconds();

        const tId = window.setTimeout(() => {
            tick();
            const iId = window.setInterval(tick, 60_000);
            return () => clearInterval(iId);
        }, delayToNextMinute);

        return () => clearTimeout(tId);
    }, [mode, tick]);

    return ms;
}

function UtcCountdown({update = "minute" as UpdateMode}) {
    const ms = useMsToNextUtcMidnight(update);
    const total = Math.max(ms, 0);
    const h = Math.floor(total / 3_600_000);
    const m = Math.floor((total % 3_600_000) / 60_000);
    const hh = String(h).padStart(2, "0");
    const mm = String(m).padStart(2, "0");

    return (
        <div
            style={{margin: "4px 0 12px", fontSize: 12, color: "#7a6a56", textAlign: "center"}}
        >
            Next quiz in <strong>{hh}:{mm}</strong>
        </div>
    );
}

export default function DashboardClient() {
    const router = useRouter();
    const {user, authenticated, ready} = usePrivy();
    const hasMounted = useHasMounted();

    const [welcomeTried, setWelcomeTried] = useState(false);

    /* name anti-flicker */
    const [username, setUsername] = useState("");
    const [nameLoaded, setNameLoaded] = useState(false);

    const [mintModal, setMintModal] = useState<{ open: boolean; tokenId?: number }>({open: false});


    useEffect(() => {
        if (!hasMounted) return;
        const cached =
            sessionStorage.getItem("onb_username") ||
            localStorage.getItem("onb_username");
        if (cached) {
            setUsername(cached.replace(/^@/, "").trim());
            setNameLoaded(true);
        }
    }, [hasMounted]);

    useEffect(() => {
        if (!ready || !authenticated || !hasMounted) return;
        const privyId = user?.id;
        if (!privyId) return;
        (async () => {
            try {
                const r = await fetch(`/api/users/has-username?privy_id=${encodeURIComponent(privyId)}`, {cache: "no-store"});
                if (r.ok) {
                    const j = await r.json();
                    const name = String(j?.username || "").replace(/^@/, "").trim();
                    if (name) {
                        setUsername(name);
                        localStorage.setItem("onb_username", name);
                    }
                }
            } finally {
                setNameLoaded(true);
            }
        })();
    }, [ready, authenticated, user, hasMounted]);

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

    function openLink(url: string) {
        if (!url) return;
        const isTg = Boolean((window as any).Telegram?.WebApp);
        if (isTg) {
            window.open(url, "_blank");
        } else {
            window.open(url, "_blank", "noopener,noreferrer");
        }
    }

    return (
        <main className="page-inner">
            <style>{`
        @keyframes skeleton {
          0% { background-position: 100% 0; }
          100% { background-position: 0 0; }
        }
      `}</style>

            {/* greeting + profile */}
            <div style={{display: "flex", alignItems: "center", justifyContent: "space-between"}}>
                <h2 className="greeting">
                    {greetTitle},{" "}
                    {nameLoaded ? (username || "friend") : Skeleton}!
                </h2>
                <div className="header-wrap">
                    <button
                        type="button"
                        onClick={() => router.push("/profile")}
                        aria-label="Open profile"
                        title="Open profile"
                        className="img-button curious"
                    >
                        <img src="/profile/curious.png" alt="Open profile"/>
                    </button>
                </div>
            </div>

            {/* CALENDAR (real week) */}
            <CalendarWeek privyId={user?.id ?? ""} ready={ready && authenticated}/>

            {/* QUIZ  */}
            <QuizCard
                privyId={user?.id || ""}
                ready={ready && authenticated}
                onOpenMint={(tokenId) => setMintModal({open: true, tokenId})}
            />

            {/* Mint popup */}
            {mintModal.open && mintModal.tokenId && (
                <MintPopup
                    tokenId={mintModal.tokenId}
                    onClose={() => setMintModal({open: false})}
                    onView={() => {
                        setMintModal({open: false});
                        router.push(`/profile?new=${mintModal.tokenId}`);
                    }}
                />
            )}

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
            <h4 style={{marginTop: 24, color: "#95654D"}}>Explore Polygon Community</h4>
            <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12}}>
                <a onClick={() => openLink("https://obi-onboard.vercel.app/about")}
                   href="#"
                   style={{
                       padding: 24,
                       borderRadius: 16,
                       background: COLORS.cardBg,
                       textAlign: "center",
                       color: "#B0AC9A",
                       textDecoration: "none",
                       boxShadow: "0 2px 8px rgba(0,0,0,.06)",
                       height: "80px",
                   }}
                >
                    Grants
                </a>
                <a onClick={() => openLink("https://obi-onboard.vercel.app/about")}
                   href="#"
                   style={{
                       padding: 24,
                       borderRadius: 16,
                       background: COLORS.cardBg,
                       textAlign: "center",
                       color: "#B0AC9A",
                       textDecoration: "none",
                       boxShadow: "0 2px 8px rgba(0,0,0,.06)",
                       height: "80px",
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
function QuizCard({privyId, ready, onOpenMint}: {
    privyId: string;
    ready: boolean,
    onOpenMint: (tokenId: number) => void;
}) {
    const [loading, setLoading] = useState(true);
    const [state, setState] = useState<QuizState | null>(null);
    const [selected, setSelected] = useState<number | null>(null);
    const [banner, setBanner] = useState<"correct" | "wrong" | "locked" | "finished" | null>(null);
    const router = useRouter();
    const currentTokenId: number | null = state?.index == null ? null : state.index + 1;
    const [minting, setMinting] = useState(false);

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
                    setBanner(s.has_unclaimed ? "correct" : "locked");
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
                boxShadow: "0 2px 8px rgba(0,0,0,.06)",
                color: "#6c584c"
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
            setState(s => s ? {...s, locked: true, has_unclaimed: true} : s);
        } else if (j?.locked) {
            setBanner("locked");
            setState(s => s ? {...s, locked: true} : s);
        } else {
            setBanner("wrong");
        }
    }

    async function claim() {
        try {
            setMinting(true);
            const r = await fetch("/api/quiz/claim", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({privy_id: privyId}),
            });

            let j: any = null;
            try {
                j = await r.json();
            } catch {
            }

            if (!r.ok || !j?.token_id) {
                const msg = j?.detail || j?.error || "Claim failed";
                throw new Error(msg);
            }

            setMinting(false);

            try {
                const local = JSON.parse(localStorage.getItem("owned_tokens") || "[]");
                if (!local.includes(j.token_id)) {
                    local.push(j.token_id);
                    localStorage.setItem("owned_tokens", JSON.stringify(local));
                }
            } catch {
            }

            setState(s => (s ? {...s, has_unclaimed: false} : s));
            setBanner("locked");

            onOpenMint(j.token_id);
        } catch (e: any) {
            setMinting(false);
            alert(e?.message || "Claim failed");
        }
    }

    return (
        <>
            {state.locked && <UtcCountdown update="static"/>}
            <div style={{
                background: COLORS.cardBg,
                borderRadius: 16,
                padding: 16,
                boxShadow: "0 2px 8px rgba(0,0,0,.06)"
            }}>
                <h3 style={{margin: 0, color: "#95654D"}}>Quiz of the day:</h3>
                <p style={{margin: "8px 0 12px", color: "#6C584C"}}>{state.question}</p>

                <div style={{display: "grid", gap: 10, color: "#6C584C"}}>
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
                    <button
                        type="button"
                        disabled={currentTokenId == null || minting}
                        onClick={claim}
                        style={{
                            width: "100%",
                            marginTop: 10,
                            padding: "10px 12px",
                            borderRadius: 10,
                            background: "#dff3d9",
                            color: "#2f6b33",
                            fontWeight: 700,
                            border: "1px solid #bfe9b2",
                            cursor: "pointer",
                        }}
                    >
                        {minting ? "Minting…" : "You were right! Claim reward here"}
                    </button>
                )}
                {
                    banner === "wrong" && (
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
                    )
                }
                {
                    banner === "locked" && !state.has_unclaimed && (
                        <div style={{
                            marginTop: 10, padding: "10px 12px", borderRadius: 10,
                            background: "#dff3d9", color: "#2f6b33", textAlign: "center", fontWeight: 700,
                            width: "100%", border: "1px solid #bfe9b2",
                        }}>
                            You’ve already answered today
                        </div>
                    )
                }
            </div>
        </>
    )
        ;
}

/* ===========================
   Calendar Week
   =========================== */
function CalendarWeek({privyId, ready}: { privyId: string; ready: boolean }) {
    const [answered, setAnswered] = React.useState<Set<string>>(new Set());

    const today = new Date();
    const weekStart = startOfWeekMonUTC(today);
    const days: Date[] = Array.from({length: 7}, (_, i) => addUTC(weekStart, i));
    const from = toYMDUTC(days[0]);
    const to = toYMDUTC(days[6]);
    const todayYMD = toYMDUTC(today);

    React.useEffect(() => {
        if (!ready || !privyId) return;
        (async () => {
            const r = await fetch(
                `/api/quiz/week?privy_id=${encodeURIComponent(privyId)}&from=${from}&to=${to}`,
                {cache: "no-store"}
            );
            if (!r.ok) return;
            const j = await r.json();
            setAnswered(new Set<string>(j?.days ?? []));
        })();
    }, [ready, privyId, from, to]);

    return (
        <>
            <style>{`
  .cal {
    display:grid; grid-template-columns: repeat(7, minmax(0,1fr));
    gap:6px; margin:12px 0 16px;
  }
  .cal-day {
    position: relative;
    display:flex; flex-direction:column; align-items:center; justify-content:center;
    padding: 6px 2px;
    border-radius: 10px;
    text-align: center;
    line-height: 1.05;
    font-size: 12px;
    /* фон как SVG */
    background-repeat: no-repeat;
    background-position: center;
    background-size: 100% 100%;
    border: 0;
  }
  .cal-day .d { opacity: .95; font-size: 11px; }

  @media (max-width: 380px) {
    .cal { gap:4px; }
    .cal-day { padding: 5px 2px; border-radius: 8px; font-size: 10.5px; }
    .cal-day .d { font-size: 10px; }
  }
  @media (max-width: 340px) {
    .cal-day { font-size: 9.5px; }
    .cal-day .d { font-size: 9px; }
  }
`}</style>

            <div className="cal">
                {days.map((d, i) => {
                    const ymd = toYMDUTC(d);
                    const isToday = ymd === todayYMD;
                    const wasCorrect = answered.has(ymd);

                    const bgName = wasCorrect ? "answer_day" : (isToday ? "current_day" : "day");

                    const textColor = wasCorrect ? "#F0EAD2" : (isToday ? "#437338" : "#ADC178");

                    return (
                        <div
                            key={i}
                            className="cal-day"
                            title={`${ymd}${wasCorrect ? " • Answered" : ""}${isToday ? " • Today" : ""}`}
                            style={{
                                backgroundImage: `url(/dashboard/${bgName}.svg)`,
                                color: textColor,
                                fontWeight: 700
                            }}
                        >
                            <div>{dayNames[d.getUTCDay()]}</div>
                            <div className="d">{String(d.getUTCDate()).padStart(2, "0")}</div>
                        </div>
                    );
                })}
            </div>
        </>
    );
}
