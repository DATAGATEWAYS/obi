"use client";
import {useEffect, useState} from "react";
import {usePrivy} from "@privy-io/react-auth";
import {useRouter} from "next/navigation";

const router = useRouter();

function titleByHour(h: number) {
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
}

function sanitize(s?: string | null) {
    return (s ?? "").replace(/^@/, "").trim();
}

export default function Dashboard() {
    const {user, authenticated, ready} = usePrivy();
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
                background:
                    "linear-gradient(90deg, #eee 25%, #f6f6f6 37%, #eee 63%)",
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

            {/* calendar dummie */}
            <div style={{display: "flex", gap: 8, margin: "12px 0 16px"}}>
                {["Mon 18", "Tue 19", "Wed 20", "Fri 22", "Sat 23", "Sun 24"].map((d) => (
                    <div key={d}
                         style={{
                             padding: "6px 10px",
                             borderRadius: 12,
                             background: "#f3eed6",
                             color: "#7a6a56",
                             fontSize: 12
                         }}>{d}</div>
                ))}
            </div>

            {/* Quiz card */}
            <div style={{background: "#fff", borderRadius: 16, padding: 16, boxShadow: "0 2px 8px rgba(0,0,0,.06)"}}>
                <h3 style={{margin: 0, color: "#6d7d4f"}}>Quiz of the day:</h3>
                <p style={{margin: "8px 0 12px"}}>What is a crypto wallet used for?</p>
                <ul style={{listStyle: "none", padding: 0, margin: 0, color: "#5b584f"}}>
                    <li>○ To store and manage your crypto assets</li>
                    <li>○ To print out paper cash</li>
                    <li>○ To connect your phone to Wi-Fi</li>
                </ul>
            </div>

            <a href="/chat"
               style={{
                   display: "block",
                   textAlign: "center",
                   marginTop: 16,
                   padding: 14,
                   borderRadius: 12,
                   background: "#2f6b33",
                   color: "#fff",
                   textDecoration: "none"
               }}>
                Ask a question
            </a>

            <h4 style={{marginTop: 24, color: "#7a6a56"}}>Explore Polygon Community</h4>
            <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12}}>
                <a href="#" style={{
                    padding: 24,
                    borderRadius: 16,
                    background: "#fff",
                    textAlign: "center",
                    color: "#6d7d4f",
                    textDecoration: "none",
                    boxShadow: "0 2px 8px rgba(0,0,0,.06)"
                }}>Grants</a>
                <a href="#" style={{
                    padding: 24,
                    borderRadius: 16,
                    background: "#fff",
                    textAlign: "center",
                    color: "#6d7d4f",
                    textDecoration: "none",
                    boxShadow: "0 2px 8px rgba(0,0,0,.06)"
                }}>dApps</a>
            </div>
        </main>
    );
}