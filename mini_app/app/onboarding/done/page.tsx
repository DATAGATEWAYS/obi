"use client";
import { useEffect, useRef, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";

export default function Done() {
  const postedRef = useRef(false);
  const { user, authenticated, ready } = usePrivy();
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!ready || !authenticated || postedRef.current) return;

    const privy_id = user?.id;
    const username = sessionStorage.getItem("onb_username") || "";
    const topics = JSON.parse(sessionStorage.getItem("onb_topics") || "{}");

    if (!privy_id || !username) return;

    (async () => {
      postedRef.current = true;
      const r = await fetch("/api/users/onboarding-complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ privy_id, username, topics }),
      });
      setSubmitted(r.ok);
      sessionStorage.removeItem("onb_username");
      sessionStorage.removeItem("onb_topics");
    })();
  }, [ready, authenticated, user]);

  return (
    <main style={{ padding: 16, textAlign: "center" }}>
      <h2>You’re all set, user</h2>
      <p>You’re ready to explore! Obi can answer your questions anytime.</p>
      <img src="/turtle.png" alt="" style={{ width: 160, margin: "24px auto" }} />
      <div style={{ display: "grid", gap: 12 }}>
        <a href="/chat" style={{ padding: 14, borderRadius: 10, background: "#2f6b33", color: "#fff" }}>
          Ask Obi your first question
        </a>
        <a href="/dashboard" style={{ padding: 14, borderRadius: 10, background: "#f2f2f2" }}>
          Explore dashboard
        </a>
      </div>
      {!submitted && <p style={{ marginTop: 12, opacity: .7 }}>Saving your preferences…</p>}
    </main>
  );
}
