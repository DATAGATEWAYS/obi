import NextDynamic from "next/dynamic";
export const dynamic = "force-dynamic";

const ChatClient = NextDynamic(() => import("./ChatClient"), { ssr: false });

export default function Page() {
  return <ChatClient />;
}