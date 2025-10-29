"use client";
import {useState} from "react";
import {useRouter, useSearchParams} from "next/navigation";
import {usePrivy} from "@privy-io/react-auth";

export default function Username() {
    const search = useSearchParams();
    const isEdit = search.get("edit") === "1";

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
        const clean = name.trim().slice(0, 20);
        sessionStorage.setItem("onb_username", clean);
        localStorage.setItem("onb_username", clean);
        router.push("/onboarding/topics");
    };

    // edit mode
    const save = async () => {
        const clean = name.trim().slice(0, 20);
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

    const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!name.trim()) return;
        await action();
    };

    return (
        <main className="page-inner">
            <div className="username-helper">
                <h2 className="username-h2">What would you like Obi to call you?</h2>
                <p className="username-p">This is your nickname inside the app — you can change it anytime.</p>

                <form style={{
                    display: "flex",
                    flexDirection: "column",
                    }}
                    onSubmit={handleSubmit}>
                    <input
                    className="name-input"
                    placeholder="Start typing..."
                    value={name}
                    onChange={(e) => setName(e.target.value.slice(0, 20))}
                    maxLength={20}
                    autoComplete="nickname"
                    inputMode="text"
                    enterKeyHint={isEdit ? "done" : "next"}
                    />

                    <button
                    className="name-save-btn"
                    type="submit"
                    disabled={!name.trim()}
                >
                    {isEdit ? "Save" : "Next"}
                </button>
            </form>
        </div>
</main>
)
    ;
}