/**
 * emailService.js
 * Nodemailer-based email delivery for scheduled reports and alert notifications.
 * Gracefully degrades (logs warning) if SMTP credentials are not configured.
 */

import nodemailer from 'nodemailer';

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    console.warn('[EmailService] SMTP credentials not configured. Email delivery disabled.');
    return null;
  }

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 587,
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  return transporter;
}

const FROM = process.env.SMTP_FROM || 'Stone India Analytics <noreply@stoneindia.com>';

/**
 * Send an alert notification email.
 */
export async function sendAlertEmail({ recipients, alertName, severity, message, metric, actualValue, threshold }) {
  const t = getTransporter();
  if (!t || !recipients?.length) return false;

  const severityColor = severity === 'critical' ? '#ef4444' : severity === 'warning' ? '#f59e0b' : '#3b82f6';
  const severityLabel = severity.toUpperCase();

  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #e2e8f0; border-radius: 12px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #1e293b, #0f172a); padding: 32px; border-bottom: 3px solid ${severityColor};">
        <div style="display:flex; align-items:center; gap:12px;">
          <span style="font-size:28px;">⚡</span>
          <div>
            <h1 style="margin:0; font-size:20px; color:#fff;">Stone India EV — Alert Notification</h1>
            <p style="margin:4px 0 0; color:#94a3b8; font-size:13px;">Analytics & Intelligence Platform</p>
          </div>
        </div>
      </div>
      <div style="padding: 32px;">
        <div style="background: ${severityColor}22; border: 1px solid ${severityColor}44; border-radius:8px; padding: 16px; margin-bottom:24px;">
          <span style="background:${severityColor}; color:#fff; font-size:11px; font-weight:700; padding: 3px 10px; border-radius:99px; letter-spacing:1px;">${severityLabel}</span>
          <h2 style="margin: 12px 0 4px; color:#fff; font-size:18px;">${alertName}</h2>
          <p style="margin:0; color:#cbd5e1; font-size:14px;">${message}</p>
        </div>
        <table style="width:100%; border-collapse:collapse;">
          <tr style="border-bottom:1px solid #1e293b;">
            <td style="padding:10px 0; color:#94a3b8; font-size:13px; width:40%;">Metric</td>
            <td style="padding:10px 0; color:#e2e8f0; font-size:13px;">${metric}</td>
          </tr>
          <tr style="border-bottom:1px solid #1e293b;">
            <td style="padding:10px 0; color:#94a3b8; font-size:13px;">Actual Value</td>
            <td style="padding:10px 0; color:${severityColor}; font-size:13px; font-weight:700;">${actualValue}</td>
          </tr>
          <tr>
            <td style="padding:10px 0; color:#94a3b8; font-size:13px;">Threshold</td>
            <td style="padding:10px 0; color:#e2e8f0; font-size:13px;">${threshold}</td>
          </tr>
        </table>
        <div style="margin-top:28px; padding-top:20px; border-top:1px solid #1e293b; color:#64748b; font-size:12px;">
          <p style="margin:0;">This is an automated alert from Stone India Analytics Platform. Manage alerts at <strong>Admin → Alerts Center</strong>.</p>
          <p style="margin:8px 0 0;">Generated at: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</p>
        </div>
      </div>
    </div>
  `;

  try {
    await t.sendMail({
      from: FROM,
      to: recipients.join(', '),
      subject: `[${severityLabel}] Stone India Alert: ${alertName}`,
      html,
    });
    return true;
  } catch (err) {
    console.error('[EmailService] Failed to send alert email:', err.message);
    return false;
  }
}

/**
 * Send a scheduled report email with CSV attachment.
 */
export async function sendReportEmail({ recipients, reportName, dateRange, csvBuffer, summary }) {
  const t = getTransporter();
  if (!t || !recipients?.length) return false;

  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #e2e8f0; border-radius: 12px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #1e3a5f, #0f172a); padding: 32px; border-bottom: 3px solid #3b82f6;">
        <div style="display:flex; align-items:center; gap:12px;">
          <span style="font-size:28px;">📊</span>
          <div>
            <h1 style="margin:0; font-size:20px; color:#fff;">Stone India EV — Scheduled Report</h1>
            <p style="margin:4px 0 0; color:#94a3b8; font-size:13px;">Analytics & Intelligence Platform</p>
          </div>
        </div>
      </div>
      <div style="padding: 32px;">
        <h2 style="margin:0 0 8px; color:#60a5fa; font-size:17px;">${reportName}</h2>
        <p style="margin:0 0 20px; color:#94a3b8; font-size:13px;">Date range: ${dateRange}</p>
        ${summary ? `<div style="background:#1e293b; border-radius:8px; padding:16px; margin-bottom:20px;"><pre style="margin:0;color:#e2e8f0;font-size:12px;overflow:auto;">${summary}</pre></div>` : ''}
        <p style="color:#cbd5e1; font-size:14px;">The full report is attached as a CSV file.</p>
        <div style="margin-top:28px; padding-top:20px; border-top:1px solid #1e293b; color:#64748b; font-size:12px;">
          <p style="margin:0;">This is an automated scheduled report from Stone India Analytics Platform.</p>
          <p style="margin:8px 0 0;">Generated at: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</p>
        </div>
      </div>
    </div>
  `;

  const filename = `${reportName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`;

  try {
    await t.sendMail({
      from: FROM,
      to: recipients.join(', '),
      subject: `Stone India Report: ${reportName} — ${new Date().toLocaleDateString('en-IN')}`,
      html,
      attachments: csvBuffer
        ? [{ filename, content: csvBuffer, contentType: 'text/csv' }]
        : [],
    });
    return true;
  } catch (err) {
    console.error('[EmailService] Failed to send report email:', err.message);
    return false;
  }
}
