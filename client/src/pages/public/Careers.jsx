import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import api from '../../services/api';
import { FiBriefcase, FiMapPin, FiClock, FiDollarSign, FiSend, FiFileText, FiCheck } from 'react-icons/fi';
import toast from 'react-hot-toast';

const openings = [
  { id: 'job-001', title: 'QC Engineer (LFP/NMC)', category: 'Quality Control', location: 'Shamshabad, Hyderabad', type: 'Full-Time', experience: '2–4 Years', description: 'Responsible for end-to-end battery pack testing, BIS compliance documentation, and defect analysis.' },
  { id: 'job-002', title: 'Production Lead', category: 'Manufacturing', location: 'Shamshabad, Hyderabad', type: 'Full-Time', experience: '5–8 Years', description: 'Managing the assembly line, ensuring shift targets are met, and optimizing the manufacturing process.' },
  { id: 'job-003', title: 'R&D Battery Scientist', category: 'Research', location: 'Shamshabad, Hyderabad', type: 'Full-Time', experience: '3–6 Years', description: 'Focused on cell chemistry optimization, thermal management, and developing new LFP/NMC variants.' },
  { id: 'job-004', title: 'Supply Chain Executive', category: 'Logistics', location: 'Shamshabad, Hyderabad', type: 'Full-Time', experience: '2–5 Years', description: 'Sourcing high-quality cells and raw materials from international partners and managing warehouse inventory.' },
];

