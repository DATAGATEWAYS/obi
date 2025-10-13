"use client";
import React, {useEffect, useState} from "react";
import {usePrivy} from "@privy-io/react-auth";
import {useRouter} from "next/navigation";
import s from "../profileTest/page.module.css";

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
        <main className="page-inner">
            <style>{`
        @keyframes skeleton {
          0% { background-position: 100% 0; }
          100% { background-position: 0 0; }
        }
      `}</style>

            <div style={{display: "flex", alignItems: "center", justifyContent: "space-between"}}>
                <h2 style={{color: "#859E4F", fontWeight: 700, margin: 0}}>
                    {greetTitle},{" "}
                    {nameLoaded ? (username || "friend") : Skeleton}!
                </h2>
                <img
                    className="curious-icon"
                    src="/profile/curious.png"
                    alt="Open profile"
                    onClick={() => router.push("/dashboard")}
                />
            </div>

            {/* turtle back*/}
            <div className="shell-sticker">
                <img className="vector" alt="Vector" src="/profile/Vector%201.png"/>
                <img className="img" alt="Group" src="/profile/Group%203.png"/>
                <img className="group-2" alt="Group 28" src="/profile/Group%2028.svg"/>
                <img className="group-3" alt="Group 29" src="/profile/Group%2029.svg"/>
            </div>

            {/* Account Settings */}
            <h4 style={{marginTop: 24, color: "#95654D"}}>Account Settings</h4>
            <button
                onClick={() => router.push("/onboarding/username?edit=1")}
                style={{
                    width: "100%",
                    textAlign: "left",
                    padding: 16,
                    borderRadius: 16,
                    background: "#f4efdf",
                    border: 0,
                    marginBottom: 12,
                    color: "#6C584C"
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
                    cursor: "default",
                    color: "#6C584C"
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
            <h4 style={{marginTop: 24, color: "#95654D"}}>Other</h4>
            <div style={{display: "grid", gap: 12, color: "#6c584c"}}>
                <button
                    onClick={() => router.push("/dashboard")}
                    style={{
                        width: "100%",
                        textAlign: "left",
                        padding: 16,
                        borderRadius: 16,
                        background: "#f4efdf",
                        border: 0,
                        color: "#6C584C"
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
                        color: "#6C584C"
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
                        border: 0,
                        color: "#6C584C"
                    }}
                >
                    Log out
                </button>

                <button
                    onClick={() => router.push("/profileTest")}
                    style={{
                        width: "100%",
                        textAlign: "left",
                        padding: 16,
                        borderRadius: 16,
                        background: "#f4efdf",
                        border: 0,
                        color: "#6C584C"
                    }}
                >
                    Go to profileTest
                </button>
            </div>
        </main>
    );
}