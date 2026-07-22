/**
 * DateRangePicker — lightweight date range preset selector + optional custom date inputs.
 *
 * Props:
 *  - preset: current preset string
 *  - onChange: (preset, startDate?, endDate?) => void
 */
export default function DateRangePicker({ preset = 'last_30_days', onChange }) {
  const PRESETS = [
    { value: 'last_7_days', label: 'Last 7 Days' },
    { value: 'last_30_days', label: 'Last 30 Days' },
    { value: 'last_90_days', label: 'Last 90 Days' },
    { value: 'this_month', label: 'This Month' },
    { value: 'last_month', label: 'Last Month' },
    { value: 'this_year', label: 'This Year' },
    { value: 'custom', label: 'Custom Range' },
  ];

  const isCustom = preset === 'custom';

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="flex gap-1 bg-slate-800/50 border border-slate-700/50 rounded-lg p-1">
        {PRESETS.map(p => (
          <button
            key={p.value}
            onClick={() => onChange(p.value)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
              preset === p.value
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {isCustom && (
        <div className="flex items-center gap-2">
          <input
            type="date"
            onChange={e => onChange('custom', e.target.value, undefined)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
          />
          <span className="text-slate-500 text-sm">to</span>
          <input
            type="date"
            onChange={e => onChange('custom', undefined, e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
          />
        </div>
      )}
    </div>
  );
}
