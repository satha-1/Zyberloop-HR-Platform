import nodemailer from 'nodemailer';

/**
 * Email service for sending 360 feedback invitation emails.
 * Uses nodemailer with SMTP transport.
 * Falls back to console.log in development if no SMTP is configured.
 */
class Feedback360EmailService {
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
   * Send a 360 feedback invitation email to a rater.
   */
  async send360InviteEmail(params: {
    name: string;
    email: string;
    reviewedEmployeeName: string;
    link: string;
    deadlineAt?: Date | null;
    roleType: 'MANAGER' | 'PEER' | 'DIRECT_REPORT' | 'SELF';
  }): Promise<void> {
    const roleText = {
      MANAGER: 'as their manager',
      PEER: 'as their peer',
      DIRECT_REPORT: 'as their direct report',
      SELF: 'for self-assessment',
    }[params.roleType];

    const subject = `360 Feedback Request for ${params.reviewedEmployeeName}`;
    const deadlineText = params.deadlineAt
      ? `<p style="color:#666;font-size:13px;">Please complete your feedback by <strong>${params.deadlineAt.toLocaleDateString()}</strong>.</p>`
      : '';

    const bodyHtml = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
      <h2 style="color:#1a1a1a;">360 Feedback Request</h2>
      <p>Hello ${params.name},</p>
      <p>You have been requested to provide 360-degree feedback for <strong>${params.reviewedEmployeeName}</strong> ${roleText}.</p>
      <p>Your feedback is valuable and will help ${params.reviewedEmployeeName} understand their strengths and areas for development.</p>
      ${deadlineText}
      <a href="${params.link}" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 32px;border-radius:6px;text-decoration:none;font-weight:600;margin:16px 0;">Provide Feedback</a>
      <p style="color:#999;font-size:12px;margin-top:24px;">This link is unique to you and will expire once you submit your feedback.</p>
      <p style="color:#999;font-size:12px;">If you did not expect this request, please contact your HR department.</p>
      <p style="color:#999;font-size:12px;">Powered by ZyberHR</p>
    </div>`;

    if (this.transporter) {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM || `"ZyberHR" <noreply@zyberhr.com>`,
        to: params.email,
        subject,
        html: bodyHtml,
      });
      console.log(`[Feedback360Email] Sent invitation email to ${params.email}`);
    } else {
      // Development fallback: log the email
      console.log(`[Feedback360Email] (DEV) Would send email to ${params.email}`);
      console.log(`[Feedback360Email] Subject: ${subject}`);
      console.log(`[Feedback360Email] Feedback Link: ${params.link}`);
    }
  }
}

export const feedback360EmailService = new Feedback360EmailService();
