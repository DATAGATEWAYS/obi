"use client";
import { useEffect, useMemo, useRef } from "react";
import { usePrivy } from "@privy-io/react-auth";

export default function Page() {
  const { ready, authenticated, user, logout } = usePrivy();
  const postedRef = useRef(false);

  useEffect(() => {
  if (!ready || !authenticated || postedRef.current) return;

  const tgId = user?.telegram?.telegram_user_id ?? user?.telegram?.telegramUserId;
  const tgUsername = user?.telegram?.username;
  const privyId = user?.id;
  const API_URL = process.env.NEXT_PUBLIC_AI_API_URL;

  if (!API_URL) return;

  if (tgId && privyId) {
    postedRef.current = true;

    fetch(`${API_URL}/users/insert`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ telegram_username: tgUsername, telegram_id: tgId, privy_id: privyId }),
    })
      .then(async (r) => {
        const txt = await r.text().catch(() => "");
        if (!r.ok) throw new Error(`HTTP ${r.status}: ${txt}`);
      })
      .catch((e) => {
        postedRef.current = false;
      });
  }
}, [ready, authenticated, user]);

  const statusPrivy = useMemo(() => {
    if (!ready) return { cls: "wait", text: "Loading…" };
    if (authenticated) return { cls: "ok", text: "Success" };
    return { cls: "fail", text: "Not authenticated" };
  }, [ready, authenticated]);

  return (
    <div className="container">
      <div className="card">
        <h1>Privy × Telegram Mini App</h1>
        <p>
          Next.js + React + PrivyProvider template. Open from your bot as{" "}
          <code>web_app</code> — login will happen automatically (seamless).
        </p>
      </div>

      <div className="card">
        <h2>
          Privy status:&nbsp;
          <span className={`status ${statusPrivy.cls}`}>{statusPrivy.text}</span>
        </h2>

        {authenticated && (
          <>
            <h3>Privy user data</h3>
            <pre>
              {JSON.stringify(
                { privy_user_id: user?.id, telegram: user?.telegram },
                null,
                2
              )}
            </pre>
            <button onClick={logout}>Log out</button>
          </>
        )}
      </div>
    </div>
  );
}