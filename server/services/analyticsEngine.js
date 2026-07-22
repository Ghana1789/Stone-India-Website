/**
 * analyticsEngine.js
 * Shared aggregation helpers used by both admin routes and the scheduled job runner.
 * All functions return plain JS objects ready for JSON serialization or CSV/PDF export.
 */

import User from '../models/User.js';
import Order from '../models/Order.js';
import Task from '../models/Task.js';
import BatchLog from '../models/BatchLog.js';
import Battery from '../models/Battery.js';
import Invoice from '../models/Invoice.js';
import Transaction from '../models/Transaction.js';
import LeaveRequest from '../models/LeaveRequest.js';
import WarrantyClaim from '../models/WarrantyClaim.js';

// ─── DATE HELPERS ─────────────────────────────────────────────────────────────

export function parseDatePreset(preset, startDate, endDate) {
  const now = new Date();
  let start, end;

  switch (preset) {
    case 'last_7_days':
      start = new Date(now); start.setDate(start.getDate() - 7); end = now; break;
    case 'last_30_days':
      start = new Date(now); start.setDate(start.getDate() - 30); end = now; break;
    case 'last_90_days':
      start = new Date(now); start.setDate(start.getDate() - 90); end = now; break;
    case 'this_month':
      start = new Date(now.getFullYear(), now.getMonth(), 1); end = now; break;
    case 'last_month':
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      end = new Date(now.getFullYear(), now.getMonth(), 0); break;
    case 'this_year':
      start = new Date(now.getFullYear(), 0, 1); end = now; break;
    case 'custom':
      start = startDate ? new Date(startDate) : new Date(now.setDate(now.getDate() - 30));
      end = endDate ? new Date(endDate) : new Date(); break;
    default:
      start = new Date(now); start.setDate(start.getDate() - 30); end = new Date(); break;
  }

  return { start, end };
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// ─── OVERVIEW / KPI SUMMARY ───────────────────────────────────────────────────

export async function getAnalyticsOverview(datePreset = 'last_30_days', startDate, endDate) {
  const { start, end } = parseDatePreset(datePreset, startDate, endDate);

  const [
    totalRevenue,
    orderCount,
    fulfilledOrders,
    newClients,
    activeClients,
    tasksCompleted,
    tasksPending,
    pendingOrders,
    warrantyClaims
  ] = await Promise.all([
    Order.aggregate([
      { $match: { paymentStatus: 'Paid', createdAt: { $gte: start, $lte: end } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]),
    Order.countDocuments({ createdAt: { $gte: start, $lte: end } }),
    Order.countDocuments({ status: 'Delivered', createdAt: { $gte: start, $lte: end } }),
    User.countDocuments({ role: 'client', createdAt: { $gte: start, $lte: end } }),
    User.countDocuments({ role: 'client', isActive: true }),
    Task.countDocuments({ status: 'Completed', updatedAt: { $gte: start, $lte: end } }),
    Task.countDocuments({ status: { $in: ['Pending', 'InProgress'] } }),
    Order.countDocuments({ status: { $in: ['Pending', 'Confirmed', 'Manufacturing'] } }),
    WarrantyClaim.countDocuments({ createdAt: { $gte: start, $lte: end } })
  ]);

  const fulfillmentRate = orderCount > 0 ? ((fulfilledOrders / orderCount) * 100).toFixed(1) : 0;

  // Calculate avg processing time (days from createdAt to deliveredAt)
  const processingTimeAgg = await Order.aggregate([
    {
      $match: {
        status: 'Delivered',
        createdAt: { $gte: start, $lte: end },
        'trackingHistory.status': 'Delivered'
      }
    },
    {
      $addFields: {
        deliveredEntry: {
          $arrayElemAt: [
            { $filter: { input: '$trackingHistory', as: 'h', cond: { $eq: ['$$h.status', 'Delivered'] } } },
            -1
          ]
        }
      }
    },
    {
      $addFields: {
        processingDays: {
          $divide: [{ $subtract: ['$deliveredEntry.timestamp', '$createdAt'] }, 86400000]
        }
      }
    },
    { $group: { _id: null, avgDays: { $avg: '$processingDays' } } }
  ]);

  const avgProcessingDays = processingTimeAgg[0]?.avgDays?.toFixed(1) || '—';

  return {
    totalRevenue: totalRevenue[0]?.total || 0,
    orderCount,
    fulfilledOrders,
    fulfillmentRate: Number(fulfillmentRate),
    avgProcessingDays,
    newClients,
    activeClients,
    tasksCompleted,
    tasksPending,
    pendingOrders,
    warrantyClaims,
    dateRange: { start, end, preset: datePreset }
  };
}

// ─── CLIENT ACQUISITION ────────────────────────────────────────────────────────

export async function getClientAcquisitionData(datePreset = 'last_90_days', startDate, endDate) {
  const { start, end } = parseDatePreset(datePreset, startDate, endDate);

  const monthly = await User.aggregate([
    { $match: { role: 'client', createdAt: { $gte: start, $lte: end } } },
    {
      $group: {
        _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
        newClients: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);

  const series = monthly.map(m => ({
    label: `${MONTHS[m._id.month - 1]} ${m._id.year}`,
    newClients: m.newClients
  }));

  // Recent clients list
  const recentClients = await User.find({ role: 'client', createdAt: { $gte: start, $lte: end } })
    .select('name email company createdAt isActive')
    .sort({ createdAt: -1 })
    .limit(20);

  const totalNew = monthly.reduce((s, m) => s + m.newClients, 0);

  // Active vs inactive breakdown
  const [activeCount, inactiveCount] = await Promise.all([
    User.countDocuments({ role: 'client', isActive: true }),
    User.countDocuments({ role: 'client', isActive: false })
  ]);

  return { series, totalNew, activeCount, inactiveCount, recentClients, dateRange: { start, end } };
}

// ─── ORDER FULFILLMENT ─────────────────────────────────────────────────────────

export async function getOrderFulfillmentData(datePreset = 'last_90_days', startDate, endDate) {
  const { start, end } = parseDatePreset(datePreset, startDate, endDate);

  const monthly = await Order.aggregate([
    { $match: { createdAt: { $gte: start, $lte: end } } },
    {
      $group: {
        _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
        totalOrders: { $sum: 1 },
        delivered: {
          $sum: { $cond: [{ $eq: ['$status', 'Delivered'] }, 1, 0] }
        },
        revenue: {
          $sum: { $cond: [{ $eq: ['$paymentStatus', 'Paid'] }, '$totalAmount', 0] }
        }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);

  const series = monthly.map(m => ({
    label: `${MONTHS[m._id.month - 1]} ${m._id.year}`,
    totalOrders: m.totalOrders,
    delivered: m.delivered,
    fulfillmentRate: m.totalOrders > 0 ? +((m.delivered / m.totalOrders) * 100).toFixed(1) : 0,
    revenue: m.revenue
  }));

  // Status distribution
  const statusDist = await Order.aggregate([
    { $match: { createdAt: { $gte: start, $lte: end } } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);

  return { series, statusDistribution: statusDist, dateRange: { start, end } };
}

// ─── EMPLOYEE PRODUCTIVITY ────────────────────────────────────────────────────

export async function getEmployeeProductivityData(datePreset = 'last_30_days', startDate, endDate) {
  const { start, end } = parseDatePreset(datePreset, startDate, endDate);

  // Tasks completed per department
  const deptProductivity = await Task.aggregate([
    { $match: { status: 'Completed', updatedAt: { $gte: start, $lte: end } } },
    {
      $lookup: {
        from: 'users',
        localField: 'assignedTo',
        foreignField: '_id',
        as: 'assignee'
      }
    },
    { $unwind: { path: '$assignee', preserveNullAndEmptyArrays: false } },
    {
      $group: {
        _id: '$assignee.department',
        tasksCompleted: { $sum: 1 }
      }
    },
    { $match: { _id: { $ne: null } } },
    { $sort: { tasksCompleted: -1 } }
  ]);

  // Top performers (employees with most tasks completed)
  const topPerformers = await Task.aggregate([
    { $match: { status: 'Completed', updatedAt: { $gte: start, $lte: end } } },
    {
      $lookup: {
        from: 'users',
        localField: 'assignedTo',
        foreignField: '_id',
        as: 'assignee'
      }
    },
    { $unwind: { path: '$assignee', preserveNullAndEmptyArrays: false } },
    {
      $group: {
        _id: '$assignee._id',
        name: { $first: '$assignee.name' },
        department: { $first: '$assignee.department' },
        employeeId: { $first: '$assignee.employeeId' },
        tasksCompleted: { $sum: 1 }
      }
    },
    { $sort: { tasksCompleted: -1 } },
    { $limit: 10 }
  ]);

  // Monthly task completion trend
  const monthlyTrend = await Task.aggregate([
    { $match: { status: 'Completed', updatedAt: { $gte: start, $lte: end } } },
    {
      $group: {
        _id: { year: { $year: '$updatedAt' }, month: { $month: '$updatedAt' } },
        completed: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);

  const series = monthlyTrend.map(m => ({
    label: `${MONTHS[m._id.month - 1]} ${m._id.year}`,
    completed: m.completed
  }));

  // Overall stats
  const [totalCompleted, totalPending, totalInProgress] = await Promise.all([
    Task.countDocuments({ status: 'Completed', updatedAt: { $gte: start, $lte: end } }),
    Task.countDocuments({ status: 'Pending' }),
    Task.countDocuments({ status: 'InProgress' })
  ]);

  const productivityIndex = totalCompleted > 0
    ? +((totalCompleted / (totalCompleted + totalPending + totalInProgress)) * 100).toFixed(1)
    : 0;

  return {
    deptProductivity,
    topPerformers,
    series,
    totalCompleted,
    totalPending,
    totalInProgress,
    productivityIndex,
    dateRange: { start, end }
  };
}

// ─── REVENUE ANALYTICS ────────────────────────────────────────────────────────

export async function getRevenueData(datePreset = 'this_year', startDate, endDate) {
  const { start, end } = parseDatePreset(datePreset, startDate, endDate);

  // Monthly revenue
  const monthly = await Order.aggregate([
    { $match: { paymentStatus: 'Paid', createdAt: { $gte: start, $lte: end } } },
    {
      $group: {
        _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
        revenue: { $sum: '$totalAmount' },
        orders: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);

  const series = monthly.map(m => ({
    label: `${MONTHS[m._id.month - 1]} ${m._id.year}`,
    revenue: m.revenue,
    orders: m.orders,
    avgOrderValue: m.orders > 0 ? +(m.revenue / m.orders).toFixed(0) : 0
  }));

  // Revenue by client (top clients)
  const revenueByClient = await Order.aggregate([
    { $match: { paymentStatus: 'Paid', createdAt: { $gte: start, $lte: end } } },
    {
      $group: {
        _id: '$client',
        revenue: { $sum: '$totalAmount' },
        orderCount: { $sum: 1 }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'client'
      }
    },
    { $unwind: { path: '$client', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        name: { $ifNull: ['$client.name', 'Unknown'] },
        company: { $ifNull: ['$client.company', '—'] },
        revenue: 1,
        orderCount: 1
      }
    },
    { $sort: { revenue: -1 } },
    { $limit: 10 }
  ]);

  const totalRevenue = series.reduce((s, m) => s + m.revenue, 0);
  const totalOrders = series.reduce((s, m) => s + m.orders, 0);
  const avgOrderValue = totalOrders > 0 ? +(totalRevenue / totalOrders).toFixed(0) : 0;

  // YoY growth: compare current period revenue with prior period of same length
  const periodDays = Math.ceil((end - start) / 86400000);
  const priorEnd = new Date(start);
  const priorStart = new Date(start);
  priorStart.setDate(priorStart.getDate() - periodDays);

  const priorRevAgg = await Order.aggregate([
    { $match: { paymentStatus: 'Paid', createdAt: { $gte: priorStart, $lte: priorEnd } } },
    { $group: { _id: null, total: { $sum: '$totalAmount' } } }
  ]);
  const priorRevenue = priorRevAgg[0]?.total || 0;
  const revenueGrowthPct = priorRevenue > 0
    ? +(((totalRevenue - priorRevenue) / priorRevenue) * 100).toFixed(1)
    : null;

  return {
    series,
    revenueByClient,
    totalRevenue,
    totalOrders,
    avgOrderValue,
    revenueGrowthPct,
    priorRevenue,
    dateRange: { start, end }
  };
}

// ─── INVENTORY TURNOVER ────────────────────────────────────────────────────────

export async function getInventoryTurnoverData(datePreset = 'last_90_days', startDate, endDate) {
  const { start, end } = parseDatePreset(datePreset, startDate, endDate);

  // Batch production activity
  const batchActivity = await BatchLog.aggregate([
    { $match: { createdAt: { $gte: start, $lte: end } } },
    {
      $group: {
        _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
        batchesStarted: { $sum: 1 },
        unitsProd: { $sum: '$quantityProduced' },
        qcPassed: {
          $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] }
        }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);

  const series = batchActivity.map(b => ({
    label: `${MONTHS[b._id.month - 1]} ${b._id.year}`,
    batchesStarted: b.batchesStarted,
    unitsProd: b.unitsProd || 0,
    qcPassed: b.qcPassed
  }));

  // Battery stock overview
  const batteries = await Battery.find({ isActive: true })
    .select('name sku stockQty unitPrice category')
    .sort({ stockQty: 1 })
    .limit(30);

  const lowStock = batteries.filter(b => b.stockQty !== undefined && b.stockQty < 10);
  const totalInventoryValue = batteries.reduce((s, b) => s + ((b.stockQty || 0) * (b.unitPrice || 0)), 0);

  // Slow-moving: batteries with no orders in the date range
  const orderedBatteryIds = await Order.distinct('items.battery', { createdAt: { $gte: start, $lte: end } });
  const slowMoving = batteries.filter(b => !orderedBatteryIds.map(String).includes(String(b._id)));

  return {
    series,
    batteries,
    lowStock,
    slowMoving,
    totalInventoryValue,
    dateRange: { start, end }
  };
}

// ─── SNAPSHOT FOR ALERT EVALUATION ───────────────────────────────────────────

export async function getMetricSnapshot() {
  const now = new Date();
  const dayAgo = new Date(now); dayAgo.setDate(dayAgo.getDate() - 1);
  const weekAgo = new Date(now); weekAgo.setDate(weekAgo.getDate() - 7);
  const monthAgo = new Date(now); monthAgo.setMonth(monthAgo.getMonth() - 1);

  const [
    revDay, revWeek, revMonth,
    orderDay,
    pendingOrders,
    warrantyClaims,
    batteries
  ] = await Promise.all([
    Order.aggregate([{ $match: { paymentStatus: 'Paid', createdAt: { $gte: dayAgo } } }, { $group: { _id: null, t: { $sum: '$totalAmount' } } }]),
    Order.aggregate([{ $match: { paymentStatus: 'Paid', createdAt: { $gte: weekAgo } } }, { $group: { _id: null, t: { $sum: '$totalAmount' } } }]),
    Order.aggregate([{ $match: { paymentStatus: 'Paid', createdAt: { $gte: monthAgo } } }, { $group: { _id: null, t: { $sum: '$totalAmount' } } }]),
    Order.countDocuments({ createdAt: { $gte: dayAgo } }),
    Order.countDocuments({ status: { $in: ['Pending', 'Confirmed', 'Manufacturing'] } }),
    WarrantyClaim.countDocuments({ status: { $in: ['Submitted', 'UnderReview'] } }),
    Battery.find({ isActive: true }).select('stockQty').lean()
  ]);

  // Batch failure rate (last 30 days)
  const [totalBatches, failedBatches] = await Promise.all([
    BatchLog.countDocuments({ createdAt: { $gte: monthAgo } }),
    BatchLog.countDocuments({ status: 'Failed', createdAt: { $gte: monthAgo } })
  ]);
  const batchFailureRate = totalBatches > 0 ? +((failedBatches / totalBatches) * 100).toFixed(1) : 0;

  // Task productivity index
  const [completedTasks, allActiveTasks] = await Promise.all([
    Task.countDocuments({ status: 'Completed', updatedAt: { $gte: monthAgo } }),
    Task.countDocuments({ status: { $nin: ['Completed', 'Cancelled'] } })
  ]);
  const productivityIndex = (completedTasks + allActiveTasks) > 0
    ? +((completedTasks / (completedTasks + allActiveTasks)) * 100).toFixed(1)
    : 0;

  const minStock = batteries.length > 0 ? Math.min(...batteries.map(b => b.stockQty || 0)) : 0;

  return {
    revenue_daily: revDay[0]?.t || 0,
    revenue_weekly: revWeek[0]?.t || 0,
    revenue_monthly: revMonth[0]?.t || 0,
    order_volume_daily: orderDay,
    pending_orders_count: pendingOrders,
    warranty_claims_count: warrantyClaims,
    inventory_level: minStock,
    batch_failure_rate: batchFailureRate,
    employee_productivity_index: productivityIndex,
    defect_rate_percent: batchFailureRate
  };
}
