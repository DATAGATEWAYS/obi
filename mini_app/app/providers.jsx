// 'use client' must be at top for client components
"use client";

import { PrivyProvider } from "@privy-io/react-auth";

export default function Providers({ children }) {
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID}
      config={{
        // You can restrict login methods if needed.
        loginMethods: ["telegram"],
        appearance: {
          theme: "dark",
          accentColor: "#8ab4f8"
        }
      }}
    >
      {children}
    </PrivyProvider>
  );
}
