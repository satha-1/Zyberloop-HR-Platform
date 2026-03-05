import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import crypto from 'crypto';
import { IOverlayField } from '../pdfTemplateVersion.model';
import { ISignRequestFieldValue } from '../signRequestFieldValue.model';

/**
 * PDF service for:
 * - Extracting page info from uploaded PDFs
 * - Stamping field values (text, signatures, dates, stamps) onto a PDF
 * - Flattening / finalising
 */
class PdfService {
  /**
   * Extract page count and page sizes from a PDF buffer.
   */
  async extractPageInfo(pdfBuffer: Buffer): Promise<{
    pageCount: number;
    pageSizes: Array<{ width: number; height: number }>;
  }> {
    const pdfDoc = await PDFDocument.load(pdfBuffer, { ignoreEncryption: true });
    const pages = pdfDoc.getPages();
    const pageSizes = pages.map((page) => {
      const { width, height } = page.getSize();
      return { width, height };
    });
    return { pageCount: pages.length, pageSizes };
  }

  /**
   * Stamp all field values onto the source PDF and return the final PDF buffer.
   * Coordinates are normalised (0..1), so we convert them to PDF points.
   */
  async stampFieldValues(
    sourcePdfBuffer: Buffer,
    overlayFields: IOverlayField[],
    fieldValues: ISignRequestFieldValue[],
    signatureImageBuffers: Map<string, Buffer> // fieldId -> PNG buffer
  ): Promise<{ pdfBuffer: Buffer; sha256: string }> {
    const pdfDoc = await PDFDocument.load(sourcePdfBuffer, { ignoreEncryption: true });
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const pages = pdfDoc.getPages();

    for (const field of overlayFields) {
      const page = pages[field.pageIndex];
      if (!page) continue;

      const { width: pageW, height: pageH } = page.getSize();
      const x = field.x * pageW;
      const y = pageH - (field.y * pageH) - (field.height * pageH); // PDF origin is bottom-left
      const fieldW = field.width * pageW;
      const fieldH = field.height * pageH;

      // Handle static_text (placed by HR at template design time)
      if (field.type === 'static_text' && field.staticText) {
        const fontSize = field.fontSize || 12;
        page.drawText(field.staticText, {
          x,
          y: y + fieldH - fontSize,
          size: fontSize,
          font: helvetica,
          color: field.fontColor ? this.parseColor(field.fontColor) : rgb(0, 0, 0),
          maxWidth: fieldW,
        });
        continue;
      }

      // Find the field value submitted by the signer
      const fv = fieldValues.find((v) => v.fieldId === field.fieldId);
      if (!fv) continue;

      switch (field.type) {
        case 'text': {
          const fontSize = field.fontSize || 12;
          page.drawText(fv.value || '', {
            x,
            y: y + fieldH - fontSize,
            size: fontSize,
            font: helvetica,
            color: rgb(0, 0, 0),
            maxWidth: fieldW,
          });
          break;
        }

        case 'date': {
          const fontSize = field.fontSize || 12;
          page.drawText(fv.value || '', {
            x,
            y: y + fieldH - fontSize,
            size: fontSize,
            font: helvetica,
            color: rgb(0, 0, 0),
          });
          break;
        }

        case 'checkbox': {
          if (fv.value === 'true') {
            const fontSize = 14;
            page.drawText('✓', {
              x: x + 2,
              y: y + fieldH - fontSize,
              size: fontSize,
              font: helvetica,
              color: rgb(0, 0, 0),
            });
          }
          break;
        }

        case 'signature':
        case 'initials':
        case 'stamp': {
          const imgBuf = signatureImageBuffers.get(field.fieldId);
          if (imgBuf) {
            try {
              const pngImage = await pdfDoc.embedPng(imgBuf);
              page.drawImage(pngImage, {
                x,
                y,
                width: fieldW,
                height: fieldH,
              });
            } catch {
              // If PNG fails, try JPEG
              try {
                const jpgImage = await pdfDoc.embedJpg(imgBuf);
                page.drawImage(jpgImage, {
                  x,
                  y,
                  width: fieldW,
                  height: fieldH,
                });
              } catch (e) {
                console.error(`Failed to embed image for field ${field.fieldId}:`, e);
              }
            }
          }
          break;
        }
      }
    }

    const pdfBytes = await pdfDoc.save();
    const pdfBuffer = Buffer.from(pdfBytes);
    const sha256 = crypto.createHash('sha256').update(pdfBuffer).digest('hex');

    return { pdfBuffer, sha256 };
  }

  /**
   * Generate an audit certificate as a JSON string (optionally could be PDF in future).
   */
  generateAuditCertificate(auditTrail: any[], envelopeId: string, signedPdfHash: string): string {
    return JSON.stringify(
      {
        envelopeId,
        signedPdfSha256: signedPdfHash,
        generatedAt: new Date().toISOString(),
        events: auditTrail,
      },
      null,
      2
    );
  }

  async generateAuditCertificatePdf(
    auditTrail: any[],
    envelopeId: string,
    signedPdfHash: string
  ): Promise<Buffer> {
    const pdfDoc = await PDFDocument.create();
    let page = pdfDoc.addPage([595, 842]); // A4 portrait
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    let y = 810;
    page.drawText('ZyberHR eSignature Audit Certificate', { x: 40, y, size: 16, font: bold, color: rgb(0, 0, 0) });
    y -= 26;
    page.drawText(`Envelope ID: ${envelopeId}`, { x: 40, y, size: 10, font });
    y -= 14;
    page.drawText(`Generated At: ${new Date().toISOString()}`, { x: 40, y, size: 10, font });
    y -= 14;
    page.drawText(`Final PDF SHA-256: ${signedPdfHash}`, { x: 40, y, size: 10, font });
    y -= 22;
    page.drawText('Events', { x: 40, y, size: 12, font: bold });
    y -= 16;

    for (const event of auditTrail) {
      const eventTime = event?.timestamp ? new Date(event.timestamp).toISOString() : 'n/a';
      const line = `[${eventTime}] ${event?.eventType || 'event'} | actor=${event?.actorEmail || event?.actorUserId || 'system'} | ip=${event?.ip || 'n/a'}`;
      page.drawText(line.slice(0, 120), { x: 40, y, size: 9, font });
      y -= 12;
      if (y < 50) {
        page = pdfDoc.addPage([595, 842]);
        y = 810;
      }
    }

    return Buffer.from(await pdfDoc.save());
  }

  private parseColor(hex: string) {
    const cleaned = hex.replace('#', '');
    const r = parseInt(cleaned.substring(0, 2), 16) / 255;
    const g = parseInt(cleaned.substring(2, 4), 16) / 255;
    const b = parseInt(cleaned.substring(4, 6), 16) / 255;
    return rgb(r, g, b);
  }
}

export const pdfService = new PdfService();
