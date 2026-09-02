import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { StorageAdapter, StoragePresignResult } from "./types";

export class R2StorageAdapter implements StorageAdapter {
  name = "r2";
  private client: S3Client;
  private bucket: string;

  constructor() {
    const accountId = process.env.R2_ACCOUNT_ID || process.env.CF_ACCOUNT_ID || "";
    const endpoint = `https://${accountId}.r2.cloudflarestorage.com`;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID || "";
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || "";
    this.bucket = process.env.R2_BUCKET || "blindshare-cipher";

    this.client = new S3Client({
      endpoint,
      region: "auto",
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      forcePathStyle: true,
    });
  }

  async getPresignedPutUrl(key: string, contentType: string, expiresInSec = 600): Promise<StoragePresignResult> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });
    const url = await getSignedUrl(this.client, command, { expiresIn: expiresInSec });
    return {
      url,
      method: "PUT",
      expiresInSeconds: expiresInSec,
    };
  }

  async getPresignedGetUrl(key: string, expiresInSec = 300): Promise<StoragePresignResult> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });
    const url = await getSignedUrl(this.client, command, { expiresIn: expiresInSec });
    return {
      url,
      method: "GET",
      expiresInSeconds: expiresInSec,
    };
  }

  async putObject(key: string, body: Buffer | Uint8Array, contentType: string): Promise<void> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    });
    await this.client.send(command);
  }

  async getObject(key: string): Promise<{ data: Buffer; contentType: string } | null> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });
      const response = await this.client.send(command);
      if (!response.Body) return null;
      const streamToBuffer = async (stream: any): Promise<Buffer> => {
        const chunks: Buffer[] = [];
        for await (const chunk of stream) {
          chunks.push(Buffer.from(chunk));
        }
        return Buffer.concat(chunks);
      };
      const buffer = await streamToBuffer(response.Body);
      return {
        data: buffer,
        contentType: response.ContentType || "application/octet-stream",
      };
    } catch {
      return null;
    }
  }

  async deleteObject(key: string): Promise<boolean> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });
      await this.client.send(command);
      return true;
    } catch {
      return false;
    }
  }

  async listObjects(prefix?: string): Promise<string[]> {
    try {
      const command = new ListObjectsV2Command({
        Bucket: this.bucket,
        Prefix: prefix,
      });
      const response = await this.client.send(command);
      return (response.Contents || []).map((c) => c.Key!).filter(Boolean);
    } catch {
      return [];
    }
  }

  async getBucketUsage(prefix?: string): Promise<{ totalBytes: number; objectCount: number }> {
    try {
      let totalBytes = 0;
      let objectCount = 0;
      let continuationToken: string | undefined = undefined;

      do {
        const cmd: ListObjectsV2Command = new ListObjectsV2Command({
          Bucket: this.bucket,
          Prefix: prefix,
          ContinuationToken: continuationToken,
        });
        const res: any = await this.client.send(cmd);
        if (res.Contents) {
          for (const item of res.Contents) {
            totalBytes += (item.Size || 0);
            objectCount++;
          }
        }
        continuationToken = res.NextContinuationToken;
      } while (continuationToken);

      return { totalBytes, objectCount };
    } catch {
      return { totalBytes: 0, objectCount: 0 };
    }
  }
}