export default function Careers() {
  const [selectedJob, setSelectedJob] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', experience: 'Fresher', currentCompany: '', noticePeriod: '', resume: null });
  const [submitting, setSubmitting] = useState(false);
  const [applied, setApplied] = useState(false);

  const handleFileChange = (e) => {
    setForm({ ...form, resume: e.target.files[0] });
  };

  const handleApply = async (e) => {
    e.preventDefault();
    if (!form.resume) return toast.error('Please upload your resume');
    
    setSubmitting(true);
    const formData = new FormData();
    formData.append('jobId', selectedJob.id);
    formData.append('jobTitle', selectedJob.title);
    formData.append('name', form.name);
    formData.append('email', form.email);
    formData.append('phone', form.phone);
    formData.append('experience', form.experience);
    formData.append('currentCompany', form.currentCompany);
    formData.append('noticePeriod', form.noticePeriod);
    formData.append('resume', form.resume);

    try {
      await api.post('/public/apply', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setApplied(true);
      toast.success('Application submitted successfully! Our HR team will review and get back to you.');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Helmet>
        <title>Careers | Join the Energy Revolution at Stone India</title>
        <meta name="description" content="Explore job openings at Stone India Pvt. Ltd. Join our team of engineers and innovators in Hyderabad to build the future of EV battery technology." />
      </Helmet>
      <Navbar />
      <section className="pt-32 pb-16 px-4 relative bg-black border-b border-white/10 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.05),transparent_50%)]" />
        <div className="container-custom relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-6">
            <FiBriefcase className="text-slate-300 w-3 h-3" />
            <span className="text-slate-300 text-xs font-medium tracking-widest uppercase">Work with Stone India</span>
          </div>
          <h1 className="font-display font-bold text-5xl md:text-7xl mb-6 text-white tracking-tighter">
            Build the <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-white/40">Energy Future</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto font-light">
            Join a team of innovators, engineers, and visionaries committed to powering India's electric mobility transition.
          </p>
        </div>
      </section>

      {/* Why Join Us */}
      <section className="py-12 bg-zinc-950 border-b border-white/10">
        <div className="container-custom">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: '🚀', title: 'Rapid Growth', desc: 'Working at the heart of India\'s EV battery revolution with massive scaling opportunities.' },
              { icon: '🛠️', title: 'Hands-on Tech', desc: 'Direct access to state-of-the-art battery labs and manufacturing facilities.' },
              { icon: '🌱', title: 'Green Mission', desc: 'Contribute to a sustainable future by helping decarbonize India\'s transportation.' },
            ].map(v => (
              <div key={v.title} className="text-center group">
                <div className="text-4xl mb-4 group-hover:scale-125 transition-transform duration-300 opacity-80 group-hover:opacity-100">{v.icon}</div>
                <h3 className="text-white font-semibold text-lg mb-2">{v.title}</h3>
                <p className="text-slate-400 text-sm font-light">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {applied ? (
        <section className="section bg-black text-center">
          <div className="container-custom py-20">
            <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce shadow-[0_0_30px_rgba(255,255,255,0.05)]">
              <FiCheck className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-white font-semibold text-3xl mb-4 tracking-tight">Application Sent!</h2>
            <p className="text-slate-400 max-w-md mx-auto mb-10 font-light">Thank you for your interest in joining the Stone India team. Our HR department will review your profile and contact you if there is a match.</p>
            <button onClick={() => { setApplied(false); setSelectedJob(null); }} className="btn-secondary px-8 rounded-full">View Other Openings</button>
          </div>
        </section>
      ) : (
        <section className="section bg-black">
          <div className="container-custom">
            <div className="grid lg:grid-cols-3 gap-10">
              {/* Job List */}
              <div className="lg:col-span-1 space-y-4">
                <h2 className="text-white font-semibold text-xl mb-6">Current Openings</h2>
                {openings.map(job => (
                  <div key={job.id} 
                    onClick={() => setSelectedJob(job)}
                    className={`card cursor-pointer transition-all card-hover ${selectedJob?.id === job.id ? 'bg-white/10 border-white/30' : 'bg-white/5 border-white/10 hover:border-white/20'}`}>
                    <h3 className="text-white font-semibold mb-2">{job.title}</h3>
                    <div className="flex items-center gap-3 text-xs text-slate-400 mb-3 font-medium uppercase tracking-wider">
                      <span className="flex items-center gap-1.5"><FiMapPin className="text-slate-500" />{job.location}</span>
                      <span className="flex items-center gap-1.5"><FiClock className="text-slate-500" />{job.type}</span>
                    </div>
                    <p className="text-slate-400 text-xs line-clamp-2 font-light">{job.description}</p>
                  </div>
                ))}
              </div>

              {/* Form */}
              <div className="lg:col-span-2">
                <div className="card h-full shadow-md bg-zinc-950 border-white/10">
                  {selectedJob ? (
                    <form onSubmit={handleApply} className="space-y-6">
                      <div className="border-b border-white/10 pb-6 mb-6">
                        <h2 className="text-white font-semibold text-2xl mb-2 tracking-tight">Applying for {selectedJob.title}</h2>
                        <div className="flex gap-2">
                          <span className="badge bg-white/5 border border-white/10 text-slate-300">{selectedJob.category}</span>
                          <span className="badge bg-white/5 border border-white/10 text-slate-300">{selectedJob.experience}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div><label className="label">Full Name *</label><input className="input" placeholder="Your name" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
                        <div><label className="label">Email *</label><input type="email" className="input" placeholder="your@email.com" required value={form.email} onChange={e => setForm({...form, email: e.target.value})} /></div>
                        <div><label className="label">Phone *</label><input className="input" placeholder="+91 9505306561" required value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} /></div>
                        <div>
                          <label className="label">Experience Level *</label>
                          <select className="input" value={form.experience} onChange={e => setForm({...form, experience: e.target.value})}>
                            <option value="Fresher">Fresher / Graduate</option>
                            <option value="Experienced">Experienced Professional</option>
                          </select>
                        </div>
                      </div>

                      {form.experience === 'Experienced' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in py-4 bg-white/5 rounded-2xl px-4 border border-white/10 mt-2">
                          <div><label className="label">Current Company</label><input className="input" placeholder="Company name" value={form.currentCompany} onChange={e => setForm({...form, currentCompany: e.target.value})} /></div>
                          <div><label className="label">Notice Period (Days)</label><input className="input" placeholder="e.g. 30" value={form.noticePeriod} onChange={e => setForm({...form, noticePeriod: e.target.value})} /></div>
                        </div>
                      )}

                      <div>
                        <label className="label">Resume / CV (PDF or DOC) *</label>
                        <div className={`relative border border-dashed rounded-2xl p-8 hover:border-white/30 transition-all text-center group ${form.resume ? 'border-white bg-white/5' : 'border-white/20 bg-transparent'}`}>
                          <input type="file" required onChange={handleFileChange} accept=".pdf,.doc,.docx" className="absolute inset-0 opacity-0 cursor-pointer" />
                          <FiFileText className={`w-10 h-10 mx-auto mb-4 transition-transform group-hover:scale-110 ${form.resume ? 'text-white' : 'text-slate-500'}`} />
                          <p className="text-white font-medium mb-1 tracking-tight">
                            {form.resume ? form.resume.name : 'Drag and drop your resume here'}
                          </p>
                          <p className="text-slate-400 text-xs font-light">
                            {form.resume ? `${(form.resume.size / 1024 / 1024).toFixed(2)} MB` : 'or click to browse files'}
                          </p>
                        </div>
                      </div>

                      <button type="submit" disabled={submitting} className="btn-primary w-full flex items-center justify-center gap-3 py-4 text-sm rounded-full shadow-[0_0_20px_rgba(255,255,255,0.1)] active:scale-[0.98] transition-all">
                        {submitting ? (
                          <><div className="w-4 h-4 border-2 border-black/50 border-t-black rounded-full animate-spin" /> Submitting Application...</>
                        ) : (
                          <><FiSend className="w-4 h-4" /> Submit Application</>
                        )}
                      </button>
                    </form>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center py-32 px-6">
                      <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                        <FiBriefcase className="w-6 h-6 text-slate-400" />
                      </div>
                      <h3 className="text-white font-semibold text-2xl mb-3 tracking-tight">Join our Power Team</h3>
                      <p className="text-slate-400 max-w-sm leading-relaxed font-light text-sm">Please select an open position from the list on the left to view the application form and apply for your future with Stone India.</p>
                      <button className="btn-secondary rounded-full mt-8 hidden lg:flex items-center gap-2 text-sm px-6 py-2.5" onClick={() => setSelectedJob(openings[0])}>
                        View Featured Opening
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
      <Footer />
    </div>
  );
}
