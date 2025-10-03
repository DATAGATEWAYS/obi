"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { polygon } from "viem/chains";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
      config={{
        appearance: { theme: "dark", accentColor: "#2f6b33" },
        loginMethods: ["telegram"],
        defaultChain: polygon,
        supportedChains: [polygon],
        embeddedWallets: {
          ethereum: { createOnLogin: "users-without-wallets" },
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
}