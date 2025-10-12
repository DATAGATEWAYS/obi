"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";

export default function Username() {
  const search = useSearchParams();
  const isEdit = search.get("edit") === "1"; // режим редактирования с профиля

  const { user, authenticated, ready } = usePrivy();
  const [name, setName] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    return (
      sessionStorage.getItem("onb_username") ||
      localStorage.getItem("onb_username") ||
      ""
    );
  });
  const router = useRouter();

  // onboarding
  const next = () => {
    const clean = name.trim();
    sessionStorage.setItem("onb_username", clean);
    localStorage.setItem("onb_username", clean);
    router.push("/onboarding/topics");
  };

  // edit mode
  const save = async () => {
    const clean = name.trim();
    if (!clean) return;

    sessionStorage.setItem("onb_username", clean);
    localStorage.setItem("onb_username", clean);

    if (ready && authenticated && user?.id) {
      await fetch("/api/users/update-username", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ privy_id: user.id, username: clean }),
      }).catch(() => {});
    }
    router.push("/dashboard");
  };

  const action = isEdit ? save : next;

  return (
    <main className="tg-safe page-inner">
      <h2>What would you like Obi to call you?</h2>
      <p>This is your nickname inside the app — you can change it anytime.</p>

      <input
        placeholder="Start typing..."
        value={name}
        onChange={(e) => setName(e.target.value)}
        style={{
          width: "100%",
          padding: 12,
          borderRadius: 10,
          border: "1px solid #ddd",
          marginTop: 12,
        }}
      />

      <button
        disabled={!name.trim()}
        onClick={action}
        style={{ marginTop: 24, width: "100%", padding: 14, borderRadius: 10 }}
      >
        {isEdit ? "Save" : "Next"}
      </button>
    </main>
  );
}