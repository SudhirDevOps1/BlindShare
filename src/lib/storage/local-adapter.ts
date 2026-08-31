import { StorageAdapter, StoragePresignResult } from "./types";
import fs from "fs";
import path from "path";

export class LocalStorageAdapter implements StorageAdapter {
  name = "local";
  private storageDir: string;

  constructor() {
    this.storageDir = path.join(process.cwd(), ".storage_blobs");
    if (!fs.existsSync(this.storageDir)) {
      try {
        fs.mkdirSync(this.storageDir, { recursive: true });
      } catch (e) {
        console.warn("Could not create local storage dir, using /tmp/blindshare_blobs:", e);
        this.storageDir = "/tmp/blindshare_blobs";
        if (!fs.existsSync(this.storageDir)) {
          fs.mkdirSync(this.storageDir, { recursive: true });
        }
      }
    }
  }

  private getFilePath(key: string): string {
    const sanitizedKey = key.replace(/[^a-zA-Z0-9_\-\.]/g, "_");
    return path.join(this.storageDir, sanitizedKey);
  }

  async getPresignedPutUrl(key: string, contentType: string, expiresInSec = 600): Promise<StoragePresignResult> {
    const baseUrl = process.env.PUBLIC_APP_URL || "http://localhost:3000";
    return {
      url: `${baseUrl}/api/storage/local-upload?key=${encodeURIComponent(key)}`,
      method: "PUT",
      expiresInSeconds: expiresInSec,
    };
  }

  async getPresignedGetUrl(key: string, expiresInSec = 300): Promise<StoragePresignResult> {
    const baseUrl = process.env.PUBLIC_APP_URL || "http://localhost:3000";
    return {
      url: `${baseUrl}/api/storage/local-download?key=${encodeURIComponent(key)}`,
      method: "GET",
      expiresInSeconds: expiresInSec,
    };
  }

  async putObject(key: string, body: Buffer | Uint8Array, contentType: string): Promise<void> {
    const filePath = this.getFilePath(key);
    const buf = Buffer.isBuffer(body) ? body : Buffer.from(body);
    await fs.promises.writeFile(filePath, buf);
  }

  async getObject(key: string): Promise<{ data: Buffer; contentType: string } | null> {
    try {
      const filePath = this.getFilePath(key);
      if (!fs.existsSync(filePath)) return null;
      const data = await fs.promises.readFile(filePath);
      return {
        data,
        contentType: "application/octet-stream",
      };
    } catch {
      return null;
    }
  }

  async deleteObject(key: string): Promise<boolean> {
    try {
      const filePath = this.getFilePath(key);
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
      }
      return true;
    } catch {
      return false;
    }
  }

  async listObjects(prefix?: string): Promise<string[]> {
    try {
      if (!fs.existsSync(this.storageDir)) return [];
      const files = await fs.promises.readdir(this.storageDir);
      if (prefix) {
        return files.filter((f) => f.startsWith(prefix));
      }
      return files;
    } catch {
      return [];
    }
  }
}
