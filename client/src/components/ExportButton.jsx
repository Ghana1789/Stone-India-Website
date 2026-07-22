import { useState, useRef } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

/**
 * ExportButton — triggers CSV or PDF download from the admin analytics export endpoints.
 *
 * Props:
 *  - type: 'csv' | 'pdf'
 *  - reportType: string (e.g. 'overview', 'revenue', 'order_fulfillment', ...)
 *  - preset: string (date range preset)
 *  - startDate / endDate: optional ISO date strings for custom range
 *  - title: optional PDF title override
 *  - className: additional CSS classes
 *  - children: button label
 */
export default function ExportButton({
  type = 'csv',
  reportType = 'overview',
  preset = 'last_30_days',
  startDate,
  endDate,
  title,
  className = '',
  children
}) {
  const [loading, setLoading] = useState(false);
  const linkRef = useRef(null);

  const handleExport = async () => {
    setLoading(true);
    const toastId = toast.loading(`Generating ${type.toUpperCase()}…`);
    try {
      const payload = { reportType, preset, startDate, endDate, title };
      const response = await api.post(`/admin/analytics/export/${type}`, payload, {
        responseType: 'blob'
      });

      const mimeType = type === 'pdf' ? 'application/pdf' : 'text/csv;charset=utf-8;';
      const ext = type === 'pdf' ? 'pdf' : 'csv';
      const blob = new Blob([response.data], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const filename = `${reportType}_${new Date().toISOString().slice(0, 10)}.${ext}`;

      // Trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(`${type.toUpperCase()} downloaded!`, { id: toastId });
    } catch (err) {
      toast.error(`Export failed: ${err?.response?.data?.message || err.message}`, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const baseStyle = `inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${className}`;

  const csvStyle = 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/30';
  const pdfStyle = 'bg-red-600/20 text-red-400 border border-red-500/30 hover:bg-red-600/30';

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className={`${baseStyle} ${type === 'pdf' ? pdfStyle : csvStyle}`}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        <span>{type === 'pdf' ? '📄' : '📊'}</span>
      )}
      {children || (type === 'pdf' ? 'Export PDF' : 'Export CSV')}
    </button>
  );
}
