import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import api from '../../services/api';
import { FiMail, FiPhone, FiMapPin, FiSend, FiCheck, FiClock } from 'react-icons/fi';
import toast from 'react-hot-toast';

const contactInfo = [
  { icon: FiMapPin, label: 'Address', value: 'NEAR RAVIRYAL ROAD, SHAMSHABAD, HYDERABAD 501818', color: 'text-brand-400', bg: 'bg-brand-500/10' },
  { icon: FiPhone, label: 'Phone', value: '+91 9505306561', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  { icon: FiMail, label: 'Email', value: 'stonelithiumbatteries@gmail.com', color: 'text-purple-400', bg: 'bg-purple-500/10' },
  { icon: FiClock, label: 'Working Hours', value: 'Mon – Sat: 9:00 AM – 6:00 PM IST', color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
];

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', company: '', subject: '', message: '', type: 'General Enquiry' });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/public/contact', form);
      setSent(true);
      toast.success('Message sent! Our team will contact you within 24 hours.');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const enquiryTypes = ['General Enquiry', 'Product Quote', 'Technical Support', 'Partnership', 'Warranty', 'Career'];

  return (
    <div className="min-h-screen">
      <Helmet>
        <title>Contact Us | Stone India Pvt. Ltd. - EV Battery Experts</title>
        <meta name="description" content="Get in touch with Stone India for battery quotes, technical support, or partnership inquiries. Located in Shamshabad, Hyderabad." />
      </Helmet>
      <Navbar />
      <section className="pt-32 pb-16 px-4 relative bg-black border-b border-white/10 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.05),transparent_50%)]" />
        <div className="container-custom relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-6">
            <span className="text-slate-300 text-xs font-medium tracking-widest uppercase">Contact Us</span>
          </div>
          <h1 className="font-display font-bold text-5xl md:text-7xl mb-4 text-white tracking-tighter">Get In <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-white/40">Touch</span></h1>
          <p className="text-slate-400 text-lg max-w-xl mx-auto font-light">Questions about our batteries? Request a quote, technical support, or partnership discussions.</p>
        </div>
      </section>

      <section className="section bg-black">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Contact Info */}
            <div className="space-y-5">
              <h2 className="text-white font-semibold text-xl mb-6">Contact Information</h2>
              {contactInfo.map(c => (
                <div key={c.label} className="flex items-start gap-4 p-4 card card-hover group bg-white/5 border-white/10 backdrop-blur-sm">
                  <div className={`w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                    <c.icon className={`w-5 h-5 text-slate-300`} />
                  </div>
                  <div>
                    <div className="text-slate-500 text-[10px] mb-1 font-medium uppercase tracking-widest">{c.label}</div>
                    <div className="text-white text-sm font-light">{c.value}</div>
                  </div>
                </div>
              ))}

              {/* Map placeholder */}
              <div className="rounded-2xl overflow-hidden h-48 bg-zinc-950 border border-white/10 flex items-center justify-center shadow-[inset_0_0_20px_rgba(255,255,255,0.02)]">
                <div className="text-center opacity-80">
                  <FiMapPin className="w-8 h-8 text-slate-500 mx-auto mb-3" />
                  <p className="text-slate-300 font-medium text-xs tracking-widest uppercase">SHAMSHABAD, HYDERABAD</p>
                  <p className="text-slate-500 text-[10px] uppercase tracking-widest mt-1">Telangana, India</p>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              {sent ? (
                <div className="card flex flex-col items-center justify-center py-16 text-center shadow-md bg-zinc-950 border-white/10">
                  <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-full flex items-center justify-center mb-6 animate-pulse">
                    <FiCheck className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-white font-semibold text-2xl mb-3 tracking-tight">Message Sent!</h3>
                  <p className="text-slate-400 max-w-sm font-light">Thank you for reaching out. Our team will get back to you within 24 business hours.</p>
                  <button onClick={() => { setSent(false); setForm({ name: '', email: '', phone: '', company: '', subject: '', message: '', type: 'General Enquiry' }); }}
                    className="btn-secondary rounded-full mt-8 px-6 py-2.5 text-sm">Send Another Message</button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="card space-y-6 shadow-md bg-zinc-950 border-white/10">
                  <h2 className="text-white font-semibold text-xl tracking-tight">Send us a Message</h2>

                  {/* Enquiry Type */}
                  <div>
                    <label className="label">Enquiry Type</label>
                    <div className="flex flex-wrap gap-2">
                      {enquiryTypes.map(t => (
                        <button key={t} type="button" onClick={() => setForm({ ...form, type: t })}
                          className={`px-4 py-1.5 rounded-full text-[10px] font-semibold tracking-wider uppercase transition-all ${
                            form.type === t ? 'bg-white text-black' : 'bg-transparent border border-white/10 text-slate-400 hover:text-white hover:border-white/30'
                          }`}>{t}</button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label className="label">Full Name *</label><input id="contact-name" className="input text-sm" placeholder="Your name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
                    <div><label className="label">Email *</label><input id="contact-email" type="email" className="input text-sm" placeholder="your@email.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required /></div>
                    <div><label className="label">Phone</label><input id="contact-phone" className="input text-sm" placeholder="+91 9505306561" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
                    <div><label className="label">Company / Organisation</label><input id="contact-company" className="input text-sm" placeholder="Your company name" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} /></div>
                  </div>

                  <div><label className="label">Subject *</label><input id="contact-subject" className="input text-sm" placeholder="Brief subject of your enquiry" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} required /></div>

                  <div><label className="label">Message *</label>
                    <textarea id="contact-message" className="input resize-none text-sm" rows={5}
                      placeholder="Describe your requirements, quantity needed, vehicle application, timeline, etc."
                      value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} required />
                  </div>

                  <button type="submit" id="contact-submit" disabled={loading}
                    className="btn-primary w-full flex items-center justify-center gap-3 py-4 text-sm rounded-full shadow-[0_0_20px_rgba(255,255,255,0.1)] active:scale-[0.98] transition-all">
                    {loading ? (
                      <><div className="w-4 h-4 border-2 border-black/50 border-t-black rounded-full animate-spin" /> Sending...</>
                    ) : (
                      <><FiSend className="w-4 h-4" /> Send Message</>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
