import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { FiBatteryCharging, FiTarget, FiEye, FiHeart } from 'react-icons/fi';

const team = [
  { name: 'Naidu Mithun Reddy', role: 'Founder & CEO', desc: 'IIT Bombay alum with 15+ years in electrochemistry and EV tech.', emoji: '👨‍💼' },
  { name: 'Sunita Rao', role: 'Head of R&D', desc: 'Ph.D in Materials Science. Led LFP chemistry research at DRDO.', emoji: '👩‍🔬' },
  { name: 'Vikram Singh', role: 'VP Manufacturing', desc: '20 years in automotive manufacturing. Six Sigma Black Belt.', emoji: '👨‍🏭' },
  { name: 'Priyanka Das', role: 'Head of Quality', desc: 'ISO certified quality lead with expertise in AIS compliance.', emoji: '👩‍💻' },
];

const milestones = [
  { year: '2016', event: 'Stone India founded in Hyderabad with focus on EV battery R&D' },
  { year: '2018', event: 'First BIS certified LFP battery pack for electric scooters' },
  { year: '2020', event: 'Expanded to fleet batteries — supplied 500+ packs to e-rickshaw OEMs' },
  { year: '2022', event: 'ISO 9001:2015 certification. Launched Grid/BESS product line' },
  { year: '2023', event: 'AIS 038 Rev 2 certification achieved. 10,000+ packs deployed' },
  { year: '2024', event: 'Launched digital client & employee portal. Scaling to 50,000 packs/year' },
];

export default function About() {
  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-20 px-4 relative overflow-hidden bg-black">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.05),transparent_50%)]" />
        <div className="absolute top-0 right-0 w-[600px] h-[300px] bg-brand-500/10 blur-[120px] rounded-full" />
        <div className="container-custom relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-6">
                <span className="text-slate-300 text-xs font-medium tracking-widest uppercase">About Stone India</span>
              </div>
              <h1 className="font-display font-bold text-5xl md:text-7xl mb-6 text-white tracking-tighter leading-[1.1]">
                Powering India's <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-white/40">EV Revolution</span>
              </h1>
              <p className="text-slate-400 text-lg leading-relaxed mb-6 font-light">
                Stone India Pvt. Ltd. is a Hyderabad-based EV battery manufacturer committed to delivering safe, reliable, and high-performance battery packs for India's growing electric vehicle ecosystem.
              </p>
              <p className="text-slate-500 leading-relaxed font-light text-sm">
                Founded in 2016, we have grown from a small R&D lab to a full-scale manufacturing facility producing BIS and AIS certified LFP and NMC battery packs for 2-wheelers, 3-wheelers, fleet vehicles, and grid storage applications.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { val: '2016', label: 'Founded', color: 'text-white' },
                { val: '10,000+', label: 'Packs Deployed', color: 'text-white' },
                { val: '50+', label: 'OEM Partners', color: 'text-white' },
                { val: '99.2%', label: 'QC Pass Rate', color: 'text-white' },
              ].map(s => (
                <div key={s.label} className="card text-center group card-hover bg-white/5 border-white/10 backdrop-blur-sm">
                  <div className={`text-3xl font-bold font-display ${s.color} mb-2 tracking-tight`}>{s.val}</div>
                  <div className="text-slate-400 text-xs tracking-wider uppercase font-medium">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Mission, Vision, Values */}
      <section className="section bg-zinc-950 border-y border-white/10">
        <div className="container-custom">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: FiTarget, title: 'Our Mission', color: 'text-slate-300', bg: 'bg-white/5', text: 'To accelerate India\'s electric mobility transition by manufacturing world-class, affordable, and safe battery packs that meet the toughest Indian standards.' },
              { icon: FiEye, title: 'Our Vision', color: 'text-slate-300', bg: 'bg-white/5', text: 'To become India\'s most trusted EV battery brand — powering 1 million electric vehicles by 2030 with zero compromise on safety.' },
              { icon: FiHeart, title: 'Our Values', color: 'text-slate-300', bg: 'bg-white/5', text: 'Safety first. Zero defects. Transparent business. Customer-centric approach. Continuous innovation. Respect for every team member and partner.' },
            ].map(v => (
              <div key={v.title} className="card card-hover text-center group bg-black border-white/10">
                <div className={`w-14 h-14 rounded-2xl ${v.bg} border border-white/10 flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-transform`}>
                  <v.icon className={`w-6 h-6 ${v.color}`} />
                </div>
                <h3 className="font-display font-semibold text-white text-xl mb-3">{v.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed font-light">{v.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="section bg-black">
        <div className="container-custom">
          <div className="text-center mb-16">
            <h2 className="section-title font-display">Our Journey</h2>
          </div>
          <div className="relative max-w-2xl mx-auto">
            <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-white/20 to-transparent" />
            <div className="space-y-8">
              {milestones.map((m, i) => (
                <div key={m.year} className="flex gap-6 pl-0">
                  <div className="relative flex flex-col items-center">
                    <div className="w-12 h-12 bg-zinc-900 border border-white/10 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0 z-10 shadow-sm">
                      {m.year.slice(2)}
                    </div>
                  </div>
                  <div className="card card-hover flex-1 mb-0 bg-white/5 border-white/10 backdrop-blur-sm">
                    <div className="text-slate-300 font-bold font-mono tracking-widest text-xs mb-2">{m.year}</div>
                    <p className="text-slate-400 text-sm font-light">{m.event}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Leadership */}
      <section className="section bg-zinc-950 border-t border-white/10">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="section-title font-display">Leadership Team</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {team.map(t => (
              <div key={t.name} className="card card-hover text-center group bg-black border-white/10">
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300 opacity-80 group-hover:opacity-100">{t.emoji}</div>
                <h3 className="text-white font-semibold">{t.name}</h3>
                <div className="text-slate-400 text-xs uppercase tracking-widest font-medium mb-4 mt-1">{t.role}</div>
                <p className="text-slate-500 text-xs leading-relaxed font-light">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
