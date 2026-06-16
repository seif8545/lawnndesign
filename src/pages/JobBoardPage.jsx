import { toast } from '../lib/toast.js';
import { useState } from 'react';
import { CheckCircle, Clock, DollarSign, ExternalLink, File, Image as ImageIcon, Paperclip, Plus, Trash2, Upload, Users, X } from 'lucide-react';
import { jobs as jobsApi, uploadFile } from '../lib/api.js';
import { Avatar, CategoryPill, Modal } from '../components/ui.jsx';
import { useBusy } from '../hooks/useBusy.js';
import { formatRelativeTime } from '../lib/mappers.js';

export function JobBoardPage({ setView, jobs, setJobs, pendingJobs, setPendingJobs, currentUser, refreshJobs, refreshProjects }) {
  const [showPostModal, setShowPostModal] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [selectedJobForApply, setSelectedJobForApply] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [applySuccess, setApplySuccess] = useState(false);
  const [postForm, setPostForm] = useState({ title: '', brief: '', budget: '', skills: [], attachments: [] });
  const [applyForm, setApplyForm] = useState({ note: '', uploadedFiles: [] });
  const [filterCat, setFilterCat] = useState('all');
  const [postSuccess, setPostSuccess] = useState(false);
  const [posting,   runPost]    = useBusy();  // guards duplicate job-post submits
  const [applying,  runApply]   = useBusy();  // guards duplicate apply-to-job submits
  const [hiring,    runHire]    = useBusy();  // guards duplicate accept-application clicks
  const [rejecting, runReject]  = useBusy();  // guards duplicate reject-application clicks
  const [newSkill, setNewSkill] = useState('');

  // Job-applications review (job owner / admin)
  const [reviewingJob, setReviewingJob] = useState(null);
  const [reviewApps,   setReviewApps]   = useState([]);
  const [reviewBusy,   setReviewBusy]   = useState(false);
  const openReview = async job => {
    setReviewingJob(job);
    setReviewBusy(true);
    try {
      const apps = await jobsApi.applications(job.id);
      setReviewApps(apps);
    } catch (e) {
      toast.error(`Couldn't load applications: ${e.message}`);
      setReviewingJob(null);
    } finally { setReviewBusy(false); }
  };
  const acceptApplication = (job, app) => runHire(async () => {
    if (!confirm(`Hire ${app.user.name} for "${job.title}"? This creates a project and rejects other applicants.`)) return;
    try {
      await jobsApi.acceptApplication(job.id, app.id);
      await Promise.all([refreshJobs?.(), refreshProjects?.()]);
      setReviewingJob(null);
      toast.success('Hired! The project is now in your Projects tab.');
    } catch (e) { toast.error(`Couldn't hire: ${e.message}`); }
  });

  // Reject a single pending application. Required before the client can delete
  // the job if there are pending applications outstanding.
  const rejectApplication = (job, app) => runReject(async () => {
    if (!confirm(`Reject ${app.user.name}'s application?`)) return;
    try {
      await jobsApi.rejectApplication(job.id, app.id);
      // Reflect locally so the modal updates without a full refetch.
      setReviewApps(apps => apps.map(a => a.id === app.id ? { ...a, status: 'rejected' } : a));
      // Refresh job list so applicant counts stay accurate.
      await refreshJobs?.();
    } catch (e) { toast.error(`Couldn't reject: ${e.message}`); }
  });

  const handleApplyFileAdd = async files => {
    const remaining = 3 - applyForm.uploadedFiles.length;
    if (remaining <= 0) return;
    const picked = Array.from(files).slice(0, remaining);
    try {
      const uploaded = await Promise.all(
        picked.map(async file => {
          const r = await uploadFile(file, 'application');
          return {
            id:   `uf-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            name: r.name,
            url:  r.url,         // storage path (private bucket); backend signs at read time
            type: r.mimeType,
          };
        })
      );
      setApplyForm(f => ({ ...f, uploadedFiles: [...f.uploadedFiles, ...uploaded] }));
    } catch (e) {
      toast.error(`Upload failed: ${e.message}`);
    }
  };
  const removeApplyFile = id => setApplyForm(f => ({ ...f, uploadedFiles: f.uploadedFiles.filter(uf => uf.id !== id) }));

  const addSkill = () => {
    const s = newSkill.trim();
    if (s && !postForm.skills.includes(s)) setPostForm(f => ({ ...f, skills: [...f.skills, s] }));
    setNewSkill('');
  };
  const removeSkill = s => setPostForm(f => ({ ...f, skills: f.skills.filter(sk => sk !== s) }));

  const handleJobAttachmentAdd = async files => {
    try {
      const uploaded = await Promise.all(
        Array.from(files).map(async file => {
          const r = await uploadFile(file, 'job-attachment');
          return {
            id:   `att-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            name: r.name,
            url:  r.url,         // public bucket URL — usable directly in <img>/<a>
            type: r.mimeType,
          };
        })
      );
      setPostForm(f => ({ ...f, attachments: [...f.attachments, ...uploaded] }));
    } catch (e) {
      toast.error(`Upload failed: ${e.message}`);
    }
  };
  const removeJobAttachment = id => setPostForm(f => ({ ...f, attachments: f.attachments.filter(a => a.id !== id) }));

  const handlePost = () => runPost(async () => {
    try {
      await jobsApi.create({
        title:      postForm.title,
        brief:      postForm.brief,
        budget:     parseInt(postForm.budget, 10) || 0,
        budgetType: 'Fixed',
        category:   'Visuals & Branding',
        skills:     postForm.skills,
        // Attachments are uploaded to Supabase Storage by handleJobAttachmentAdd
        // before reaching here, so `url` is the persistent public URL.
        attachments: postForm.attachments.map(a => ({
          name: a.name, url: a.url, mimeType: a.type,
        })),
      });
      // Admin posts go live immediately — refetch to show the new job.
      // Client posts are pending — won't show in the public list until approved.
      if (currentUser?.role === 'admin') await refreshJobs?.();
      setPostSuccess(true);
      setTimeout(() => {
        setShowPostModal(false);
        setPostSuccess(false);
        setPostForm({ title: '', brief: '', budget: '', skills: [], attachments: [] });
      }, 2500);
    } catch (e) {
      toast.error(`Couldn't post job: ${e.message}`);
    }
  });

  const filteredJobs = filterCat === 'all' ? jobs : jobs.filter(j => j.category.toLowerCase().includes(filterCat));

  // A client's own jobs awaiting admin approval aren't on the public 'live'
  // list yet — surface them (badged) so the poster can see their submission.
  const myPendingJobs = currentUser?.role === 'client'
    ? pendingJobs.filter(j => j.clientId === currentUser.id && (filterCat === 'all' || j.category.toLowerCase().includes(filterCat)))
    : [];
  const displayJobs = [...myPendingJobs, ...filteredJobs];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#21326c]">Job Board</h1>
          <p className="text-sm text-[#21326c] mt-1">
            {currentUser?.role === 'client'
              ? 'Post a brief and review applicants. When you hire someone, it becomes a managed project with escrow.'
              : currentUser?.role === 'student'
              ? 'Browse live briefs and apply. Once a client hires you, the work is managed as a project with secure payments.'
              : "Live creative briefs from Egypt's top brands and agencies"}
          </p>
        </div>
        {/* Only clients and admins post jobs — students apply, they don't post. */}
        {(currentUser?.role === 'client' || currentUser?.role === 'admin') && (
          <button
            onClick={() => setShowPostModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-white shadow-md hover:opacity-90 transition-all text-sm flex-shrink-0"
            style={{ background: '#ff9044' }}
          >
            <Plus size={16} /> Post a Job
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-6">
        {[
          { id: 'all', label: 'All Jobs' },
          { id: 'architecture', label: 'Architecture & Interiors' },
          { id: 'visuals', label: 'Visuals & Branding' },
          { id: 'fine arts', label: 'Fine Arts' },
        ].map(f => (
          <CategoryPill key={f.id} label={f.label} active={filterCat === f.id} onClick={() => setFilterCat(f.id)} />
        ))}
      </div>

      {/* Job List */}
      <div className="grid gap-4">
        {displayJobs.map(job => (
          <div
            key={job.id}
            className="job-card bg-white rounded-2xl border border-[#21326c]/10 p-6 cursor-pointer"
            onClick={() => setSelectedJob(job)}
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <h3 className="font-semibold text-[#21326c] text-lg leading-tight">{job.title}</h3>
                  {job.status && job.status !== 'live' && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: '#db963015', color: '#db9630' }}>
                      <Clock size={10} /> {job.status === 'pending' ? 'Pending admin review' : job.status === 'filled' ? 'Filled' : job.status}
                    </span>
                  )}
                </div>
                <p className="text-sm text-[#21326c] mb-3">{job.client} · {job.postedAgo}</p>
                <p className="text-sm text-[#21326c] mb-4 leading-relaxed line-clamp-2">{job.brief}</p>
                <div className="flex flex-wrap gap-1.5">
                  {job.tags.map(tag => (
                    <span key={tag} className="tag-pill">{tag}</span>
                  ))}
                </div>
              </div>
              <div className="sm:text-right flex-shrink-0 flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 sm:gap-1">
                <div>
                  <div className="text-xl sm:text-2xl font-bold text-[#21326c]">{job.budget} EGP</div>
                  <div className="text-xs text-[#21326c]">{job.budgetType === 'Fixed' ? 'Fixed price' : 'Hourly rate'} · {job.applicants} applicants</div>
                </div>
                {currentUser?.role === 'student' && job.status === 'live' && (
                  <button
                    className="mt-2 px-4 py-2 rounded-full text-sm font-semibold text-white transition-all hover:opacity-90"
                    style={{ background: '#ff9044' }}
                    onClick={e => { e.stopPropagation(); setSelectedJobForApply(job); setShowApplyModal(true); }}
                  >
                    Apply Now
                  </button>
                )}
                {(job.clientId === currentUser?.id || currentUser?.role === 'admin') && (
                  <button
                    onClick={e => { e.stopPropagation(); openReview(job); }}
                    className="mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border border-[#21326c]/20 text-[#21326c] hover:bg-[#21326c]/5 transition-colors"
                  >
                    <Users size={12} /> Review Applications ({job.applicants || 0})
                  </button>
                )}
                {(job.clientId === currentUser?.id || currentUser?.role === 'admin') && (
                  <button
                    onClick={async e => {
                      e.stopPropagation();
                      if (!confirm(`Delete "${job.title}"? This can't be undone.`)) return;
                      try {
                        await jobsApi.delete(job.id);
                        setJobs(js => js.filter(j => j.id !== job.id));
                      } catch (err) {
                        // Backend returns a clear message for owner-side guardrails
                        // (pending apps, filled job). Surface it verbatim.
                        toast.error(err.message);
                      }
                    }}
                    className="mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border border-red-200 text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                  >
                    <Trash2 size={12} /> Delete
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* POST A JOB MODAL */}
      <Modal open={showPostModal} onClose={() => setShowPostModal(false)} title="Post a Creative Job" wide>
        {postSuccess ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-[#21326c]/10 flex items-center justify-center mx-auto mb-4">
              <Clock size={32} className="text-[#21326c]" />
            </div>
            <h3 className="font-display text-xl font-bold text-[#21326c] mb-2">
              {currentUser?.role === 'admin' ? 'Job Posted!' : 'Pending Review'}
            </h3>
            <p className="text-[#21326c] text-sm leading-relaxed">
              {currentUser?.role === 'admin'
                ? 'Your brief is now live on the Lawnn job board.'
                : 'Your job posting has been submitted and is awaiting admin approval before going live.'}
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-[#21326c] mb-1.5">Job Title *</label>
              <input
                type="text"
                placeholder="e.g. Logo & brand identity for a café"
                value={postForm.title}
                onChange={e => setPostForm(f => ({ ...f, title: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-[#21326c]/20 text-[#21326c] text-sm focus:ring-2 focus:ring-[#21326c] focus:border-[#21326c] transition-all placeholder:text-[#21326c]"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#21326c] mb-1.5">Project Brief *</label>
              <textarea
                rows={4}
                placeholder="Describe your project — what you need, style preferences, deliverables, timeline..."
                value={postForm.brief}
                onChange={e => setPostForm(f => ({ ...f, brief: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-[#21326c]/20 text-[#21326c] text-sm focus:ring-2 focus:ring-[#21326c] focus:border-[#21326c] transition-all resize-none placeholder:text-[#21326c]"
              />
            </div>
            {/* Attachments */}
            <div>
              <label className="block text-sm font-semibold text-[#21326c] mb-1.5">Reference Files <span className="font-normal text-[#21326c]/50">(optional — images or PDFs)</span></label>
              {postForm.attachments.length > 0 && (
                <div className="space-y-2 mb-2">
                  {postForm.attachments.map(att => (
                    <div key={att.id} className="flex items-center gap-2 px-3 py-2 bg-[#21326c]/5 rounded-xl">
                      {att.type.startsWith('image/') ? <ImageIcon size={14} className="text-[#21326c] flex-shrink-0" /> : <File size={14} className="text-[#21326c] flex-shrink-0" />}
                      <span className="text-sm text-[#21326c] truncate flex-1">{att.name}</span>
                      {att.type.startsWith('image/') && (
                        <img src={att.url} alt={att.name} className="w-10 h-8 rounded object-cover flex-shrink-0" />
                      )}
                      <button onClick={() => removeJobAttachment(att.id)} className="text-[#21326c]/30 hover:text-red-400 transition-colors flex-shrink-0"><X size={14} /></button>
                    </div>
                  ))}
                </div>
              )}
              <label className="cursor-pointer flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-[#21326c]/30 text-sm text-[#21326c]/60 hover:border-[#21326c]/60 hover:text-[#21326c] transition-colors w-full justify-center">
                <Paperclip size={14} /> Attach photos or PDFs
                <input type="file" accept="image/*,application/pdf" multiple className="hidden" onChange={e => handleJobAttachmentAdd(e.target.files)} />
              </label>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#21326c] mb-1.5">Budget (EGP) *</label>
              <div className="relative">
                <DollarSign size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#21326c]" />
                <input
                  type="number"
                  placeholder="e.g. 3500"
                  value={postForm.budget}
                  onChange={e => setPostForm(f => ({ ...f, budget: e.target.value }))}
                  className="w-full pl-9 pr-4 py-3 rounded-xl border border-[#21326c]/20 text-[#21326c] text-sm focus:ring-2 focus:ring-[#21326c] focus:border-[#21326c] transition-all placeholder:text-[#21326c]"
                />
              </div>
            </div>

            {/* Skills */}
            <div>
              <label className="block text-sm font-semibold text-[#21326c] mb-1.5">Required Skills</label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {postForm.skills.map(s => (
                  <span key={s} className="tag-pill flex items-center gap-1">
                    {s}
                    <button onClick={() => removeSkill(s)} className="ml-0.5 hover:opacity-60"><X size={10} /></button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Figma, AutoCAD…"
                  value={newSkill}
                  onChange={e => setNewSkill(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addSkill()}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-[#21326c]/20 text-[#21326c] text-sm focus:ring-2 focus:ring-[#21326c] transition-all placeholder:text-[#21326c]/40"
                />
                <button
                  onClick={addSkill}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
                  style={{ background: '#21326c' }}
                >
                  Add
                </button>
              </div>
            </div>

            <button
              onClick={handlePost}
              disabled={posting || !postForm.title || !postForm.brief || !postForm.budget}
              className="w-full py-3 rounded-xl font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: '#ff9044' }}
            >
              {posting ? 'Posting…' : 'Post Job'}
            </button>
          </div>
        )}
      </Modal>

      {/* APPLY MODAL */}
      <Modal
        open={showApplyModal}
        onClose={() => { setShowApplyModal(false); setApplyForm({ note: '', uploadedFiles: [] }); }}
        title={`Apply: ${selectedJobForApply?.title || ''}`}
        wide
      >
        <div className="space-y-5">
          <div className="bg-[#21326c]/5 rounded-xl p-4 border border-[#21326c]/10">
            <p className="text-sm font-medium text-[#21326c] mb-1">{selectedJobForApply?.client}</p>
            <p className="text-xs text-[#21326c] leading-relaxed">{selectedJobForApply?.brief}</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#21326c] mb-1.5">Your Application Note</label>
            <textarea
              rows={4}
              placeholder="Tell the client why you're the right fit. Mention relevant experience, your approach, and estimated timeline..."
              value={applyForm.note}
              onChange={e => setApplyForm(f => ({ ...f, note: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-[#21326c]/20 text-[#21326c] text-sm focus:ring-2 focus:ring-[#21326c] resize-none placeholder:text-[#21326c]"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#21326c] mb-1">Portfolio Samples</label>
            <p className="text-xs text-[#21326c] mb-3">Upload your work (images / PDFs) — up to 3 files</p>

            {/* Uploaded files */}
            {applyForm.uploadedFiles.length > 0 && (
              <div className="space-y-2 mb-2">
                {applyForm.uploadedFiles.map(uf => (
                  <div key={uf.id} className="flex items-center gap-2 px-3 py-2 bg-[#21326c]/5 rounded-xl">
                    {uf.type.startsWith('image/') ? <ImageIcon size={14} className="text-[#21326c] flex-shrink-0" /> : <File size={14} className="text-[#21326c] flex-shrink-0" />}
                    <span className="text-sm text-[#21326c] truncate flex-1">{uf.name}</span>
                    {uf.type.startsWith('image/') && (
                      <img src={uf.url} alt={uf.name} className="w-10 h-8 rounded object-cover flex-shrink-0" />
                    )}
                    <button onClick={() => removeApplyFile(uf.id)} className="text-[#21326c]/30 hover:text-red-400 transition-colors flex-shrink-0"><X size={14} /></button>
                  </div>
                ))}
              </div>
            )}

            {applyForm.uploadedFiles.length < 3 && (
              <label className="cursor-pointer flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-[#21326c]/30 text-sm text-[#21326c]/60 hover:border-[#21326c]/60 hover:text-[#21326c] transition-colors w-full justify-center">
                <Upload size={14} /> Upload portfolio files
                <input type="file" accept="image/*,application/pdf" multiple className="hidden" onChange={e => handleApplyFileAdd(e.target.files)} />
              </label>
            )}

            <p className="text-xs text-[#21326c] mt-2">{applyForm.uploadedFiles.length}/3 uploaded</p>
          </div>

          {applySuccess ? (
            <div className="text-center py-6">
              <div className="w-14 h-14 rounded-full bg-[#21326c]/10 flex items-center justify-center mx-auto mb-3">
                <CheckCircle size={28} className="text-[#21326c]" />
              </div>
              <p className="font-display text-lg font-bold text-[#21326c] mb-1">Application Sent!</p>
              <p className="text-sm text-[#21326c]/70">The client will review your application and respond via messages.</p>
            </div>
          ) : (
            <button
              onClick={() => runApply(async () => {
                if (!selectedJobForApply) return;
                try {
                  await jobsApi.apply(selectedJobForApply.id, {
                    note: applyForm.note,
                    // Uploaded files (Supabase Storage paths/URLs). Sample-portfolio
                    // refs are local IDs; backend ignores them for now.
                    files: applyForm.uploadedFiles.map(uf => ({
                      name: uf.name, url: uf.url, mimeType: uf.type,
                    })),
                  });
                  setApplySuccess(true);
                  await refreshJobs?.();  // bump applicant count
                  setTimeout(() => {
                    setShowApplyModal(false);
                    setApplySuccess(false);
                    setApplyForm({ note: '', uploadedFiles: [] });
                  }, 2500);
                } catch (err) {
                  toast.error(`Couldn't submit: ${err.message}`);
                }
              })}
              disabled={applying || !applyForm.note || applyForm.uploadedFiles.length === 0}
              className="w-full py-3 rounded-xl font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: '#ff9044' }}
            >
              {applying ? 'Submitting…' : 'Submit Application'}
            </button>
          )}
        </div>
      </Modal>

      {/* REVIEW APPLICATIONS MODAL (job owner / admin) */}
      <Modal
        open={!!reviewingJob}
        onClose={() => setReviewingJob(null)}
        title={`Applications: ${reviewingJob?.title || ''}`}
        wide
      >
        <div className="space-y-3">
          {reviewBusy && <p className="text-sm text-[#21326c]/60 text-center py-4">Loading…</p>}
          {!reviewBusy && reviewApps.length === 0 && (
            <p className="text-sm text-[#21326c]/60 text-center py-4">No applications yet.</p>
          )}
          {!reviewBusy && reviewApps.map(app => (
            <div key={app.id} className="border border-[#21326c]/10 rounded-2xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <Avatar initials={app.user.initials} color={app.user.avatarColor} size="sm" />
                <div className="flex-1">
                  <p className="font-semibold text-sm text-[#21326c]">{app.user.name}</p>
                  <p className="text-xs text-[#21326c]/60">{formatRelativeTime(app.createdAt)}</p>
                </div>
                {app.status !== 'pending' && (
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${app.status === 'accepted' ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-500'}`}>
                    {app.status}
                  </span>
                )}
              </div>
              <p className="text-sm text-[#21326c] italic mb-3">"{app.note}"</p>
              {app.status === 'pending' && (
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => acceptApplication(reviewingJob, app)}
                    disabled={hiring || rejecting}
                    className="px-4 py-2 rounded-full text-sm font-semibold text-white hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ background: '#21326c' }}
                  >
                    <CheckCircle size={14} className="inline mr-1" /> {hiring ? 'Hiring…' : `Hire ${app.user.name.split(' ')[0]}`}
                  </button>
                  <button
                    onClick={() => rejectApplication(reviewingJob, app)}
                    disabled={hiring || rejecting}
                    className="px-4 py-2 rounded-full text-sm font-semibold border border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {rejecting ? 'Rejecting…' : 'Reject'}
                  </button>
                </div>
              )}
              {app.status === 'rejected' && (
                <span className="text-xs font-semibold text-red-500">Rejected</span>
              )}
            </div>
          ))}
        </div>
      </Modal>

      {/* JOB DETAIL MODAL */}
      <Modal open={!!selectedJob} onClose={() => setSelectedJob(null)} title="Job Details" wide>
        {selectedJob && (
          <div className="space-y-5">
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h2 className="font-display text-xl font-bold text-[#21326c]">{selectedJob.title}</h2>
              </div>
              <p className="text-sm text-[#21326c]/60">{selectedJob.client} · {selectedJob.postedAgo} · {selectedJob.applicants} applicants</p>
            </div>

            <div className="bg-[#21326c]/5 rounded-xl p-4">
              <p className="text-xs font-semibold text-[#21326c] uppercase tracking-wide mb-2">Project Brief</p>
              <p className="text-sm text-[#21326c] leading-relaxed">{selectedJob.brief}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white border border-[#21326c]/10 rounded-xl p-4">
                <p className="text-xs text-[#21326c]/50 mb-1">Budget</p>
                <p className="text-lg font-bold text-[#21326c]">{selectedJob.budget} EGP</p>
                <p className="text-xs text-[#21326c]/50">{selectedJob.budgetType === 'Fixed' ? 'Fixed price' : 'Hourly'}</p>
              </div>
              <div className="bg-white border border-[#21326c]/10 rounded-xl p-4">
                <p className="text-xs text-[#21326c]/50 mb-1">Category</p>
                <p className="text-sm font-semibold text-[#21326c]">{selectedJob.category}</p>
              </div>
            </div>

            {selectedJob.tags?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-[#21326c] uppercase tracking-wide mb-2">Required Skills</p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedJob.tags.map(t => <span key={t} className="tag-pill">{t}</span>)}
                </div>
              </div>
            )}

            {selectedJob.attachments?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-[#21326c] uppercase tracking-wide mb-2">Reference Files</p>
                <div className="space-y-2">
                  {selectedJob.attachments.map(att => (
                    <a key={att.id} href={/^https?:\/\//i.test(att.url || '') ? att.url : undefined} target="_blank" rel="noreferrer"
                      className="flex items-center gap-3 px-3 py-2 bg-[#21326c]/5 hover:bg-[#21326c]/10 rounded-xl transition-colors group"
                    >
                      {att.type.startsWith('image/') ? <ImageIcon size={14} className="text-[#21326c] flex-shrink-0" /> : <File size={14} className="text-[#21326c] flex-shrink-0" />}
                      <span className="text-sm text-[#21326c] truncate flex-1">{att.name}</span>
                      {att.type.startsWith('image/') && (
                        <img src={att.url} alt={att.name} className="w-10 h-8 rounded object-cover flex-shrink-0" />
                      )}
                      <ExternalLink size={12} className="text-[#21326c]/30 group-hover:text-[#21326c] flex-shrink-0 transition-colors" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {currentUser?.role === 'student' && (
              <button
                onClick={() => { setSelectedJob(null); setSelectedJobForApply(selectedJob); setShowApplyModal(true); }}
                className="w-full py-3 rounded-xl font-semibold text-white hover:opacity-90 transition-all"
                style={{ background: '#ff9044' }}
              >
                Apply for This Job
              </button>
            )}
            {!currentUser && (
              <p className="text-sm text-center text-[#21326c]/50">Sign in as a student to apply</p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

// ─── VIEW 3: TALENT DIRECTORY ─────────────────────────────────────────────────
