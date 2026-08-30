export const PLAYWRIGHT_FIREBASE_STATE_KEY =
  "playwright-firebase-mock-state";

export type MockUser = {
  uid: string;
  email?: string | null;
  displayName?: string | null;
};

type AuthBehavior = {
  signInReject?: boolean;
  createUserReject?: boolean;
  updateProfileReject?: boolean;
  signOutReject?: boolean;
  authStateReject?: boolean;
};

export type FirebaseMockState = {
  user: MockUser | null;
  auth?: AuthBehavior;
  plans?: Array<Record<string, unknown>>;
  calls?: {
    signIn?: Array<{ email: string; password: string }>;
    createUser?: Array<{ email: string; password: string }>;
    updateProfile?: Array<{ displayName?: string | null }>;
    signOut?: number;
    getTravelPlans?: string[];
    getTravelPlan?: string[];
    deleteTravelPlan?: string[];
    updateTravelPlan?: Array<{
      id: string;
      data: Record<string, unknown>;
    }>;
    saveTravelPlan?: Array<{
      uid: string;
      plan: Record<string, unknown>;
    }>;
  };
};

function createDefaultState(): FirebaseMockState {
  return {
    user: null,
    plans: [],
    calls: {},
  };
}

export function readFirebaseMockState(): FirebaseMockState {
  if (typeof window === "undefined") {
    return createDefaultState();
  }

  const stored = window.localStorage.getItem(
    PLAYWRIGHT_FIREBASE_STATE_KEY
  );

  if (!stored) {
    return createDefaultState();
  }

  try {
    return JSON.parse(stored) as FirebaseMockState;
  } catch {
    return createDefaultState();
  }
}

export function writeFirebaseMockState(
  state: FirebaseMockState
): void {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(
    PLAYWRIGHT_FIREBASE_STATE_KEY,
    JSON.stringify(state)
  );
}

function updateState(
  update: (state: FirebaseMockState) => void
): FirebaseMockState {
  const state = readFirebaseMockState();
  state.calls ??= {};
  update(state);
  writeFirebaseMockState(state);
  return state;
}

export const auth = {
  get currentUser(): MockUser | null {
    return readFirebaseMockState().user;
  },
};

export function onAuthStateChanged(
  _auth: unknown,
  next: (user: MockUser | null) => void,
  error?: (reason: Error) => void
): () => void {
  let active = true;

  queueMicrotask(() => {
    if (!active) return;

    const state = readFirebaseMockState();

    if (state.auth?.authStateReject) {
      error?.(new Error("Mock authentication state failure."));
      return;
    }

    next(state.user);
  });

  return () => {
    active = false;
  };
}

export async function signInWithEmailAndPassword(
  _auth: unknown,
  email: string,
  password: string
) {
  const state = updateState((current) => {
    current.calls!.signIn ??= [];
    current.calls!.signIn.push({ email, password });
  });

  if (state.auth?.signInReject) {
    throw new Error("Mock sign-in failure.");
  }

  const user: MockUser = state.user ?? {
    uid: "mock-user",
    email,
    displayName: null,
  };

  updateState((current) => {
    current.user = user;
  });

  return { user };
}

export async function createUserWithEmailAndPassword(
  _auth: unknown,
  email: string,
  password: string
) {
  const state = updateState((current) => {
    current.calls!.createUser ??= [];
    current.calls!.createUser.push({ email, password });
  });

  if (state.auth?.createUserReject) {
    throw new Error("Mock user creation failure.");
  }

  const user: MockUser = state.user ?? {
    uid: "mock-user",
    email,
    displayName: null,
  };

  updateState((current) => {
    current.user = user;
  });

  return { user };
}

export async function updateProfile(
  user: MockUser,
  profile: { displayName?: string | null }
): Promise<void> {
  const state = updateState((current) => {
    current.calls!.updateProfile ??= [];
    current.calls!.updateProfile.push(profile);
  });

  if (state.auth?.updateProfileReject) {
    throw new Error("Mock profile update failure.");
  }

  updateState((current) => {
    current.user = {
      ...user,
      ...profile,
    };
  });
}

export async function signOut(_auth: unknown): Promise<void> {
  void _auth;

  const state = updateState((current) => {
    current.calls!.signOut =
      (current.calls!.signOut ?? 0) + 1;
  });

  if (state.auth?.signOutReject) {
    throw new Error("Mock sign-out failure.");
  }

  updateState((current) => {
    current.user = null;
  });
}
