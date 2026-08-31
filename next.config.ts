import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

import { resolveFirebaseMockMode } from "./lib/testing/firebase-mock-mode";

export default function createNextConfig(phase: string): NextConfig {
  const usePlaywrightFirebaseMocks = resolveFirebaseMockMode({
    env: process.env,
    isDevelopmentServer: phase === PHASE_DEVELOPMENT_SERVER,
  });

  return usePlaywrightFirebaseMocks
    ? {
        turbopack: {
          resolveAlias: {
            "firebase/auth": "./tests/mocks/firebase-auth.ts",
            "@/lib/firebase": "./tests/mocks/firebase.ts",
            "@/lib/firebase-admin": "./tests/mocks/firebase-admin.ts",
            "@/lib/firestore": "./tests/mocks/firestore.ts",
          },
        },
      }
    : {};
}
