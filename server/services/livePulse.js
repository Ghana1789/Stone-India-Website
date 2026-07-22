/**
 * LivePulse Service — Extended EV Battery Manufacturing
 * 
 * Emits realistic real-time sensor fluctuations via Socket.io:
 * - factory_metrics: OEE, FPY, throughput, utilization, downtime
 * - energy_pulse: kW consumption, carbon g/min, water L/hr
 * - machine_status: per-machine health, temperature, vibration, status
 * - bms_telemetry: SOC%, SOH%, cell balance, fault count
 * - production_counters: cells produced today, packs assembled, shipped
 * - quality_live: real-time defect rate, scrap %, FPY
 * - alert_stream: rolling alerts from machines / QC / energy
 */

let intervalId = null;
let alertQueue = [];

// ---------- Helper: Clamp + Fluctuate ----------
const fluctuate = (val, range, min, max) => {
  const delta = (Math.random() * range * 2) - range;
  return Math.min(max, Math.max(min, +(val + delta).toFixed(2)));
};

// ---------- Initial State ----------
let state = {
  // Factory-level
  oee: 82.4,
  fpy: 94.8,
  throughput: 127,
  utilization: 78.2,
  downtimePct: 4.3,
  lineEfficiency: { A: 91.2, B: 88.4, C: 79.6, D: 84.1 },

  // Counters (since midnight)
  cellsProducedToday: 1840,
  packsAssembledToday: 38,
  packsShippedToday: 22,
  defectsToday: 14,
  scrapToday: 7,

  // Energy
  plantKw: 342.5,
  carbonGPerMin: 58.4,
  waterLPerHr: 120.3,
  wasteKgToday: 12.8,
  recycledKgToday: 8.5,
  renewablePct: 18.3,

  // BMS live
  avgSoc: 74.2,
  avgSoh: 96.8,
  cellImbalanceMv: 8.3,
  activeFaults: 2,
  thermalEvents: 0,

  // Quality live
  defectRatePct: 0.76,
  scrapRatePct: 0.38,
  reworkRatePct: 1.12,
  qualityPassPct: 97.6,
  inspectionsToday: 284,

  // Machines (8 machines)
  machines: [
    { id: 'M-001', name: 'Coating Machine #1', type: 'Coating Machine', line: 'Line A', temp: 58.2, vibration: 1.8, health: 92, status: 'Running', oee: 88.4, uptimePct: 96.2 },
    { id: 'M-002', name: 'Calendering Press #1', type: 'Calendering Press', line: 'Line A', temp: 72.1, vibration: 2.4, health: 87, status: 'Running', oee: 84.1, uptimePct: 91.8 },
    { id: 'M-003', name: 'Winding Machine #1', type: 'Winding Machine', line: 'Line B', temp: 44.5, vibration: 3.1, health: 78, status: 'Running', oee: 79.3, uptimePct: 88.5 },
    { id: 'M-004', name: 'Electrolyte Filler #1', type: 'Electrolyte Filler', line: 'Line B', temp: 22.8, vibration: 0.6, health: 95, status: 'Running', oee: 93.1, uptimePct: 98.4 },
    { id: 'M-005', name: 'Formation Cycler #1', type: 'Formation Cycler', line: 'Line C', temp: 35.2, vibration: 0.4, health: 91, status: 'Running', oee: 87.6, uptimePct: 94.1 },
    { id: 'M-006', name: 'Aging Oven #1', type: 'Aging Oven', line: 'Line C', temp: 45.0, vibration: 0.2, health: 96, status: 'Running', oee: 91.4, uptimePct: 99.1 },
    { id: 'M-007', name: 'Welding Station #1', type: 'Welding Station', line: 'Line D', temp: 68.4, vibration: 4.2, health: 73, status: 'Warning', oee: 72.8, uptimePct: 82.3 },
    { id: 'M-008', name: 'Packaging Line #1', type: 'Packaging Line', line: 'Line D', temp: 28.1, vibration: 1.1, health: 89, status: 'Running', oee: 85.2, uptimePct: 93.7 },
  ],

  // Rolling alerts (last 10)
  alerts: [
    { id: 1, type: 'warning', source: 'M-007', message: 'Welding Station #1 vibration above threshold (4.2 mm/s)', time: new Date(Date.now() - 4 * 60000) },
    { id: 2, type: 'info', source: 'QC-Lab', message: 'Batch CB-2026-00142 passed formation QC (96.2/100)', time: new Date(Date.now() - 12 * 60000) },
    { id: 3, type: 'success', source: 'Production', message: '38 packs assembled today — target met', time: new Date(Date.now() - 25 * 60000) },
  ],
  alertIdCounter: 4,
};

