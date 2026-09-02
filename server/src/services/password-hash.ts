/**
 * Exact port of the frontend's hashPassword() from src/lib/account-store.ts.
 * Must produce byte-identical hashes so existing Firestore accounts work.
 */
export function hashPassword(password: string): string {
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < password.length; i++) {
    const c = password.charCodeAt(i);
    h1 = (h1 ^ c) >>> 0;
    h1 = (h1 * 16777619) >>> 0;
    h2 = (h2 + c * (i + 7)) >>> 0;
    h2 = ((h2 << 5) | (h2 >>> 27)) >>> 0;
  }
  return `pp1$${h1.toString(16).padStart(8, "0")}${h2.toString(16).padStart(8, "0")}`;
}
