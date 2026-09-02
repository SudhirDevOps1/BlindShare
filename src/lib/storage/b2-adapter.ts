import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { StorageAdapter, StoragePresignResult } from "./types";

export class B2StorageAdapter implements StorageAdapter {
  name = "b2";
  private client: S3Client;
  private bucket: string;
  private putExpirySec: number;
  private getExpirySec: number;

  constructor() {
    const endpoint = process.env.B2_ENDPOINT || "s3.us-east-005.backblazeb2.com";
    const formattedEndpoint = endpoint.startsWith("http") ? endpoint : `https://${endpoint}`;
    const region = process.env.B2_REGION || "us-east-005";
    const accessKeyId = process.env.B2_KEY_ID || "";
    const secretAccessKey = process.env.B2_APPLICATION_KEY || "";
    this.bucket = process.env.B2_BUCKET || "blindshare-cipher";
    this.putExpirySec = parseInt(process.env.B2_PRESIGN_PUT_EXPIRY_SEC || "600", 10);
    this.getExpirySec = parseInt(process.env.B2_PRESIGN_GET_EXPIRY_SEC || "300", 10);

    this.client = new S3Client({
      endpoint: formattedEndpoint,
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      forcePathStyle: true,
    });
  }

  private maskSignature(url: string): string {
    return url.replace(/X-Amz-Signature=[a-f0-9]+/gi, "X-Amz-Signature=***MASKED***");
  }

  async getPresignedPutUrl(key: string, contentType: string, expiresInSec?: number): Promise<StoragePresignResult> {
    const expiry = expiresInSec || this.putExpirySec;
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });
    const url = await getSignedUrl(this.client, command, { expiresIn: expiry });
    return {
      url,
      method: "PUT",
      expiresInSeconds: expiry,
    };
  }

  async getPresignedGetUrl(key: string, expiresInSec?: number): Promise<StoragePresignResult> {
    const expiry = expiresInSec || this.getExpirySec;
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });
    const url = await getSignedUrl(this.client, command, { expiresIn: expiry });
    return {
      url,
      method: "GET",
      expiresInSeconds: expiry,
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
