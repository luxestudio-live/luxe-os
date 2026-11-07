import nodemailer from 'nodemailer';
import { prisma } from './prisma';
import { decryptSecret } from './crypto';

export interface EmailOptions {
  toEmail: string;
  toName: string;
  subject: string;
  bodyHtml: string;
  bodyText?: string;
  eventType?: string;
}

export async function getTransporter() {
  const config = await prisma.smtpConfig.findUnique({
    where: { id: 'default' },
  });

  if (!config) {
    throw new Error('SMTP Configuration not found.');
  }

  const decryptedPassword = decryptSecret(config.passwordEncrypted);

  const isSecure = config.encryption === 'SSL_TLS' || config.port === 465;

  return {
    transporter: nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: isSecure,
      auth: {
        user: config.username,
        pass: decryptedPassword,
      },
      tls: {
        rejectUnauthorized: true,
      },
    }),
    config,
  };
}

export async function verifySmtpConnection(): Promise<{ success: boolean; message: string }> {
  try {
    const { transporter, config } = await getTransporter();
    await transporter.verify();

    await prisma.smtpConfig.update({
      where: { id: config.id },
      data: {
        isVerified: true,
        lastTestedAt: new Date(),
        testStatus: 'SUCCESS: Connection established and authenticated',
      },
    });

    return { success: true, message: 'SMTP server verified successfully.' };
  } catch (error: any) {
    const errorMsg = error?.message || 'Failed to connect to SMTP server';
    await prisma.smtpConfig.update({
      where: { id: 'default' },
      data: {
        isVerified: false,
        lastTestedAt: new Date(),
        testStatus: `ERROR: ${errorMsg}`,
      },
    });
    return { success: false, message: errorMsg };
  }
}

export async function queueEmail(options: EmailOptions) {
  return await prisma.emailQueue.create({
    data: {
      toEmail: options.toEmail,
      toName: options.toName,
      subject: options.subject,
      bodyHtml: options.bodyHtml,
      bodyText: options.bodyText || options.subject,
      eventType: options.eventType || 'GENERAL',
      status: 'PENDING',
    },
  });
}

export async function processEmailQueue(): Promise<{ processed: number; sent: number; failed: number }> {
  const pendingEmails = await prisma.emailQueue.findMany({
    where: { status: 'PENDING' },
    take: 10,
    orderBy: { queuedAt: 'asc' },
  });

  if (pendingEmails.length === 0) {
    return { processed: 0, sent: 0, failed: 0 };
  }

  let sent = 0;
  let failed = 0;

  try {
    const { transporter, config } = await getTransporter();

    for (const email of pendingEmails) {
      try {
        await transporter.sendMail({
          from: `"${config.fromName}" <${config.fromEmail}>`,
          to: `"${email.toName}" <${email.toEmail}>`,
          replyTo: config.replyTo,
          subject: email.subject,
          text: email.bodyText || '',
          html: email.bodyHtml,
        });

        await prisma.emailQueue.update({
          where: { id: email.id },
          data: {
            status: 'SENT',
            sentAt: new Date(),
            attempts: { increment: 1 },
          },
        });
        sent++;
      } catch (err: any) {
        await prisma.emailQueue.update({
          where: { id: email.id },
          data: {
            status: email.attempts >= 3 ? 'FAILED' : 'PENDING',
            attempts: { increment: 1 },
            lastError: err?.message || 'SMTP transmission error',
          },
        });
        failed++;
      }
    }
  } catch (smtpErr: any) {
    for (const email of pendingEmails) {
      await prisma.emailQueue.update({
        where: { id: email.id },
        data: {
          attempts: { increment: 1 },
          lastError: smtpErr?.message || 'SMTP Configuration unreachable',
        },
      });
      failed++;
    }
  }

  return { processed: pendingEmails.length, sent, failed };
}

export function renderBrandedEmailTemplate({
  headline,
  recipientName,
  contentHtml,
  ctaText,
  ctaUrl,
}: {
  headline: string;
  recipientName: string;
  contentHtml: string;
  ctaText?: string;
  ctaUrl?: string;
}) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <style>
    body { background-color: #0B0B0D; color: #F7F5F1; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 40px 20px; }
    .card { max-width: 580px; margin: 0 auto; background-color: #171719; border: 1px solid rgba(201, 165, 106, 0.2); border-radius: 12px; padding: 36px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
    .brand { font-size: 20px; letter-spacing: 2px; color: #C9A56A; font-weight: bold; margin-bottom: 24px; text-transform: uppercase; }
    .headline { font-size: 22px; font-weight: 600; color: #FFFFFF; margin-bottom: 16px; }
    .body { font-size: 15px; line-height: 1.6; color: #E6D0A5; margin-bottom: 28px; }
    .btn { display: inline-block; background-color: #C9A56A; color: #0B0B0D; font-weight: 600; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; }
    .footer { margin-top: 36px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.08); font-size: 12px; color: #8E8E93; text-align: center; }
  </style>
</head>
<body>
  <div class="card">
    <div class="brand">LuxeOS &middot; LuxeStudio</div>
    <div class="headline">${headline}</div>
    <div class="body">
      <p>Dear ${recipientName},</p>
      ${contentHtml}
    </div>
    ${ctaText && ctaUrl ? `<div style="text-align: center; margin: 30px 0;"><a href="${ctaUrl}" class="btn">${ctaText}</a></div>` : ''}
    <div class="footer">
      Sent from LuxeOS Platform &middot; Exclusive Operations Engine for LuxeStudio &middot; <a href="https://theluxestudio.in" style="color: #C9A56A;">theluxestudio.in</a>
    </div>
  </div>
</body>
</html>
  `;
}

