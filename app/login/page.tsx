"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { DEFAULT_LOCALE } from "@/lib/locale";
import { getMessages } from "@/lib/messages";

const loginMessages = getMessages(DEFAULT_LOCALE).login;

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (loading) return;

    const trimmedEmail = email.trim();

    if (!trimmedEmail || !password) {
      alert(loginMessages.requiredAlert);
      return;
    }

    setLoading(true);

    try {
  await signInWithEmailAndPassword(auth, trimmedEmail, password);
  router.push("/dashboard");
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
        </form>
      </div>
    </main>
  );
}
