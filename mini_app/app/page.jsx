"use client";
import { useEffect, useMemo, useRef } from "react";
import { usePrivy } from "@privy-io/react-auth";

export default function Page() {
  const { ready, authenticated, user, logout } = usePrivy();
  const postedRef = useRef(false);

  useEffect(() => {
    if (!ready || !authenticated || postedRef.current) return;

    const tgId = user?.telegram?.telegramUserId;
    const privyId = user?.id;

    if (tgId && privyId) {
      postedRef.current = true;

      fetch(`${process.env.API_URL}/users/insert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telegram_id: tgId, privy_id: privyId }),
      }).catch((e) => {
        console.warn("users/insert failed:", e);
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