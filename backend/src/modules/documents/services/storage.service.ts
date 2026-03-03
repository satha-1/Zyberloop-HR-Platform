import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { config } from '../../../config';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

// Use local storage only when no bucket is configured.
// On AWS EC2 we rely on IAM role credentials (no static keys required).
const USE_LOCAL_STORAGE = !config.s3.bucket;

class StorageService {
  private s3Client: S3Client | null = null;
  private localStoragePath: string;

  constructor() {
    if (!USE_LOCAL_STORAGE) {
      const clientConfig: ConstructorParameters<typeof S3Client>[0] = {
        region: config.s3.region,
        endpoint: config.s3.endpoint,
        forcePathStyle: config.s3.forcePathStyle,
      };

      // Only set static credentials when both values are provided.
      // Otherwise AWS SDK uses the default credential chain (IAM role, etc.).
      if (config.s3.accessKeyId && config.s3.secretAccessKey) {
        clientConfig.credentials = {
          accessKeyId: config.s3.accessKeyId,
          secretAccessKey: config.s3.secretAccessKey,
        };
      }

      this.s3Client = new S3Client(clientConfig);
    }
    this.localStoragePath = path.join(process.cwd(), 'uploads', 'documents');
    if (USE_LOCAL_STORAGE && !fs.existsSync(this.localStoragePath)) {
      fs.mkdirSync(this.localStoragePath, { recursive: true });
    }
  }

  /**
   * Upload a file to storage
   */
  async putObject(key: string, buffer: Buffer, contentType: string): Promise<string> {
    if (USE_LOCAL_STORAGE) {
      const filePath = path.join(this.localStoragePath, key);
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(filePath, buffer);
      return `/uploads/documents/${key}`;
    }

    const command = new PutObjectCommand({
      Bucket: config.s3.bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    });

    await this.s3Client!.send(command);
    return key;
  }

  /**
   * Generate a presigned URL for downloading
   */
  async getPresignedUrl(key: string, expiresIn: number = config.documents.presignedUrlTTL): Promise<string> {
    if (USE_LOCAL_STORAGE) {
      // For local storage, return a direct URL (in production, you'd want to serve this through your API)
      const filePath = path.join(this.localStoragePath, key);
      if (!fs.existsSync(filePath)) {
        throw new Error('File not found');
      }
      // Return a path that can be served by Express static middleware
      return `/uploads/documents/${key}`;
    }

    const command = new GetObjectCommand({
      Bucket: config.s3.bucket,
      Key: key,
    });

    return await getSignedUrl(this.s3Client!, command, { expiresIn });
  }

  /**
   * Delete an object
   */
  async deleteObject(key: string): Promise<void> {
    if (USE_LOCAL_STORAGE) {
      const filePath = path.join(this.localStoragePath, key);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      return;
    }

    const command = new DeleteObjectCommand({
      Bucket: config.s3.bucket,
      Key: key,
    });

    await this.s3Client!.send(command);
  }

  /**
   * Check if object exists
   */
  async objectExists(key: string): Promise<boolean> {
    if (USE_LOCAL_STORAGE) {
      const filePath = path.join(this.localStoragePath, key);
      return fs.existsSync(filePath);
    }

    try {
      const command = new HeadObjectCommand({
        Bucket: config.s3.bucket,
        Key: key,
      });
      await this.s3Client!.send(command);
      return true;
    } catch (error: any) {
      if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Compute SHA-256 hash of buffer
   */
  computeHash(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  /**
   * Generate storage key for a document artefact
   */
  generateDocumentKey(tenantId: string | undefined, documentId: string, kind: string, extension: string = 'pdf'): string {
    const tenantPrefix = tenantId ? `tenants/${tenantId}/` : '';
    return `${tenantPrefix}documents/${documentId}/${kind}.${extension}`;
  }
}

export const storageService = new StorageService();
