import { KeyStoreAdapter, PushAdapter, PlatformAdapter } from "../types";

/**
 * Mobile Capacitor Platform Adapter Stub
 * Ready for Phase 4 Capacitor integration with @capacitor/preferences,
 * @capacitor/push-notifications, and @capacitor/share.
 */
export class CapacitorKeyStoreAdapter implements KeyStoreAdapter {
  private inMemoryMap = new Map<string, Uint8Array>();

  async storeKey(docId: string, keyBytes: Uint8Array): Promise<void> {
    // Phase 4: Use @capacitor-community/secure-storage or Keychain
    this.inMemoryMap.set(docId, keyBytes);
  }

  async retrieveKey(docId: string): Promise<Uint8Array | null> {
    return this.inMemoryMap.get(docId) || null;
  }

  async deleteKey(docId: string): Promise<void> {
    this.inMemoryMap.delete(docId);
  }
}

export class CapacitorPlatformAdapter implements PlatformAdapter {
  isNative = true;
  platformName = "android" as const;

  async shareUrl(title: string, url: string): Promise<boolean> {
    void title;
    void url;
    return true;
  }

  async copyToClipboard(text: string): Promise<boolean> {
    void text;
    return true;
  }
}
