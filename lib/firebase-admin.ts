import "server-only";

import {
  cert,
  getApp,
  getApps,
  initializeApp,
  type App,
} from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";

const PROJECT_ID_PATTERN = /^[a-z][a-z0-9-]{4,28}[a-z0-9]$/;
const CLIENT_EMAIL_PATTERN =
  /^[^@\s]+@[^@\s]+\.iam\.gserviceaccount\.com$/i;
const PRIVATE_KEY_HEADER = "-----BEGIN PRIVATE KEY-----";
const PRIVATE_KEY_FOOTER = "-----END PRIVATE KEY-----";

export class FirebaseAdminConfigurationError extends Error {
  constructor() {
    super("Firebase Admin configuration is invalid.");
    this.name = "FirebaseAdminConfigurationError";
  }
}

function readRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new FirebaseAdminConfigurationError();
  }

  return value;
}

function getFirebaseAdminApp(): App {
  if (getApps().length > 0) {
    return getApp();
  }

  const projectId = readRequiredEnv("FIREBASE_ADMIN_PROJECT_ID");
  const clientEmail = readRequiredEnv("FIREBASE_ADMIN_CLIENT_EMAIL");
  const privateKey = readRequiredEnv("FIREBASE_ADMIN_PRIVATE_KEY").replace(
    /\\n/g,
    "\n"
  );

  if (
    !PROJECT_ID_PATTERN.test(projectId) ||
    !CLIENT_EMAIL_PATTERN.test(clientEmail) ||
    !privateKey.includes(PRIVATE_KEY_HEADER) ||
    !privateKey.includes(PRIVATE_KEY_FOOTER)
  ) {
    throw new FirebaseAdminConfigurationError();
  }

  return initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
    projectId,
  });
}

export function getFirebaseAdminAuth(): Auth {
  return getAuth(getFirebaseAdminApp());
}
