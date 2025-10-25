"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { polygon, polygonAmoy } from "viem/chains";
import { useEffect, useMemo } from "react";

function isEmbeddedFrame(): boolean {
  if (typeof window === "undefined") return false;
  try { return window.self !== window.top; } catch { return true; }
}

export default function Providers({ children }: { children: React.ReactNode }) {
  const embedded = useMemo(isEmbeddedFrame, []);
  const wcPid = process.env.NEXT_PUBLIC_WC_PROJECT_ID; // можно не указывать, если WalletConnect не нужен

  useEffect(() => {
    // защитный хак от "Blocked a frame ... accessing a cross-origin frame"
    if (embedded) {
      try {
        if ((window as any).ethereum === undefined) (window as any).ethereum = {};
      } catch {}
    }
  }, [embedded]);

  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
      config={{
        walletConnectCloudProjectId: wcPid,
        loginMethods: ["telegram"],
        defaultChain: polygon,
        supportedChains: [polygon, polygonAmoy],
        appearance: {
          theme: "dark",
          accentColor: "#2f6b33",
          walletList: embedded
            ? []
            : (wcPid
                ? ["detected_wallets", "metamask", "coinbase_wallet", "wallet_connect"]
                : ["detected_wallets", "metamask", "coinbase_wallet"]),
          walletChainType: "ethereum-only",
        },
        embeddedWallets: {
          ethereum: { createOnLogin: "users-without-wallets" },
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
}