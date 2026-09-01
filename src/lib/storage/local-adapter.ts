import { StorageAdapter, StoragePresignResult } from "./types";
import fs from "fs";
import path from "path";
import os from "os";

export class LocalStorageAdapter implements StorageAdapter {
  name = "local";
  private storageDir: string;

  constructor() {
    this.storageDir = path.resolve(process.cwd(), ".storage_blobs");
    if (!fs.existsSync(this.storageDir)) {
      try {
        fs.mkdirSync(this.storageDir, { recursive: true, mode: 0o700 });
      } catch {
        this.storageDir = path.resolve(os.tmpdir(), "blindshare_vault");
        if (!fs.existsSync(this.storageDir)) {
          fs.mkdirSync(this.storageDir, { recursive: true, mode: 0o700 });
        }
      }
    }
  }

  private getFilePath(key: string): string {
    const cleanKey = path.basename(key).replace(/[^a-zA-Z0-9_\-\.]/g, "_");
    const safeKey = cleanKey || "unnamed_blob";
    const resolvedPath = path.resolve(this.storageDir, safeKey);
    const resolvedRoot = path.resolve(this.storageDir);
    if (!resolvedPath.startsWith(resolvedRoot)) {
      throw new Error("Security violation: Path traversal attempt detected");
    }
    return resolvedPath;
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
