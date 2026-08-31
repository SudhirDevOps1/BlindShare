import { KeyStoreAdapter, PushAdapter, PlatformAdapter } from "../types";

export class WebKeyStoreAdapter implements KeyStoreAdapter {
  private prefix = "blindshare_dockey_";

  async storeKey(docId: string, keyBytes: Uint8Array): Promise<void> {
    if (typeof window === "undefined") return;
    try {
      const hex = Array.from(keyBytes).map(b => b.toString(16).padStart(2, "0")).join("");
      sessionStorage.setItem(`${this.prefix}${docId}`, hex);
    } catch (e) {
      console.warn("SessionStorage unavailable for temporary key store:", e);
    }
  }

  async retrieveKey(docId: string): Promise<Uint8Array | null> {
    if (typeof window === "undefined") return null;
    try {
      const hex = sessionStorage.getItem(`${this.prefix}${docId}`);
      if (!hex) return null;
      const bytes = new Uint8Array(hex.length / 2);
      for (let i = 0; i < hex.length; i += 2) {
        bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
      }
      return bytes;
    } catch {
      return null;
    }
  }

  async deleteKey(docId: string): Promise<void> {
    if (typeof window === "undefined") return;
    sessionStorage.removeItem(`${this.prefix}${docId}`);
  }
}

export class WebPlatformAdapter implements PlatformAdapter {
  isNative = false;
  platformName = "web" as const;

  async shareUrl(title: string, url: string): Promise<boolean> {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, url });
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }

  async copyToClipboard(text: string): Promise<boolean> {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }
}
