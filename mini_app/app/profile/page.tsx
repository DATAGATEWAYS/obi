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
    const [username, setUsername] = useState("");
    const router = useRouter();

    useEffect(() => {
        if (!ready || !authenticated) return;

        const fromStorage =
            sanitize(sessionStorage.getItem("onb_username")) ||
            sanitize(localStorage.getItem("onb_username"));
        if (fromStorage) {
            setUsername(fromStorage);
            return;
        }
        const privyId = user?.id;
        if (!privyId) return;

        (async () => {
            try {
                const r = await fetch(`/api/users/has-username?privy_id=${encodeURIComponent(privyId)}`, {cache: "no-store"});
                if (!r.ok) return;
                const j = await r.json();
                const name = sanitize(j?.username);
                if (name) {
                    setUsername(name);
                    localStorage.setItem("onb_username", name);
                } else {
                    router.replace("/onboarding/username");
                }
            } catch {
            }
        })();
    }, [ready, authenticated, user, router]);

    const greet = `${titleByHour(new Date().getHours())}, ${username || "friend"}!`;

    return (
        <main style={{padding: 16, maxWidth: 420, margin: "0 auto"}}>
            <div style={{display: "flex", alignItems: "center", justifyContent: "space-between"}}>
                <h2 style={{color: "#6d7d4f", fontWeight: 700, margin: 0}}>{greet}</h2>
                <div aria-hidden style={{fontSize: 28}}>🕶️</div>
            </div>

            {/* turtle back */}
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
                onClick={() => router.push("/onboarding/username")}
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
                onClick={() => alert("Language picker TBD")}
                style={{
                    width: "100%",
                    textAlign: "left",
                    padding: 16,
                    borderRadius: 16,
                    background: "#f4efdf",
                    border: 0
                }}
            >
                Language
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