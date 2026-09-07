import "server-only";
import { handle } from "./handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const GET = handle;
export const POST = handle;
