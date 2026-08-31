export interface StoragePresignResult {
  url: string;
  method: "PUT" | "GET";
  headers?: Record<string, string>;
  expiresInSeconds: number;
}

export interface StorageAdapter {
  name: string;
  getPresignedPutUrl(key: string, contentType: string, expiresInSec?: number): Promise<StoragePresignResult>;
  getPresignedGetUrl(key: string, expiresInSec?: number): Promise<StoragePresignResult>;
  putObject(key: string, body: Buffer | Uint8Array, contentType: string): Promise<void>;
  getObject(key: string): Promise<{ data: Buffer; contentType: string } | null>;
  deleteObject(key: string): Promise<boolean>;
  listObjects(prefix?: string): Promise<string[]>;
}
