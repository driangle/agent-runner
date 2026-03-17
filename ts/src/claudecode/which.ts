import { execSync } from "node:child_process";

/** Check if a binary exists on PATH. Returns the path or null. */
export function which(binary: string): string | null {
  try {
    return execSync(`which ${binary}`, { encoding: "utf8" }).trim() || null;
  } catch {
    return null;
  }
}
