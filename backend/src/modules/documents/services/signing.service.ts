import { DocumentSignature, IDocumentSignature, SigningProvider } from '../documentSignature.model';
import { Document } from '../document.model';
import { AppError } from '../../../middlewares/errorHandler';
import mongoose from 'mongoose';

class SigningService {
  /**
   * Create a signing request (stub implementation)
   */
  async createSignRequest(
    documentId: string,
    provider: SigningProvider,
    signers: Array<{ name: string; email: string; role: string }>,
    mode: 'PROVIDER_ESIGN' | 'INTERNAL_PDF_CERT' = 'PROVIDER_ESIGN'
  ): Promise<{ provider: SigningProvider; launchUrl?: string; envelopeId?: string }> {
    const document = await Document.findById(documentId);
    if (!document) {
      throw new AppError(404, 'Document not found');
    }

    // Create signature record
    const signature = new DocumentSignature({
      documentId: document._id,
      mode,
      provider,
      signers: signers.map((s) => ({
        ...s,
        authMethod: 'EMAIL' as const,
      })),
      events: [
        {
          type: 'SENT',
          timestamp: new Date(),
        },
      ],
    });

    await signature.save();

    // Update document status
    document.status = 'SIGNING_PENDING';
    await document.save();

    // TODO: Integrate with actual signing provider
    // For now, return stub response
    if (provider === 'NONE') {
      return { provider: 'NONE' };
    }

    // Stub: In production, this would call the provider's API
    return {
      provider,
      launchUrl: `https://stub-signing-provider.com/sign/${signature._id}`,
      envelopeId: `ENV-${signature._id}`,
    };
  }

  /**
   * Handle webhook from signing provider (stub)
   */
  async handleWebhook(
    provider: SigningProvider,
    rawEvent: any
  ): Promise<void> {
    // TODO: Implement webhook handling for each provider
    // For now, this is a placeholder

    // Example structure:
    // 1. Verify webhook signature (provider-specific)
    // 2. Parse event type (SENT, VIEWED, SIGNED, DECLINED, etc.)
    // 3. Find signature record by providerEnvelopeId
    // 4. Update signature events
    // 5. If completed, download signed PDF and store as artefact
    // 6. Update document status to SIGNED

    console.log(`Webhook received from ${provider}:`, rawEvent);
  }

  /**
   * Get signature record for document
   */
  async getSignatureByDocumentId(documentId: string): Promise<IDocumentSignature | null> {
    return await DocumentSignature.findOne({ documentId });
  }
}

export const signingService = new SigningService();
