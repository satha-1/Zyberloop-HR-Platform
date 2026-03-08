import { storageService } from '../../documents/services/storage.service';
import { ComplianceAsset, IComplianceAsset } from '../compliance.model';
import { PutObjectRetentionCommand, PutObjectLegalHoldCommand, ObjectLockRetentionMode, ObjectLockLegalHoldStatus } from '@aws-sdk/client-s3';
import { config } from '../../../config';
import { S3Client } from '@aws-sdk/client-s3';
import mongoose from 'mongoose';

/**
 * Service for managing compliance assets (files stored in S3 with integrity hashing).
 */
class ComplianceAssetService {
  private s3Client: S3Client | null = null;
  private readonly objectLockEnabled: boolean;

  constructor() {
    this.objectLockEnabled = process.env.COMPLIANCE_OBJECT_LOCK_ENABLED === 'true';
    
    if (this.objectLockEnabled && config.s3.bucket) {
      const clientConfig: ConstructorParameters<typeof S3Client>[0] = {
        region: config.s3.region,
        endpoint: config.s3.endpoint,
        forcePathStyle: config.s3.forcePathStyle,
      };

      if (config.s3.accessKeyId && config.s3.secretAccessKey) {
        clientConfig.credentials = {
          accessKeyId: config.s3.accessKeyId,
          secretAccessKey: config.s3.secretAccessKey,
        };
      }

      this.s3Client = new S3Client(clientConfig);
    }
  }

  /**
   * Generate S3 key for compliance asset
   */
  generateKey(prefix: string, entityId: string, fileName: string, timestamp?: number): string {
    const ts = timestamp || Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    return `compliance/${prefix}/${entityId}/${ts}_${sanitizedFileName}`;
  }

  /**
   * Upload file buffer to S3, compute hash, create ComplianceAsset record
   */
  async uploadAsset(params: {
    buffer: Buffer;
    fileName: string;
    mimeType: string;
    prefix: string; // e.g., "filings", "permits", "audits"
    entityId: string; // filingId, permitId, auditId
    createdBy: mongoose.Types.ObjectId;
    applyImmutability?: boolean; // Apply Object Lock if enabled
    retentionDays?: number; // Retention period in days (default 7 years = 2555 days)
  }): Promise<IComplianceAsset> {
    const { buffer, fileName, mimeType, prefix, entityId, createdBy, applyImmutability, retentionDays } = params;

    // Compute SHA-256 hash
    const sha256 = storageService.computeHash(buffer);

    // Generate S3 key
    const s3Key = this.generateKey(prefix, entityId, fileName);

    // Upload to S3
    await storageService.putObject(s3Key, buffer, mimeType);

    // Apply Object Lock if requested and enabled
    let objectLockMode: 'GOVERNANCE' | 'COMPLIANCE' | null = null;
    let retainUntil: Date | null = null;

    if (applyImmutability && this.objectLockEnabled && this.s3Client && config.s3.bucket) {
      try {
        const retentionPeriod = retentionDays || 2555; // 7 years default
        retainUntil = new Date();
        retainUntil.setDate(retainUntil.getDate() + retentionPeriod);
        objectLockMode = 'COMPLIANCE'; // Use COMPLIANCE mode for audit-ready immutability

        const retentionCommand = new PutObjectRetentionCommand({
          Bucket: config.s3.bucket,
          Key: s3Key,
          Retention: {
            Mode: ObjectLockRetentionMode.COMPLIANCE,
            RetainUntilDate: retainUntil,
          },
        });

        await this.s3Client.send(retentionCommand);

        // Optionally apply legal hold
        const legalHoldCommand = new PutObjectLegalHoldCommand({
          Bucket: config.s3.bucket,
          Key: s3Key,
          LegalHold: {
            Status: ObjectLockLegalHoldStatus.ON,
          },
        });

        await this.s3Client.send(legalHoldCommand);
      } catch (error: any) {
        console.error('[ComplianceAsset] Failed to apply Object Lock:', error.message);
        // Continue without Object Lock if it fails (feature-flagged)
      }
    }

    // Create ComplianceAsset record
    const asset = new ComplianceAsset({
      bucket: config.s3.bucket || 'local',
      s3Key,
      fileName,
      mimeType,
      size: buffer.length,
      sha256,
      immutable: {
        objectLockEnabled: objectLockMode !== null,
        mode: objectLockMode,
        retainUntil,
        legalHold: objectLockMode !== null ? 'ON' : 'OFF',
      },
      createdBy,
    });

    await asset.save();
    return asset;
  }

  /**
   * Get presigned URL for downloading asset
   */
  async getDownloadUrl(asset: IComplianceAsset, expiresIn: number = 900): Promise<string> {
    return storageService.getPresignedUrl(asset.s3Key, expiresIn);
  }
}

export const complianceAssetService = new ComplianceAssetService();
