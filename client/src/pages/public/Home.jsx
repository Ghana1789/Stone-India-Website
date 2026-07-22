import { Link } from 'react-router-dom';
import { FiBatteryCharging, FiArrowRight, FiShield, FiAward, FiTruck, FiZap } from 'react-icons/fi';
import { HiOutlineLightningBolt } from 'react-icons/hi';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

const stats = [
  { value: '500+', label: 'Batteries Deployed' },
  { value: '50+', label: 'Fleet Clients' },
  { value: '99.2%', label: 'QC Pass Rate' },
  { value: '8+', label: 'Years Experience' },
];

const features = [
  {
    icon: FiShield,
    title: 'BIS & AIS Certified',
    desc: 'Every battery meets mandatory BIS and AIS 038/048 safety standards for Indian roads.',
    color: 'text-brand-400',
    bg: 'bg-brand-500/10',
  },
  {
    icon: FiBatteryCharging,
    title: 'LFP & NMC Chemistry',
    desc: 'Industry-leading Lithium Ferro Phosphate and NMC cells for maximum cycle life and safety.',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
  },
  {
    icon: FiZap,
    title: 'Smart BMS',
    desc: 'Advanced Battery Management System with real-time monitoring, cell balancing, and CAN bus.',
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10',
  },
  {
    icon: FiTruck,
    title: 'Fleet Solutions',
    desc: 'Custom battery packs for 2W, 3W, buses, trucks, and grid storage with warranty support.',
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
  },
];

const products = [
  { name: '2W / 3W Packs', range: '48V–60V | 20–40Ah', img: '⚡', color: 'from-brand-600 to-brand-400' },
  { name: 'Fleet Batteries', range: '72V–96V | 60–200Ah', img: '🚌', color: 'from-blue-600 to-blue-400' },
  { name: 'Grid / BESS', range: '48V–400V | Custom', img: '🏭', color: 'from-purple-600 to-purple-400' },
  { name: 'R&D Custom', range: 'Fully configurable', img: '🔬', color: 'from-orange-600 to-orange-400' },
];

export default function Home() {
  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="relative min-h-screen flex items-center overflow-hidden bg-black">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.05),transparent_50%)]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-brand-500/10 blur-[120px] rounded-full" />

        <div className="container-custom relative z-10 py-32 flex flex-col items-center text-center mt-10">
          <div className="max-w-4xl flex flex-col items-center">
            {/* Tag */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-8 animate-fade-in shadow-[0_0_10px_rgba(255,255,255,0.05)]">
              <div className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
              <span className="text-slate-300 text-xs font-medium tracking-wide uppercase">India's Premier EV Battery Manufacturer</span>
            </div>

            {/* Headline */}
            <h1 className="font-display font-bold text-6xl md:text-8xl leading-[1.05] mb-6 animate-slide-up text-white tracking-tighter">
              Powering India's <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-white/40">Electric Future</span>
            </h1>
            <p className="text-slate-400 text-lg md:text-xl leading-relaxed mb-10 max-w-2xl animate-slide-up font-light" style={{ animationDelay: '0.1s' }}>
              BIS & AIS certified LFP and NMC battery packs engineered for performance.
              From 2-wheelers to fleet vehicles and grid storage.
            </p>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row items-center gap-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <Link to="/products" className="btn-primary flex items-center gap-2 text-sm rounded-full px-8 py-3.5">
                Explore Catalogue <FiArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/contact" className="btn-secondary flex items-center gap-2 text-sm rounded-full px-8 py-3.5">
                Request Quote
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full max-w-5xl mt-24 animate-slide-up" style={{ animationDelay: '0.3s' }}>
            {stats.map((s) => (
              <div key={s.label} className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center backdrop-blur-sm">
                <div className="text-3xl md:text-4xl font-bold font-display text-white mb-2 tracking-tight">{s.value}</div>
                <div className="text-slate-400 text-xs tracking-wide uppercase font-medium">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="section bg-black border-t border-white/10">
        <div className="container-custom">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-4">
              <span className="text-slate-400 text-xs font-medium uppercase tracking-widest">Why Stone India</span>
            </div>
            <h2 className="section-title font-display">Built for Performance.<br className="hidden md:block" />
              <span className="text-white/60"> Certified for Safety.</span>
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto font-light">
              Every battery that leaves our facility undergoes rigorous testing to meet Indian and international standards.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f) => (
              <div key={f.title} className="card card-hover group bg-white/5 border border-white/10 backdrop-blur-sm">
                <div className={`w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300 border border-white/10`}>
                  <f.icon className={`w-5 h-5 text-slate-300`} />
                </div>
                <h3 className="font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed font-light">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Product Categories */}
      <section className="section bg-zinc-950 border-t border-white/10">
        <div className="container-custom">
          <div className="text-center mb-16">
            <h2 className="section-title font-display">
              Battery Catalogue
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto font-light">
              Engineered for every application — from personal e-scooters to industrial grid storage.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((p) => (
              <div key={p.name} className="card card-hover group cursor-pointer bg-black border-white/10" onClick={() => window.location.href = '/products'}>
                <div className={`w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-3xl mb-5 group-hover:scale-110 transition-transform duration-300 border border-white/10`}>
                  {p.img}
                </div>
                <h3 className="font-semibold text-white mb-1">{p.name}</h3>
                <p className="text-slate-500 text-xs font-mono tracking-wide mb-4">{p.range}</p>
                <div className="flex items-center gap-1 text-slate-300 text-xs font-semibold uppercase tracking-wider">
                  <span>View Products</span>
                  <FiArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link to="/products" className="btn-secondary inline-flex items-center gap-2 rounded-full px-8 py-3.5 text-sm">
              View Full Catalogue <FiArrowRight />
            </Link>
          </div>
        </div>
      </section>

      {/* Certifications Bar */}
      <section className="py-10 bg-black border-y border-white/10">
        <div className="container-custom">
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
            {['BIS Certified', 'AIS 038/048', 'ISO 9001:2015', 'UN38.3', 'IEC 62619', 'ISO 26262'].map((cert) => (
              <div key={cert} className="flex items-center gap-2">
                <FiAward className="w-4 h-4 text-white" />
                <span className="text-slate-300 font-medium text-xs tracking-widest uppercase">{cert}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section bg-black">
        <div className="container-custom">
          <div className="relative rounded-3xl overflow-hidden bg-zinc-950 border border-white/10 p-16 text-center shadow-[0_0_50px_rgba(255,255,255,0.02)]">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(255,255,255,0.05),transparent_50%)]" />
            <div className="relative z-10">
              <h2 className="section-title font-display mb-4 text-white">
                Ready to Power Your EV Fleet?
              </h2>
              <p className="text-slate-400 text-lg mb-10 max-w-xl mx-auto font-light">
                Get a custom quote for your requirements. Our engineers will design the perfect battery solution.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/contact" className="btn-primary flex items-center justify-center gap-2 rounded-full px-8 py-3.5 text-sm">
                  Get a Quote <FiArrowRight />
                </Link>
                <Link to="/login" className="btn-secondary flex items-center justify-center gap-2 rounded-full px-8 py-3.5 text-sm">
                  Client Portal
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
