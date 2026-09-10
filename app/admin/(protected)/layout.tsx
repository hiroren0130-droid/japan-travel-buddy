import type { ReactNode } from "react";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Props = {
  children: ReactNode;
};

export default function ProtectedAdminLayout({ children }: Props) {
  return children;
}
