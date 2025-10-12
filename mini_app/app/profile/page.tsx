"use client";
import {useEffect, useState} from "react";
import {usePrivy} from "@privy-io/react-auth";
import {useRouter} from "next/navigation";

function sanitize(s?: string | null) {
    return (s ?? "").replace(/^@/, "").trim();
}

function titleByHour(h: number) {
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
}

export default function Profile() {
    const {user, authenticated, ready, logout} = usePrivy() as any;
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
    const router = useRouter();

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
                    } else {
                        router.replace("/onboarding/username");
                        return;
                    }
                }
            } finally {
                setNameLoaded(true);
            }
        })();
    }, [ready, authenticated, user, nameLoaded, router]);

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
        <main className="tg-safe page-inner">
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
                <div aria-hidden style={{fontSize: 28}}>🕶️</div>
            </div>

            {/* turtle back*/}
            <div
                style={{
                    marginTop: 16,
                    background: "#9fbc78",
                    height: 220,
                    borderRadius: 24,
                    clipPath:
                        "polygon(20% 0, 80% 0, 100% 20%, 100% 80%, 80% 100%, 20% 100%, 0 80%, 0 20%)",
                    position: "relative",
                    boxShadow: "inset 0 0 0 6px rgba(0,0,0,0.05)",
                }}
            >
                <div
                    style={{
                        position: "absolute",
                        top: 26,
                        left: 26,
                        background: "#d9c1ef",
                        color: "#5a3f75",
                        borderRadius: 16,
                        padding: "10px 12px",
                        fontSize: 12,
                        fontWeight: 600,
                    }}
                >
                    question asked
                </div>
                <div
                    style={{
                        position: "absolute",
                        right: 32,
                        top: 84,
                        background: "#c7d3ff",
                        color: "#3851a3",
                        borderRadius: 16,
                        padding: "10px 12px",
                        fontSize: 12,
                        fontWeight: 600,
                    }}
                >
                    quiz
                </div>
            </div>

            {/* Account Settings */}
            <h4 style={{marginTop: 24, color: "#7a6a56"}}>Account Settings</h4>
            <button
                onClick={() => router.push("/onboarding/username?edit=1")}
                style={{
                    width: "100%",
                    textAlign: "left",
                    padding: 16,
                    borderRadius: 16,
                    background: "#f4efdf",
                    border: 0,
                    marginBottom: 12
                }}
            >
                Username
            </button>
            <button
                disabled
                style={{
                    width: "100%",
                    textAlign: "left",
                    padding: 16,
                    borderRadius: 16,
                    background: "#f4efdf",
                    border: 0,
                    position: "relative",
                    opacity: 0.6,
                }}
                aria-disabled="true"
            >
                Language
                <img
                    src="/assets/badges/soon.svg"
                    alt="Soon"
                    style={{
                        position: "absolute",
                        right: 12,
                        top: "50%",
                        transform: "translateY(-50%)",
                        height: 20,
                        pointerEvents: "none",
                        userSelect: "none",
                    }}
                />
            </button>

            {/* Other */}
            <h4 style={{marginTop: 24, color: "#7a6a56"}}>Other</h4>
            <button
                onClick={() => router.push("/dashboard")}
                style={{
                    width: "100%",
                    textAlign: "left",
                    padding: 16,
                    borderRadius: 16,
                    background: "#f4efdf",
                    border: 0,
                    marginBottom: 12
                }}
            >
                To dashboard
            </button>
            <button
                onClick={() => alert("What is Obi? TBD")}
                style={{
                    width: "100%",
                    textAlign: "left",
                    padding: 16,
                    borderRadius: 16,
                    background: "#f4efdf",
                    border: 0,
                    marginBottom: 12
                }}
            >
                What is Obi?
            </button>
            <button
                onClick={() => logout?.()}
                style={{
                    width: "100%",
                    textAlign: "left",
                    padding: 16,
                    borderRadius: 16,
                    background: "#f4efdf",
                    border: 0
                }}
            >
                Log out
            </button>
        </main>
    );
}