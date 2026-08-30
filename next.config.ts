import type { NextConfig } from "next";

const usePlaywrightFirebaseMocks =
  process.env.PLAYWRIGHT_FIREBASE_MOCKS === "1";

const nextConfig: NextConfig = usePlaywrightFirebaseMocks
  ? {
      turbopack: {
        resolveAlias: {
          "firebase/auth": "./tests/mocks/firebase-auth.ts",
          "@/lib/firebase": "./tests/mocks/firebase.ts",
          "@/lib/firestore": "./tests/mocks/firestore.ts",
        },
      },
    }
  : {};

export default nextConfig;
