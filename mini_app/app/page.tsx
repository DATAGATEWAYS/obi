"use client";
import React, {useEffect, useMemo, useRef} from "react";
import {usePrivy} from "@privy-io/react-auth";
import {useRouter} from "next/navigation";

export default function Page() {
    const {ready, authenticated, user} = usePrivy();
    const postedRef = useRef(false);
    const router = useRouter();

    useEffect(() => {
        if (!ready || !authenticated || postedRef.current) return;

        const tgId = user?.telegram?.telegramUserId;
        const tgUsername = user?.telegram?.username || null;
        const privyId = user?.id ?? null;
        if (!tgId || !privyId) return;

        (async () => {
            postedRef.current = true;
            // 1) insert user
            const r1 = await fetch(`/api/users/insert`, {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({telegram_username: tgUsername, telegram_id: tgId, privy_id: privyId}),
            });
            if (!r1.ok) {
                postedRef.current = false;
                return;
            }

            // 2) check username
            const r2 = await fetch(`/api/users/has-username?privy_id=${encodeURIComponent(privyId)}`, {cache: "no-store"});
            const j2 = r2.ok ? await r2.json() : {has: false};
            if (!j2.has) {
                const prefillName = (tgUsername ?? "");
                if (prefillName) {
                    sessionStorage.setItem("onb_username", prefillName);
                }
                router.replace("/onboarding/username");
            } else {
                // all good - go to dashboard
                router.replace("/dashboard");
            }
        })();
    }, [ready, authenticated, user, router]);

    const statusPrivy = useMemo(() => {
        if (!ready) return {cls: "wait", text: "Loading…"};
        if (authenticated) return {cls: "ok", text: "Success"};
        return {cls: "fail", text: "Not authenticated"};
    }, [ready, authenticated]);

    return <div className="welcome-screen">
        <img
            className="background-image"
            alt="Background image"
            src="welcome/welcome_background_image.svg"
        />
        <div className="">Privy status: {statusPrivy.text}</div>

        <div className="btn">
            <div className="btn-text">
                <div className="text-wrapper">Log in with Privy</div>

                <img
                    className="privy-symbol"
                    alt="Privy symbol"
                    src="/welcome/privy_symbol.png"
                />
            </div>
        </div>

        <img
            className="turtle"
            src="welcome/obi_turtle.svg"
            alt="turtle"/>

        <img
            className="logo"
            src="welcome/obi_logo.svg"
            alt="logo"/>

        <p className="learn-crypto-slow">
            learn crypto slow and steady
            <br/>
            with
        </p>
    </div>;
}