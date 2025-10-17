"use client";
import {useEffect, useRef} from "react";
import {useCreateWallet, usePrivy, useWallets} from "@privy-io/react-auth";
import {router} from "next/client";

function safeSet(key: string, val: string) {
  try { sessionStorage.setItem(key, val); } catch {}
  try { localStorage.setItem(key, val); } catch {}
}

export default function Done() {
  const {user, authenticated, ready} = usePrivy();
  const {wallets, ready: walletsReady} = useWallets();

  const postedWalletRef = useRef(false);
  const creatingRef     = useRef(false);

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
    },
    onError: () => {},
  });

  useEffect(() => {
    if (!ready || !authenticated || !walletsReady) return;

    const existing = wallets.find(w => w.walletClientType === "privy") ?? wallets[0];
    if (existing) {
      safeSet("wallet_address", existing.address);
      if ((existing as any).id) safeSet("wallet_id", (existing as any).id);
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
      createWallet();
    }
  }, [ready, authenticated, walletsReady, wallets, createWallet, user?.id]);

  return (
      <main className="page-inner done-main tg-safe--lock">
        <h2 className="done-h2">You’re all set</h2>
        <p className="done-p">You’re ready to explore! Obi can answer your questions anytime.</p>

        <img className="done-turtle" src="/welcome/obi_turtle.svg" alt="turtle"/>
        <img className="done-ground" src="/done/ground.png" alt="ground"/>

        <div className="done-btns">
          <button
              className="done-chat-btn"
              onClick={() => router.push("/chat")}
          >
            Ask Obi your first question
          </button>
          <button
              className="done-dashboard-btn"
              onClick={() => router.push("/dashboard")}
          >
            Explore dashboard
          </button>
        </div>
      </main>
  );
}