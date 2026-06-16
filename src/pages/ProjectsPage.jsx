import { toast } from '../lib/toast.js';
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Briefcase, CheckCircle, ChevronRight, CreditCard, DollarSign, Hourglass, PackageCheck, PartyPopper, Plus, Star, Trash2, Users, X } from 'lucide-react';
import { projects as projectsApi } from '../lib/api.js';
import { AvailabilityBadge, Avatar, Modal, SkillPicker, StarPicker } from '../components/ui.jsx';
import { useBusy } from '../hooks/useBusy.js';
import { PROJECT_DONE_STATUSES, PROJECT_STATUS_LABELS, PROJECT_STATUS_STEPS } from '../lib/constants.js';
import { mapApiProject } from '../lib/mappers.js';

export function ProjectStatusBadge({ status }) {
  const s = PROJECT_STATUS_LABELS[status] || PROJECT_STATUS_LABELS.open;
  return (
    <span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
}

export function EscrowStepper({ status }) {
  const steps = [
    { key: 'open',           label: 'Post' },
    { key: 'offer_accepted', label: 'Accept Offer' },
    { key: 'deposit_paid',   label: 'Pay Deposit' },
    { key: 'in_progress',    label: 'In Progress' },
    { key: 'delivered',      label: 'Delivery' },
    { key: 'completed',      label: 'Full Payment' },
    { key: 'reviewed',       label: 'Review' },
  ];
  const idx = PROJECT_STATUS_STEPS.indexOf(status);
  return (
    <div className="flex items-center gap-0 overflow-x-auto pb-1">
      {steps.map((step, i) => {
        const done    = i < idx;
        const active  = i === idx;
        const future  = i > idx;
        return (
          <div key={step.key} className="flex items-center flex-shrink-0">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 border-2 transition-all ${
                  done   ? 'border-[#16a34a] bg-[#16a34a] text-white' :
                  active ? 'border-[#21326c] bg-[#21326c] text-white' :
                  'border-[#21326c]/20 bg-white text-[#21326c]/30'
                }`}
              >
                {done ? '✓' : i + 1}
              </div>
              <span className={`text-[9px] font-semibold whitespace-nowrap ${active ? 'text-[#21326c]' : done ? 'text-[#16a34a]' : 'text-[#21326c]/30'}`}>
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`h-0.5 w-6 mx-1 mb-4 flex-shrink-0 ${done ? 'bg-[#16a34a]' : 'bg-[#21326c]/15'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export function ProjectsPage({ projects, setProjects, currentUser, setView, setSelectedTalent, talents, addNotification, refreshProjects }) {
  const [selected, setSelected] = useState(null);
  const [showPostModal, setShowPostModal] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 0, text: '' });
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [tab, setTab] = useState('active'); // active | completed
  // Per-action busy guards. Each state machine transition is independent so we
  // keep them separate — paying a deposit doesn't disable the review button.
  const [paying,        runPay]      = useBusy();
  const [approving,     runApprove]  = useBusy();
  const [reviewing,     runReview]   = useBusy();
  const [delivering,    runDeliver]  = useBusy();
  const [creatingProj,  runCreate]   = useBusy();
  const [deletingProj,  runDelete]   = useBusy();

  // Role-aware filter: clients see projects they own; talents see projects
  // they've been hired for; admins see all.
  const isAdminRole = currentUser?.role === 'admin';
  const myProjects = projects.filter(p =>
    isAdminRole ||
    p.clientId === currentUser?.id ||
    p.acceptedTalentId === currentUser?.id
  );
  const activeProjects = myProjects.filter(p => !PROJECT_DONE_STATUSES.includes(p.status));
  const doneProjects = myProjects.filter(p => PROJECT_DONE_STATUSES.includes(p.status));
  const displayProjects = tab === 'active' ? activeProjects : doneProjects;

  // Refresh selected when projects update
  const proj = selected ? projects.find(p => p.id === selected.id) : null;

  // Accept an offer — currently unreachable through real data because the
  // applications array is empty (see mapApiProject). Job→Project bridge TODO.
  const acceptApp = async (projId, appId) => {
    const app = proj?.applications?.find(a => a.id === appId);
    if (!app) return;
    try {
      await projectsApi.advance(projId, { talentId: app.talentId });
      await refreshProjects?.();
      addNotification({
        icon: 'bag', title: `Offer accepted — ${proj.title}`,
        body: `You accepted ${app.talentName}'s application. Pay the 50% deposit to get started.`,
        time: 'Just now',
      });
    } catch (e) { toast.error(`Couldn't accept: ${e.message}`); }
  };

  const payDeposit = (projId) => runPay(async () => {
    const deposit = Math.round(proj.budget * 0.5);
    try {
      // Backend state machine: offer_accepted → deposit_paid → in_progress.
      // Collapse both transitions into one user action so the talent can start.
      await projectsApi.advance(projId, {});                  // → deposit_paid
      await projectsApi.advance(projId, {}).catch(() => {});  // → in_progress (best-effort)
      await refreshProjects?.();
      addNotification({
        icon: 'money', title: 'Deposit paid!',
        body: `${deposit.toLocaleString()} EGP held in escrow. Work can begin.`,
        time: 'Just now', iconBg: '#dcfce7',
      });
    } catch (e) { toast.error(`Couldn't pay deposit: ${e.message}`); }
  });

  const approveDelivery = (projId) => runApprove(async () => {
    const remaining = proj.budget - (proj.depositAmount || 0);
    try {
      await projectsApi.advance(projId, {});
      await refreshProjects?.();
      addNotification({
        icon: 'money', title: `${remaining.toLocaleString()} EGP released to talent`,
        body: `Full payment for "${proj.title}" has been released.`,
        time: 'Just now', iconBg: '#dcfce7',
      });
    } catch (e) { toast.error(`Couldn't approve: ${e.message}`); }
  });

  const submitReview = (projId) => runReview(async () => {
    if (!reviewForm.rating) return;
    try {
      await projectsApi.review(projId, { rating: reviewForm.rating, comment: reviewForm.text });
      await refreshProjects?.();
      setReviewSubmitted(true);
      setReviewForm({ rating: 0, text: '' });
    } catch (e) { toast.error(`Couldn't submit review: ${e.message}`); }
  });

  // Client deletes their own project. Backend allows it only when status='open'
  // (no talent yet, no deposit). Admins can delete anytime. Closes the modal
  // on success and refreshes the list.
  const deleteProject = (projId, title) => runDelete(async () => {
    if (!confirm(`Delete "${title}"? This can't be undone.`)) return;
    try {
      await projectsApi.delete(projId);
      setSelected(null);
      await refreshProjects?.();
    } catch (e) {
      // 409 from backend means project is past 'open'; surface verbatim.
      toast.error(e.message);
    }
  });

  // Talent: submit delivery (in_progress → delivered)
  const [deliveryNote, setDeliveryNote] = useState('');
  const submitDelivery = (projId) => runDeliver(async () => {
    if (!deliveryNote.trim()) return;
    try {
      await projectsApi.advance(projId, { deliveryNote: deliveryNote.trim() });
      await refreshProjects?.();
      setDeliveryNote('');
      addNotification({
        icon: 'check', title: 'Delivery submitted',
        body: 'The client has been notified.',
        time: 'Just now', iconBg: '#dcfce7',
      });
    } catch (e) { toast.error(`Couldn't submit: ${e.message}`); }
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#21326c]">My Projects</h1>
          <p className="text-sm text-[#21326c] mt-1">Track your projects and manage payments</p>
        </div>
        <button
          onClick={() => setShowPostModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-white shadow-md hover:opacity-90 transition-all text-sm flex-shrink-0"
          style={{ background: '#ff9044' }}
        >
          <Plus size={16} /> New Project
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-[#21326c]/5 p-1 rounded-xl w-fit">
        {[['active','Active'], ['completed','Completed']].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab === id ? 'bg-white text-[#21326c] shadow-sm' : 'text-[#21326c]/60 hover:text-[#21326c]'}`}
          >
            {label} {id === 'active' ? `(${activeProjects.length})` : `(${doneProjects.length})`}
          </button>
        ))}
      </div>

      {displayProjects.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-[#21326c]/5 flex items-center justify-center mx-auto mb-4">
            <Briefcase size={28} className="text-[#21326c]/30" />
          </div>
          <p className="text-[#21326c] font-semibold mb-1">{tab === 'active' ? 'No active projects' : 'No completed projects yet'}</p>
          <p className="text-sm text-[#21326c]/50 mb-5">Post a project to find the right student for your brief</p>
          <button onClick={() => setShowPostModal(true)}
            className="px-6 py-3 rounded-full font-semibold text-white hover:opacity-90 transition-all"
            style={{ background: '#ff9044' }}
          >
            Post Your First Project
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {displayProjects.map(p => (
            <div
              key={p.id}
              onClick={() => { setSelected(p); setReviewSubmitted(false); }}
              className="bg-white rounded-2xl border border-[#21326c]/10 p-5 sm:p-6 cursor-pointer hover:border-[#21326c]/30 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-semibold text-[#21326c] text-base">{p.title}</h3>
                  </div>
                  <p className="text-sm text-[#21326c]/60">{p.postedAt} · {p.budget.toLocaleString()} EGP</p>
                </div>
                <ProjectStatusBadge status={p.status} />
              </div>
              <EscrowStepper status={p.status} />
              {p.status === 'open' && (
                <p className="text-xs text-[#21326c]/50 mt-3">{p.applications.length} application{p.applications.length !== 1 ? 's' : ''} — click to review</p>
              )}
              {['deposit_paid','in_progress'].includes(p.status) && (
                <div className="mt-3 flex items-center gap-2 text-xs font-medium text-[#2563eb]">
                  <Hourglass size={13} /> Student is working · {(p.depositAmount || 0).toLocaleString()} EGP held in escrow
                </div>
              )}
              {p.status === 'delivered' && (
                <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-[#7c3aed]">
                  <PackageCheck size={13} /> Delivery received — click to review and release payment
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── PROJECT DETAIL PANEL ── */}
      {proj && createPortal((
        <div className="fixed inset-0 flex items-end sm:items-center justify-center p-0 sm:px-4 sm:pb-4 sm:pt-20 modal-backdrop" style={{ zIndex: 1000 }} onClick={() => setSelected(null)}>
          <div
            className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-2xl max-h-[92dvh] sm:max-h-[88vh] overflow-y-auto animate-fade-in flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* Panel header */}
            <div className="flex items-start justify-between px-6 py-5 border-b border-[#21326c]/10 flex-shrink-0">
              <div className="flex-1 pr-4">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h2 className="font-display text-lg font-bold text-[#21326c]">{proj.title}</h2>
                  <ProjectStatusBadge status={proj.status} />
                </div>
                <p className="text-xs text-[#21326c]/50">{proj.postedAt} · {proj.budget.toLocaleString()} EGP budget</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Delete: visible to project owner (and admins) when nothing's
                    committed yet. Backend enforces the same rule. */}
                {(proj.clientId === currentUser?.id || currentUser?.role === 'admin') && proj.status === 'open' && (
                  <button
                    onClick={() => deleteProject(proj.id, proj.title)}
                    disabled={deletingProj}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Delete project"
                  >
                    <Trash2 size={12} /> {deletingProj ? 'Deleting…' : 'Delete'}
                  </button>
                )}
                <button onClick={() => setSelected(null)} className="w-8 h-8 rounded-full bg-[#21326c]/5 flex items-center justify-center hover:bg-[#21326c]/10 transition-colors flex-shrink-0">
                  <X size={16} className="text-[#21326c]" />
                </button>
              </div>
            </div>

            <div className="px-6 py-5 space-y-6 flex-1 overflow-y-auto">
              {/* Stepper */}
              <EscrowStepper status={proj.status} />

              {/* Escrow summary */}
              <div className="rounded-2xl p-4 grid grid-cols-3 gap-3 text-center" style={{ background: '#21326c06', border: '1px solid #21326c10' }}>
                <div>
                  <p className="text-xs text-[#21326c]/50 mb-0.5">Total Budget</p>
                  <p className="font-bold text-[#21326c]">{proj.budget.toLocaleString()} EGP</p>
                </div>
                <div>
                  <p className="text-xs text-[#21326c]/50 mb-0.5">Deposit (50%)</p>
                  <p className={`font-bold ${proj.depositAmount ? 'text-[#16a34a]' : 'text-[#21326c]/30'}`}>
                    {proj.depositAmount ? `${proj.depositAmount.toLocaleString()} EGP` : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#21326c]/50 mb-0.5">On Completion</p>
                  <p className={`font-bold ${proj.clientApproved ? 'text-[#16a34a]' : 'text-[#21326c]/30'}`}>
                    {proj.depositAmount ? `${(proj.budget - proj.depositAmount).toLocaleString()} EGP` : `${Math.round(proj.budget * 0.5).toLocaleString()} EGP`}
                  </p>
                </div>
              </div>

              {/* ── STEP: open — Review applications ── */}
              {proj.status === 'open' && (
                <div>
                  <h3 className="font-semibold text-[#21326c] mb-3 flex items-center gap-2">
                    <Users size={16} /> Applications ({proj.applications.length})
                  </h3>
                  {proj.applications.length === 0 ? (
                    <p className="text-sm text-[#21326c]/50 text-center py-6 border border-dashed border-[#21326c]/20 rounded-2xl">
                      No applications yet — check back soon
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {proj.applications.map(app => {
                        const talent = talents.find(t => t.id === app.talentId);
                        return (
                          <div key={app.id} className="rounded-2xl border border-[#21326c]/10 p-4">
                            <div className="flex items-start justify-between gap-3 mb-3">
                              <div className="flex items-center gap-3">
                                <button
                                  onClick={() => { setSelected(null); setSelectedTalent(talent); setView('profile'); }}
                                  className="flex-shrink-0"
                                >
                                  <Avatar initials={app.talentInitials} color={app.talentColor} size="md" />
                                </button>
                                <div>
                                  <p className="font-semibold text-[#21326c] text-sm">{app.talentName}</p>
                                  <p className="text-xs text-[#21326c]/50">{app.submittedAt}</p>
                                </div>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <p className="font-bold text-[#21326c]">{(app.proposedAmount || proj.budget).toLocaleString()} EGP</p>
                                {talent && <div className="mt-0.5"><AvailabilityBadge status={talent.availability} /></div>}
                              </div>
                            </div>
                            <p className="text-sm text-[#21326c] leading-relaxed mb-3 italic">"{app.note}"</p>
                            {talent && (
                              <div className="flex flex-wrap gap-1 mb-3">
                                {talent.tags.slice(0,4).map(tag => <span key={tag} className="tag-pill">{tag}</span>)}
                              </div>
                            )}
                            <div className="flex gap-2 flex-wrap">
                              <button
                                onClick={() => acceptApp(proj.id, app.id)}
                                className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold text-white hover:opacity-90 transition-all"
                                style={{ background: '#21326c' }}
                              >
                                <CheckCircle size={14} /> Accept This Offer
                              </button>
                              <button
                                onClick={() => { setSelected(null); setSelectedTalent(talent); setView('profile'); }}
                                className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold border border-[#21326c]/20 text-[#21326c] hover:bg-[#21326c]/5 transition-colors"
                              >
                                View Profile
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ── STEP: offer_accepted — Pay deposit ── */}
              {proj.status === 'offer_accepted' && (() => {
                const app = proj.applications.find(a => a.id === proj.acceptedApplicationId);
                const talent = app ? talents.find(t => t.id === app.talentId) : null;
                const deposit = Math.round(proj.budget * 0.5);
                return (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-4 rounded-2xl" style={{ background: '#21326c08', border: '1px solid #21326c15' }}>
                      {talent && <Avatar initials={talent.initials} color={talent.avatarColor} size="md" />}
                      <div>
                        <p className="font-semibold text-[#21326c] text-sm">{app?.talentName}</p>
                        <p className="text-xs text-[#21326c]/60">Offer accepted — waiting for deposit</p>
                      </div>
                    </div>
                    <div className="rounded-2xl border-2 border-dashed border-[#21326c]/20 p-5 text-center space-y-3">
                      <CreditCard size={32} className="text-[#21326c]/40 mx-auto" />
                      <div>
                        <p className="font-display text-2xl font-bold text-[#21326c]">{deposit.toLocaleString()} EGP</p>
                        <p className="text-sm text-[#21326c]/60 mt-0.5">50% deposit · held in escrow by Lawnn</p>
                      </div>
                      <p className="text-xs text-[#21326c]/50 leading-relaxed max-w-xs mx-auto">
                        Your deposit is protected. It's released to the student only when you approve the final delivery.
                      </p>
                      <button
                        onClick={() => payDeposit(proj.id)}
                        disabled={paying}
                        className="w-full py-3 rounded-xl font-semibold text-white hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ background: '#ff9044' }}
                      >
                        {paying ? 'Processing…' : `Pay ${deposit.toLocaleString()} EGP Deposit`}
                      </button>
                    </div>
                  </div>
                );
              })()}

              {/* ── STEP: deposit_paid / in_progress — Waiting for / submitting delivery ── */}
              {['deposit_paid', 'in_progress'].includes(proj.status) && (() => {
                const isTalent = proj.acceptedTalentId === currentUser?.id;
                const talentName = proj.acceptedTalentName || 'The student';
                return (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-4 rounded-2xl" style={{ background: '#21326c08', border: '1px solid #21326c15' }}>
                      {proj.acceptedTalentInitials && <Avatar initials={proj.acceptedTalentInitials} color={proj.acceptedTalentColor} size="md" />}
                      <div className="flex-1">
                        <p className="font-semibold text-[#21326c] text-sm">
                          {isTalent ? "You're working on this project" : `${talentName} is working on your project`}
                        </p>
                        <p className="text-xs text-[#21326c]/60">Deposit paid {proj.depositPaidAt}</p>
                      </div>
                      <AvailabilityBadge status="busy" />
                    </div>

                    {isTalent ? (
                      // Talent view — submit delivery form
                      <div className="rounded-2xl p-4 border border-[#21326c]/10" style={{ background: '#fdf0d3' }}>
                        <p className="text-sm font-semibold text-[#21326c] mb-2">Submit your delivery</p>
                        <p className="text-xs text-[#21326c]/60 mb-3">Once you submit, the client reviews and (on approval) the remaining {(proj.budget - (proj.depositAmount || 0)).toLocaleString()} EGP is released to your wallet.</p>
                        <textarea
                          rows={4}
                          value={deliveryNote}
                          onChange={e => setDeliveryNote(e.target.value)}
                          placeholder="Summarise what you've delivered, where the files are, and any notes the client needs..."
                          className="w-full px-3 py-2 rounded-xl border border-[#21326c]/20 text-sm text-[#21326c] resize-none focus:ring-2 focus:ring-[#21326c] placeholder:text-[#21326c]/40"
                        />
                        <button
                          onClick={() => submitDelivery(proj.id)}
                          disabled={delivering || !deliveryNote.trim()}
                          className="mt-3 w-full py-2.5 rounded-xl font-semibold text-white hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                          style={{ background: '#21326c' }}
                        >
                          Submit Delivery
                        </button>
                      </div>
                    ) : (
                      // Client view — waiting message
                      <div className="rounded-2xl p-4 flex items-center gap-3" style={{ background: '#fef3c7', border: '1px solid #f59e0b40' }}>
                        <Hourglass size={20} className="text-amber-600 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-semibold text-amber-800">Waiting for delivery</p>
                          <p className="text-xs text-amber-700 mt-0.5">You'll be notified when {talentName.split(' ')[0]} submits their work.</p>
                        </div>
                      </div>
                    )}

                    <div className="rounded-2xl p-4 border border-[#21326c]/10" style={{ background: '#21326c04' }}>
                      <p className="text-xs font-semibold text-[#21326c] uppercase tracking-wider mb-2">Escrow Summary</p>
                      <div className="flex justify-between text-sm text-[#21326c] mb-1">
                        <span>Deposit paid</span><span className="font-semibold text-green-600">{(proj.depositAmount||0).toLocaleString()} EGP ✓</span>
                      </div>
                      <div className="flex justify-between text-sm text-[#21326c]">
                        <span>On delivery approval</span><span className="font-semibold text-[#21326c]/50">{(proj.budget - (proj.depositAmount||0)).toLocaleString()} EGP</span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* ── STEP: delivered — Approve delivery ── */}
              {proj.status === 'delivered' && (() => {
                const app = proj.applications.find(a => a.id === proj.acceptedApplicationId);
                const talent = app ? talents.find(t => t.id === app.talentId) : null;
                const remaining = proj.budget - (proj.depositAmount || 0);
                return (
                  <div className="space-y-4">
                    <div className="rounded-2xl p-4" style={{ background: '#f3e8ff', border: '1px solid #c084fc40' }}>
                      <div className="flex items-center gap-2 mb-2">
                        <PackageCheck size={18} className="text-purple-600" />
                        <p className="font-semibold text-purple-800 text-sm">{app?.talentName} submitted their delivery</p>
                        <span className="text-xs text-purple-600 ml-auto">{proj.deliveredAt}</span>
                      </div>
                      {proj.deliveryNote && (
                        <p className="text-sm text-purple-700 leading-relaxed italic">"{proj.deliveryNote}"</p>
                      )}
                    </div>
                    {talent && (
                      <button
                        onClick={() => { setSelected(null); setSelectedTalent(talent); setView('profile'); }}
                        className="flex items-center gap-2 text-sm font-semibold text-[#21326c] hover:opacity-70 transition-opacity"
                      >
                        <Avatar initials={talent.initials} color={talent.avatarColor} size="sm" />
                        View {talent.name}'s portfolio
                        <ChevronRight size={14} />
                      </button>
                    )}
                    <div className="rounded-2xl border-2 border-dashed border-green-300 p-5 text-center space-y-3">
                      <PartyPopper size={32} className="text-green-500 mx-auto" />
                      <div>
                        <p className="font-display text-xl font-bold text-[#21326c]">Happy with the work?</p>
                        <p className="text-sm text-[#21326c]/60 mt-1">Approving releases <strong>{remaining.toLocaleString()} EGP</strong> to the student.</p>
                      </div>
                      <button
                        onClick={() => approveDelivery(proj.id)}
                        disabled={approving}
                        className="w-full py-3 rounded-xl font-semibold text-white hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ background: '#16a34a' }}
                      >
                        {approving ? 'Releasing…' : `Approve & Release ${remaining.toLocaleString()} EGP`}
                      </button>
                      <p className="text-xs text-[#21326c]/40">If you need revisions, message {app?.talentName?.split(' ')[0]} directly.</p>
                    </div>
                  </div>
                );
              })()}

              {/* ── STEP: completed — Leave review ── */}
              {proj.status === 'completed' && (
                <div className="space-y-4">
                  <div className="rounded-2xl p-4 flex items-center gap-3" style={{ background: '#dcfce7', border: '1px solid #22c55e40' }}>
                    <CheckCircle size={20} className="text-green-600 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-green-800">Payment released successfully</p>
                      <p className="text-xs text-green-700 mt-0.5">Full {proj.budget.toLocaleString()} EGP paid · {proj.completedAt}</p>
                    </div>
                  </div>
                  {!reviewSubmitted ? (
                    <div className="rounded-2xl border border-[#21326c]/10 p-5 space-y-4">
                      <h3 className="font-semibold text-[#21326c]">Leave a Review</h3>
                      <div>
                        <p className="text-xs text-[#21326c]/60 mb-2">Your rating</p>
                        <StarPicker value={reviewForm.rating} onChange={r => setReviewForm(f => ({ ...f, rating: r }))} size={28} />
                      </div>
                      <div>
                        <p className="text-xs text-[#21326c]/60 mb-2">Your feedback (optional)</p>
                        <textarea
                          rows={3}
                          value={reviewForm.text}
                          onChange={e => setReviewForm(f => ({ ...f, text: e.target.value }))}
                          placeholder="Share what it was like to work with this student..."
                          className="w-full px-4 py-3 rounded-xl border border-[#21326c]/20 text-sm text-[#21326c] resize-none focus:ring-2 focus:ring-[#21326c] transition-all placeholder:text-[#21326c]/40"
                        />
                      </div>
                      <button
                        onClick={() => submitReview(proj.id)}
                        disabled={reviewing || !reviewForm.rating}
                        className="w-full py-3 rounded-xl font-semibold text-white hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                        style={{ background: '#ff9044' }}
                      >
                        {reviewing ? 'Submitting…' : 'Submit Review'}
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-6 rounded-2xl border border-[#21326c]/10">
                      <Star size={32} fill="#db9630" color="#db9630" className="mx-auto mb-2" />
                      <p className="font-semibold text-[#21326c]">Review submitted!</p>
                      <p className="text-sm text-[#21326c]/60 mt-1">Thanks for your feedback.</p>
                    </div>
                  )}
                </div>
              )}

              {/* ── STEP: reviewed — All done ── */}
              {proj.status === 'reviewed' && (
                <div className="space-y-4">
                  <div className="rounded-2xl p-5 text-center" style={{ background: '#21326c08', border: '1px solid #21326c15' }}>
                    <div className="flex justify-center gap-0.5 mb-3">
                      {[1,2,3,4,5].map(n => (
                        <Star key={n} size={22} fill={n <= (proj.clientReview?.rating || 5) ? '#db9630' : 'none'} color={n <= (proj.clientReview?.rating || 5) ? '#db9630' : '#21326c20'} />
                      ))}
                    </div>
                    <p className="text-sm text-[#21326c] italic mb-1">"{proj.clientReview?.text}"</p>
                    <p className="text-xs text-[#21326c]/40">Your review · {proj.completedAt}</p>
                  </div>
                  {proj.talentReview && (
                    <div className="rounded-2xl p-4 border border-[#21326c]/10">
                      <p className="text-xs font-semibold text-[#21326c]/50 uppercase tracking-wider mb-2">Student's review of you</p>
                      <div className="flex gap-0.5 mb-1">
                        {[1,2,3,4,5].map(n => (
                          <Star key={n} size={14} fill={n <= proj.talentReview.rating ? '#db9630' : 'none'} color={n <= proj.talentReview.rating ? '#db9630' : '#21326c20'} />
                        ))}
                      </div>
                      <p className="text-sm text-[#21326c] italic">"{proj.talentReview.text}"</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      ), document.body)}

      {/* New Project Modal (simple re-use of job post UI) */}
      <Modal open={showPostModal} onClose={() => setShowPostModal(false)} title="Post a New Project" wide>
        <NewProjectForm
          currentUser={currentUser}
          busy={creatingProj}
          onSubmit={(project) => runCreate(async () => {
            try {
              await projectsApi.create({
                title:  project.title,
                brief:  project.brief,
                budget: project.budget,
                // No talentId — project starts in 'open' until a talent is hired.
              });
              await refreshProjects?.();
              setShowPostModal(false);
              addNotification({ icon: 'bag', title: 'Project posted!', body: 'Project is now open. Hire a student to begin.', time: 'Just now' });
            } catch (e) {
              toast.error(`Couldn't post project: ${e.message}`);
            }
          })}
        />
      </Modal>
    </div>
  );
}

export function NewProjectForm({ currentUser, onSubmit, busy = false }) {
  const [form, setForm] = useState({ title: '', brief: '', budget: '', skills: [] });
  const [newSkill, setNewSkill] = useState('');
  const addSkill = () => { const s = newSkill.trim(); if (s && !form.skills.includes(s)) setForm(f => ({ ...f, skills: [...f.skills, s] })); setNewSkill(''); };
  return (
    <div className="space-y-5">
      <div>
        <label className="block text-sm font-semibold text-[#21326c] mb-1.5">Project Title *</label>
        <input type="text" placeholder="e.g. Logo & brand identity for a café" value={form.title}
          onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          className="w-full px-4 py-3 rounded-xl border border-[#21326c]/20 text-[#21326c] text-sm focus:ring-2 focus:ring-[#21326c] transition-all placeholder:text-[#21326c]/40" />
      </div>
      <div>
        <label className="block text-sm font-semibold text-[#21326c] mb-1.5">Brief *</label>
        <textarea rows={4} placeholder="Describe your project — deliverables, style, timeline..." value={form.brief}
          onChange={e => setForm(f => ({ ...f, brief: e.target.value }))}
          className="w-full px-4 py-3 rounded-xl border border-[#21326c]/20 text-[#21326c] text-sm focus:ring-2 focus:ring-[#21326c] resize-none placeholder:text-[#21326c]/40" />
      </div>
      <div>
        <label className="block text-sm font-semibold text-[#21326c] mb-1.5">Budget (EGP) *</label>
        <div className="relative">
          <DollarSign size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#21326c]/40" />
          <input type="number" placeholder="e.g. 3500" value={form.budget}
            onChange={e => setForm(f => ({ ...f, budget: e.target.value }))}
            className="w-full pl-9 pr-4 py-3 rounded-xl border border-[#21326c]/20 text-[#21326c] text-sm focus:ring-2 focus:ring-[#21326c] placeholder:text-[#21326c]/40" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-semibold text-[#21326c] mb-1.5">Required Skills</label>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {form.skills.map(s => (
            <span key={s} className="tag-pill flex items-center gap-1">{s}
              <button onClick={() => setForm(f => ({ ...f, skills: f.skills.filter(x => x !== s) }))} className="ml-0.5 hover:opacity-60"><X size={10} /></button>
            </span>
          ))}
        </div>
        <SkillPicker currentTags={form.skills} onAdd={s => setForm(f => ({ ...f, skills: [...f.skills, s] }))} />
      </div>
      <button
        onClick={() => onSubmit({ title: form.title, brief: form.brief, budget: parseInt(form.budget) || 0, tags: form.skills })}
        disabled={busy || !form.title || !form.brief || !form.budget}
        className="w-full py-3 rounded-xl font-semibold text-white hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        style={{ background: '#ff9044' }}
      >
        {busy ? 'Posting…' : 'Post Project'}
      </button>
    </div>
  );
}

// ─── ONBOARDING FLOW ─────────────────────────────────────────────────────────
