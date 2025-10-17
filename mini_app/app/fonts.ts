import localFont from "next/font/local";
export const satoshi = localFont({
  src: [{ path: "./fonts/Satoshi-Variable.woff2", weight: "100 900", style: "normal" }],
  variable: "--font-satoshi",
  display: "swap",
});
export const prompt = localFont({
  src: [{ path: "./fonts/Prompt-Regular.woff2", weight: "100 900", style: "normal" }],
  variable: "--font-prompt",
  display: "swap",
});
