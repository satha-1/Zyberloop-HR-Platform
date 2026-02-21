import { Document, IDocument, DocumentStatus, ArtefactKind } from '../document.model';
import { AppError } from '../../../middlewares/errorHandler';
import { storageService } from './storage.service';
import { config } from '../../../config';
import mongoose from 'mongoose';

class DocumentService {
  /**
   * Create a document record
   */
  async createDocument(data: {
    tenantId?: mongoose.Types.ObjectId;
    docType: string;
    templateId: mongoose.Types.ObjectId;
    templateVersion: number;
    subjectType: string;
    subjectId: mongoose.Types.ObjectId | string;
    renderInputSnapshot: {
      sha256: string;
      storedObjectKey?: string;
      redactedPreview?: any;
    };
    artefacts: Array<{
      kind: ArtefactKind;
      objectKey: string;
      contentType: string;
      sha256: string;
      sizeBytes: number;
    }>;
    accessPolicy?: {
      viewRoles?: string[];
      downloadRoles?: string[];
      subjectCanView?: boolean;
    };
    expiresAt?: Date;
    createdBy: mongoose.Types.ObjectId;
  }): Promise<IDocument> {
    const doc = new Document({
      ...data,
      status: 'GENERATED',
    });

    return await doc.save();
  }

  /**
   * Get document by ID with RBAC check
   */
  async getDocumentById(
    documentId: string,
    requester: {
      id: string;
      roles: string[];
      subjectId?: string; // If requester is an employee/candidate
    }
  ): Promise<IDocument> {
    const doc = await Document.findById(documentId);
    if (!doc) {
      throw new AppError(404, 'Document not found');
    }

    // RBAC check
    if (!this.canAccessDocument(doc, requester)) {
      throw new AppError(403, 'Access denied');
    }

    return doc;
  }

  /**
   * Check if requester can access document
   */
  canAccessDocument(
    doc: IDocument,
    requester: {
      id: string;
      roles: string[];
      subjectId?: string;
    }
  ): boolean {
    // Admin/HR/Finance can access all documents
    if (requester.roles.some((r) => ['ADMIN', 'HR_ADMIN', 'FINANCE'].includes(r))) {
      return true;
    }

    // Subject can view their own documents if accessPolicy allows
    if (
      doc.accessPolicy?.subjectCanView &&
      requester.subjectId &&
      doc.subjectId.toString() === requester.subjectId
    ) {
      return true;
    }

    // Check role-based access
    if (doc.accessPolicy?.viewRoles) {
      return requester.roles.some((r) => doc.accessPolicy!.viewRoles!.includes(r));
    }

    return false;
  }

  /**
   * Check if requester can download document
   */
  canDownloadDocument(
    doc: IDocument,
    requester: {
      id: string;
      roles: string[];
      subjectId?: string;
    }
  ): boolean {
    // Admin/HR/Finance can download all documents
    if (requester.roles.some((r) => ['ADMIN', 'HR_ADMIN', 'FINANCE'].includes(r))) {
      return true;
    }

    // Subject can download their own documents if accessPolicy allows
    if (
      doc.accessPolicy?.subjectCanView &&
      requester.subjectId &&
      doc.subjectId.toString() === requester.subjectId
    ) {
      return true;
    }

    // Check role-based access
    if (doc.accessPolicy?.downloadRoles) {
      return requester.roles.some((r) => doc.accessPolicy!.downloadRoles!.includes(r));
    }

    return false;
  }

  /**
   * Create presigned download URL
   */
  async createDownloadLink(
    documentId: string,
    artefactKind: ArtefactKind = 'PDF_DELIVERABLE',
    requester: {
      id: string;
      roles: string[];
      subjectId?: string;
    },
    expiresIn?: number
  ): Promise<{ url: string; expiresAt: Date }> {
    const doc = await this.getDocumentById(documentId, requester);

    if (!this.canDownloadDocument(doc, requester)) {
      throw new AppError(403, 'Download access denied');
    }

    // Find artefact
    const artefact = doc.artefacts.find((a) => a.kind === artefactKind);
    if (!artefact) {
      // Fallback to PDF_MASTER if PDF_DELIVERABLE not found
      const masterArtefact = doc.artefacts.find((a) => a.kind === 'PDF_MASTER');
      if (!masterArtefact) {
        throw new AppError(404, 'Document artefact not found');
      }
      artefact.kind = 'PDF_MASTER';
    }

    const ttl = expiresIn || config.documents.presignedUrlTTL;
    const url = await storageService.getPresignedUrl(artefact.objectKey, ttl);
    const expiresAt = new Date(Date.now() + ttl * 1000);

    return { url, expiresAt };
  }

  /**
   * Update document status
   */
  async updateDocumentStatus(
    documentId: string,
    status: DocumentStatus
  ): Promise<IDocument> {
    const doc = await Document.findById(documentId);
    if (!doc) {
      throw new AppError(404, 'Document not found');
    }

    doc.status = status;
    return await doc.save();
  }

  /**
   * Add artefact to document
   */
  async addArtefact(
    documentId: string,
    artefact: {
      kind: ArtefactKind;
      objectKey: string;
      contentType: string;
      sha256: string;
      sizeBytes: number;
    }
  ): Promise<IDocument> {
    const doc = await Document.findById(documentId);
    if (!doc) {
      throw new AppError(404, 'Document not found');
    }

    doc.artefacts.push({
      ...artefact,
      createdAt: new Date(),
    });

    return await doc.save();
  }

  /**
   * Get documents with filters
   */
  async getDocuments(filters: {
    tenantId?: mongoose.Types.ObjectId;
    docType?: string;
    status?: DocumentStatus;
    subjectType?: string;
    subjectId?: mongoose.Types.ObjectId | string;
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<IDocument[]> {
    const query: any = {};

    if (filters.tenantId) {
      query.tenantId = filters.tenantId;
    }
    if (filters.docType) {
      query.docType = filters.docType;
    }
    if (filters.status) {
      query.status = filters.status;
    }
    if (filters.subjectType) {
      query.subjectType = filters.subjectType;
    }
    if (filters.subjectId) {
      query.subjectId = filters.subjectId;
    }
    if (filters.dateFrom || filters.dateTo) {
      query.createdAt = {};
      if (filters.dateFrom) {
        query.createdAt.$gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        query.createdAt.$lte = filters.dateTo;
      }
    }

    return await Document.find(query).sort({ createdAt: -1 });
  }
}

export const documentService = new DocumentService();
