"use client";
import { useEffect, useRef, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";

function sanitizeName(s?: string | null) {
  return (s ?? "");
}

export default function Done() {
  const { user, authenticated, ready } = usePrivy();

  const [displayName, setDisplayName] = useState<string>("");
  const [submitted, setSubmitted] = useState(false);
  const postedRef = useRef(false);

  useEffect(() => {
    if (!ready || !authenticated) return;

    const fromStorage = sanitizeName(
      localStorage.getItem("onb_username") ||
      sessionStorage.getItem("onb_username")
    );
    if (fromStorage) {
      setDisplayName(fromStorage);
      return;
    }

    const privyId = user?.id;
    if (!privyId) return;

    (async () => {
      try {
        const r = await fetch(`/api/users/has-username?privy_id=${encodeURIComponent(privyId)}`, { cache: "no-store" });
        const j = r.ok ? await r.json() : null;
        const name = sanitizeName(j?.username);
        if (name) {
          setDisplayName(name);
          sessionStorage.setItem("onb_username", name);
          localStorage.setItem("onb_username", name);
        }
      } catch {
      }
    })();
  }, [ready, authenticated, user]);

  useEffect(() => {
    if (!ready || !authenticated || postedRef.current) return;

    const privy_id = user?.id;
    const topicsRaw = sessionStorage.getItem("onb_topics");
    const name = sanitizeName(
      sessionStorage.getItem("onb_username") || localStorage.getItem("onb_username")
    );

    if (!privy_id || !name || !topicsRaw) return;

    (async () => {
      postedRef.current = true;
      const topics = JSON.parse(topicsRaw || "{}");

      const r = await fetch("/api/users/onboarding-complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ privy_id, username: name, topics }),
      });

      setSubmitted(r.ok);
      sessionStorage.removeItem("onb_topics");
    })();
  }, [ready, authenticated, user]);

  return (
    <main style={{ padding: 16, textAlign: "center" }}>
      <h2>You’re all set, {displayName}</h2>
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