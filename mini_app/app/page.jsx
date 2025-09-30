"use client";

import {useEffect, useMemo} from "react";
import {usePrivy} from "@privy-io/react-auth";

export default function Page() {
    const {ready, authenticated, user, logout} = usePrivy();

    useEffect(() => {
        let tries = 0;
        const maxTries = 20;
        const tick = () => {
            const tg = typeof window !== "undefined" ? window.Telegram?.WebApp : undefined;
            if (tg) {
                setTgDetected(true);
                try {
                    tg.ready();
                    tg.expand();
                } catch {
                }
                const id = tg.initData || "";
                setInitData(id);
                try {
                    setInitDataUnsafe(tg.initDataUnsafe ?? null);
                } catch {
                    setInitDataUnsafe(null);
                }
                if (id && typeof fetch !== "undefined") {
                    fetch("/api/verify-init-data", {
                        method: "POST",
                        headers: {"Content-Type": "application/json"},
                        body: JSON.stringify({initData: id})
                    })
                        .then(r => r.json())
                        .then(setVerifyResult)
                        .catch(err => setVerifyResult({ok: false, reason: String(err)}));
                }
            } else if (tries++ < maxTries) {
                setTimeout(tick, 150);
            }
        };
        tick();
    }, []);

    const statusPrivy = useMemo(() => {
        if (!ready) return {cls: "wait", text: "Loading…"};
        if (authenticated) return {cls: "ok", text: "Success"};
        return {cls: "fail", text: "Not authenticated"};
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
                {ready && !authenticated && (
                    <p>
                        <small>
                            If this is opened outside of the Telegram WebApp, enable Telegram
                            login in the Privy Dashboard and use a sign-in button on a separate
                            page.
                        </small>
                    </p>
                )}
                {authenticated && (
                    <>
                        <h3>Privy user data</h3>
                        <pre>
            {JSON.stringify(
                {
                    privy_user_id: user?.id,
                    telegram: user?.telegram,
                },
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
