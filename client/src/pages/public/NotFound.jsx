import { Link } from 'react-router-dom';
import { FiHome, FiMessageSquare, FiAlertCircle } from 'react-icons/fi';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-black">
      <Navbar />
      
      <main className="flex-1 flex items-center justify-center px-4 pt-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.05),transparent_50%)]" />
        <div className="max-w-2xl w-full text-center relative z-10">
          {/* Background decoration */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-500/10 blur-[120px] rounded-full -z-10" />
          
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 mb-8 animate-bounce">
            <FiAlertCircle className="text-red-400 w-3 h-3" />
            <span className="text-red-400 text-xs font-medium tracking-widest uppercase">Error 404</span>
          </div>
          
          <h1 className="font-display font-bold text-7xl md:text-9xl text-white mb-6 tracking-tighter">
            Lost in <br/><span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-white/40">Space?</span>
          </h1>
          
          <p className="text-slate-400 text-lg mb-12 max-w-lg mx-auto font-light leading-relaxed">
            The page you're looking for was either moved, deleted, or never existed in the first place. Let's get you back on track.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/" className="btn-primary flex items-center gap-2 px-8 py-3.5 rounded-full text-sm">
              <FiHome /> Back to Home
            </Link>
            <Link to="/contact" className="btn-secondary flex items-center gap-2 px-8 py-3.5 rounded-full text-sm">
              <FiMessageSquare /> Contact Support
            </Link>
          </div>
          
          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
            {[
              { label: 'Products', path: '/products' },
              { label: 'About Us', path: '/about' },
              { label: 'Manufacturing', path: '/manufacturing' },
              { label: 'Careers', path: '/careers' },
            ].map(link => (
              <Link key={link.path} to={link.path} className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-white/30 transition-colors group">
                <div className="text-slate-500 text-[10px] mb-1 font-medium tracking-widest uppercase">Quick Link</div>
                <div className="text-white font-semibold group-hover:text-slate-300 transition-colors">{link.label}</div>
              </Link>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
