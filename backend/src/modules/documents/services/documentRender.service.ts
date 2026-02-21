import Handlebars from 'handlebars';
import puppeteer from 'puppeteer';
import { Template, ITemplate } from '../template.model';
import { MergeContext } from './mergeContextResolver.service';
import { storageService } from './storage.service';
import { config } from '../../../config';
import crypto from 'crypto';

class DocumentRenderService {
  /**
   * Render HTML from template and context
   */
  renderHTML(template: ITemplate, context: MergeContext): string {
    if (template.engine === 'HANDLEBARS_HTML') {
      const compiled = Handlebars.compile(template.content);
      let html = compiled(context);

      // Validate no unresolved variables remain
      const unresolvedMatches = html.match(/\{\{[\w.]+}\}/g);
      if (unresolvedMatches && unresolvedMatches.length > 0) {
        console.warn('Unresolved template variables:', unresolvedMatches);
      }

      // Wrap in standard HTML structure with print styles
      return this.wrapHTML(html);
    }

    // For LIQUID_HTML, you'd use a Liquid engine here
    // For DOCX, you'd use a different approach
    throw new Error(`Template engine ${template.engine} not yet implemented`);
  }

  /**
   * Generate PDF from HTML using Puppeteer
   */
  async generatePDF(html: string, options?: {
    format?: 'A4' | 'Letter';
    margin?: { top?: string; right?: string; bottom?: string; left?: string };
  }): Promise<Buffer> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });

      const pdfBuffer = await page.pdf({
        format: options?.format || 'A4',
        margin: {
          top: options?.margin?.top || '20mm',
          right: options?.margin?.right || '15mm',
          bottom: options?.margin?.bottom || '20mm',
          left: options?.margin?.left || '15mm',
        },
        printBackground: true,
        displayHeaderFooter: true,
        headerTemplate: '<div style="font-size: 10px; text-align: center; width: 100%; padding: 0 15mm;"><span class="title"></span></div>',
        footerTemplate: '<div style="font-size: 10px; text-align: center; width: 100%; padding: 0 15mm;"><span class="pageNumber"></span> / <span class="totalPages"></span></div>',
      });

      return Buffer.from(pdfBuffer);
    } finally {
      await browser.close();
    }
  }

  /**
   * Wrap HTML content with standard structure and print styles
   */
  private wrapHTML(content: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @page {
      margin: 20mm 15mm;
      size: A4;
    }
    body {
      font-family: 'Arial', 'Helvetica', sans-serif;
      font-size: 12pt;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
    }
    h1, h2, h3 {
      color: #2c3e50;
      margin-top: 1em;
      margin-bottom: 0.5em;
    }
    p {
      margin: 0.5em 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 1em 0;
    }
    table th, table td {
      border: 1px solid #ddd;
      padding: 8px;
      text-align: left;
    }
    table th {
      background-color: #f2f2f2;
      font-weight: bold;
    }
    .text-center {
      text-align: center;
    }
    .text-right {
      text-align: right;
    }
    .mb-1 { margin-bottom: 0.5em; }
    .mb-2 { margin-bottom: 1em; }
    .mt-1 { margin-top: 0.5em; }
    .mt-2 { margin-top: 1em; }
    @media print {
      body {
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }
    }
  </style>
</head>
<body>
  ${content}
</body>
</html>
    `.trim();
  }

  /**
   * Generate document: render HTML, convert to PDF, store, return metadata
   */
  async generateDocument(
    template: ITemplate,
    context: MergeContext,
    contextHash: string,
    documentId: string,
    tenantId?: string
  ): Promise<{
    pdfBuffer: Buffer;
    pdfHash: string;
    objectKey: string;
  }> {
    // Render HTML
    const html = this.renderHTML(template, context);

    // Generate PDF
    const pdfBuffer = await this.generatePDF(html);

    // Compute hash
    const pdfHash = storageService.computeHash(pdfBuffer);

    // Generate storage key
    const objectKey = storageService.generateDocumentKey(tenantId, documentId, 'PDF_MASTER');

    // Store PDF
    await storageService.putObject(objectKey, pdfBuffer, 'application/pdf');

    return {
      pdfBuffer,
      pdfHash,
      objectKey,
    };
  }

  /**
   * Generate preview (HTML only, or small PDF)
   */
  async generatePreview(
    template: ITemplate,
    context: MergeContext,
    includePDF: boolean = false
  ): Promise<{ html: string; pdfBuffer?: Buffer }> {
    const html = this.renderHTML(template, context);

    if (includePDF) {
      const pdfBuffer = await this.generatePDF(html);
      return { html, pdfBuffer };
    }

    return { html };
  }
}

export const documentRenderService = new DocumentRenderService();
