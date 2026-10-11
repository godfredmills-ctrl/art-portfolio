import bcrypt from "bcryptjs";

const ROUNDS = 12;

// Compared against when the user doesn't exist so response timing doesn't
// reveal which emails have accounts.
const DUMMY_HASH = "$2b$12$2FVFlAvyAzAXAH5HPexpXeBcsN11d5.ZqerrWNGu3v3pY1HFxnLEW";

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, ROUNDS);
}

export async function verifyPassword(password: string, hash: string | null): Promise<boolean> {
  const ok = await bcrypt.compare(password, hash ?? DUMMY_HASH);
  return hash !== null && ok;
}
