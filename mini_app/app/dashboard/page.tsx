"use client";
import { useEffect, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";

function titleByHour(h: number) {
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}
function sanitize(s?: string | null) {
  return (s ?? "").replace(/^@/, "").trim();
}

export default function Dashboard() {
  const { user, authenticated, ready } = usePrivy();
  const [username, setUsername] = useState<string>("");

  // берём ник: sessionStorage → localStorage → бек
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
        const r = await fetch(`/api/users/has-username?privy_id=${encodeURIComponent(privyId)}`, { cache: "no-store" });
        if (!r.ok) return;
        const j = await r.json();
        const name = sanitize(j?.username);
        if (name) {
          setUsername(name);
          // кэшируем, чтобы в следующий вход было мгновенно
          localStorage.setItem("onb_username", name);
        } else {
          // если вдруг не прошёл онбординг — уводим в него
          window.location.href = "/onboarding/username";
        }
      } catch {}
    })();
  }, [ready, authenticated, user]);

  const greetTitle = titleByHour(new Date().getHours());

  return (
    <main style={{ padding: 16, maxWidth: 420, margin: "0 auto" }}>
      <h2 style={{color: "#6d7d4f", fontWeight: 700}}>
        {greetTitle},{" "}
        <a
            href="/profile"
            style={{color: "#6d7d4f", textDecoration: "underline", cursor: "pointer"}}
            title="Open profile"
        >
          {username || "friend"}
        </a>
        !
      </h2>

      {/* calendar dummie */}
      <div style={{display: "flex", gap: 8, margin: "12px 0 16px"}}>
        {["Mon 18", "Tue 19", "Wed 20", "Fri 22", "Sat 23", "Sun 24"].map((d) => (
            <div key={d}
                 style={{padding: "6px 10px", borderRadius: 12, background: "#f3eed6", color: "#7a6a56", fontSize: 12 }}>{d}</div>
        ))}
      </div>

      {/* Quiz card */}
      <div style={{ background: "#fff", borderRadius: 16, padding: 16, boxShadow: "0 2px 8px rgba(0,0,0,.06)" }}>
        <h3 style={{ margin: 0, color: "#6d7d4f" }}>Quiz of the day:</h3>
        <p style={{ margin: "8px 0 12px" }}>What is a crypto wallet used for?</p>
        <ul style={{ listStyle: "none", padding: 0, margin: 0, color: "#5b584f" }}>
          <li>○ To store and manage your crypto assets</li>
          <li>○ To print out paper cash</li>
          <li>○ To connect your phone to Wi-Fi</li>
        </ul>
      </div>

      <a href="/chat"
         style={{ display: "block", textAlign: "center", marginTop: 16, padding: 14, borderRadius: 12, background: "#2f6b33", color: "#fff", textDecoration: "none" }}>
        Ask a question
      </a>

      <h4 style={{ marginTop: 24, color: "#7a6a56" }}>Explore Polygon Community</h4>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <a href="#" style={{ padding: 24, borderRadius: 16, background: "#fff", textAlign: "center", color: "#6d7d4f", textDecoration: "none", boxShadow: "0 2px 8px rgba(0,0,0,.06)" }}>Grants</a>
        <a href="#" style={{ padding: 24, borderRadius: 16, background: "#fff", textAlign: "center", color: "#6d7d4f", textDecoration: "none", boxShadow: "0 2px 8px rgba(0,0,0,.06)" }}>dApps</a>
      </div>
    </main>
  );
}