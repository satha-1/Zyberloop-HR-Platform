import { storageService } from '../../documents/services/storage.service';

/**
 * Storage helpers specific to the eSign module.
 * Delegates all actual I/O to the shared StorageService (S3 / local fallback).
 */
class EsignStorageService {
  /** Template source PDFs */
  templateSourceKey(templateId: string, versionNumber: number): string {
    return `esign/templates/${templateId}/v${versionNumber}/source.pdf`;
  }

  /** Signature / initials / stamp images */
  signatureAssetKey(userId: string, assetId: string, ext: string = 'png'): string {
    return `esign/signatures/${userId}/${assetId}.${ext}`;
  }

  /** Working copy PDF for a sign request envelope */
  envelopeSourceKey(envelopeId: string): string {
    return `esign/envelopes/${envelopeId}/source.pdf`;
  }

  /** Final signed PDF */
  envelopeSignedKey(envelopeId: string): string {
    return `esign/envelopes/${envelopeId}/signed.pdf`;
  }

  /** Audit trail JSON */
  envelopeAuditKey(envelopeId: string): string {
    return `esign/envelopes/${envelopeId}/audit.json`;
  }

  // Delegate to shared storage
  async putObject(key: string, buffer: Buffer, contentType: string) {
    return storageService.putObject(key, buffer, contentType);
  }

  async getPresignedUrl(key: string, expiresIn?: number) {
    return storageService.getPresignedUrl(key, expiresIn || 60);
  }

  async deleteObject(key: string) {
    return storageService.deleteObject(key);
  }

  async objectExists(key: string) {
    return storageService.objectExists(key);
  }

  computeHash(buffer: Buffer) {
    return storageService.computeHash(buffer);
  }
}

export const esignStorageService = new EsignStorageService();
