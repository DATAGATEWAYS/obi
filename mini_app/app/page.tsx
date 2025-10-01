"use client";
import { useEffect, useMemo, useRef } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";

export default function Page() {
  const { ready, authenticated, user } = usePrivy();
  const postedRef = useRef(false);
  const router = useRouter();

  useEffect(() => {
    if (!ready || !authenticated || postedRef.current) return;

    const tgId = user?.telegram?.telegram_user_id ?? user?.telegram?.telegramUserId;
    const tgUsername = user?.telegram?.username || null;
    const privyId = user?.id ?? null;
    if (!tgId || !privyId) return;

    (async () => {
      postedRef.current = true;
      // 1) insert user
      const r1 = await fetch(`/api/users/insert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telegram_username: tgUsername, telegram_id: tgId, privy_id: privyId }),
      });
      if (!r1.ok) { postedRef.current = false; return; }

      // 2) check username
      const r2 = await fetch(`/api/users/has-username?privy_id=${encodeURIComponent(privyId)}`, { cache: "no-store" });
      const j2 = r2.ok ? await r2.json() : { has: false };
      if (!j2.has) {
        const prefillName = (tgUsername ?? "");
        if (prefillName) {
        sessionStorage.setItem("onb_username", prefillName);
        }
        router.replace("/onboarding/username");
      } else {
        // all good - go to dashboard
        router.replace("/onboarding/done");
      }
    })();
  }, [ready, authenticated, user, router]);

  const statusPrivy = useMemo(() => {
    if (!ready) return { cls: "wait", text: "Loading…" };
    if (authenticated) return { cls: "ok", text: "Success" };
    return { cls: "fail", text: "Not authenticated" };
  }, [ready, authenticated]);

  return <div>Privy status: {statusPrivy.text}</div>;
}