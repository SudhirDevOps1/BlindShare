import { StorageAdapter } from "./types";
import { B2StorageAdapter } from "./b2-adapter";
import { R2StorageAdapter } from "./r2-adapter";
import { LocalStorageAdapter } from "./local-adapter";

let storageInstance: StorageAdapter | null = null;

export function getStorageAdapter(): StorageAdapter {
  if (storageInstance) return storageInstance;

  const target = (process.env.STORE_TARGET || "local").toLowerCase();

  // If credentials exist for B2, use B2
  if (target === "b2" && process.env.B2_KEY_ID && process.env.B2_APPLICATION_KEY) {
    storageInstance = new B2StorageAdapter();
  } else if (target === "r2" && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY) {
    storageInstance = new R2StorageAdapter();
  } else {
    storageInstance = new LocalStorageAdapter();
  }

  return storageInstance;
}

export * from "./types";
