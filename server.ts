import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { Resend } from 'resend';
import nodemailer from 'nodemailer';

// Load environment variables from .env.local and .env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

// Enable CORS for local development if client calls API directly
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Configure Resend
const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

// Configure SMTP Nodemailer
const smtpHost = process.env.SMTP_HOST;
const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const smtpFrom = process.env.SMTP_FROM || 'Meduman <no-reply@meduman.sulvatech.com>';

const smtpTransporter = smtpHost
  ? nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth:
        smtpUser && smtpPass
          ? {
              user: smtpUser,
              pass: smtpPass
            }
          : undefined
    })
  : null;

// Email sending endpoint
app.post('/api/send-waitlist-email', async (req, res) => {
  const { email, fullName, userType, id } = req.body;

  if (!email || !fullName) {
    return res.status(400).json({ error: 'Email and Full Name are required.' });
  }

  const cleanName = fullName.trim();
  const cleanEmail = email.trim().toLowerCase();
  const queueId = id || `WM-${Math.floor(1000 + Math.random() * 9000)}`;
  const role = userType || 'Buyer';

  // Beautiful responsive HTML email template
  const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Meduman</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: #F7F7F7;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #F7F7F7;
      padding: 40px 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 24px;
      overflow: hidden;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.03);
    }
    .header {
      background-color: #081635;
      padding: 40px 20px;
      text-align: center;
    }
    .logo {
      font-size: 20px;
      font-weight: 800;
      color: #ffffff;
      letter-spacing: 2px;
      text-decoration: none;
    }
    .content {
      padding: 40px;
      color: #000000;
    }
    h1 {
      font-size: 24px;
      font-weight: 700;
      margin-top: 0;
      margin-bottom: 16px;
      color: #081635;
      line-height: 1.2;
    }
    p {
      font-size: 14px;
      line-height: 1.6;
      color: #4a5568;
      margin-bottom: 24px;
    }
    .badge-container {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 20px;
      margin-bottom: 32px;
    }
    .badge-title {
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #718096;
      margin-bottom: 12px;
    }
    .badge-row {
      display: flex;
      justify-content: space-between;
      border-bottom: 1px solid #e2e8f0;
      padding: 8px 0;
      font-size: 13px;
    }
    .badge-row:last-child {
      border-bottom: none;
    }
    .badge-label {
      color: #718096;
      font-weight: 500;
    }
    .badge-value {
      color: #081635;
      font-weight: 700;
    }
    .cta-container {
      text-align: center;
      margin-bottom: 24px;
    }
    .cta-button {
      display: inline-block;
      background-color: #232F72;
      color: #ffffff !important;
      text-decoration: none;
      padding: 14px 28px;
      border-radius: 12px;
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      box-shadow: 0 4px 6px rgba(35, 47, 114, 0.15);
    }
    .footer {
      background-color: #f8fafc;
      border-top: 1px solid #e2e8f0;
      padding: 24px 40px;
      text-align: center;
      font-size: 11px;
      color: #94a3b8;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <span class="logo">MEDUMAN</span>
      </div>
      <div class="content">
        <h1>You're on the list, ${cleanName}!</h1>
        <p>Thank you for joining the Meduman waitlist. We are building the next-generation escrow-backed transaction protection platform for social commerce across Africa.</p>
        <p>Whether you transact on WhatsApp, Instagram, Telegram, or direct DMs, Meduman will shield your payments and build escrowed trusts without the traditional integration friction.</p>
        
        <div class="badge-container">
          <div class="badge-title">Member Ledger Details</div>
          <div class="badge-row">
            <span class="badge-label">Queue ID</span>
            <span class="badge-value">${queueId}</span>
          </div>
          <div class="badge-row">
            <span class="badge-label">Role</span>
            <span class="badge-value">${role}</span>
          </div>
          <div class="badge-row">
            <span class="badge-label">Status</span>
            <span class="badge-value">Active (Queue Verified)</span>
          </div>
        </div>

        <p>We will contact you as soon as the next cohort opens up for early beta trials and sandboxed transaction runs in your region.</p>
        
        <div class="cta-container">
          <a href="https://meduman.sulvatech.com" class="cta-button" target="_blank">Visit Meduman Portal</a>
        </div>
      </div>
      <div class="footer">
        <p style="margin: 0; font-size: 11px; color: #94a3b8; line-height: 1.5;">
          &copy; 2026 Sulva Technology. Meduman is a registered trademark of Sulva Technology.<br>
          Escrow deposits are securely held under CBN-regulated depository partners.
        </p>
      </div>
    </div>
  </div>
</body>
</html>
`;

  try {
    if (resend) {
      // Send using Resend
      const data = await resend.emails.send({
        from: smtpFrom,
        to: [cleanEmail],
        subject: 'You are on the Meduman Waitlist!',
        html: emailHtml
      });

      console.log(`[Resend] Welcome email sent to ${cleanEmail}. Message ID:`, data);
      return res.status(200).json({ success: true, provider: 'resend', messageId: data.id });
    } else if (smtpTransporter) {
      // Send using standard SMTP
      const info = await smtpTransporter.sendMail({
        from: smtpFrom,
        to: cleanEmail,
        subject: 'You are on the Meduman Waitlist!',
        html: emailHtml
      });

      console.log(`[SMTP] Welcome email sent to ${cleanEmail}. Message ID:`, info.messageId);
      return res.status(200).json({ success: true, provider: 'smtp', messageId: info.messageId });
    } else {
      // Fallback: log to console in development
      console.log('========================================================================');
      console.log(`[MOCK EMAIL SERVICE] Email dispatched (No email service provider configured)`);
      console.log(`To: ${cleanEmail}`);
      console.log(`From: ${smtpFrom}`);
      console.log(`Subject: You are on the Meduman Waitlist!`);
      console.log(`Content Preview: Welcome ${cleanName}! Queue ID: ${queueId}`);
      console.log('========================================================================');
      
      return res.status(200).json({
        success: true,
        provider: 'console-mock',
        message: 'No email service configuration detected. Email printed to server console.'
      });
    }
  } catch (error) {
    console.error('[Mail Service Error] Failed to send waitlist email:', error);
    return res.status(500).json({
      error: 'Failed to send waitlist email.',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

// Serve static files in production
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

// Fallback for SPA routing in production
app.get('*', (req, res) => {
  const indexFile = path.join(distPath, 'index.html');
  res.sendFile(indexFile, (err) => {
    if (err) {
      res.status(404).send('Not Found (Meduman production bundle is clean)');
    }
  });
});

app.listen(PORT, () => {
  console.log(`Meduman backend listening at http://localhost:${PORT}`);
});
