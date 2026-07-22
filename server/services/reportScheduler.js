/**
 * reportScheduler.js
 * node-cron based scheduled report runner.
 * Loads active ReportSchedule documents, generates CSV data, and emails recipients.
 */

import cron from 'node-cron';
import ReportSchedule from '../models/ReportSchedule.js';
import {
  getClientAcquisitionData,
  getOrderFulfillmentData,
  getEmployeeProductivityData,
  getRevenueData,
  getInventoryTurnoverData,
  getAnalyticsOverview
} from './analyticsEngine.js';
import { sendReportEmail } from './emailService.js';

// Map frequency to cron expression
const FREQ_TO_CRON = {
  daily: '0 7 * * *',    // 7 AM every day
  weekly: '0 7 * * 1',   // 7 AM every Monday
  monthly: '0 7 1 * *'   // 7 AM on the 1st of every month
};

// Map frequency to date range preset
const FREQ_TO_PRESET = {
  daily: 'last_7_days',
  weekly: 'last_30_days',
  monthly: 'last_month'
};

let cronJobs = new Map(); // scheduleId -> cron.ScheduledTask

export async function startReportScheduler() {
  await loadAndRegisterSchedules();
  console.log('[ReportScheduler] ✅ Started');
}

export async function loadAndRegisterSchedules() {
  // Cancel all existing jobs
  for (const [, job] of cronJobs) {
    job.stop();
  }
  cronJobs.clear();

  const schedules = await ReportSchedule.find({ isActive: true }).lean();

  for (const schedule of schedules) {
    registerSchedule(schedule);
  }
}

export function registerSchedule(schedule) {
  const expr = FREQ_TO_CRON[schedule.frequency] || schedule.cronExpression;

  if (!cron.validate(expr)) {
    console.warn(`[ReportScheduler] Invalid cron expression for schedule "${schedule.name}": ${expr}`);
    return;
  }

  const job = cron.schedule(expr, async () => {
    await runScheduledReport(schedule._id.toString());
  }, { timezone: 'Asia/Kolkata' });

  cronJobs.set(schedule._id.toString(), job);
}

export function unregisterSchedule(scheduleId) {
  const job = cronJobs.get(scheduleId.toString());
  if (job) {
    job.stop();
    cronJobs.delete(scheduleId.toString());
  }
}

