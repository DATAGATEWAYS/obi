"use client";

import {PrivyProvider} from "@privy-io/react-auth";
import {polygon, polygonAmoy} from "viem/chains";
import {useEffect} from "react";

export default function Providers({children}: { children: React.ReactNode }) {
    useEffect(() => {
        const tg = (window as any)?.Telegram?.WebApp;
        tg?.expand?.();
        tg?.setHeaderColor?.("bg_color");
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