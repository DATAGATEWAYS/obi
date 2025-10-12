"use client";

import {PrivyProvider} from "@privy-io/react-auth";
import {polygon, polygonAmoy} from "viem/chains";
import {useEffect} from "react";

export default function Providers({children}: { children: React.ReactNode }) {
      useEffect(() => {
    const tg: any = (window as any)?.Telegram?.WebApp;
    if (!tg) return;

    const apply = () => {
      const vh = tg.viewportHeight ?? window.innerHeight;
      document.documentElement.style.setProperty("--tg-vh", `${vh}px`);

      const safeBottom = (parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--safe-bottom")) || 0);
      const overlaySum = Math.max(0, window.innerHeight - vh);
      const header = Math.max(0, overlaySum - safeBottom);
      document.documentElement.style.setProperty("--tg-header", `${header}px`);
    };

    tg.expand?.();
    tg.setHeaderColor?.("bg_color");

    apply();
    tg.onEvent?.("viewportChanged", apply);
    window.addEventListener("resize", apply);

    return () => {
      tg.offEvent?.("viewportChanged", apply);
      window.removeEventListener("resize", apply);
    };
  }, []);
    return (
        <PrivyProvider
            appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
            config={{
                appearance: {theme: "dark", accentColor: "#2f6b33"},
                loginMethods: ["telegram"],
                defaultChain: polygon,
                supportedChains: [polygon, polygonAmoy],
                embeddedWallets: {
                    ethereum: {createOnLogin: "users-without-wallets"},
                },
            }}
        >
            {children}
        </PrivyProvider>
    );
}