// ---------- Alert generators ----------
const POSSIBLE_ALERTS = [
  () => ({ type: 'warning', source: 'M-003', message: 'Winding Machine #1: tension variance detected' }),
  () => ({ type: 'info', source: 'Energy', message: `Plant power at ${(state.plantKw).toFixed(0)} kW — within budget` }),
  () => ({ type: 'success', source: 'QC-Lab', message: `FPY holding at ${state.fpy.toFixed(1)}% this hour` }),
  () => ({ type: 'error', source: 'BMS', message: `Pack fault detected — ${state.activeFaults} active fault codes` }),
  () => ({ type: 'warning', source: 'Inventory', message: 'NMC cathode stock below 72kg — reorder threshold' }),
  () => ({ type: 'info', source: 'Production', message: `Line B throughput: ${Math.round(state.throughput * 0.9)} units/hr` }),
  () => ({ type: 'success', source: 'Maintenance', message: 'PM completed on Formation Cycler #1 — health 96%' }),
  () => ({ type: 'warning', source: 'M-002', message: `Calendering Press #1 temp ${state.machines[1].temp.toFixed(1)}°C — monitor` }),
];

export const startLivePulse = (io) => {
  if (intervalId) return;
  console.log('📡 LivePulse EV Service Started: Broadcasting 8 telemetry streams...');

  let tick = 0;

  intervalId = setInterval(() => {
    tick++;

    // ── Update factory metrics ──
    state.oee = fluctuate(state.oee, 0.3, 72, 96);
    state.fpy = fluctuate(state.fpy, 0.15, 88, 99);
    state.throughput = Math.round(fluctuate(state.throughput, 3, 90, 160));
    state.utilization = fluctuate(state.utilization, 0.4, 65, 95);
    state.downtimePct = fluctuate(state.downtimePct, 0.1, 1, 12);

    // Line efficiencies
    ['A', 'B', 'C', 'D'].forEach(line => {
      state.lineEfficiency[line] = fluctuate(state.lineEfficiency[line], 0.5, 60, 98);
    });

    // ── Update counters (increment each tick ~every 5s) ──
    state.cellsProducedToday += Math.floor(Math.random() * 4);
    if (tick % 12 === 0) state.packsAssembledToday += 1;
    if (tick % 20 === 0) state.packsShippedToday += 1;
    state.defectsToday += Math.random() > 0.92 ? 1 : 0;
    state.scrapToday += Math.random() > 0.96 ? 1 : 0;

    // ── Update energy ──
    state.plantKw = fluctuate(state.plantKw, 8, 280, 420);
    state.carbonGPerMin = +(state.plantKw * 0.17).toFixed(1);
    state.waterLPerHr = fluctuate(state.waterLPerHr, 5, 80, 200);
    state.wasteKgToday += Math.random() > 0.95 ? 0.2 : 0;
    state.recycledKgToday += Math.random() > 0.93 ? 0.15 : 0;
    state.renewablePct = fluctuate(state.renewablePct, 0.3, 10, 35);

    // ── Update BMS telemetry ──
    state.avgSoc = fluctuate(state.avgSoc, 0.5, 20, 100);
    state.avgSoh = fluctuate(state.avgSoh, 0.05, 80, 100);
    state.cellImbalanceMv = fluctuate(state.cellImbalanceMv, 0.4, 2, 30);
    state.activeFaults = Math.max(0, state.activeFaults + (Math.random() > 0.97 ? 1 : Math.random() > 0.96 ? -1 : 0));

    // ── Update quality metrics ──
    state.defectRatePct = fluctuate(state.defectRatePct, 0.05, 0.1, 3.5);
    state.scrapRatePct = fluctuate(state.scrapRatePct, 0.03, 0.05, 2.0);
    state.reworkRatePct = fluctuate(state.reworkRatePct, 0.05, 0.3, 4.0);
    state.qualityPassPct = Math.min(99.9, 100 - state.defectRatePct - state.scrapRatePct);
    state.inspectionsToday += Math.floor(Math.random() * 2);

    // ── Update machines ──
    state.machines = state.machines.map(m => {
      const newTemp = fluctuate(m.temp, 0.8, 20, 95);
      const newVib = fluctuate(m.vibration, 0.15, 0.1, 8.0);
      const newHealth = fluctuate(m.health, 0.2, 50, 100);
      const newOee = fluctuate(m.oee, 0.4, 55, 98);
      
      let newStatus = m.status;
      if (newHealth < 60) newStatus = 'Critical';
      else if (newHealth < 75 || newVib > 5) newStatus = 'Warning';
      else if (newHealth >= 75 && m.status === 'Warning') newStatus = 'Running';

      return { ...m, temp: newTemp, vibration: newVib, health: Math.round(newHealth), oee: newOee, status: newStatus };
    });

    // ── Generate occasional alert ──
    if (Math.random() > 0.85) {
      const alertFn = POSSIBLE_ALERTS[Math.floor(Math.random() * POSSIBLE_ALERTS.length)];
      const newAlert = { ...alertFn(), id: state.alertIdCounter++, time: new Date() };
      state.alerts = [newAlert, ...state.alerts.slice(0, 14)]; // keep last 15
    }

    // ── Emit all streams ──
    const timestamp = new Date();

    // Legacy stream (backward compat)
    io.emit('production_update', {
      metrics: {
        productionRate: state.oee.toFixed(1) + '%',
        qualityScore: state.qualityPassPct.toFixed(1) + '%',
        machineUptime: (100 - state.downtimePct).toFixed(1) + '%'
      },
      trends: {
        productionRate: (state.oee > 82 ? '+' : '-') + (Math.random() * 1.5).toFixed(1) + '%',
        qualityScore: '+' + (Math.random() * 0.5).toFixed(1) + '%',
        machineUptime: (Math.random() > 0.6 ? '+' : '-') + (Math.random() * 0.8).toFixed(1) + '%'
      },
      timestamp
    });

    // Factory overview metrics
    io.emit('factory_metrics', {
      oee: +state.oee.toFixed(1),
      fpy: +state.fpy.toFixed(1),
      throughput: state.throughput,
      utilization: +state.utilization.toFixed(1),
      downtimePct: +state.downtimePct.toFixed(1),
      lineEfficiency: state.lineEfficiency,
      timestamp
    });

    // Energy & carbon
    io.emit('energy_pulse', {
      plantKw: +state.plantKw.toFixed(1),
      carbonGPerMin: +state.carbonGPerMin.toFixed(1),
      waterLPerHr: +state.waterLPerHr.toFixed(1),
      wasteKgToday: +state.wasteKgToday.toFixed(1),
      recycledKgToday: +state.recycledKgToday.toFixed(1),
      renewablePct: +state.renewablePct.toFixed(1),
      carbonKgToday: +(state.carbonGPerMin * tick * 5 / 1000 / 60).toFixed(2),
      timestamp
    });

    // Machine statuses
    io.emit('machine_status', { machines: state.machines, timestamp });

    // BMS telemetry
    io.emit('bms_telemetry', {
      avgSoc: +state.avgSoc.toFixed(1),
      avgSoh: +state.avgSoh.toFixed(1),
      cellImbalanceMv: +state.cellImbalanceMv.toFixed(1),
      activeFaults: state.activeFaults,
      thermalEvents: state.thermalEvents,
      packCount: 42,
      timestamp
    });

    // Production counters
    io.emit('production_counters', {
      cellsProducedToday: state.cellsProducedToday,
      packsAssembledToday: state.packsAssembledToday,
      packsShippedToday: state.packsShippedToday,
      defectsToday: state.defectsToday,
      scrapToday: state.scrapToday,
      timestamp
    });

    // Quality live stream
    io.emit('quality_live', {
      defectRatePct: +state.defectRatePct.toFixed(2),
      scrapRatePct: +state.scrapRatePct.toFixed(2),
      reworkRatePct: +state.reworkRatePct.toFixed(2),
      qualityPassPct: +state.qualityPassPct.toFixed(1),
      inspectionsToday: state.inspectionsToday,
      timestamp
    });

    // Alert stream (last 15 alerts)
    io.emit('alert_stream', { alerts: state.alerts, timestamp });

  }, 5000); // Every 5 seconds
};

export const stopLivePulse = () => {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log('📡 LivePulse stopped.');
  }
};
