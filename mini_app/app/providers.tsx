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

  useEffect(() => {
    if (!embedded) return;

    try {
      const w: any = window as any;
      const noop = () => {};
      if (!w.ethereum || typeof w.ethereum.on !== "function") {
        w.ethereum = {
          isInjectedShim: true,
          request: async () => { throw new Error("No injected provider in iframe"); },
          on: noop,
          off: noop,
          addListener: noop,
          removeListener: noop,
        };
      }
    } catch {}
  }, [embedded]);

  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
      config={{
        loginMethods: ["telegram"],
        defaultChain: polygon,
        supportedChains: [polygon, polygonAmoy],

        appearance: {
          theme: "dark",
          accentColor: "#2f6b33",
          walletList: embedded
            ? []
            : ["detected_wallets", "metamask", "coinbase_wallet"],
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
