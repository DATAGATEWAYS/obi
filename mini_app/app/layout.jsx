import "./globals.css";
import Providers from "./providers";

export const metadata = {
  title: "Privy × Telegram Mini App",
  description: "Seamless Telegram login with Privy (Next.js template)",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
