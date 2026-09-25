import nodemailer from 'nodemailer';

const host = process.env.SMTP_HOST || 'localhost';
const port = parseInt(process.env.SMTP_PORT || '1025', 10);

export const mailer = nodemailer.createTransport({
  host,
  port,
  secure: false,
  ignoreTLS: true,
});

export async function sendPasswordResetEmail(
  toEmail: string,
  resetToken: string
): Promise<void> {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
  const resetUrl = `${clientUrl}/?reset_token=${resetToken}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #09090b; color: #f4f4f5; padding: 24px; }
          .card { background-color: #18181b; border: 1px solid #27272a; border-radius: 12px; padding: 32px; max-width: 520px; margin: 0 auto; }
          .logo { font-size: 20px; font-weight: 800; color: #f59e0b; margin-bottom: 20px; letter-spacing: -0.5px; }
          .button { display: inline-block; background-color: #d97706; color: #ffffff !important; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 24px 0; }
          .footer { font-size: 12px; color: #71717a; margin-top: 24px; }
          .token-box { background-color: #27272a; padding: 10px; border-radius: 6px; font-family: monospace; word-break: break-all; font-size: 13px; color: #e4e4e7; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="logo">☕ Specialty Coffee BrewLab</div>
          <h2 style="margin-top: 0; color: #ffffff;">Password Reset Request</h2>
          <p style="color: #a1a1aa; line-height: 1.6;">
            We received a request to reset your password. Click the button below to set a new password. This link is valid for 1 hour.
          </p>
          <a href="${resetUrl}" class="button" target="_blank">Reset Password</a>
          <p style="color: #a1a1aa; font-size: 13px;">Or copy and paste this reset token:</p>
          <div class="token-box">${resetToken}</div>
          <div class="footer">
            If you did not request this password reset, please ignore this email.
          </div>
        </div>
      </body>
    </html>
  `;

  await mailer.sendMail({
    from: '"BrewLab Security" <no-reply@brewlog.local>',
    to: toEmail,
    subject: '☕ Reset your BrewLab account password',
    text: `To reset your password, visit: ${resetUrl} or use token: ${resetToken}`,
    html,
  });
}
