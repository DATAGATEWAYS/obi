"use client";
import {useEffect, useMemo, useState} from "react";
import {useRouter} from "next/navigation";

const allTopics = [
    ["crypto_basics", "Basics of crypto"],
    ["crypto_wallets", "Crypto wallets"],
    ["nfts", "NFTs"],
    ["crypto_games", "Crypto games"],
    ["money_transactions", "Sending or receiving money"],
    ["scam_awareness", "Staying safe from scams"],
    ["exploring", "I'm just exploring"],
    ["other", "Other"],
] as const;

export default function Topics() {
    const router = useRouter();
    const [topics, setTopics] = useState<Record<string, boolean>>({});
    const hasSelected = useMemo(() => Object.values(topics).some(Boolean), [topics]);

    useEffect(() => {
        const name = sessionStorage.getItem("onb_username");
        if (!name) router.replace("/onboarding/username");
    }, [router]);

    const toggle = (k: string) => setTopics((p) => ({...p, [k]: !p[k]}));

    return (
        <main className="page-inner topics-main">
            <button
                onClick={() => router.push("router.back()")}
                className="topics-back-btn"><img className="topics-back-img" src="/topics/back_button.png"
                                                     alt="back_button"/>
            </button>
            <h2 className="topics-h2">What brings you here?</h2>
            <p className="topics-p">Choose what you want to chat with Obi about.</p>
            <div className="topic-list">
                {allTopics.map(([k, title]) => (
                    <button
                        className="topic-btn"
                        key={k}
                        onClick={() => toggle(k)}
                        style={{border: topics [k] ? "2px solid #ADC178" : "none"}}
                    >
                        {title}
                    </button>
                ))}
            </div>
            <button
                className={`next-btn ${hasSelected ? "next-btn-active" : "next-btn-passive"}`}
                disabled={!hasSelected}
                onClick={() => {
                    if (!hasSelected) return;
                    sessionStorage.setItem("onb_topics", JSON.stringify(topics));
                    router.push("/onboarding/done");
                }}
            >
                Next
            </button>
        </main>
    );
}
