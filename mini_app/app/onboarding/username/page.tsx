"use client";
import {useState} from "react";
import {useRouter, useSearchParams} from "next/navigation";
import {usePrivy} from "@privy-io/react-auth";

export default function Username() {
    const search = useSearchParams();
    const isEdit = search.get("edit") === "1"; // режим редактирования с профиля

    const {user, authenticated, ready} = usePrivy();
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
        router.push("/onboarding/done");
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
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({privy_id: user.id, username: clean}),
            }).catch(() => {
            });
        }
        router.push("/dashboard");
    };

    const action = isEdit ? save : next;

    return (
        <main className="page-inner">
            <div className="username-helper">
                <h2 className="username-h2">What would you like Obi to call you?</h2>
                <p className="username-p">This is your nickname inside the app — you can change it anytime.</p>

                <input
                    onChange={(e) => setName(e.target.value)}
                    className="name-input"
                    placeholder="Start typing..."
                    value={name}
                />

                <button
                    className="name-save-btn"
                    disabled={!name.trim()}
                    onClick={action}
                >
                    {isEdit ? "Save" : "Next"}
                </button>
            </div>
        </main>
    );
}