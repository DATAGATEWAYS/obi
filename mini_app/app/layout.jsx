import "./globals.css";
import Script from "next/script";
import dynamic from "next/dynamic";

const Providers = dynamic(() => import("./providers"), { ssr: false });

export const metadata = { title: "Privy × Telegram Mini App" };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}