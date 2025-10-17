import "./globals.css";
import Script from "next/script";
import dynamic from "next/dynamic";
import {satoshi} from "./fonts";
import {prompt} from "./fonts";

const Providers = dynamic(() => import("./providers"), { ssr: false });

export const metadata = { title: "Obi" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
      <html lang="en">
      <head>
          <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"/>
          <title>Obi</title>
      </head>
      <body className={`${satoshi.className} ${prompt.variable}`}>
      <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
      />
      <Providers>{children}</Providers>
      </body>
      </html>
  );
}