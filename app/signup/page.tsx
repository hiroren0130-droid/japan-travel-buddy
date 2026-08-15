"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { DEFAULT_LOCALE } from "@/lib/locale";
import { getMessages } from "@/lib/messages";

const signupMessages = getMessages(DEFAULT_LOCALE).signup;

export default function SignupPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();

  if (loading) return;

  setError("");

  const trimmedName = name.trim();
  const trimmedEmail = email.trim();

  if (!trimmedName || !trimmedEmail || !password) {
    setError(signupMessages.requiredError);
    return;
  }

  setLoading(true);

    try {
      try {
        const userCredential =
          await createUserWithEmailAndPassword(
            auth,
            trimmedEmail,
            password
          );

        try {
          await updateProfile(userCredential.user, {
            displayName: trimmedName,
          });
        } catch {
          alert(signupMessages.profileUpdateWarning);
        }
      } catch {
        setError(signupMessages.creationFailedError);
        return;
      }

      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100 px-6">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <h1 className="mb-6 text-center text-3xl font-bold">
          {signupMessages.title}
        </h1>

        <form onSubmit={handleSignup} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium">
              {signupMessages.nameLabel}
            </label>

            <input
              type="text"
              placeholder={signupMessages.namePlaceholder}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-lg border p-3"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              {signupMessages.emailLabel}
            </label>

            <input
              type="email"
              placeholder={signupMessages.emailPlaceholder}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border p-3"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              {signupMessages.passwordLabel}
            </label>

            <input
              type="password"
              placeholder={signupMessages.passwordPlaceholder}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-lg border p-3"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? signupMessages.loadingLabel : signupMessages.submitLabel}
          </button>
        </form>
      </div>
    </main>
  );
}
