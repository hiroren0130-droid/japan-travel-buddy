import type { ReactNode } from "react";

import { requireAdminSession } from "@/lib/auth/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Props = {
  children: ReactNode;
};

export default async function ProtectedAdminLayout({ children }: Props) {
  await requireAdminSession();

  return children;
}
