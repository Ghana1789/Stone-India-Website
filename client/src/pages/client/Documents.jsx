import { useState, useEffect } from 'react';
import api from '../../services/api';
import { format } from 'date-fns';
import { FiFile, FiDownload, FiUploadCloud, FiTrash2, FiFileText } from 'react-icons/fi';

export default function ClientDocuments() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/client/documents')
      .then(r => setDocuments(r.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleUploadClick = () => {
    // Simulated upload for demo purposes
    const simulatedDoc = {
      _id: 'doc_' + Date.now(),
      title: 'Brand_Assets.zip',
      fileType: 'application/zip',
      sizeBytes: 4500000,
      createdAt: new Date().toISOString(),
      uploadedBy: 'Me',
      uploaderRole: 'client'
    };
    alert('Mock Uploading File...');
    setDocuments([simulatedDoc, ...documents]);
  };

  const formatSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024, sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto pb-10 font-sans">
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Document Centre</h1>
          <p className="text-slate-400 text-sm">Contracts, reports, and delivery documents.</p>
        </div>
        <button 
          onClick={handleUploadClick}
          className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold flex items-center gap-2 rounded-lg transition-colors border border-brand-500"
        >
          <FiUploadCloud className="w-4 h-4" /> Upload File
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        {documents.length === 0 ? (
          <div className="col-span-full border-2 border-dashed border-slate-700 bg-slate-900 rounded-2xl p-12 flex flex-col items-center justify-center text-slate-500">
            <FiUploadCloud className="w-12 h-12 mb-3 text-slate-600" />
            <p className="text-sm">Drag and drop files here, or click upload.</p>
          </div>
        ) : documents.map(doc => (
          <div key={doc._id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg group hover:border-slate-700 transition-colors">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-brand-400 shrink-0">
                <FiFileText className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-white text-sm font-bold truncate group-hover:text-brand-400 transition-colors" title={doc.title}>
                  {doc.title}
                </h4>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                  <span>{formatSize(doc.sizeBytes)}</span>
                  <span>•</span>
                  <span>{format(new Date(doc.createdAt), 'dd MMM yyyy')}</span>
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${doc.uploaderRole === 'admin' ? 'bg-purple-500/20 text-purple-400' : 'bg-slate-800 text-slate-400'}`}>
                    {doc.uploaderRole === 'admin' ? 'Agency' : 'Me'}
                  </span>
                </div>
              </div>
              
              <div className="shrink-0 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="p-2 bg-slate-800 text-slate-300 hover:text-white rounded hover:bg-brand-600 transition-colors" title="Download">
                  <FiDownload className="w-4 h-4" />
                </button>
                <button className="p-2 bg-slate-800 text-slate-300 hover:text-red-400 rounded hover:bg-slate-700 transition-colors" title="Delete">
                  <FiTrash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
