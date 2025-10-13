"use client";
import {useEffect, useRef, useState} from "react";
import {usePrivy} from "@privy-io/react-auth";
import {useCreateWallet, useWallets} from "@privy-io/react-auth";

function sanitize(s?: string | null) {
    return (s ?? "").replace(/^@/, "").trim();
}

export default function Done() {
    const {user, authenticated, ready} = usePrivy();
    const {wallets, ready: walletsReady} = useWallets();

    const [displayName, setDisplayName] = useState("");
    const [address, setAddress] = useState("");
    const postedWalletRef = useRef(false);
    const creatingRef = useRef(false);
    const postedOnboardingRef = useRef(false);

    async function upsertWalletOnce(payload: any) {
        if (postedWalletRef.current) return;
        postedWalletRef.current = true;
        try {
            await fetch("/api/wallets/insert", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify(payload),
            });
        } catch (e) {
            postedWalletRef.current = false;
            console.error(e);
        }
    }

    useEffect(() => {
        if (!ready || !authenticated) return;

        const fromStorage = sanitize(
            sessionStorage.getItem("onb_username") || localStorage.getItem("onb_username")
        );
        if (fromStorage) {
            setDisplayName(fromStorage);
            return;
        }
        const privyId = user?.id;
        if (!privyId) return;

        (async () => {
            const r = await fetch(`/api/users/has-username?privy_id=${encodeURIComponent(privyId)}`, {cache: "no-store"});
            if (!r.ok) return;
            const j = await r.json();
            const name = sanitize(j?.username);
            if (name) {
                setDisplayName(name);
                sessionStorage.setItem("onb_username", name);
                localStorage.setItem("onb_username", name);
            }
        })();
    }, [ready, authenticated, user]);

    useEffect(() => {
        if (!ready || !authenticated || postedOnboardingRef.current) return;

        const privy_id = user?.id;
        const topicsRaw = sessionStorage.getItem("onb_topics");
        const name = sanitize(sessionStorage.getItem("onb_username") || localStorage.getItem("onb_username"));

        if (!privy_id || !name || !topicsRaw) return;

        (async () => {
            postedOnboardingRef.current = true;
            const topics = JSON.parse(topicsRaw || "{}");
            await fetch("/api/users/onboarding-complete", {
                method: "POST", headers: {"Content-Type": "application/json"},
                body: JSON.stringify({privy_id, username: name, topics}),
            });
            sessionStorage.removeItem("onb_topics");
            sessionStorage.removeItem("onb_username");
        })();
    }, [ready, authenticated, user]);

    const [creating, setCreating] = useState(false);
    const {createWallet} = useCreateWallet({
        onSuccess: async ({wallet}) => {
            setCreating(false);
            setAddress(wallet.address);
            await upsertWalletOnce({
                privy_id: user?.id,
                wallet_id: wallet.id,
                chain_type: "ethereum",
                address: wallet.address,
                is_embedded: wallet.walletClientType === "privy",
                is_primary: true,
            });
        },
        onError: (e) => {
            setCreating(false);
            console.error("createWallet failed:", e);
        },
    });

    useEffect(() => {
        if (!ready || !authenticated || !walletsReady) return;

        const existing =
            wallets.find((w) => w.walletClientType === "privy") ?? wallets[0];

        if (existing) {
            setAddress(existing.address);
            upsertWalletOnce({
                privy_id: user?.id,
                wallet_id: (existing as any).id ?? null,
                chain_type: "ethereum",
                address: existing.address,
                is_embedded: existing.walletClientType === "privy",
                is_primary: true,
            });
            return;
        }

        if (!creatingRef.current) {
            creatingRef.current = true;
            setCreating(true);
            createWallet();
        }
    }, [ready, authenticated, walletsReady, wallets, createWallet, user?.id]);

    return (
        <main className="page-inner">
            <h2>You’re all set{displayName ? `, ${displayName}` : ""}</h2>

            <p style={{marginTop: 8}}>
                Your wallet address:&nbsp;
                <strong>{address || (creating ? "Creating…" : "—")}</strong>
            </p>

            <p>You’re ready to explore! Obi can answer your questions anytime.</p>

            <img src="/turtle.png" alt="" style={{width: 160, margin: "24px auto"}}/>

            <div style={{display: "grid", gap: 12}}>
                <a href="/chat" style={{padding: 14, borderRadius: 10, background: "#2f6b33", color: "#fff"}}>
                    Ask Obi your first question
                </a>
                <a href="/dashboard" style={{padding: 14, borderRadius: 10, background: "#f2f2f2"}}>
                    Explore dashboard
                </a>
            </div>
        </main>
    );
}