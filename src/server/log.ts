import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";

export async function sistemLogYaz(opts: {
  actorId?: string | null;
  action: string;
  target?: string | null;
  payload?: unknown;
  ip?: string | null;
}) {
  await prisma.sistemLog.create({
    data: {
      actorId: opts.actorId ?? undefined,
      action: opts.action,
      target: opts.target ?? undefined,
      payload:
        opts.payload === undefined
          ? undefined
          : (opts.payload as Prisma.InputJsonValue),
      ip: opts.ip ?? undefined,
    },
  });
}
