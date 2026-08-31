export type DocsEncryptionMode = "e2ee-fragment" | "plain-cipher-at-rest";

export interface EncryptedPayload {
  ciphertext: ArrayBuffer;
  iv: Uint8Array;
  tag?: Uint8Array;
}

export interface WrappedKeyPayload {
  wrappedKeyHex: string;
  saltHex: string;
  iterations: number;
  algorithm: string;
}

export interface KeyStoreAdapter {
  storeKey(docId: string, keyBytes: Uint8Array): Promise<void>;
  retrieveKey(docId: string): Promise<Uint8Array | null>;
  deleteKey(docId: string): Promise<void>;
}

export interface PushAdapter {
  subscribe(): Promise<PushSubscription | null>;
  unsubscribe(): Promise<boolean>;
  getSubscription(): Promise<PushSubscription | null>;
}

export interface PlatformAdapter {
  isNative: boolean;
  platformName: "web" | "android" | "ios";
  shareUrl(title: string, url: string): Promise<boolean>;
  copyToClipboard(text: string): Promise<boolean>;
}
