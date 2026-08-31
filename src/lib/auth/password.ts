import bcrypt from "bcryptjs";

/**
 * Strict-by-default cost factor (12 rounds ≈ 2x the old default of 10), tunable
 * via BCRYPT_COST_FACTOR for hosts with tighter CPU-time budgets (e.g. CF Workers
 * 10ms CPU limit — lower the cost factor there and document the trade-off).
 */
function costFactor(): number {
  const raw = Number(process.env.BCRYPT_COST_FACTOR || "12");
  return Number.isFinite(raw) && raw >= 10 && raw <= 15 ? raw : 12;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(costFactor());
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hash);
  } catch {
    return false;
  }
}
