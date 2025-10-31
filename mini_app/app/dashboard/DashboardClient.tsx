"use client";
import React, {useEffect, useState} from "react";
import {usePrivy} from "@privy-io/react-auth";
import {useRouter} from "next/navigation";
import MintPopup from "../components/MintPopup";

/* ---------- palette for good contrast ---------- */
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
    cta2Bg: "#859E4F",
    ctaText: "#ffffff",
};

const QUIZ_ASSETS = {
    bg: "/dashboard/dashboard.png",
    radio_default: "/dashboard/radio_default.svg",
    radio_right: "/dashboard/radio_right.svg",
    radio_wrong: "/dashboard/radio_wrong.svg",
};

// цвета по ТЗ
const QUIZ_COLORS = {
    textDefault: "#6C584C",
    textRight: "#437338",
    textWrong: "#8D2F2F",
    btnRight: "#A7C470",
    btnWrong: "#8D2F2F",
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

    const [mintModal, setMintModal] = useState<{ open: boolean; tokenId?: number, image?: string; }>({open: false});


    useEffect(() => {
        if (!hasMounted) return;
        const cached =
            sessionStorage.getItem("onb_username") ||
            localStorage.getItem("onb_username");
        if (cached) {
            setUsername(cached);
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
            <div style={{display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 10,}}>
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
                onOpenMint={(tokenId) => setMintModal({open: true, tokenId, image: `/assets/nfts/${tokenId}.png`})}
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
                    image={mintModal.image}
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
                    marginBottom: "3rem",
                }}
            >
                Ask a question
            </a>

            {/* Explore */}
            <h4 style={{color: "#95654D"}}>Explore Polygon Community</h4>
            <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12}}>
                <a onClick={() => openLink("https://polygon.technology/ecosystem")}
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
                       justifyContent: "center",
                       display: "flex",
                       alignItems: "center",
                   }}
                >
                    dApps
                </a>
                <a onClick={() => openLink("https://polygon.technology/community")}
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
                       justifyContent: "center",
                       display: "flex",
                       alignItems: "center",
                       marginBottom: "2rem",
                   }}
                >
                    Community Hub
                </a>
            </div>

            {/* Still lost */}
            <h4 style={{color: "#95654D"}}>Still lost?</h4>
            <a
                onClick={() => openLink("https://t.me/OBIonboardAI")}
                style={{
                    display: "block",
                    textAlign: "center",
                    marginTop: 16,
                    padding: 14,
                    borderRadius: 12,
                    background: COLORS.cta2Bg,
                    color: COLORS.ctaText,
                    textDecoration: "none",
                }}
            >
                Talk to an expert
            </a>
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
                <p style={{margin: 0}}>Loading…</p>
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
    const [answering, setAnswering] = useState(false);

    async function choose(i: number) {
        if (disabled || answering) return;
        setSelected(i);
        setAnswering(true);
        try {
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
        } catch (e) {
            alert("Network error. Try again.");
            setSelected(null);
        } finally {
            setAnswering(false);
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
            <div
                style={{
                    borderRadius: 16,
                    padding: 16,
                    backgroundImage: `url(${QUIZ_ASSETS.bg})`,
                    backgroundRepeat: "no-repeat",
                    backgroundSize: "100% 100%",

                }}>
                <div
                    style={{
                        padding: 16,
                        marginTop: 16,
                    }}>
                    <h3 style={{margin: 0, color: "#95654D"}}>Quiz of the day:</h3>
                    <p style={{margin: "8px 0 12px", color: "#6C584C"}}>{state.question}</p>

                    <div>
                        {(state.options || []).map((opt, i) => {
                            const isSelected = selected === i;

                            const radioName =
                                banner === "correct" && isSelected ? "radio_right" :
                                    banner === "wrong" && isSelected ? "radio_wrong" :
                                        "radio_default";

                            const rowColor =
                                banner === "correct" && isSelected ? QUIZ_COLORS.textRight :
                                    banner === "wrong" && isSelected ? QUIZ_COLORS.textWrong :
                                        QUIZ_COLORS.textDefault;

                            const clickable = !(state.locked || banner === "correct" || banner === "wrong" || answering);

                            return (
                                <div
                                    key={i}
                                    role="radio"
                                    aria-checked={isSelected}
                                    tabIndex={clickable ? 0 : -1}
                                    onPointerUp={(e) => {
                                        if (clickable) choose(i);
                                    }}
                                    onKeyDown={(e) => {
                                        if (clickable && (e.key === "Enter" || e.key === " ")) {
                                            e.preventDefault();
                                            choose(i);
                                        }
                                    }}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 10,
                                        cursor: clickable ? "pointer" : "default",
                                        color: rowColor,
                                        fontWeight: 500,
                                        padding: "6px 2px",
                                        userSelect: "none",
                                        outline: isSelected && !banner ? "2px solid #6B8749" : "none",
                                        outlineOffset: 2,
                                        borderRadius: 8,
                                        opacity: answering && isSelected ? 0.8 : 1,
                                    }}
                                >
                                  <span
                                      aria-hidden
                                      style={{
                                          flex: "0 0 18px",
                                          width: 18, height: 18,
                                          backgroundImage: `url(${QUIZ_ASSETS[radioName as keyof typeof QUIZ_ASSETS]})`,
                                          backgroundRepeat: "no-repeat",
                                          backgroundSize: "100% 100%",
                                          display: "inline-block",
                                          transform: isSelected && !banner ? "scale(1.06)" : "none",
                                      }}
                                  />
                                    <span>{opt}</span>
                                </div>
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
                                marginTop: 12,
                                padding: "12px 14px",
                                borderRadius: 12,
                                background: QUIZ_COLORS.btnRight,
                                color: "#F5F3F3",
                                fontWeight: 700,
                                border: "none",
                                cursor: currentTokenId == null || minting ? "default" : "pointer",
                            }}
                        >
                            {minting ? "Minting…" : "You were right! Claim reward here"}
                        </button>
                    )}
                    {banner === "wrong" && (
                        <button
                            type="button"
                            onClick={handleTryAgain}
                            style={{
                                width: "100%",
                                marginTop: 12,
                                padding: "12px 14px",
                                borderRadius: 12,
                                background: QUIZ_COLORS.btnWrong,
                                color: "#F5F3F3",
                                fontWeight: 700,
                                border: "none",
                                cursor: "pointer",
                            }}
                        >
                            Wrong answer, try again
                        </button>
                    )}
                    {banner === "locked" && !state.has_unclaimed && (
                        <div
                            style={{
                                marginTop: 12,
                                padding: "12px 14px",
                                borderRadius: 12,
                                background: "#E7F0DB",
                                color: QUIZ_COLORS.textRight,
                                textAlign: "center",
                                fontWeight: 700,
                                width: "100%",
                            }}
                        >
                            You’ve already answered today
                        </div>
                    )}
                </div>
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
    const [offset, setOffset] = React.useState<number>(0);

    const today = new Date();
    const base = addUTC(today, offset * 7);
    const weekStart = startOfWeekMonUTC(base);
    const days: Date[] = Array.from({length: 7}, (_, i) => addUTC(weekStart, i));
    const from = toYMDUTC(days[0]);
    const to = toYMDUTC(days[6]);
    const todayYMD = toYMDUTC(today);

    const label = offset === -1 ? "Last week" : offset === 0 ? "This week" : "Next week";

    useEffect(() => {
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
  .cal-nav {
          display:flex; align-items:center; justify-content:space-between;
          margin: 8px 0 6px; color:#6C584C;
        }
    .cal-nav .btn {
      border:0; border-radius:10px; padding:6px 10px; line-height:1;
      background:#f4efdf; color:#6C584C; cursor:pointer;
    }
    .cal-nav .btn:disabled { opacity:.4; cursor:default; }
    
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
    font-size: 10px;
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
            <div className="cal-nav">
                <button
                    type="button"
                    className="btn"
                    onClick={() => setOffset(o => Math.max(-1, o - 1))}
                    disabled={offset <= -1}
                    aria-label="Previous week"
                    title="Previous week"
                >
                    {"<"}
                </button>

                <div style={{fontWeight: 600}}>{label}</div>

                <button
                    type="button"
                    className="btn"
                    onClick={() => setOffset(o => Math.min(1, o + 1))}
                    disabled={offset >= 1}
                    aria-label="Next week"
                    title="Next week"
                >
                    {">"}
                </button>
            </div>

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
