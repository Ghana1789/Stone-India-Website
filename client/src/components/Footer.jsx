import { Link } from 'react-router-dom';
import { FiBatteryCharging, FiMail, FiPhone, FiMapPin, FiLinkedin, FiTwitter, FiInstagram } from 'react-icons/fi';

export default function Footer() {
  return (
    <footer className="bg-black border-t border-white/10 pt-16 pb-8">
      <div className="container-custom">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-2.5 group mb-6">
              <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.2)] group-hover:shadow-[0_0_20px_rgba(255,255,255,0.4)] transition-all duration-300">
                <FiBatteryCharging className="w-5 h-5 text-black" />
              </div>
              <div>
                <span className="font-display font-bold text-white tracking-tight text-lg leading-none">Stone India</span>
                <p className="text-[10px] text-slate-400 font-medium tracking-widest">PVT. LTD.</p>
              </div>
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              India's trusted EV battery manufacturer. Powering the future of electric mobility with BIS-certified, AIS-compliant battery packs.
            </p>
            <div className="flex gap-3">
              {[FiLinkedin, FiTwitter, FiInstagram].map((Icon, i) => (
                <a key={i} href="#" className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:border-white/30 transition-all duration-200">
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-white mb-5">Company</h4>
            <ul className="space-y-3">
              {[
                { label: 'About Us', to: '/about' },
                { label: 'EV Products', to: '/products' },
                { label: 'Manufacturing', to: '/manufacturing' },
                { label: 'Certifications', to: '/certifications' },
                { label: 'Careers', to: '/careers' },
                { label: 'Contact', to: '/contact' },
              ].map(link => (
                <li key={link.to}>
                  <Link to={link.to} className="text-slate-400 hover:text-white text-sm transition-colors duration-200">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Portals */}
          <div>
            <h4 className="font-semibold text-white mb-5">Portals</h4>
            <ul className="space-y-3">
              {[
                { label: 'Client Portal', to: '/client/dashboard' },
                { label: 'Employee Portal', to: '/employee/dashboard' },
                { label: 'Admin Portal', to: '/admin/dashboard' },
                { label: 'Sign In', to: '/login' },
              ].map(link => (
                <li key={link.to}>
                  <Link to={link.to} className="text-slate-400 hover:text-white text-sm transition-colors duration-200">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-white mb-5">Contact</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <FiMapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                <span className="text-slate-400 text-sm">NEAR RAVIRYAL ROAD<br />SHAMSHABAD,<br />HYDERABAD 501818</span>
              </li>
              <li className="flex items-center gap-3">
                <FiPhone className="w-4 h-4 text-slate-400 shrink-0" />
                <a href="tel:+919505306561" className="text-slate-400 hover:text-white text-sm transition-colors">+91 9505306561</a>
              </li>
              <li className="flex items-center gap-3">
                <FiMail className="w-4 h-4 text-slate-400 shrink-0" />
                <a href="mailto:stonelithiumbatteries@gmail.com" className="text-slate-400 hover:text-white text-sm transition-colors">stonelithiumbatteries@gmail.com</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-slate-500 text-sm">© 2024 Stone India Pvt. Ltd. All rights reserved.</p>
          <div className="flex gap-6">
            <span className="text-slate-500 text-xs">CIN: U31100MH2020PTC123456</span>
            <span className="text-slate-500 text-xs">GST: 27ABCDE1234F1Z5</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
