// Client component: reads Privy auth state and Telegram initData
"use client";

import { useEffect, useMemo, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";

export default function Page() {
  const { ready, authenticated, user, logout } = usePrivy();

  const [tgDetected, setTgDetected] = useState(false);
  const [initData, setInitData] = useState("");
  const [initDataUnsafe, setInitDataUnsafe] = useState(null);
  const [verifyResult, setVerifyResult] = useState(null);

  useEffect(() => {
    const tg = typeof window !== "undefined" ? window.Telegram?.WebApp : undefined;
    if (tg) {
      setTgDetected(true);
      try {
        tg.ready();
        tg.expand();
      } catch (e) {
        console.warn("Telegram WebApp init error:", e);
      }
      const id = tg.initData || "";
      setInitData(id);
      try {
        setInitDataUnsafe(tg.initDataUnsafe ?? null);
      } catch {
        setInitDataUnsafe(null);
      }
      // Try verifying initData on server
      if (id && typeof fetch !== "undefined") {
        fetch("/api/verify-init-data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ initData: id })
        })
          .then(r => r.json())
          .then(setVerifyResult)
          .catch(err => setVerifyResult({ ok: false, reason: String(err) }));
      }
    }
  }, []);

  const statusPrivy = useMemo(() => {
    if (!ready) return { cls: "wait", text: "Загружаю…" };
    if (authenticated) return { cls: "ok", text: "Успешно" };
    return { cls: "fail", text: "Не авторизован" };
  }, [ready, authenticated]);

  return (
    <div className="container">
      <div className="card">
        <h1>Privy × Telegram Mini App</h1>
        <p>Шаблон Next.js + React + PrivyProvider. Открой из бота как <code>web_app</code> — авторизация пройдёт автоматически (seamless).</p>
      </div>

      <div className="card">
        <h2>Статус Privy:&nbsp;
          <span className={`status ${statusPrivy.cls}`}>{statusPrivy.text}</span>
        </h2>
        {ready && !authenticated && (
          <p><small>Если это открыто вне Telegram WebApp, включи Telegram-логин в Dashboard Privy и используй кнопку входа на отдельной странице.</small></p>
        )}
        {authenticated && (
          <>
            <h3>Данные пользователя Privy</h3>
            <pre>{JSON.stringify({
              privy_user_id: user?.id,
              telegram: user?.telegram
            }, null, 2)}</pre>
            <button onClick={logout}>Выйти</button>
          </>
        )}
      </div>

      <div className="card">
        <h2>Telegram WebApp окружение</h2>
        <p>Обнаружен Telegram: {tgDetected ? "✅ Да" : "❌ Нет"}</p>
        <details>
          <summary>initData (сырой)</summary>
          <pre>{initData || "—"}</pre>
        </details>
        <details>
          <summary>initDataUnsafe (распарсено на клиенте)</summary>
          <pre>{JSON.stringify(initDataUnsafe, null, 2) || "—"}</pre>
        </details>

        <h3>Проверка initData на сервере</h3>
        <p>
          Результат валидации:{" "}
          <span className={`status ${verifyResult?.ok ? "ok" : (verifyResult ? "fail" : "wait")}`}>
            {verifyResult ? (verifyResult.ok ? "ОК" : "Ошибка") : "Жду…"}
          </span>
        </p>
        {verifyResult && (
          <pre>{JSON.stringify(verifyResult, null, 2)}</pre>
        )}
        <p><small>Проверка выполняется на сервере по HMAC (SHA256) с секретом бота. По умолчанию окно валидности 10 минут.</small></p>
      </div>
    </div>
  );
}
