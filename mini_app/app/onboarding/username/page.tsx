"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";

export default function Username() {
    const [name, setName] = useState<string>(() => {
        if (typeof window === "undefined") return "";
        return sessionStorage.getItem("onb_username")
            || localStorage.getItem("onb_username")
            || "";
    });
    const router = useRouter();

    const next = () => {
        const clean = name.trim();
        sessionStorage.setItem("onb_username", clean);
        localStorage.setItem("onb_username", clean);
        router.push("/onboarding/topics");
    };

    return (
        <main style={{padding: 16}}>
            <h2>What would you like Obi to call you?</h2>
            <p>This is your nickname inside the app — you can change it anytime.</p>
            <input
                placeholder="Start typing..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{width: "100%", padding: 12, borderRadius: 10, border: "1px solid #ddd", marginTop: 12}}
            />
            <button
                disabled={!name.trim()}
                onClick={next}
                style={{marginTop: 24, width: "100%", padding: 14, borderRadius: 10}}
            >
                Next
            </button>
        </main>
    );
}
