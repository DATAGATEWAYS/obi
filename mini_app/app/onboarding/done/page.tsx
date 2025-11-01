"use client";
import {useEffect, useRef, useState} from "react";
import {useCreateWallet, usePrivy, useWallets} from "@privy-io/react-auth";
import {useRouter} from "next/navigation";
import MintPopup from "../../components/MintPopup";
import popupCss from "../../components/MintPopup.module.css";

const WELCOME_TOKEN_ID = 1000;

function safeSet(key: string, val: string) {
    try {
        sessionStorage.setItem(key, val);
    } catch {
    }
    try {
        localStorage.setItem(key, val);
    } catch {
    }
}

export default function Done() {
    const {user, authenticated, ready} = usePrivy();
    const {wallets, ready: walletsReady} = useWallets();

    const postedWalletRef = useRef(false);
    const creatingRef = useRef(false);
    const router = useRouter();


    const [saving, setSaving] = useState(false);
    const [savingText, setSavingText] = useState("Saving settings...");

    const [mintLoading, setMintLoading] = useState(false);
    const [mintDots, setMintDots] = useState(1);


    useEffect(() => {
        if (!mintLoading) return;
        const id = setInterval(() => setMintDots(d => (d % 3) + 1), 500);
        return () => clearInterval(id);
    }, [mintLoading]);
    const mintingText = `Minting your first badge${".".repeat(mintDots)}`;

    const [mintModal, setMintModal] = useState<{ open: boolean }>({open: false});

    async function upsertWalletOnce(payload: any) {
        if (postedWalletRef.current) return;
        postedWalletRef.current = true;
        try {
            await fetch("/api/wallets/insert", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify(payload),
            });
        } catch {
            postedWalletRef.current = false;
        }
    }

    const welcomeTriedRef = useRef(false);
    const triggerWelcomeMintOnce = async () => {
        if (welcomeTriedRef.current) return;
        welcomeTriedRef.current = true;

        try {
            const owned = JSON.parse(localStorage.getItem("owned_tokens") || "[]");
            if (Array.isArray(owned) && owned.includes(WELCOME_TOKEN_ID)) return;
        } catch {
        }

        setMintLoading(true);
        try {
            const r = await fetch("/api/quiz/mint-onboarding", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({privy_id: user?.id}),
            });

            let j: any = null;
            try {
                j = await r.json();
            } catch {
            }

            if (!r.ok) {
                const msg = j?.detail || j?.error || `Mint failed (${r.status})`;
                throw new Error(msg);
            }

            if (j?.token_id === WELCOME_TOKEN_ID) {
                try {
                    const local = JSON.parse(localStorage.getItem("owned_tokens") || "[]");
                    if (!local.includes(WELCOME_TOKEN_ID)) {
                        local.push(WELCOME_TOKEN_ID);
                        localStorage.setItem("owned_tokens", JSON.stringify(local));
                    }
                } catch {
                }
            }

            setMintModal({open: true});
        } catch (e: any) {
            console.error(e?.message || e);
        } finally {
            setMintLoading(false);
        }
    };

    const {createWallet} = useCreateWallet({
        onSuccess: async ({wallet}) => {
            safeSet("wallet_address", wallet.address);
            if ((wallet as any).id) safeSet("wallet_id", (wallet as any).id);
            await upsertWalletOnce({
                privy_id: user?.id,
                wallet_id: (wallet as any).id ?? null,
                chain_type: "ethereum",
                address: wallet.address,
                is_embedded: wallet.walletClientType === "privy",
                is_primary: true,
            });
            await triggerWelcomeMintOnce();
        },
        onError: () => {
        },
    });

    const insertToDB = async (privyId: string | undefined) => {
        const payload = {privy_id: privyId, username, topics};
        await fetch("/api/users/onboarding-complete", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(payload),
            keepalive: true,
            cache: "no-store",
        }).catch(() => {
        });
    };

    const [username, setUsername] = useState<string>(() => {
        if (typeof window === "undefined") return "";
        return (
            sessionStorage.getItem("onb_username") ||
            localStorage.getItem("onb_username") ||
            ""
        );
    });

    const [topics, setTopics] = useState<Record<string, boolean>>(() => {
        if (typeof window === "undefined") return {};
        try {
            const raw =
                sessionStorage.getItem("onb_topics") ||
                localStorage.getItem("onb_topics") ||
                "{}";
            const obj = JSON.parse(raw);
            return obj && typeof obj === "object" && !Array.isArray(obj) ? obj : {};
        } catch {
            return {};
        }
    });

    const insertedRef = useRef(false);
    const initedRef = useRef(false);

    useEffect(() => {
        if (!ready || !authenticated || !walletsReady || initedRef.current) return;

        const run = async () => {
            if (user?.id && !insertedRef.current) {
                safeSet("privy_id", user.id);
                await insertToDB(user.id);
                insertedRef.current = true;
            }

            let existing = wallets.find(w => w.walletClientType === "privy") ?? wallets[0];

            if (!existing) {
                try {
                    const created = await createWallet();
                    existing = (created as any) ?? null;
                } catch (e) {
                }
                if (!existing) return;
            }

            safeSet("wallet_address", existing.address);
            if ((existing as any).id) safeSet("wallet_id", (existing as any).id);

            await upsertWalletOnce({
                privy_id: user?.id ?? null,
                wallet_id: (existing as any).id ?? null,
                chain_type: "ethereum",
                address: existing.address,
                is_embedded: existing.walletClientType === "privy",
                is_primary: true,
            });

            triggerWelcomeMintOnce();
            initedRef.current = true;
        };

        void run();
    }, [ready, authenticated, walletsReady, wallets, createWallet, user?.id]);

    const complete = async (target: "chat" | "dashboard") => {
        router.push(target === "chat" ? "/chat" : "/dashboard");
    };

    return (
        <main className="page-inner done-main tg-safe--lock">
            <div className="done-header">
                <h2 className="done-h2">You’re all set, {username}!</h2>
                <p className="done-p">You’re ready to explore! Obi can answer your questions anytime.</p>
            </div>

            <div className="done-obi-btns">
                <img className="done-turtle" src="/welcome/obi_turtle.svg" alt="turtle"/>

                <div className="done-btns">
                    <button
                        className="done-chat-btn"
                        onClick={() => complete("chat")}
                    >
                        Ask Obi your first question
                    </button>
                    <button
                        className="done-dashboard-btn"
                        onClick={() => complete("dashboard")}
                    >
                        Explore dashboard
                    </button>
                </div>
            </div>

            {/* loader */}
            {mintLoading && (
                <div className={popupCss.mintBackdrop} aria-live="polite" aria-busy="true">
                    <p style={{fontSize: 18, fontWeight: 700}}>
                        {mintingText}
                    </p>
                </div>
            )}
            {/* popup after mint" */}
            {mintModal.open && (
                <MintPopup
                    tokenId={WELCOME_TOKEN_ID}
                    image={`/assets/nfts/${WELCOME_TOKEN_ID}.png`}
                    name="Welcome to Obi!"
                    description="This is your first badge — congrats!"
                    onClose={() => setMintModal({open: false})}
                    mode="single"
                    primaryLabel="Great!"
                    onPrimary={() => setMintModal({open: false})}
                />
            )}
        </main>
    );
}