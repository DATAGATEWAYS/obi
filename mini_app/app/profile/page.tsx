"use client";
import React, {useEffect, useMemo, useState} from "react";
import {usePrivy} from "@privy-io/react-auth";
import {useRouter, useSearchParams} from "next/navigation";
import MintPopup from "../components/MintPopup";
import {copyTextToClipboard} from "../utils/copy";
import popupStyles from "../components/MintPopup.module.css";

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

    const [copied, setCopied] = useState(false);

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

    const [saved, setSaved] = useState(false);


    const save = async (name: string) => {
        const clean = name.trim();
        if (!clean) return;

        sessionStorage.setItem("onb_username", clean);
        localStorage.setItem("onb_username", clean);

        if (ready && authenticated && user?.id) {
            await fetch("/api/users/update-username", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({privy_id: user.id, username: clean}),
            }).catch(() => {
            });
            setEdited(false);
            setSaved(true);
            setTimeout(() => setSaved(false), 1200);
        }
    };

    const [edited, setEdited] = useState(false);

    async function onEdit() {
        try {
            setEdited(true);
        } catch (e) {
            alert("Edit failed");
        }
    }

    type Net = "mainnet" | "testnet";

    function openLink(url: string) {
        if (!url) return;
        const isTg = Boolean((window as any).Telegram?.WebApp);
        if (isTg) {
            window.open(url, "_blank");
        } else {
            window.open(url, "_blank", "noopener,noreferrer");
        }
    }

    function openOnPolygonscan(addr: string, net: Net = "mainnet") {
        if (!addr) return;
        const host = net === "testnet" ? "amoy.polygonscan.com" : "polygonscan.com";
        const url = `https://${host}/address/${encodeURIComponent(addr)}#nfttransfers`;

        const isTg = Boolean((window as any).Telegram?.WebApp);
        if (isTg) {
            window.open(url, "_blank");
        } else {
            window.open(url, "_blank", "noopener,noreferrer");
        }
    }

    function openTxOnPolygonscan(tx: string, net: Net = "mainnet") {
        if (!tx) return;
        const host = net === "testnet" ? "amoy.polygonscan.com" : "polygonscan.com";
        const url = `https://${host}/tx/0x${encodeURIComponent(tx)}`;

        const isTg = Boolean((window as any).Telegram?.WebApp);
        if (isTg) {
            window.open(url, "_blank");
        } else {
            window.open(url, "_blank", "noopener,noreferrer");
        }
    }

    const PINATA_META_BASE = "https://gateway.pinata.cloud/ipfs/bafybeie6t77eu3gcblouw5zvizxaqv5qvkyesznka5zzuiunsasv2d6j54";

    async function fetchPinataMeta(tokenId: number) {
        const url = `${PINATA_META_BASE}/${tokenId}.json`;
        const r = await fetch(url, {cache: "force-cache"});
        if (!r.ok) throw new Error("meta_not_found");
        return r.json() as Promise<{ name?: string; description?: string; image?: string }>;
    }

    const [nftModal, setNftModal] = React.useState<{
        open: boolean;
        tokenId?: number;
        name?: string;
        description?: string;
        image?: string;
        tx?: string;
    }>({open: false});

    const [txByToken, setTxByToken] = React.useState<Record<number, string>>({});

    React.useEffect(() => {
        (async () => {
            if (!ready || !authenticated || !privyId) return;
            try {
                const r = await fetch(`/api/quiz/minted?privy_id=${encodeURIComponent(privyId)}`);
                const j = await r.json();
                if (r.ok && Array.isArray(j?.items)) {
                    const map: Record<number, string> = {};
                    for (const it of j.items) map[Number(it.token_id)] = String(it.tx_hash || "");
                    setTxByToken(map);
                }
            } catch {
            }
        })();
    }, [ready, authenticated, privyId]);

    const [mintLoading, setMintLoading] = useState(false);
    const [mintDots, setMintDots] = useState(1);
    useEffect(() => {
        if (!mintLoading) return;
        const id = setInterval(() => setMintDots(d => (d % 3) + 1), 500);
        return () => clearInterval(id);
    }, [mintLoading]);
    const mintLoadingText = `Loading${".".repeat(mintDots)}`;

    const [input, setInput] = useState("");

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
                            <div
                                key={id}
                                className={`sticker pos-${i} ${isNew ? "highlight" : ""}`}
                                onClick={async () => {
                                    if (mintLoading) return;
                                    setMintLoading(true);
                                    let meta: { name?: string; description?: string; image?: string } = {};
                                    try {
                                        meta = await fetchPinataMeta(id);
                                    } catch {
                                    }
                                    setNftModal({
                                        open: true,
                                        tokenId: id,
                                        name: meta.name,
                                        description: meta.description,
                                        image: src,
                                        tx: txByToken[id],
                                    });

                                    setTimeout(() => setMintLoading(false), 0);
                                }}
                            >
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
            <div
                style={{
                    width: "100%",
                    padding: "18px 24px",
                    borderRadius: 24,
                    background: "#f4efdf",
                    color: "#6C584C",
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                }}
            >
                <p style={{margin: 0, whiteSpace: "nowrap", fontSize: 18}}>My address</p>

                <p
                    style={{
                        margin: 0,
                        flex: 1,
                        textAlign: "center",
                        fontWeight: 700,
                        fontSize: 22,
                    }}
                >
                    {shortenAddress(walletAddress) || (walletLoading ? "Creating…" : "—")}
                </p>

                <button
                    onClick={onCopy}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "6px 12px",
                        borderRadius: 12,
                        background: "transparent",
                        border: "2px solid #A7C470",
                        color: "#A7C470",
                        cursor: "pointer",
                        fontWeight: 600,
                    }}
                >
                    <img src="/profile/copy_btn.svg" alt="copy"/>
                    copy
                </button>
            </div>
            {copied && (
                <div style={{textAlign: "center", fontSize: 12, color: "#6C584C", marginTop: -8, marginBottom: 12}}>
                    address copied!
                </div>
            )}
            <button
                onClick={() => openOnPolygonscan(walletAddress, "testnet")}
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
            <div
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
                }}
            >
                <div>
                    <p style={{color: "#6C584C", margin: 0}}>
                        Username
                    </p>
                    <div>
                        {!edited && (
                            <p style={{color: "#6C584C", margin: 0}}>
                                {username}
                            </p>
                        )}
                        {!edited && (
                            <img onClick={onEdit} src="/profile/edit_btn.svg" alt="edit_btn" style={{
                                cursor: "pointer"
                            }}/>
                        )}
                        {edited && (
                            <input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Enter new username"
                                style={{
                                    flex: 1,
                                    padding: "12px 14px",
                                    borderRadius: 18,
                                    border: "1px solid #ddd",
                                    outline: "none",
                                    background: "#fff",
                                    color: "#6C584C",
                                }}
                            />
                        )}
                        {edited && (
                            <img onClick={() => save(input)} src="/profile/save_btn.svg" alt="edit_btn" style={{
                                cursor: "pointer"
                            }}/>
                        )}
                    </div>
                </div>
            </div>
            {saved && (
                <div style={{textAlign: "center", fontSize: 12, color: "#6C584C", marginTop: -8, marginBottom: 12}}>
                    new name set!
                </div>
            )}
            <button
                onClick={() => router.push("/onboarding/username")}
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
                Test
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
                <button onClick={() => openLink("https://obi-onboard.vercel.app/about")} style={{
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
            {/* Popup loader */}
            {mintLoading && (
                <div className={popupStyles.mintBackdrop} aria-live="polite" aria-busy="true">
                    <p style={{fontSize: 18, fontWeight: 700}}>{mintLoadingText}</p>
                </div>
            )}
            {/* Mint popup */}
            {nftModal.open && nftModal.tokenId && (
                <MintPopup
                    tokenId={nftModal.tokenId}
                    name={nftModal.name}
                    description={nftModal.description}
                    image={nftModal.image}
                    onClose={() => setNftModal({open: false})}
                    onView={() => {
                        setNftModal({open: false});
                        openTxOnPolygonscan(nftModal.tx || "", "testnet");
                    }}
                    btn_name="View on Polygonscan"
                />
            )}
        </main>
    );
}