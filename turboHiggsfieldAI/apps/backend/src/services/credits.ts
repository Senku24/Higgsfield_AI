import { db } from "../../prisma/db";
import { CREDITS_CONFIG } from "@repo/config";

export async function getUserCreditBalance(userId: string): Promise<number> {
  const entries: any[] = (await db.orm.public.CreditLedgerEntry.where({ userId }).all()) || [];
  const balance = entries.reduce((sum: number, entry: any) => sum + (entry.amount || 0), 0);
  return balance;
}

export async function grantSignupCredits(userId: string): Promise<void> {
  const idempotencyKey = `signup_grant_${userId}`;
  const existing = await db.orm.public.CreditLedgerEntry
    .where({ idempotencyKey })
    .first();

  if (existing) return;

  await db.orm.public.CreditLedgerEntry.create({
    userId,
    amount: CREDITS_CONFIG.signupGrant,
    reason: "signup_grant",
    idempotencyKey,
  });
}

export async function debitCredits(
  userId: string,
  costAmount: number,
  reason: "avatar_generation" | "video_generation",
  refId: string,
  idempotencyKey: string
): Promise<void> {
  // Idempotency check first
  const existing = await db.orm.public.CreditLedgerEntry
    .where({ idempotencyKey })
    .first();

  if (existing) return;

  // Calculate current balance
  const currentBalance = await getUserCreditBalance(userId);
  if (currentBalance < costAmount) {
    throw new Error(`Insufficient credits. Required: ${costAmount}, Available: ${currentBalance}`);
  }

  // Create debit entry (negative amount)
  await db.orm.public.CreditLedgerEntry.create({
    userId,
    amount: -costAmount,
    reason,
    refId,
    idempotencyKey,
  });
}
