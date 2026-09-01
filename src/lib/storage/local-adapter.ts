import { StorageAdapter, StoragePresignResult } from "./types";
import fs from "fs";
import path from "path";
import crypto from "crypto";

export class LocalStorageAdapter implements StorageAdapter {
  name = "local";
  private storageDir: string;

  constructor() {
    this.storageDir = path.resolve(process.cwd(), ".storage_blobs");
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true, mode: 0o700 });
    }
  }

  private getFilePath(key: string): string {
    const rawKey = String(key || "").trim();
    if (!rawKey) {
      throw new Error("Security violation: Storage key cannot be empty");
    }
    // Deterministic cryptographic key digest prevents path traversal & arbitrary filesystem write
    const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");
    const safeFilename = `${keyHash}.blob`;
    const resolvedPath = path.resolve(this.storageDir, safeFilename);
    const resolvedRoot = path.resolve(this.storageDir);

    const rel = path.relative(resolvedRoot, resolvedPath);
    if (rel.startsWith("..") || path.isAbsolute(rel)) {
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
    const storageRoot = path.resolve(this.storageDir);
    if (!filePath.startsWith(storageRoot)) {
      throw new Error("Security violation: Invalid storage destination path");
    }
    const buf = Buffer.isBuffer(body) ? body : Buffer.from(body);
    const fd = await fs.promises.open(filePath, "w", 0o600);
    try {
      await fd.write(buf, 0, buf.length, 0);
    } finally {
      await fd.close();
    }
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
