import { NextRequest } from "next/server";

export function cronYetkili(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = req.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  if (header === expected) return true;
  const querySecret = req.nextUrl.searchParams.get("secret");
  return querySecret === secret;
}
