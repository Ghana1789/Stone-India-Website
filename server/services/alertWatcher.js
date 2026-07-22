/**
 * alertWatcher.js
 * Polls configured alert rules on a regular interval, fires alert events,
 * emits real-time socket notifications, and sends emails when thresholds are crossed.
 */

import AlertConfig from '../models/AlertConfig.js';
import AlertEvent from '../models/AlertEvent.js';
import { getMetricSnapshot } from './analyticsEngine.js';
import { sendAlertEmail } from './emailService.js';

const POLL_INTERVAL_MS = 5 * 60 * 1000; // Check every 5 minutes

function evaluate(actual, operator, threshold) {
  switch (operator) {
    case 'gt': return actual > threshold;
    case 'lt': return actual < threshold;
    case 'gte': return actual >= threshold;
    case 'lte': return actual <= threshold;
    case 'eq': return actual === threshold;
    default: return false;
  }
}

function buildMessage(alertName, metric, operator, threshold, actual) {
  const opLabels = { gt: 'exceeded', lt: 'dropped below', gte: 'reached or exceeded', lte: 'is at or below', eq: 'equals' };
  return `${alertName}: ${metric.replace(/_/g, ' ')} ${opLabels[operator] || operator} ${threshold} (current: ${actual})`;
}

let io = null;
let watcherInterval = null;

export function startAlertWatcher(socketIo) {
  io = socketIo;

  // Run immediately then on interval
  runAlertCheck().catch(err => console.error('[AlertWatcher] Initial check error:', err.message));

  watcherInterval = setInterval(() => {
    runAlertCheck().catch(err => console.error('[AlertWatcher] Check error:', err.message));
  }, POLL_INTERVAL_MS);

  console.log('[AlertWatcher] ✅ Started — polling every 5 minutes');
}

export function stopAlertWatcher() {
  if (watcherInterval) {
    clearInterval(watcherInterval);
    watcherInterval = null;
  }
}

async function runAlertCheck() {
  const [configs, snapshot] = await Promise.all([
    AlertConfig.find({ isActive: true }).lean(),
    getMetricSnapshot().catch(() => ({}))
  ]);

  if (!configs.length) return;

  const now = new Date();

  for (const config of configs) {
    const actualValue = snapshot[config.metric];
    if (actualValue === undefined) continue;

    const triggered = evaluate(actualValue, config.operator, config.threshold);
    if (!triggered) continue;

    // Respect cooldown
    if (config.lastFiredAt) {
      const cooldownMs = (config.cooldownMinutes || 60) * 60 * 1000;
      if (now - new Date(config.lastFiredAt) < cooldownMs) continue;
    }

    const message = buildMessage(config.name, config.metric, config.operator, config.threshold, actualValue);

    // Create alert event
    const event = await AlertEvent.create({
      alertConfig: config._id,
      alertName: config.name,
      metric: config.metric,
      severity: config.severity,
      message,
      actualValue,
      thresholdValue: config.threshold,
      operator: config.operator
    });

    // Update lastFiredAt
    await AlertConfig.findByIdAndUpdate(config._id, { lastFiredAt: now });

    // Emit real-time socket notification to all admin users
    if (io) {
      io.emit('admin_alert', {
        id: event._id,
        alertName: config.name,
        severity: config.severity,
        message,
        metric: config.metric,
        actualValue,
        threshold: config.threshold,
        timestamp: event.createdAt
      });
    }

    // Send email if configured
    if (config.channels?.email && config.emailRecipients?.length) {
      const emailSent = await sendAlertEmail({
        recipients: config.emailRecipients,
        alertName: config.name,
        severity: config.severity,
        message,
        metric: config.metric,
        actualValue,
        threshold: config.threshold
      });
      if (emailSent) {
        await AlertEvent.findByIdAndUpdate(event._id, { emailSent: true, emailSentAt: now });
      }
    }

    console.log(`[AlertWatcher] 🔔 Alert fired: "${config.name}" — ${message}`);
  }
}
