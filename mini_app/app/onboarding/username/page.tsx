"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Nickname() {
  const [name, setName] = useState("");
  const router = useRouter();

  const next = () => {
    sessionStorage.setItem("onb_username", name.trim());
    router.push("/onboarding/topics");
  };

  return (
    <main style={{ padding: 16 }}>
      <h2>What would you like Obi to call you?</h2>
      <p>This is your nickname inside the app — you can change it anytime.</p>
      <input
        placeholder="Start typing..."
        value={name}
        onChange={(e) => setName(e.target.value)}
        style={{ width: "100%", padding: 12, borderRadius: 10, border: "1px solid #ddd", marginTop: 12 }}
      />
      <button
        disabled={!name.trim()}
        onClick={next}
        style={{ marginTop: 24, width: "100%", padding: 14, borderRadius: 10 }}
      >
        Next
      </button>
    </main>
  );
}
