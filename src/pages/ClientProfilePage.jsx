import { useState, useEffect } from 'react';
import { Briefcase, ExternalLink, Package, Pen, Plus } from 'lucide-react';
import { profiles, projects as projectsApi } from '../lib/api.js';
import { Avatar, Modal } from '../components/ui.jsx';
import { ProjectStatusBadge } from './ProjectsPage.jsx';

export function ClientProfilePage({ currentUser, jobs, pendingJobs, projects, setView }) {
  const myJobs = [
    ...pendingJobs.filter(j => j.clientId === currentUser?.id),
    ...jobs.filter(j => j.clientId === currentUser?.id),
  ];
  // projectsApi.list already returns only the caller's projects.
  const myProjects = projects || [];

  const statusLabel = s => s === 'pending' ? 'Pending admin review' : s === 'filled' ? 'Filled' : s === 'live' ? 'Live' : s;

  // Editable client details (company, bio, website).
  const [cp, setCp]             = useState(null);
  const [showEdit, setShowEdit] = useState(false);
  const [form, setForm]         = useState({ company: '', bio: '', website: '' });
  const [saving, setSaving]     = useState(false);

  useEffect(() => {
    profiles.clientProfile()
      .then(p => { setCp(p); setForm({ company: p.company || '', bio: p.bio || '', website: p.website || '' }); })
      .catch(() => {});
  }, []);

  const saveProfile = async () => {
    setSaving(true);
    try {
      const p = await profiles.updateClientProfile(form);
      setCp(p);
      setShowEdit(false);
    } catch (e) {
      alert(`Couldn't save: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-[#21326c]/10 overflow-hidden mb-6">
        <div className="h-24" style={{ background: `linear-gradient(135deg, ${currentUser?.avatarColor || '#21326c'}33, ${currentUser?.avatarColor || '#21326c'}88)` }} />
        <div className="px-6 pb-6">
          <div className="-mt-10 mb-3">
            <Avatar initials={currentUser?.initials || '?'} color={currentUser?.avatarColor || '#21326c'} size="xl" />
          </div>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="font-display text-2xl font-bold text-[#21326c]">{currentUser?.name}</h1>
              {cp?.company && <p className="text-sm font-medium text-[#21326c]/80 mt-0.5">{cp.company}</p>}
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: '#21326c12', color: '#21326c' }}>Client</span>
                {currentUser?.email && <span className="text-sm text-[#21326c]/50">{currentUser.email}</span>}
                {cp?.website && (
                  <a href={/^https?:\/\//i.test(cp.website) ? cp.website : `https://${cp.website}`} target="_blank" rel="noreferrer" className="text-sm text-[#21326c] hover:underline inline-flex items-center gap-1">
                    <ExternalLink size={12} /> Website
                  </a>
                )}
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => setShowEdit(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold border border-[#21326c]/20 text-[#21326c] hover:bg-[#21326c]/5 transition-colors">
                <Pen size={13} /> Edit
              </button>
              <button onClick={() => setView('jobs')} className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold text-white hover:opacity-90 transition-all" style={{ background: '#ff9044' }}>
                <Plus size={14} /> Post a Job
              </button>
              <button onClick={() => setView('projects')} className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold border border-[#21326c]/20 text-[#21326c] hover:bg-[#21326c]/5 transition-colors">
                <Package size={14} /> My Projects
              </button>
            </div>
          </div>
          {cp?.bio && <p className="text-sm text-[#21326c]/70 leading-relaxed mt-4">{cp.bio}</p>}
          <div className="flex gap-6 mt-5">
            <div>
              <p className="font-display text-2xl font-bold text-[#21326c]">{myJobs.length}</p>
              <p className="text-xs text-[#21326c]/60">Job postings</p>
            </div>
            <div>
              <p className="font-display text-2xl font-bold text-[#21326c]">{myProjects.length}</p>
              <p className="text-xs text-[#21326c]/60">Projects</p>
            </div>
          </div>
        </div>
      </div>

      {/* Job postings */}
      <h2 className="font-display text-lg font-bold text-[#21326c] mb-3">My Job Postings</h2>
      {myJobs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#21326c]/10 p-8 text-center text-[#21326c]/50 mb-8">
          <Briefcase size={28} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">You haven't posted any jobs yet.</p>
        </div>
      ) : (
        <div className="space-y-3 mb-8">
          {myJobs.map(job => (
            <div key={job.id} onClick={() => setView('jobs')} className="bg-white rounded-2xl border border-[#21326c]/10 p-4 flex items-center gap-3 cursor-pointer hover:border-[#21326c]/25 transition-colors">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[#21326c] text-sm truncate">{job.title}</p>
                <p className="text-xs text-[#21326c]/50">{job.budget?.toLocaleString()} EGP · {job.applicants || 0} applicant{job.applicants === 1 ? '' : 's'}</p>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: job.status === 'live' ? '#21326c12' : '#db963015', color: job.status === 'live' ? '#21326c' : '#db9630' }}>
                {statusLabel(job.status)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Projects */}
      <h2 className="font-display text-lg font-bold text-[#21326c] mb-3">My Projects</h2>
      {myProjects.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#21326c]/10 p-8 text-center text-[#21326c]/50">
          <Package size={28} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">No projects yet. Hire a student from one of your job postings to start one.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {myProjects.map(p => (
            <div key={p.id} onClick={() => setView('projects')} className="bg-white rounded-2xl border border-[#21326c]/10 p-4 flex items-center gap-3 cursor-pointer hover:border-[#21326c]/25 transition-colors">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[#21326c] text-sm truncate">{p.title}</p>
                <p className="text-xs text-[#21326c]/50">{p.budget?.toLocaleString()} EGP</p>
              </div>
              <ProjectStatusBadge status={p.status} />
            </div>
          ))}
        </div>
      )}

      {/* Edit details modal */}
      <Modal open={showEdit} onClose={() => setShowEdit(false)} title="Edit your details">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-[#21326c] mb-1.5">Company / Organisation</label>
            <input type="text" placeholder="Your company or organisation" value={form.company}
              onChange={e => setForm(f => ({ ...f, company: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-[#21326c]/20 text-[#21326c] text-sm focus:ring-2 focus:ring-[#21326c] transition-all placeholder:text-[#21326c]/40" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#21326c] mb-1.5">About</label>
            <textarea rows={4} placeholder="Tell talent about your company and the kind of work you commission." value={form.bio}
              onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-[#21326c]/20 text-[#21326c] text-sm resize-none focus:ring-2 focus:ring-[#21326c] transition-all placeholder:text-[#21326c]/40" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#21326c] mb-1.5">Website</label>
            <input type="text" placeholder="e.g. alsafwa.com" value={form.website}
              onChange={e => setForm(f => ({ ...f, website: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-[#21326c]/20 text-[#21326c] text-sm focus:ring-2 focus:ring-[#21326c] transition-all placeholder:text-[#21326c]/40" />
          </div>
          <button onClick={saveProfile} disabled={saving}
            className="w-full py-3 rounded-xl font-semibold text-white hover:opacity-90 transition-all disabled:opacity-50"
            style={{ background: '#ff9044' }}>
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </Modal>
    </div>
  );
}

// ─── STATIC / INFORMATIONAL PAGES ────────────────────────────────────────────
// Data-driven so all four (About, Privacy, Terms, Contact) share one layout.
