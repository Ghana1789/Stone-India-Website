import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { FiArrowRight, FiCheck } from 'react-icons/fi';

const steps = [
  { step: '01', title: 'Incoming Material QC', desc: 'All raw materials and cells are tested for voltage, capacity, and internal resistance before entering production.', icon: '🔬', color: 'from-brand-600 to-brand-400' },
  { step: '02', title: 'Cell Sorting & Matching', desc: 'Cells are sorted by capacity and IR using automated equipment to ensure uniform performance in packs.', icon: '⚙️', color: 'from-blue-600 to-blue-400' },
  { step: '03', title: 'Pack Assembly', desc: 'Cells are assembled into modules in our clean-room facility by trained technicians using certified tooling.', icon: '🔧', color: 'from-purple-600 to-purple-400' },
  { step: '04', title: 'BMS Integration', desc: 'Smart Battery Management System is programmed, calibrated, and tested for protection parameters and communication.', icon: '💻', color: 'from-teal-600 to-teal-400' },
  { step: '05', title: 'Formation & Aging', desc: 'Each pack goes through controlled formation cycling to stabilize chemistry and verify capacity.', icon: '⚡', color: 'from-yellow-600 to-yellow-400' },
  { step: '06', title: 'QC Testing', desc: 'Comprehensive digital QC checklist: voltage, capacity, temperature, insulation, safety, and packaging checks.', icon: '✅', color: 'from-brand-600 to-brand-400' },
  { step: '07', title: 'Certification & Labelling', desc: 'Approved batches receive batch ID, QR code traceability label, and compliance documentation.', icon: '🏅', color: 'from-orange-600 to-orange-400' },
  { step: '08', title: 'Dispatch & Delivery', desc: 'Packed in protective packaging with transport-safe UN38.3 compliance. Dispatched with full documentation.', icon: '🚚', color: 'from-red-600 to-red-400' },
];

const facilities = [
  { stat: '10,000 sq ft', label: 'Manufacturing Floor' },
  { stat: '500 units/day', label: 'Production Capacity' },
  { stat: '100% Digital', label: 'QC Tracking' },
  { stat: '<0.8%', label: 'Defect Rate' },
];

export default function Manufacturing() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <section className="pt-32 pb-16 px-4 relative bg-black border-b border-white/10 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.05),transparent_50%)]" />
        <div className="absolute top-0 right-1/4 w-[400px] h-[300px] bg-brand-500/10 blur-[120px] rounded-full" />
        <div className="container-custom relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-6">
            <span className="text-slate-300 text-xs font-medium tracking-widest uppercase">Manufacturing Excellence</span>
          </div>
          <h1 className="font-display font-bold text-5xl md:text-7xl mb-6 text-white tracking-tighter">
            From Cells to <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-white/40">Certified Pack</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto font-light">
            An 8-step precision manufacturing process with 100% digital QC tracking ensures every Stone India battery is built for performance.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-10 bg-zinc-950 border-b border-white/10">
        <div className="container-custom">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {facilities.map(f => (
              <div key={f.label} className="text-center">
                <div className="text-3xl font-bold font-display text-white tracking-tight mb-2">{f.stat}</div>
                <div className="text-slate-400 font-medium text-xs tracking-widest uppercase">{f.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Steps */}
      <section className="section bg-black">
        <div className="container-custom">
          <div className="text-center mb-16">
            <h2 className="section-title font-display text-white">Manufacturing Process</h2>
          </div>
          <div className="relative">
            {/* Vertical line on desktop */}
            <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-white/20 via-white/10 to-transparent -translate-x-1/2" />

            <div className="space-y-8">
              {steps.map((s, i) => (
                <div key={s.step} className={`flex items-center gap-8 flex-col lg:flex-row ${i % 2 === 1 ? 'lg:flex-row-reverse' : ''}`}>
                  {/* Content */}
                  <div className="flex-1 w-full">
                    <div className={`card card-hover group bg-white/5 border-white/10 backdrop-blur-sm ${i % 2 === 1 ? 'lg:text-right' : ''}`}>
                      <div className={`flex items-center gap-4 mb-4 ${i % 2 === 1 ? 'lg:flex-row-reverse' : ''}`}>
                        <div className={`w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-xl shrink-0 group-hover:scale-110 transition-transform shadow-sm`}>{s.icon}</div>
                        <div>
                          <div className="text-slate-400 text-[10px] font-mono tracking-widest uppercase mb-1">Step {s.step}</div>
                          <h3 className="text-white font-semibold text-lg">{s.title}</h3>
                        </div>
                      </div>
                      <p className="text-slate-400 text-sm leading-relaxed font-light">{s.desc}</p>
                    </div>
                  </div>
                  {/* Center node */}
                  <div className="hidden lg:flex w-10 h-10 bg-black border border-white/20 rounded-full items-center justify-center shrink-0 z-10 shadow-[0_0_15px_rgba(255,255,255,0.05)]">
                    <span className="text-slate-300 font-bold text-xs tracking-wider">{s.step}</span>
                  </div>
                  <div className="flex-1 hidden lg:block" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Battery Traceability */}
      <section className="section bg-zinc-950 border-t border-white/10">
        <div className="container-custom text-center">
          <h2 className="section-title font-display mb-4 text-white">Full Batch Traceability</h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto mb-10 font-light">
            Every battery gets a unique Batch ID with complete production history — from raw cells to final dispatch.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            {[
              { icon: '🔍', title: 'Batch ID', desc: 'Unique traceable ID on every pack (e.g. SI-BATCH-2024-0042)' },
              { icon: '📱', title: 'QR Code', desc: 'Scan to get full production history, QC results, and certificates' },
              { icon: '🛡️', title: 'Warranty Link', desc: 'Batch ID linked to warranty system for rapid claim resolution' },
            ].map(t => (
              <div key={t.title} className="card card-hover text-center bg-black border-white/10">
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform opacity-80 group-hover:opacity-100">{t.icon}</div>
                <h3 className="text-white font-semibold mb-2">{t.title}</h3>
                <p className="text-slate-400 text-sm font-light">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
