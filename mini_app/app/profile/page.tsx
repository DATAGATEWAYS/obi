"use client";
import React, { useEffect, useMemo, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useRouter, useSearchParams } from "next/navigation";

function sanitize(s?: string | null) {
  return (s ?? "").replace(/^@/, "").trim();
}
function titleByHour(h: number) {
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default function Profile() {
  const { user, authenticated, ready, logout } = usePrivy() as any;
  const router = useRouter();
  const q = useSearchParams();
  const newTokenParam = q.get("new"); // подсветить только что полученный

  const [username, setUsername] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    return (
      sanitize(sessionStorage.getItem("onb_username")) ||
      sanitize(localStorage.getItem("onb_username")) ||
      ""
    );
  });
  const [nameLoaded, setNameLoaded] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const cached =
      sessionStorage.getItem("onb_username") ||
      localStorage.getItem("onb_username");
    return !!cached;
  });

  const [tokens, setTokens] = useState<number[]>([]);
  const [page, setPage] = useState(0); // по 3 на страницу
  const pageSize = 3;

  useEffect(() => {
    if (!ready || !authenticated || nameLoaded) return;
    const privyId = user?.id;
    if (!privyId) return;

    (async () => {
      try {
        const r = await fetch(
          `/api/users/has-username?privy_id=${encodeURIComponent(privyId)}`,
          { cache: "no-store" }
        );
        if (r.ok) {
          const j = await r.json();
          const name = sanitize(j?.username);
          if (name) {
            setUsername(name);
            localStorage.setItem("onb_username", name);
          } else {
            router.replace("/onboarding/username");
            return;
          }
        }
      } finally {
        setNameLoaded(true);
      }
    })();
  }, [ready, authenticated, user, nameLoaded, router]);

  useEffect(() => {
    if (!ready || !authenticated) return;
    const privyId = user?.id;
    if (!privyId) return;

    (async () => {
      try {
        const r = await fetch(
          `/api/quiz/owned?privy_id=${encodeURIComponent(privyId)}`,
          { cache: "no-store" }
        );
        if (r.ok) {
          const j = await r.json();
          if (Array.isArray(j?.tokens)) {
            setTokens(j.tokens.map((n: any) => Number(n)).filter((n: number) => Number.isFinite(n)));
            return;
          }
        }
      } catch {}
      try {
        const local = JSON.parse(localStorage.getItem("owned_tokens") || "[]");
        const arr = (Array.isArray(local) ? local : []).map((n: any) => Number(n)).filter((n: number) => Number.isFinite(n));
        setTokens(arr);
      } catch {}
    })();
  }, [ready, authenticated, user]);

  // NFTs
  const totalPages = Math.max(1, Math.ceil(tokens.length / pageSize));
  const safePage = Math.min(page, totalPages - 1);
  const visible = useMemo(
    () => tokens.slice(safePage * pageSize, safePage * pageSize + pageSize),
    [tokens, safePage]
  );

  const greetTitle = titleByHour(new Date().getHours());
  const Skeleton = (
    <span
      aria-hidden
      style={{
        display: "inline-block",
        width: 90,
        height: "1em",
        borderRadius: 6,
        background:
          "linear-gradient(90deg, #eee 25%, #f6f6f6 37%, #eee 63%)",
        backgroundSize: "400% 100%",
        animation: "skeleton 1.2s ease-in-out infinite",
      }}
    />
  );

  return (
    <main className="page-inner">
      <style>{`
        @keyframes skeleton { 0%{background-position:100% 0} 100%{background-position:0 0} }
        /* панцирь */
        .shell {
          position: relative;
          width: 100%;
          max-width: 360px;
          margin: 24px auto 8px;
          aspect-ratio: 1 / 1;
        }
        .shell .bg { position:absolute; inset:0; width:100%; height:100%; object-fit:contain; }
        .sticker {
          position:absolute;
          width: 34%;
          aspect-ratio: 1/1;
          border-radius: 12px;
          overflow: hidden;
          display:flex; align-items:center; justify-content:center;
          background:#f6f6f6aa;
          box-shadow: 0 2px 10px rgba(0,0,0,.15);
          transform-origin:center;
          transition: transform .25s ease;
        }
        .sticker img { width:100%; height:100%; object-fit:contain; }
        .pos-0 { left: 8%;  top: 18%; }
        .pos-1 { right: 8%; top: 22%; }
        .pos-2 { left: 32%; bottom: 10%; }
        /* highlight new badge */
        @keyframes pop {
          0% { transform: scale(.7); filter: drop-shadow(0 0 0 rgba(47,107,51,0)); }
          60% { transform: scale(1.06); filter: drop-shadow(0 6px 14px rgba(47,107,51,.45)); }
          100% { transform: scale(1); filter: drop-shadow(0 2px 6px rgba(47,107,51,.25)); }
        }
        .highlight { animation: pop .6s ease; outline: 2px solid #2f6b33; }
        .pager { display:flex; gap:8px; justify-content:center; margin:6px 0 4px; }
        .pager button{
          border:none; background:#f0f0e8; color:#6C584C; padding:8px 12px; border-radius:10px; cursor:pointer;
        }
        .pager button[disabled]{ opacity:.5; cursor:default; }
      `}</style>

      {/* To dashboard */}
      <div style={{display:"flex", alignItems:"center", justifyContent:"space-between"}}>
        <h2 style={{color:"#859E4F", fontWeight:700, margin:0}}>
          {greetTitle},{" "}{nameLoaded ? (username || "friend") : Skeleton}!
        </h2>
        <img
          className="curious-icon"
          src="/profile/curious.png"
          alt="To dashboard"
          onClick={() => router.push("/dashboard")}
        />
      </div>

      {/* Turtle back */}
      <div className="shell-sticker">
        <img className="vector" src="/profile/Vector%201.png"/>
        <img className="img" src="/profile/Group%203.png" />
        {/*<img className="bg" src="/profile/Group%2028.svg" />*/}
        {/*<img className="bg" src="/profile/Group%2029.svg" />*/}

        {visible.map((id, i) => {
          const src = `/assets/nfts/${id}.png`;
          const isNew = newTokenParam && Number(newTokenParam) === id;
          return (
            <div key={id} className={`sticker pos-${i} ${isNew ? "highlight" : ""}`}>
              <img src={src} alt={`Badge ${id}`} />
            </div>
          );
        })}
      </div>

      {/* pag ( >3) */}
      {tokens.length > 3 && (
        <div className="pager">
          <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={safePage === 0}>Prev</button>
          <div style={{alignSelf:"center", color:"#6C584C"}}>{safePage + 1} / {totalPages}</div>
          <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={safePage >= totalPages - 1}>Next</button>
        </div>
      )}

      {/* Settings */}
      <h4 style={{marginTop: 50, color:"#95654D"}}>Account Settings</h4>
      <button
        onClick={() => router.push("/onboarding/username?edit=1")}
        style={{ width:"100%", textAlign:"left", padding:16, borderRadius:16, background:"#f4efdf", border:0, marginBottom:12, color:"#6C584C" }}
      >
        Username
      </button>
      <button disabled style={{ width:"100%", textAlign:"left", padding:16, borderRadius:16, background:"#f4efdf", border:0, position:"relative", opacity:.6, cursor:"default", color:"#6C584C" }} aria-disabled="true">
        Language
        <img src="/assets/badges/soon.svg" alt="Soon" style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", height:20 }} />
      </button>

      {/* Other */}
      <h4 style={{marginTop: 24, color:"#95654D"}}>Other</h4>
      <div style={{display:"grid", gap:12, color:"#6c584c"}}>
        <button onClick={() => router.push("/dashboard")} style={{ width:"100%", textAlign:"left", padding:16, borderRadius:16, background:"#f4efdf", border:0, color:"#6C584C" }}>
          To dashboard
        </button>
        <button onClick={() => alert("What is Obi? TBD")} style={{ width:"100%", textAlign:"left", padding:16, borderRadius:16, background:"#f4efdf", border:0, color:"#6C584C" }}>
          What is Obi?
        </button>
        <button onClick={() => logout?.()} style={{ width:"100%", textAlign:"left", padding:16, borderRadius:16, background:"#f4efdf", border:0, color:"#6C584C" }}>
          Log out
        </button>
      </div>
    </main>
  );
}