async function runScheduledReport(scheduleId) {
  const schedule = await ReportSchedule.findById(scheduleId);
  if (!schedule || !schedule.isActive) return;

  const preset = schedule.dateRangePreset || FREQ_TO_PRESET[schedule.frequency] || 'last_30_days';

  try {
    let data, reportName, csvRows = [], summary = '';

    switch (schedule.templateId) {
      case 'client_acquisition': {
        data = await getClientAcquisitionData(preset);
        reportName = 'Client Acquisition Report';
        csvRows = data.series.map(r => ({ Period: r.label, 'New Clients': r.newClients }));
        summary = `Total New Clients: ${data.totalNew}\nActive Clients: ${data.activeCount}\nInactive Clients: ${data.inactiveCount}`;
        break;
      }
      case 'order_fulfillment': {
        data = await getOrderFulfillmentData(preset);
        reportName = 'Order Fulfillment Report';
        csvRows = data.series.map(r => ({
          Period: r.label,
          'Total Orders': r.totalOrders,
          Delivered: r.delivered,
          'Fulfillment Rate (%)': r.fulfillmentRate,
          'Revenue (₹)': r.revenue
        }));
        break;
      }
      case 'employee_productivity': {
        data = await getEmployeeProductivityData(preset);
        reportName = 'Employee Productivity Report';
        csvRows = data.topPerformers.map(e => ({
          Employee: e.name,
          'Employee ID': e.employeeId || '—',
          Department: e.department || '—',
          'Tasks Completed': e.tasksCompleted
        }));
        summary = `Productivity Index: ${data.productivityIndex}%\nTotal Completed: ${data.totalCompleted}\nPending: ${data.totalPending}`;
        break;
      }
      case 'revenue_summary': {
        data = await getRevenueData(preset);
        reportName = 'Revenue Summary Report';
        csvRows = data.series.map(r => ({
          Period: r.label,
          'Revenue (₹)': r.revenue,
          'Orders': r.orders,
          'Avg Order Value (₹)': r.avgOrderValue
        }));
        summary = `Total Revenue: ₹${data.totalRevenue.toLocaleString('en-IN')}\nGrowth: ${data.revenueGrowthPct !== null ? data.revenueGrowthPct + '%' : 'N/A'}`;
        break;
      }
      case 'inventory_turnover': {
        data = await getInventoryTurnoverData(preset);
        reportName = 'Inventory Turnover Report';
        csvRows = data.series.map(r => ({
          Period: r.label,
          'Batches Started': r.batchesStarted,
          'Units Produced': r.unitsProd,
          'QC Passed': r.qcPassed
        }));
        summary = `Total Inventory Value: ₹${data.totalInventoryValue.toLocaleString('en-IN')}\nLow Stock Items: ${data.lowStock.length}`;
        break;
      }
      case 'full_business_summary': {
        data = await getAnalyticsOverview(preset);
        reportName = 'Full Business Summary Report';
        csvRows = [
          { Metric: 'Total Revenue (₹)', Value: data.totalRevenue },
          { Metric: 'Orders Count', Value: data.orderCount },
          { Metric: 'Fulfillment Rate (%)', Value: data.fulfillmentRate },
          { Metric: 'Avg Processing Days', Value: data.avgProcessingDays },
          { Metric: 'New Clients', Value: data.newClients },
          { Metric: 'Active Clients', Value: data.activeClients },
          { Metric: 'Tasks Completed', Value: data.tasksCompleted },
          { Metric: 'Tasks Pending', Value: data.tasksPending },
          { Metric: 'Pending Orders', Value: data.pendingOrders },
          { Metric: 'Warranty Claims', Value: data.warrantyClaims }
        ];
        break;
      }
      default:
        throw new Error(`Unknown template: ${schedule.templateId}`);
    }

    // Build CSV buffer
    const csvBuffer = buildCsvBuffer(csvRows);

    // Send email
    await sendReportEmail({
      recipients: schedule.recipients,
      reportName,
      dateRange: `${preset.replace(/_/g, ' ')}`,
      csvBuffer,
      summary
    });

    await ReportSchedule.findByIdAndUpdate(scheduleId, {
      lastRunAt: new Date(),
      lastRunStatus: 'success',
      nextRunAt: getNextRun(schedule.frequency)
    });

    console.log(`[ReportScheduler] ✅ Sent "${reportName}" to ${schedule.recipients.join(', ')}`);
  } catch (err) {
    await ReportSchedule.findByIdAndUpdate(scheduleId, {
      lastRunAt: new Date(),
      lastRunStatus: 'failed'
    });
    console.error(`[ReportScheduler] ❌ Failed to run schedule "${schedule.name}":`, err.message);
  }
}

function buildCsvBuffer(rows) {
  if (!rows.length) return Buffer.from('');
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(','),
    ...rows.map(r => headers.map(h => JSON.stringify(r[h] ?? '')).join(','))
  ];
  return Buffer.from(lines.join('\n'), 'utf8');
}

function getNextRun(frequency) {
  const now = new Date();
  switch (frequency) {
    case 'daily': return new Date(now.setDate(now.getDate() + 1));
    case 'weekly': return new Date(now.setDate(now.getDate() + 7));
    case 'monthly': return new Date(now.setMonth(now.getMonth() + 1));
    default: return null;
  }
}

// Allow external trigger (e.g., after CRUD on schedules)
export async function refreshSchedules() {
  await loadAndRegisterSchedules();
}
