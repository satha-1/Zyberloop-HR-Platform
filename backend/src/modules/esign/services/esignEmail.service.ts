import nodemailer from 'nodemailer';
import { config } from '../../../config';

/**
 * Email service for sending sign request emails.
 * Uses nodemailer with SMTP transport.
 * Falls back to console.log in development if no SMTP is configured.
 */
class EsignEmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (smtpHost && smtpUser && smtpPass) {
      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });
    }
  }

  /**
   * Send a sign request email to a recipient.
   */
  async sendSignRequestEmail(params: {
    recipientName: string;
    recipientEmail: string;
    documentName: string;
    senderName: string;
    signingLink: string;
    expiryDate?: Date;
    customSubject?: string;
    customBody?: string;
  }): Promise<void> {
    const subject =
      params.customSubject || `${params.senderName} has sent you "${params.documentName}" for signature`;

    const expiryText = params.expiryDate
      ? `<p style="color:#666;font-size:13px;">This signing request expires on <strong>${params.expiryDate.toLocaleDateString()}</strong>.</p>`
      : '';

    const bodyHtml = params.customBody
      ? `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
          <h2 style="color:#1a1a1a;">Document Signing Request</h2>
          <p>${params.customBody}</p>
          ${expiryText}
          <a href="${params.signingLink}" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 32px;border-radius:6px;text-decoration:none;font-weight:600;margin:16px 0;">Review & Sign</a>
          <p style="color:#999;font-size:12px;margin-top:24px;">Powered by ZyberHR</p>
        </div>`
      : `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
          <h2 style="color:#1a1a1a;">Document Signing Request</h2>
          <p>Hello ${params.recipientName},</p>
          <p><strong>${params.senderName}</strong> has sent you the document <strong>"${params.documentName}"</strong> for your electronic signature.</p>
          ${expiryText}
          <a href="${params.signingLink}" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 32px;border-radius:6px;text-decoration:none;font-weight:600;margin:16px 0;">Review & Sign</a>
          <p style="color:#999;font-size:12px;margin-top:24px;">If you did not expect this request, please ignore this email.</p>
          <p style="color:#999;font-size:12px;">Powered by ZyberHR</p>
        </div>`;

    if (this.transporter) {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM || `"ZyberHR" <noreply@zyberhr.com>`,
        to: params.recipientEmail,
        subject,
        html: bodyHtml,
      });
      console.log(`[EsignEmail] Sent sign request email to ${params.recipientEmail}`);
    } else {
      // Development fallback: log the email
      console.log(`[EsignEmail] (DEV) Would send email to ${params.recipientEmail}`);
      console.log(`[EsignEmail] Subject: ${subject}`);
      console.log(`[EsignEmail] Signing Link: ${params.signingLink}`);
    }
  }

  /**
   * Send a notification that signing is complete.
   */
  async sendSigningCompleteEmail(params: {
    recipientEmail: string;
    recipientName: string;
    documentName: string;
    downloadLink?: string;
  }): Promise<void> {
    const subject = `"${params.documentName}" has been signed`;
    const bodyHtml = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
      <h2 style="color:#1a1a1a;">Signing Complete</h2>
      <p>Hello ${params.recipientName},</p>
      <p>The document <strong>"${params.documentName}"</strong> has been signed successfully.</p>
      ${params.downloadLink ? `<a href="${params.downloadLink}" style="display:inline-block;background:#16a34a;color:#fff;padding:12px 32px;border-radius:6px;text-decoration:none;font-weight:600;margin:16px 0;">Download Signed Document</a>` : ''}
      <p style="color:#999;font-size:12px;margin-top:24px;">Powered by ZyberHR</p>
    </div>`;

    if (this.transporter) {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM || `"ZyberHR" <noreply@zyberhr.com>`,
        to: params.recipientEmail,
        subject,
        html: bodyHtml,
      });
    } else {
      console.log(`[EsignEmail] (DEV) Signing complete notification to ${params.recipientEmail}`);
    }
  }

  async sendReminderEmail(params: {
    recipientName: string;
    recipientEmail: string;
    documentName: string;
    signingLink: string;
    expiryDate?: Date;
  }): Promise<void> {
    const subject = `Reminder: "${params.documentName}" is awaiting your signature`;
    const expiryText = params.expiryDate
      ? `<p style="color:#666;font-size:13px;">This signing request expires on <strong>${params.expiryDate.toLocaleDateString()}</strong>.</p>`
      : '';
    const bodyHtml = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
      <h2 style="color:#1a1a1a;">Signature Reminder</h2>
      <p>Hello ${params.recipientName},</p>
      <p>This is a reminder that <strong>"${params.documentName}"</strong> is still pending your signature.</p>
      ${expiryText}
      <a href="${params.signingLink}" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 32px;border-radius:6px;text-decoration:none;font-weight:600;margin:16px 0;">Review & Sign</a>
      <p style="color:#999;font-size:12px;">Powered by ZyberHR</p>
    </div>`;

    if (this.transporter) {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM || `"ZyberHR" <noreply@zyberhr.com>`,
        to: params.recipientEmail,
        subject,
        html: bodyHtml,
      });
    } else {
      console.log(`[EsignEmail] (DEV) Reminder email to ${params.recipientEmail}`);
      console.log(`[EsignEmail] Signing Link: ${params.signingLink}`);
    }
  }
}

export const esignEmailService = new EsignEmailService();
