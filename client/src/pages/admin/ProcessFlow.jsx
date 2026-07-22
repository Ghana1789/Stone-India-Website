import { useState } from 'react';
import { FiCheckCircle, FiClock, FiPackage, FiZap, FiTruck, FiBox, FiLayers, FiDroplet } from 'react-icons/fi';

const STAGES = [
  {
    id: 1, name: 'Raw Materials', icon: FiBox, dept: 'Procurement',
    description: 'Lithium salts, graphite, separators, and electrolytes sourced & inspected.',
    color: '#3b82f6',
  },
  {
    id: 2, name: 'Mixing', icon: FiDroplet, dept: 'Production',
    description: 'Active materials mixed with binders and solvents to form electrode slurry.',
    color: '#8b5cf6',
  },
  {
    id: 3, name: 'Coating', icon: FiLayers, dept: 'Engineering',
    description: 'Slurry uniformly coated onto copper/aluminum current collectors.',
    color: '#f97316',
  },
  {
    id: 4, name: 'Drying', icon: FiZap, dept: 'Production',
    description: 'Electrodes dried in controlled environment to remove solvent residue.',
    color: '#f59e0b',
  },
  {
    id: 5, name: 'Assembly', icon: FiLayers, dept: 'Production',
    description: 'Cell assembly — stacking/winding electrodes, electrolyte filling, sealing.',
    color: '#ec4899',
  },
  {
    id: 6, name: 'Testing', icon: FiCheckCircle, dept: 'Quality Control',
    description: 'Cycle testing, thermal testing, safety checks (UN38.3, AIS 038).',
    color: '#22c55e',
  },
  {
    id: 7, name: 'Packaging', icon: FiPackage, dept: 'Packaging',
    description: 'Certified batteries packaged with BMS, documentation, and labels.',
    color: '#14b8a6',
  },
  {
    id: 8, name: 'Delivery', icon: FiTruck, dept: 'Logistics & Supply Chain',
    description: 'Dispatch to client with tracking, insurance, and documentation.',
    color: '#10b981',
  },
];

const DEPT_RESPONSIBILITY = {
  'Raw Materials': ['Procurement', 'Engineering'],
  'Mixing': ['Production', 'Research & Development'],
  'Coating': ['Engineering', 'Production'],
  'Drying': ['Production', 'Maintenance'],
  'Assembly': ['Production', 'Engineering'],
  'Testing': ['Quality Control', 'Safety & Environment'],
  'Packaging': ['Packaging', 'Quality Control'],
  'Delivery': ['Logistics & Supply Chain', 'Sales & Marketing'],
};

export default function AdminProcessFlow() {
  const [activeStage, setActiveStage] = useState(null);
  // Simulate: stages 1-5 complete, stage 6 in progress, rest pending
  const getStatus = (id) => {
    if (id < 6) return 'completed';
    if (id === 6) return 'in-progress';
    return 'pending';
  };

  const statusConfig = {
    completed: { dot: '#22c55e', label: '🟢 Completed', cls: 'border-emerald-500/40 bg-emerald-500/5' },
    'in-progress': { dot: '#f59e0b', label: '🟡 In Progress', cls: 'border-yellow-500/40 bg-yellow-500/5' },
    pending: { dot: '#6b7280', label: '⚪ Pending', cls: 'border-slate-700 bg-[#13161e]' },
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-white italic tracking-tight uppercase">Manufacturing Process Flow</h1>
        <p className="text-slate-400 mt-1 font-medium">Battery production pipeline · Department responsibility map</p>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 flex-wrap">
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-emerald-500" /><span className="text-slate-400 text-xs font-bold uppercase tracking-widest">Completed</span></div>
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-yellow-500" /><span className="text-slate-400 text-xs font-bold uppercase tracking-widest">In Progress</span></div>
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-slate-600" /><span className="text-slate-400 text-xs font-bold uppercase tracking-widest">Pending</span></div>
      </div>

      {/* Pipeline Visual */}
      <div className="overflow-x-auto pb-4">
        <div className="flex items-center gap-0 min-w-[900px]">
          {STAGES.map((stage, idx) => {
            const status = getStatus(stage.id);
            const sc = statusConfig[status];
            const isActive = activeStage === stage.id;
            return (
              <div key={stage.id} className="flex items-center flex-1">
                <button
                  onClick={() => setActiveStage(isActive ? null : stage.id)}
                  className={`w-full flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all cursor-pointer hover:scale-105 ${sc.cls} ${isActive ? 'scale-105 shadow-xl' : ''}`}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: stage.color + '20' }}>
                    <stage.icon className="w-5 h-5" style={{ color: stage.color }} />
                  </div>
                  <div className="text-center">
                    <div className="text-white font-bold text-xs">{stage.name}</div>
                    <div className="text-slate-500 text-[9px] uppercase tracking-widest mt-0.5">{stage.dept}</div>
                  </div>
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: sc.dot }} />
                </button>
                {idx < STAGES.length - 1 && (
                  <div className="flex-shrink-0 flex items-center px-1">
                    <div className="w-6 h-0.5 bg-slate-700" />
                    <div className="w-0 h-0 border-t-4 border-b-4 border-l-4 border-t-transparent border-b-transparent border-l-slate-600" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Stage Detail Panel */}
      {activeStage && (() => {
        const stage = STAGES.find(s => s.id === activeStage);
        const status = getStatus(stage.id);
        const sc = statusConfig[status];
        const depts = DEPT_RESPONSIBILITY[stage.name] || [];
        return (
          <div className="bg-[#13161e] border border-slate-800 rounded-[2rem] p-8 animate-fade-in">
            <div className="flex items-start gap-6">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0" style={{ backgroundColor: stage.color + '20' }}>
                <stage.icon className="w-8 h-8" style={{ color: stage.color }} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <h3 className="text-2xl font-black text-white italic">Stage {stage.id}: {stage.name}</h3>
                  <span className="text-sm font-bold text-slate-400">{sc.label}</span>
                </div>
                <p className="text-slate-400 mb-4">{stage.description}</p>
                <div>
                  <div className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">Responsible Departments</div>
                  <div className="flex gap-2 flex-wrap">
                    {depts.map(d => (
                      <span key={d} className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-300 text-xs font-bold">{d}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* All Stages Table */}
      <div className="bg-[#13161e] border border-slate-800 rounded-[2rem] overflow-hidden">
        <div className="px-8 py-5 border-b border-slate-800">
          <h3 className="text-white font-black italic uppercase text-base">Process Stages Overview</h3>
        </div>
        <div className="divide-y divide-slate-800">
          {STAGES.map(stage => {
            const status = getStatus(stage.id);
            const sc = statusConfig[status];
            const depts = DEPT_RESPONSIBILITY[stage.name] || [];
            return (
              <div key={stage.id} className="flex flex-col sm:flex-row sm:items-center justify-between px-8 py-4 gap-3 hover:bg-slate-800/20 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: stage.color + '20' }}>
                    <stage.icon className="w-4 h-4" style={{ color: stage.color }} />
                  </div>
                  <div>
                    <div className="text-white font-bold text-sm">{stage.id}. {stage.name}</div>
                    <div className="text-slate-500 text-xs">{depts.join(' · ')}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: sc.dot }} />
                  <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">{status.replace('-', ' ')}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
