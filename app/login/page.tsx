"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useLocale } from "@/components/LocaleProvider";

const ADMIN_SESSION_ERROR_MESSAGE =
  "管理者セッションを確立できませんでした。もう一度お試しください。";

function getSafeAdminNextPath(): string | null {
  const nextPath = new URLSearchParams(window.location.search).get("next");

  if (
    nextPath === "/admin" ||
    (nextPath?.startsWith("/admin/") && !nextPath.includes("\\"))
  ) {
    return nextPath;
  }

  return null;
}

export default function LoginPage() {
  const loginMessages = useLocale().messages.login;
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [adminSessionError, setAdminSessionError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (loading) return;

    const trimmedEmail = email.trim();

    if (!trimmedEmail || !password) {
      alert(loginMessages.requiredAlert);
      return;
    }

    setLoading(true);
    setAdminSessionError("");

    try {
      const credential = await signInWithEmailAndPassword(
        auth,
        trimmedEmail,
        password
      );

      const adminNextPath = getSafeAdminNextPath();

      if (!adminNextPath) {
        router.push("/dashboard");
        return;
      }

      try {
        const idToken = await credential.user.getIdToken(true);
        const response = await fetch("/api/auth/session", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
          cache: "no-store",
        });

        if (!response.ok || response.status !== 204) {
          setAdminSessionError(ADMIN_SESSION_ERROR_MESSAGE);
          return;
        }
      } catch {
        setAdminSessionError(ADMIN_SESSION_ERROR_MESSAGE);
        return;
      }

      router.push(adminNextPath);
    } catch {
      alert(loginMessages.invalidCredentialsAlert);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100 px-6">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <h1 className="mb-6 text-center text-3xl font-bold">
          {loginMessages.title}
        </h1>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium">
              {loginMessages.emailLabel}
            </label>

            <input
              type="email"
              placeholder={loginMessages.emailPlaceholder}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border p-3"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              {loginMessages.passwordLabel}
            </label>

            <input
              type="password"
              placeholder={loginMessages.passwordPlaceholder}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-lg border p-3"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700"
          >
            {loading ? loginMessages.loadingLabel : loginMessages.submitLabel}
          </button>

          {adminSessionError ? (
            <p role="alert" className="text-sm text-red-600">
              {adminSessionError}
            </p>
          ) : null}
        </form>
      </div>
    </main>
  );
}
