"use client";
import React, {useEffect, useMemo, useState} from "react";
import {usePrivy} from "@privy-io/react-auth";
import {useRouter, useSearchParams} from "next/navigation";
import MintPopup from "../components/MintPopup";
import {copyTextToClipboard} from "../utils/copy";

function titleByHour(h: number) {
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
}

function shortenAddress(addr: string, head = 6, tail = 4) {
    if (!addr) return "";
    const startIdx = addr.startsWith("0x") ? 2 : 0;
    const headPart = addr.slice(0, startIdx + head);
    const tailPart = addr.slice(-tail);
    return `${headPart}…${tailPart}`;
}

export default function Profile() {
    const {user, authenticated, ready, logout} = usePrivy() as any;
    const router = useRouter();
    const q = useSearchParams();
    const newTokenParam = q.get("new");
    const privyId: string | undefined = user?.id;
    const [refreshKey, setRefreshKey] = useState(0);
    const [walletAddress, setWalletAddress] = useState<string>("");
    const [walletLoading, setWalletLoading] = useState<boolean>(false);

    const [username, setUsername] = useState<string>(() => {
        if (typeof window === "undefined") return "";
        return (
            sessionStorage.getItem("onb_username") ||
            localStorage.getItem("onb_username") ||
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

    const [tokens, setTokens] = useState<number[]>([]);
    const [page, setPage] = useState(0); // по 3 на страницу
    const pageSize = 3;

    const handleLogout = async () => {
        try {
            await logout?.();
        } finally {
            router.replace("/");
        }
    }

    function readWalletFromStorage(): string {
        if (typeof window === "undefined") return "";
        try {
            const s = sessionStorage.getItem("wallet_address");
            if (s) return s;
        } catch {
        }
        try {
            const l = localStorage.getItem("wallet_address");
            if (l) return l;
        } catch {
        }
        return "";
    }

    function testModal() {
        setMintModal({open: true, tokenId: 1000})
    }

    const [mintModal, setMintModal] = useState<{ open: boolean; tokenId?: number }>({open: false});

    useEffect(() => {
        if (!ready || !authenticated || !privyId) return;

        const cached = readWalletFromStorage();
        if (cached) {
            setWalletAddress(cached);
            return;
        }

        (async () => {
            setWalletLoading(true);
            try {
                const r = await fetch(`/api/wallets/by-privy?privy_id=${encodeURIComponent(privyId)}`, {
                    cache: "no-store",
                });
                if (r.ok) {
                    const list = await r.json();
                    const pickAddress = (arr: any[]): string => {
                        if (!Array.isArray(arr) || arr.length === 0) return "";
                        const primary = arr.find(w => w?.is_primary);
                        const w = primary ?? arr[0];
                        return (w?.address ?? "").toString();
                    };
                    const addr = pickAddress(list);
                    if (addr) {
                        setWalletAddress(addr);
                        try {
                            localStorage.setItem("wallet_address", addr);
                        } catch {
                        }
                        try {
                            sessionStorage.setItem("wallet_address", addr);
                        } catch {
                        }
                    }
                }
            } finally {
                setWalletLoading(false);
            }
        })();
    }, [ready, authenticated, privyId, refreshKey]);

    useEffect(() => {
        if (!ready || !authenticated || nameLoaded || !privyId) return;

        (async () => {
            try {
                const r = await fetch(
                    `/api/users/has-username?privy_id=${encodeURIComponent(privyId)}`,
                    {cache: "no-store"}
                );
                if (r.ok) {
                    const j = await r.json();
                    const name = j?.username;
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
    }, [ready, authenticated, nameLoaded, privyId, router]);

    useEffect(() => {
        if (!ready || !authenticated || !privyId) return;

        (async () => {
            try {
                const r = await fetch(
                    `/api/quiz/owned?privy_id=${encodeURIComponent(privyId)}&t=${Date.now()}`,
                    {cache: "no-store"}
                );
                if (r.ok) {
                    const j = await r.json();
                    const ids: number[] = Array.isArray(j?.token_ids)
                        ? j.token_ids.map((n: any) => Number(n)).filter((n: number) => Number.isFinite(n))
                        : [];
                    setTokens(ids);
                    localStorage.setItem("owned_tokens", JSON.stringify(ids));
                    return;
                }
            } catch {
            }
            try {
                const local = JSON.parse(localStorage.getItem("owned_tokens") || "[]");
                const ids: number[] = (Array.isArray(local) ? local : [])
                    .map((n: any) => Number(n))
                    .filter((n: number) => Number.isFinite(n));
                setTokens(ids);
            } catch {
            }
        })();
    }, [ready, authenticated, privyId, refreshKey]);

    useEffect(() => {
        const onVisible = () => {
            if (document.visibilityState === "visible") {
                setRefreshKey(k => k + 1);
            }
        };
        document.addEventListener("visibilitychange", onVisible);
        return () => document.removeEventListener("visibilitychange", onVisible);
    }, []);

    // NFTs
    const totalPages = Math.max(1, Math.ceil(tokens.length / pageSize));
    const safePage = Math.min(page, totalPages - 1);
    const visible = useMemo(
        () => tokens.slice(safePage * pageSize, safePage * pageSize + pageSize),
        [tokens, safePage]
    );

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

    const [copied, setCopied] = React.useState(false);

    async function onCopy() {
        if (!walletAddress) return;
        try {
            await copyTextToClipboard(walletAddress);
            setCopied(true);
            setTimeout(() => setCopied(false), 1200);
        } catch (e) {
            alert("Copy failed");
        }
    }

    return (
        <main className="page-inner">
            {/* To dashboard */}
            <div style={{display: "flex", alignItems: "center", justifyContent: "space-between"}}>
                <h2 className="greeting">
                    {greetTitle},{" "}{nameLoaded ? (username || "friend") : Skeleton}!
                </h2>
                <img
                    className="curious-icon"
                    src="/profile/curious.png"
                    alt="To dashboard"
                    onClick={() => router.push("/dashboard")}
                />
            </div>
            <div className="back-with-pager">
                {/* Turtle back */}
                <div className="shell-sticker">
                    <img className="vector" src="/profile/Vector%201.png"/>
                    <img className="img" src="/profile/Group%203.png"/>

                    {visible.map((id, i) => {
                        const src = `/assets/nfts/${id}.png`;
                        const isNew = newTokenParam && Number(newTokenParam) === id;
                        return (
                            <div key={id} className={`sticker pos-${i} ${isNew ? "highlight" : ""}`}>
                                <img src={src} alt={`Badge ${id}`}/>
                            </div>
                        );
                    })}
                </div>

                {/* pager */}
                {tokens.length > 3 && (
                    <div className="pager">
                        <button onClick={() => setPage(p => Math.max(0, p - 1))}
                                disabled={safePage === 0}>{"<"}</button>
                        <div style={{alignSelf: "center", color: "#6C584C"}}>{safePage + 1} / {totalPages}</div>
                        <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                                disabled={safePage >= totalPages - 1}>{">"}
                        </button>
                    </div>
                )}
            </div>

            {/* Settings */}
            <h4 style={{marginTop: 50, color: "#95654D"}}>My address</h4>
            <button
                onClick={onCopy}
                style={{
                    width: "100%",
                    textAlign: "left",
                    padding: 16,
                    borderRadius: 16,
                    background: "#f4efdf",
                    border: 0,
                    marginBottom: 12,
                    color: "#6C584C",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    // aria-label = "Copy wallet address"
                    // title = "Copy wallet address"
                }}
            >
                <p style={{color: "#6C584C", margin: 0}}>
                    {shortenAddress(walletAddress) || (walletLoading ? "Creating…" : "—")}
                </p>
                <img src="/profile/copy_btn.svg" alt="copy_btn"/>
            </button>
            {copied && (
                <div style={{textAlign: "center", fontSize: 12, color: "#6C584C", marginTop: -8, marginBottom: 12}}>
                    address copied!
                </div>
            )}
            <button
                onClick={() => {
                }}
                style={{
                    width: "100%",
                    textAlign: "left",
                    padding: "12px 14px",
                    borderRadius: 10,
                    background: "#859e4f",
                    border: 0,
                    marginBottom: 12,
                    color: "#faf2dd",
                    height: "26px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <p style={{color: "#FAF2DD", margin: 0}}>
                    View on Polygonscan
                </p>
                <img src="/profile/open_link_btn.svg" alt="open_link_btn"
                     style={{
                         marginLeft: "10px",
                     }}/>
            </button>

            <h4 style={{color: "#95654D"}}>Account Settings</h4>
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
            <button disabled style={{
                width: "100%",
                textAlign: "left",
                padding: 16,
                borderRadius: 16,
                background: "#f4efdf",
                border: 0,
                position: "relative",
                opacity: .6,
                cursor: "default",
                color: "#6C584C"
            }} aria-disabled="true">
                Language
                <img src="/assets/badges/soon.svg" alt="Soon"
                     style={{
                         position: "absolute",
                         right: 12,
                         top: "50%",
                         transform: "translateY(-50%)",
                         height: 20
                     }}/>
            </button>

            {/* Other */}
            <h4 style={{marginTop: 24, color: "#95654D"}}>Other</h4>
            <div style={{display: "grid", gap: 12, color: "#6c584c"}}>
                <button onClick={() => router.push("/dashboard")} style={{
                    width: "100%",
                    textAlign: "left",
                    padding: 16,
                    borderRadius: 16,
                    background: "#f4efdf",
                    border: 0,
                    color: "#6C584C"
                }}>
                    To dashboard
                </button>
                <button onClick={() => router.push("/onboarding/username")} style={{
                    width: "100%",
                    textAlign: "left",
                    padding: 16,
                    borderRadius: 16,
                    background: "#f4efdf",
                    border: 0,
                    color: "#6C584C"
                }}>
                    To test
                </button>
                <button
                    type="button"
                    onClick={testModal}
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
                    Test Modal
                </button>
                <button onClick={() => alert("What is Obi? TBD")} style={{
                    width: "100%",
                    textAlign: "left",
                    padding: 16,
                    borderRadius: 16,
                    background: "#f4efdf",
                    border: 0,
                    color: "#6C584C"
                }}>
                    What is Obi?
                </button>
                <button onClick={handleLogout} style={{
                    width: "100%",
                    textAlign: "left",
                    padding: 16,
                    borderRadius: 16,
                    background: "#f4efdf",
                    border: 0,
                    color: "#6C584C"
                }}>
                    Log out
                </button>
            </div>
            {/* Mint popup */}
            {mintModal.open && mintModal.tokenId && (
                <MintPopup
                    tokenId={mintModal.tokenId}
                    onClose={() => setMintModal({open: false})}
                    onView={() => {
                        setMintModal({open: false});
                        // router.push(`/profile?new=${mintModal.tokenId}`);
                    }}
                />
            )}
        </main>
    );
}