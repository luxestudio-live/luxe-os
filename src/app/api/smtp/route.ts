import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { encryptSecret } from '@/lib/crypto';
import { verifySmtpConnection, processEmailQueue, queueEmail } from '@/lib/email';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const config = await prisma.smtpConfig.findUnique({
      where: { id: 'default' },
    });

    const queue = await prisma.emailQueue.findMany({
      orderBy: { queuedAt: 'desc' },
      take: 20,
    });

    return NextResponse.json({
      config: config
        ? {
            id: config.id,
            host: config.host,
            port: config.port,
            encryption: config.encryption,
            username: config.username,
            fromEmail: config.fromEmail,
            fromName: config.fromName,
            replyTo: config.replyTo,
            isVerified: config.isVerified,
            lastTestedAt: config.lastTestedAt,
            testStatus: config.testStatus,
            hasPassword: Boolean(config.passwordEncrypted),
          }
        : null,
      queue,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { host, port, encryption, username, password, fromEmail, fromName, replyTo } = body;

    const dataToUpdate: any = {};
    if (host !== undefined) dataToUpdate.host = host;
    if (port !== undefined) dataToUpdate.port = Number(port);
    if (encryption !== undefined) dataToUpdate.encryption = encryption;
    if (username !== undefined) dataToUpdate.username = username;
    if (password) dataToUpdate.passwordEncrypted = encryptSecret(password);
    if (fromEmail !== undefined) dataToUpdate.fromEmail = fromEmail;
    if (fromName !== undefined) dataToUpdate.fromName = fromName;
    if (replyTo !== undefined) dataToUpdate.replyTo = replyTo;

    dataToUpdate.isVerified = false; // reset verification status on credential update

    const updated = await prisma.smtpConfig.upsert({
      where: { id: 'default' },
      update: dataToUpdate,
      create: {
        id: 'default',
        host: host || 'smtp.theluxestudio.in',
        port: Number(port) || 587,
        encryption: encryption || 'STARTTLS',
        username: username || 'notifications@theluxestudio.in',
        passwordEncrypted: password ? encryptSecret(password) : '',
        fromEmail: fromEmail || 'notifications@theluxestudio.in',
        fromName: fromName || 'LuxeStudio Operations',
        replyTo: replyTo || 'hello@theluxestudio.in',
      },
    });

    return NextResponse.json({
      success: true,
      config: {
        host: updated.host,
        port: updated.port,
        encryption: updated.encryption,
        username: updated.username,
        fromEmail: updated.fromEmail,
        fromName: updated.fromName,
        replyTo: updated.replyTo,
        isVerified: updated.isVerified,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, recipientEmail } = body;

    if (action === 'verify') {
      const result = await verifySmtpConnection();
      return NextResponse.json(result);
    }

    if (action === 'send-test') {
      if (!recipientEmail) {
        return NextResponse.json({ error: 'Recipient email required' }, { status: 400 });
      }

      const queued = await queueEmail({
        toEmail: recipientEmail,
        toName: 'Test Recipient',
        subject: 'LuxeOS SMTP Operational Verification',
        bodyHtml: `
          <div style="font-family: sans-serif; padding: 20px; color: #171719;">
            <h2 style="color: #C9A56A;">LuxeOS SMTP Diagnostic Verified</h2>
            <p>This is a certified automated test transmission dispatched from the LuxeOS platform.</p>
            <p><strong>Status:</strong> Active &amp; Ready for Transactional Notifications</p>
            <hr style="border: none; border-top: 1px solid #E6D0A5;" />
            <small style="color: #8E8E93;">LuxeStudio Operations Engine &middot; os.theluxestudio.in</small>
          </div>
        `,
        eventType: 'TEST_TRANSMISSION',
      });

      // Process queue
      const processResult = await processEmailQueue();

      return NextResponse.json({
        success: true,
        queuedId: queued.id,
        processResult,
        message: `Queued and processed test email for ${recipientEmail}`,
      });
    }

    if (action === 'process-queue') {
      const result = await processEmailQueue();
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

