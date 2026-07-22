import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { FiAward, FiCheck, FiShield } from 'react-icons/fi';

const certs = [
  {
    name: 'BIS Certification',
    logo: '🏛️',
    authority: 'Bureau of Indian Standards',
    standard: 'IS 16046 (Part 1 & 2)',
    description: 'Mandatory certification by Bureau of Indian Standards for all lithium-ion batteries sold in India. Ensures safety, performance, and reliability.',
    scope: 'All our 2W, 3W, and fleet battery packs',
    color: 'from-brand-600 to-brand-400',
    border: 'border-brand-500/30',
  },
  {
    name: 'AIS 038 Rev 2',
    logo: '⚡',
    authority: 'Automotive Industry Standard',
    standard: 'AIS 038 Rev 2 / AIS 048',
    description: 'Automotive Industry Standard for performance, safety and reliability of electric vehicle batteries. Required by CMVR for vehicles operating on Indian roads.',
    scope: '2W & 3W EV batteries (48V–60V range)',
    color: 'from-blue-600 to-blue-400',
    border: 'border-blue-500/30',
  },
  {
    name: 'ISO 9001:2015',
    logo: '🏭',
    authority: 'International Organization for Standardization',
    standard: 'ISO 9001:2015',
    description: 'Quality Management System certification demonstrating consistent product quality, customer satisfaction, and continuous improvement processes.',
    scope: 'Manufacturing facility and all processes',
    color: 'from-purple-600 to-purple-400',
    border: 'border-purple-500/30',
  },
  {
    name: 'UN38.3',
    logo: '✈️',
    authority: 'United Nations',
    standard: 'UN/DOT 38.3',
    description: 'International transport safety standard for lithium batteries. Ensures our batteries can be safely transported by air, sea, and road.',
    scope: 'All battery products for transport clearance',
    color: 'from-teal-600 to-teal-400',
    border: 'border-teal-500/30',
  },
  {
    name: 'IEC 62619',
    logo: '🔋',
    authority: 'International Electrotechnical Commission',
    standard: 'IEC 62619:2022',
    description: 'Safety requirements for secondary lithium cells and batteries for use in industrial applications including grid storage and stationary BESS.',
    scope: 'Grid/BESS and industrial battery systems',
    color: 'from-orange-600 to-orange-400',
    border: 'border-orange-500/30',
  },
  {
    name: 'ISO 26262',
    logo: '🚌',
    authority: 'International Organization for Standardization',
    standard: 'ISO 26262 (ASIL B)',
    description: 'Functional safety standard for automotive electrical/electronic systems. Applied to our fleet battery BMS development.',
    scope: 'Fleet batteries (buses, trucks)',
    color: 'from-red-600 to-red-400',
    border: 'border-red-500/30',
  },
];

const testingCapabilities = [
  'Cell Voltage & Capacity Testing', 'Cycle Life Testing (2000+ cycles)',
  'Thermal Runaway Testing', 'Short Circuit Protection Test',
  'Overcharge / Over-discharge Test', 'Vibration & Shock Testing',
  'IP67 Waterproof Testing', 'BMS Communication Testing',
  'Insulation Resistance Testing', 'ESD Protection Testing',
];

export default function Certifications() {
  return (
    <div className="min-h-screen">
      <Navbar />
      {/* Hero */}
      <section className="pt-32 pb-16 px-4 relative bg-black border-b border-white/10 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.05),transparent_50%)]" />
        <div className="container-custom relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-6">
            <FiAward className="text-slate-300 w-3 h-3" />
            <span className="text-slate-300 text-xs font-medium tracking-widest uppercase">Safety & Compliance</span>
          </div>
          <h1 className="font-display font-bold text-5xl md:text-7xl mb-6 text-white tracking-tighter">
            Certified for <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-white/40">Safety & Performance</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto font-light">
            Every Stone India battery meets the strictest Indian and international safety certifications before leaving our facility.
          </p>
        </div>
      </section>

      {/* Certifications Grid */}
      <section className="section bg-black">
        <div className="container-custom">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {certs.map(c => (
              <div key={c.name} className={`card group bg-white/5 border border-white/10 card-hover backdrop-blur-sm`}>
                <div className={`w-14 h-14 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl mb-5 group-hover:scale-110 transition-transform duration-300 shadow-sm text-white`}>
                  {c.logo}
                </div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-display font-semibold text-white text-xl">{c.name}</h3>
                  <span className="badge bg-white/10 text-white border-white/20 text-[10px] shrink-0 uppercase tracking-wider">Certified</span>
                </div>
                <p className="text-xs text-slate-300 font-mono font-semibold mb-1 uppercase tracking-wider">{c.standard}</p>
                <p className="text-slate-500 text-[10px] uppercase tracking-widest mb-4 font-medium">{c.authority}</p>
                <p className="text-slate-400 text-sm leading-relaxed mb-5 font-light">{c.description}</p>
                <div className="pt-4 border-t border-white/10">
                  <div className="flex items-start gap-2">
                    <FiShield className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                    <span className="text-slate-300 text-xs font-light"><span className="text-slate-500 font-medium uppercase tracking-wider text-[10px]">Scope:</span> {c.scope}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testing Capabilities */}
      <section className="section bg-zinc-950 border-t border-white/10">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="section-title font-display text-white">In-House Testing Lab</h2>
            <p className="text-slate-400 text-lg max-w-xl mx-auto font-light">
              State-of-the-art testing equipment ensures every batch meets our quality standards.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-4xl mx-auto">
            {testingCapabilities.map(t => (
              <div key={t} className="flex items-center gap-3 p-3 bg-black rounded-xl border border-white/10 shadow-[0_0_10px_rgba(255,255,255,0.02)]">
                <div className="w-6 h-6 bg-white/5 rounded-full flex items-center justify-center shrink-0 border border-white/10">
                  <FiCheck className="w-3 h-3 text-slate-300" />
                </div>
                <span className="text-slate-300 font-light text-sm">{t}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
