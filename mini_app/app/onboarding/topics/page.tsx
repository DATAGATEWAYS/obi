"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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

  useEffect(() => {
    const name = sessionStorage.getItem("onb_username");
    if (!name) router.replace("/onboarding/username");
  }, [router]);

  const toggle = (k: string) => setTopics((p) => ({ ...p, [k]: !p[k] }));

  return (
    <main className="tg-safe page-inner">
      <button onClick={() => router.back()} aria-label="Back" style={{ marginBottom: 12 }}>← Back</button>
      <h2>What brings you here?</h2>
      <p>Choose what you want to chat with Obi about.</p>
      <div style={{ display: "grid", gap: 8, marginTop: 16 }}>
        {allTopics.map(([k, title]) => (
          <button
            key={k}
            onClick={() => toggle(k)}
            style={{
              textAlign: "left",
              padding: 12,
              borderRadius: 12,
              border: topics[k] ? "2px solid #6a8f3a" : "1px solid #ddd",
              background: "#fff"
            }}
          >
            {title}
          </button>
        ))}
      </div>
      <button
        onClick={() => { sessionStorage.setItem("onb_topics", JSON.stringify(topics)); router.push("/onboarding/done"); }}
        style={{ marginTop: 24, width: "100%", padding: 14, borderRadius: 10 }}
      >
        Next
      </button>
    </main>
  );
}
