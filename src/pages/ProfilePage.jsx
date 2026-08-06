import { toast } from '../lib/toast.js';
import { useState } from 'react';
import { Briefcase, Camera, ChevronLeft, File, FileImage, GraduationCap, Image as ImageIcon, Info, MessageSquare, Pen, Plus, Search, Send, Upload, Wallet, X } from 'lucide-react';
import { conversations as convApi, profiles, uploadFile } from '../lib/api.js';
import { AvailabilityBadge, Modal, PortfolioBlock, SkillPicker, StarRating, VerifiedBadge } from '../components/ui.jsx';
import { AVAILABILITY, PALETTE_COLORS } from '../lib/constants.js';

export function ProfilePage({ talent, setView, currentUser, onUpdateTalent }) {
  const [showEditModal, setShowEditModal]   = useState(false);
  const [startingChat, setStartingChat]     = useState(false);
  // Portfolio piece currently open in the full-size lightbox (null = closed).
  // Shared by the public grid and the edit modal's thumbnail list.
  const [preview, setPreview]               = useState(null);

  const handleMessageClick = async () => {
    if (!currentUser || !talent?.userId) return;
    setStartingChat(true);
    try {
      await convApi.create({ talentId: talent.userId });
      setView('chat');
    } catch (e) {
      console.error(e);
      setView('chat');
    } finally {
      setStartingChat(false);
    }
  };

  // Edit profile state
  const [editDraft, setEditDraft] = useState({});
  // newTag removed — replaced by SkillPicker
  const [newEdu, setNewEdu]       = useState({ degree: '', school: '', years: '' });
  const [newExp, setNewExp]       = useState({ role: '', company: '', years: '' });
  const [newPortItem, setNewPortItem] = useState({ label: '', color: '#21326c', h: 'medium' });
  const [coverUploading, setCoverUploading] = useState(false);
  const [portUploading, setPortUploading] = useState(0); // files still uploading

  const isOwnProfile = currentUser?.role === 'student' && currentUser?.id === talent?.userId;

  const openEdit = () => {
    if (!talent) return; // Guard against null talent
    setEditDraft({
      bio: talent.bio,
      tags: [...talent.tags],
      availability: talent.availability || 'open',
      education: talent.education.map(e => ({ ...e })),
      experience: talent.experience.map(e => ({ ...e })),
      portfolio: talent.portfolio.map(p => ({ ...p })),
      avatar: talent.avatar || null,
      coverPhoto: talent.coverPhoto || null,
    });
    setShowEditModal(true);
  };

  // Image / PDF upload for portfolio items — uploads to Supabase Storage so the
  // URL survives reloads and is visible to other users.
  const handlePortfolioImageUpload = async (itemId, file) => {
    if (!file) return;
    try {
      const r = await uploadFile(file, 'portfolio');
      const isPdf = file.type === 'application/pdf';
      setEditDraft(d => ({
        ...d,
        portfolio: d.portfolio.map(p =>
          p.id === itemId
            ? { ...p,
                imageUrl: isPdf ? null  : r.url,
                pdfUrl:   isPdf ? r.url : null,
                pdfName:  isPdf ? r.name : null }
            : p
        ),
      }));
    } catch (e) {
      toast.error(`Upload failed: ${e.message}`);
    }
  };

  // Add pieces file-first: pick images/PDFs and each becomes a portfolio item in
  // one step, titled from the filename (the same pattern onboarding uses, which
  // is why initial upload always felt easy and later editing didn't). Titles stay
  // editable on each row afterwards.
  const handleAddPortfolioFiles = async files => {
    const list = Array.from(files || []);
    if (!list.length) return;
    setPortUploading(list.length);
    const added = [];
    for (const file of list) {
      try {
        const r = await uploadFile(file, 'portfolio');
        const isPdf = file.type === 'application/pdf';
        added.push({
          // Date.now() alone collides inside a tight loop, so add a random suffix.
          id: `p${Date.now()}${Math.random().toString(36).slice(2, 7)}`,
          label: file.name.replace(/\.[^.]+$/, '').slice(0, 40),
          color: '#21326c',
          h: 'medium',
          imageUrl: isPdf ? null : r.url,
          pdfUrl: isPdf ? r.url : null,
          pdfName: isPdf ? file.name : null,
        });
      } catch (e) {
        toast.error(`${file.name}: ${e.message}`);
      } finally {
        setPortUploading(n => n - 1);
      }
    }
    if (added.length) {
      setEditDraft(d => ({ ...d, portfolio: [...(d.portfolio || []), ...added] }));
    }
  };

  const blankPortItem = { label: '', color: '#21326c', h: 'medium' };

  // Build a portfolio row from the "new item" draft. Shared by the Add-item
  // button and the save-time fold-in so the two can't drift apart.
  const draftPortItem = () => ({ id: `p${Date.now()}`, ...newPortItem, label: newPortItem.label.trim(), imageUrl: null });

  const addPortfolioItem = () => {
    if (!newPortItem.label.trim()) {
      toast.error('Give the piece a label first, then click Add item.');
      return;
    }
    setEditDraft(d => ({ ...d, portfolio: [...(d.portfolio || []), draftPortItem()] }));
    setNewPortItem(blankPortItem);
  };

  const saveEdit = () => {
    if (!talent) return; // Guard against null talent
    // Fold in a row the student typed but never committed with "Add entry" —
    // otherwise it sits in newEdu/newExp/newPortItem and is silently dropped on
    // save. The portfolio case bit real students: "Add item" is a small text
    // link sitting directly above the big orange Save button, so typing a label
    // and hitting Save is the obvious move — and it used to lose the item.
    const education  = [...(editDraft.education  || [])];
    const experience = [...(editDraft.experience || [])];
    const portfolio  = [...(editDraft.portfolio  || [])];
    if (newEdu.degree && newEdu.school)  education.push({ ...newEdu });
    if (newExp.role   && newExp.company) experience.push({ ...newExp });
    if (newPortItem.label.trim())        portfolio.push(draftPortItem());
    onUpdateTalent({ ...talent, ...editDraft, education, experience, portfolio });
    setNewEdu({ degree: '', school: '', years: '' });
    setNewExp({ role: '', company: '', years: '' });
    setNewPortItem(blankPortItem);
    setShowEditModal(false);
  };

  if (!talent) return null;

  return (
    <>
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      {/* Back */}
      <button
        onClick={() => setView(isOwnProfile ? 'feed' : 'directory')}
        className="flex items-center gap-2 text-sm text-[#21326c] hover:opacity-80 mb-6 transition-colors"
      >
        <ChevronLeft size={16} /> {isOwnProfile ? 'Back to Feed' : 'Back to Directory'}
      </button>

      {/* Hero */}
      <div className="bg-white rounded-2xl border border-[#21326c]/10 overflow-hidden mb-6">
        {/* Cover — avatar is absolutely positioned to straddle the bottom edge.
            Falls back to the avatar-colour gradient when no cover is uploaded. */}
        <div
          className="relative h-32 sm:h-44 bg-center bg-cover"
          style={talent.coverPhoto
            ? { backgroundImage: `url("${encodeURI(talent.coverPhoto).replace(/"/g, '%22')}")` }
            : { background: `linear-gradient(135deg, ${talent.avatarColor}33, ${talent.avatarColor}88)` }
          }
        >
          <div
            className="absolute bottom-0 left-6 translate-y-1/2 w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-4 border-white flex items-center justify-center text-white text-xl sm:text-2xl font-bold shadow-lg flex-shrink-0 z-10 overflow-hidden"
            style={talent.avatar ? {} : { background: talent.avatarColor }}
          >
            {talent.avatar
              ? <img src={talent.avatar} alt={talent.initials} className="w-full h-full object-cover" />
              : talent.initials}
          </div>
        </div>

        {/* Body — pt clears the half-protruding avatar */}
        <div className="px-6 pb-6 pt-14 sm:pt-16">
          {/* Name row + action buttons — all safely below the cover */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-display text-xl sm:text-2xl font-bold text-[#21326c]">{talent.name}</h1>
                <VerifiedBadge isGrad={talent.isGrad} />
              </div>
              <p className="text-xs sm:text-sm text-[#21326c] mt-0.5">{talent.university} · {talent.dept}</p>
            </div>

            {/* Actions */}
            <div className="flex gap-2 flex-wrap">
              {isOwnProfile ? (
                <button
                  onClick={openEdit}
                  className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#21326c]/30 text-sm font-semibold text-[#21326c] hover:bg-[#21326c]/5 transition-colors"
                >
                  <Pen size={15} /> Edit Profile
                </button>
              ) : (
                <button
                  onClick={handleMessageClick}
                  disabled={startingChat || !currentUser}
                  className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#21326c]/30 text-sm font-semibold text-[#21326c] hover:bg-[#21326c]/5 transition-colors disabled:opacity-50"
                >
                  <MessageSquare size={15} /> {startingChat ? 'Opening…' : 'Message'}
                </button>
              )}
            </div>
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-4 flex-wrap text-sm mb-4">
            <StarRating rating={talent.rating} />
            <span className="text-[#21326c]">{talent.reviews} reviews</span>
            <span className="text-[#21326c]">{talent.completedJobs} projects completed</span>
            <AvailabilityBadge status={talent.availability} />
          </div>

          {/* Wallet — own profile only */}
          {isOwnProfile && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl mb-4 border border-[#21326c]/10" style={{ background: '#21326c08' }}>
              <Wallet size={14} className="text-[#21326c]" />
              <span className="text-sm font-semibold text-[#21326c]">{talent.walletBalance?.toLocaleString() || '0'} EGP</span>
              <span className="text-xs text-[#21326c]/50">total earned · paid out by Lawnn</span>
            </div>
          )}

          {/* Bio */}
          <p className="text-[#21326c] leading-relaxed mb-5 max-w-2xl">{talent.bio}</p>

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {talent.tags.map(tag => (
              <span key={tag} className="tag-pill text-sm px-3 py-1">{tag}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CV sidebar */}
        <div className="space-y-4">
          {/* Education */}
          <div className="bg-white rounded-2xl border border-[#21326c]/10 p-5">
            <h3 className="font-semibold text-[#21326c] mb-4 flex items-center gap-2">
              <GraduationCap size={16} className="text-[#21326c]" /> Education
            </h3>
            <div className="space-y-3">
              {talent.education.map((edu, i) => (
                <div key={i} className="border-l-2 border-[#21326c]/20 pl-3">
                  <p className="text-sm font-semibold text-[#21326c]">{edu.degree}</p>
                  <p className="text-xs text-[#21326c]">{edu.school}</p>
                  <p className="text-xs text-[#21326c] mt-0.5">{edu.years}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Experience */}
          <div className="bg-white rounded-2xl border border-[#21326c]/10 p-5">
            <h3 className="font-semibold text-[#21326c] mb-4 flex items-center gap-2">
              <Briefcase size={16} className="text-[#21326c]" /> Experience
            </h3>
            <div className="space-y-3">
              {talent.experience.map((exp, i) => (
                <div key={i} className="border-l-2 pl-3" style={{ borderColor: '#c4622d' }}>
                  <p className="text-sm font-semibold text-[#21326c]">{exp.role}</p>
                  <p className="text-xs text-[#21326c]">{exp.company}</p>
                  <p className="text-xs text-[#21326c] mt-0.5">{exp.years}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Grad Notice */}
          {talent.isGrad && (
            <div className="rounded-2xl p-4 border" style={{ background: '#fffcf4', borderColor: '#e4ae50' }}>
              <div className="flex items-start gap-2">
                <Info size={15} className="flex-shrink-0 mt-0.5" style={{ color: '#db9630' }} />
                <p className="text-xs leading-relaxed text-[#21326c]">
                  <strong>Graduate Profile:</strong> This talent graduated and is available for freelance projects for up to 12 months from graduation. After that, profiles are archived.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Portfolio Masonry */}
        <div className="lg:col-span-2">
          <h3 className="font-semibold text-[#21326c] mb-4 flex items-center gap-2">
            <ImageIcon size={16} className="text-[#21326c]" /> Portfolio
          </h3>
          <div className="masonry-grid">
            {talent.portfolio.map((item, i) => (
              <PortfolioBlock key={item.id || i} color={item.color} label={item.label} height={item.h} imageUrl={item.imageUrl} pdfUrl={item.pdfUrl} pdfName={item.pdfName}
                onClick={item.imageUrl || item.pdfUrl ? () => setPreview(item) : undefined} />
            ))}
          </div>
        </div>
      </div>
    </div>

    {/* ── EDIT PROFILE MODAL ── */}
    <Modal open={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Your Profile" wide>
      <div className="space-y-6">
        {/* Profile Photo */}
        <div>
          <label className="block text-xs font-semibold text-[#21326c] uppercase tracking-wider mb-2">Profile Photo</label>
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-2xl border-2 border-[#21326c]/20 overflow-hidden flex items-center justify-center text-white text-lg font-bold flex-shrink-0"
              style={editDraft.avatar ? {} : { background: talent.avatarColor }}
            >
              {editDraft.avatar
                ? <img src={editDraft.avatar} alt={talent.initials} className="w-full h-full object-cover" />
                : talent.initials}
            </div>
            <div className="flex flex-col gap-2">
              <label className="cursor-pointer flex items-center gap-2 px-4 py-2 rounded-xl border border-[#21326c]/20 text-sm font-semibold text-[#21326c] hover:bg-[#21326c]/5 transition-colors w-fit">
                <Camera size={14} /> {editDraft.avatar ? 'Change Photo' : 'Upload Photo'}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async e => {
                    const file = e.target.files[0];
                    if (!file) return;
                    try {
                      const r = await uploadFile(file, 'avatar');
                      setEditDraft(d => ({ ...d, avatar: r.url }));
                    } catch (err) {
                      toast.error(`Avatar upload failed: ${err.message}`);
                    }
                  }}
                />
              </label>
              {editDraft.avatar && (
                <button
                  onClick={() => setEditDraft(d => ({ ...d, avatar: null }))}
                  className="text-xs text-red-400 hover:text-red-600 transition-colors flex items-center gap-1 w-fit"
                >
                  <X size={10} /> Remove photo
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Cover Photo — the wide banner behind the profile header. Optional;
            without one the header keeps its avatar-colour gradient. */}
        <div>
          <label className="block text-xs font-semibold text-[#21326c] uppercase tracking-wider mb-2">Cover Photo</label>
          <div
            className="relative h-28 sm:h-32 rounded-xl border-2 border-[#21326c]/15 overflow-hidden bg-center bg-cover"
            style={editDraft.coverPhoto
              ? { backgroundImage: `url("${encodeURI(editDraft.coverPhoto).replace(/"/g, '%22')}")` }
              : { background: `linear-gradient(135deg, ${talent.avatarColor}33, ${talent.avatarColor}88)` }
            }
          >
            {!editDraft.coverPhoto && (
              <div className="absolute inset-0 flex items-center justify-center text-xs text-[#21326c]/50">
                No cover photo yet
              </div>
            )}
            {coverUploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/70 text-xs font-semibold text-[#21326c]">
                Uploading…
              </div>
            )}
          </div>
          <div className="flex items-center gap-3 mt-2">
            <label className={`cursor-pointer flex items-center gap-2 px-4 py-2 rounded-xl border border-[#21326c]/20 text-sm font-semibold text-[#21326c] hover:bg-[#21326c]/5 transition-colors w-fit ${coverUploading ? 'opacity-60 pointer-events-none' : ''}`}>
              <ImageIcon size={14} /> {editDraft.coverPhoto ? 'Change Cover' : 'Upload Cover'}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={coverUploading}
                onChange={async e => {
                  const file = e.target.files[0];
                  e.target.value = ''; // let the same file be re-picked after a failure
                  if (!file) return;
                  setCoverUploading(true);
                  try {
                    const r = await uploadFile(file, 'cover');
                    setEditDraft(d => ({ ...d, coverPhoto: r.url }));
                  } catch (err) {
                    toast.error(`Cover upload failed: ${err.message}`);
                  } finally {
                    setCoverUploading(false);
                  }
                }}
              />
            </label>
            {editDraft.coverPhoto && (
              <button
                onClick={() => setEditDraft(d => ({ ...d, coverPhoto: null }))}
                className="text-xs text-red-400 hover:text-red-600 transition-colors flex items-center gap-1"
              >
                <X size={10} /> Remove cover
              </button>
            )}
          </div>
          <p className="text-xs text-[#21326c]/40 mt-1.5">Wide image works best — roughly 3:1. Max 5&nbsp;MB.</p>
        </div>

        {/* Bio */}
        <div>
          <label className="block text-xs font-semibold text-[#21326c] uppercase tracking-wider mb-1.5">Bio</label>
          <textarea rows={4} value={editDraft.bio || ''} onChange={e => setEditDraft(d => ({ ...d, bio: e.target.value }))}
            className="w-full px-4 py-3 rounded-xl border border-[#21326c]/20 text-[#21326c] text-sm focus:ring-2 focus:ring-[#21326c] transition-all resize-none" />
        </div>

        {/* Availability */}
        <div>
          <label className="block text-xs font-semibold text-[#21326c] uppercase tracking-wider mb-2">Availability</label>
          <div className="flex gap-2 flex-wrap">
            {Object.entries(AVAILABILITY).map(([key, val]) => (
              <button
                key={key}
                type="button"
                onClick={() => setEditDraft(d => ({ ...d, availability: key }))}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 text-sm font-semibold transition-all ${
                  (editDraft.availability || 'open') === key
                    ? 'border-[#21326c]'
                    : 'border-[#21326c]/15 hover:border-[#21326c]/40'
                }`}
                style={(editDraft.availability || 'open') === key ? { background: val.bg, color: val.text, borderColor: val.color } : {}}
              >
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: val.color }} />
                {val.label}
              </button>
            ))}
          </div>
        </div>

        {/* Skills */}
        <div>
          <label className="block text-xs font-semibold text-[#21326c] uppercase tracking-wider mb-2">Skills</label>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {(editDraft.tags || []).map(t => (
              <span key={t} className="tag-pill flex items-center gap-1">
                {t}
                <button onClick={() => setEditDraft(d => ({ ...d, tags: d.tags.filter(x => x !== t) }))} className="ml-0.5 hover:opacity-60"><X size={10} /></button>
              </span>
            ))}
          </div>
          <SkillPicker
            currentTags={editDraft.tags || []}
            onAdd={skill => setEditDraft(d => ({ ...d, tags: [...(d.tags || []), skill] }))}
          />
        </div>

        {/* Education */}
        <div>
          <label className="block text-xs font-semibold text-[#21326c] uppercase tracking-wider mb-2">Education</label>
          <div className="space-y-2 mb-3">
            {(editDraft.education || []).map((edu, i) => (
              <div key={i} className="flex items-start gap-2 p-3 bg-[#21326c]/5 rounded-xl">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-[#21326c]">{edu.degree}</p>
                  <p className="text-xs text-[#21326c]/60">{edu.school} · {edu.years}</p>
                </div>
                <button onClick={() => setEditDraft(d => ({ ...d, education: d.education.filter((_, j) => j !== i) }))}
                  className="text-[#21326c]/30 hover:text-red-400 transition-colors"><X size={14} /></button>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2 mb-2">
            <input type="text" placeholder="Degree" value={newEdu.degree} onChange={e => setNewEdu(n => ({ ...n, degree: e.target.value }))}
              className="px-3 py-2 rounded-xl border border-[#21326c]/20 text-[#21326c] text-sm focus:ring-2 focus:ring-[#21326c] placeholder:text-[#21326c]/40" />
            <input type="text" placeholder="School" value={newEdu.school} onChange={e => setNewEdu(n => ({ ...n, school: e.target.value }))}
              className="px-3 py-2 rounded-xl border border-[#21326c]/20 text-[#21326c] text-sm focus:ring-2 focus:ring-[#21326c] placeholder:text-[#21326c]/40" />
            <input type="text" placeholder="Years e.g. 2022–Present" value={newEdu.years} onChange={e => setNewEdu(n => ({ ...n, years: e.target.value }))}
              className="px-3 py-2 rounded-xl border border-[#21326c]/20 text-[#21326c] text-sm focus:ring-2 focus:ring-[#21326c] placeholder:text-[#21326c]/40" />
          </div>
          <button onClick={() => { if (newEdu.degree && newEdu.school) { setEditDraft(d => ({ ...d, education: [...(d.education || []), { ...newEdu }] })); setNewEdu({ degree: '', school: '', years: '' }); } }}
            className="text-xs font-semibold text-[#21326c] hover:opacity-70 flex items-center gap-1">
            <Plus size={12} /> Add entry
          </button>
        </div>

        {/* Experience */}
        <div>
          <label className="block text-xs font-semibold text-[#21326c] uppercase tracking-wider mb-2">Experience</label>
          <div className="space-y-2 mb-3">
            {(editDraft.experience || []).map((exp, i) => (
              <div key={i} className="flex items-start gap-2 p-3 bg-[#21326c]/5 rounded-xl">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-[#21326c]">{exp.role}</p>
                  <p className="text-xs text-[#21326c]/60">{exp.company} · {exp.years}</p>
                </div>
                <button onClick={() => setEditDraft(d => ({ ...d, experience: d.experience.filter((_, j) => j !== i) }))}
                  className="text-[#21326c]/30 hover:text-red-400 transition-colors"><X size={14} /></button>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2 mb-2">
            <input type="text" placeholder="Role" value={newExp.role} onChange={e => setNewExp(n => ({ ...n, role: e.target.value }))}
              className="px-3 py-2 rounded-xl border border-[#21326c]/20 text-[#21326c] text-sm focus:ring-2 focus:ring-[#21326c] placeholder:text-[#21326c]/40" />
            <input type="text" placeholder="Company" value={newExp.company} onChange={e => setNewExp(n => ({ ...n, company: e.target.value }))}
              className="px-3 py-2 rounded-xl border border-[#21326c]/20 text-[#21326c] text-sm focus:ring-2 focus:ring-[#21326c] placeholder:text-[#21326c]/40" />
            <input type="text" placeholder="Years e.g. 2023–Present" value={newExp.years} onChange={e => setNewExp(n => ({ ...n, years: e.target.value }))}
              className="px-3 py-2 rounded-xl border border-[#21326c]/20 text-[#21326c] text-sm focus:ring-2 focus:ring-[#21326c] placeholder:text-[#21326c]/40" />
          </div>
          <button onClick={() => { if (newExp.role && newExp.company) { setEditDraft(d => ({ ...d, experience: [...(d.experience || []), { ...newExp }] })); setNewExp({ role: '', company: '', years: '' }); } }}
            className="text-xs font-semibold text-[#21326c] hover:opacity-70 flex items-center gap-1">
            <Plus size={12} /> Add entry
          </button>
        </div>

        {/* Portfolio items */}
        <div>
          <label className="block text-xs font-semibold text-[#21326c] uppercase tracking-wider mb-2">Portfolio Items</label>

          {/* Primary way to add work: pick the files, titles come from the
              filenames and stay editable on each row below. */}
          <label className={`block cursor-pointer rounded-xl border-2 border-dashed border-[#21326c]/25 py-4 px-3 mb-3 text-center hover:border-[#ff9044] hover:text-[#ff9044] text-[#21326c]/60 transition-colors ${portUploading ? 'opacity-60 pointer-events-none' : ''}`}>
            {portUploading > 0 ? (
              <span className="text-sm font-semibold">Uploading {portUploading} file{portUploading !== 1 ? 's' : ''}…</span>
            ) : (
              <>
                <Plus size={18} className="mx-auto" />
                <span className="block text-sm font-semibold mt-1">Add images or PDFs</span>
                <span className="block text-xs mt-0.5">Pick several at once — each becomes a piece you can rename below</span>
              </>
            )}
            <input
              type="file"
              accept="image/*,application/pdf"
              multiple
              className="hidden"
              disabled={portUploading > 0}
              onChange={e => { const f = e.target.files; e.target.value = ''; handleAddPortfolioFiles(f); }}
            />
          </label>

          <div className="space-y-2 mb-3">
            {(editDraft.portfolio || []).map((item, i) => (
              <div key={item.id || i} className="flex items-center gap-3 p-2 bg-[#21326c]/5 rounded-xl">
                {/* Thumbnail */}
                <div
                  className="w-12 h-10 rounded-lg flex-shrink-0 overflow-hidden flex items-center justify-center relative"
                  style={item.imageUrl
                    ? { backgroundImage: `url("${encodeURI(item.imageUrl).replace(/"/g, '%22')}")`, backgroundSize: 'cover', backgroundPosition: 'center' }
                    : { background: item.color }
                  }
                >
                  {!item.imageUrl && !item.pdfUrl && (
                    <label className="cursor-pointer flex items-center justify-center w-full h-full" title="Upload image or PDF">
                      <FileImage size={14} color="white" opacity={0.8} />
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        className="hidden"
                        onChange={e => handlePortfolioImageUpload(item.id, e.target.files[0])}
                      />
                    </label>
                  )}
                  {item.pdfUrl && !item.imageUrl && (
                    <div className="flex items-center justify-center w-full h-full">
                      <File size={16} color="white" opacity={0.9} />
                    </div>
                  )}
                  {/* Click the thumbnail to open the full-size viewer. This used
                      to be a remove-image button covering the whole thumbnail,
                      which made "look at my piece" delete it instead. Removing
                      now lives next to the status line below. */}
                  {(item.imageUrl || item.pdfUrl) && (
                    <button
                      onClick={() => setPreview(item)}
                      className="absolute inset-0 bg-black/30 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity"
                      title={`View ${item.label}`}
                    >
                      <Search size={12} color="white" />
                    </button>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <input
                    type="text"
                    value={item.label}
                    onChange={e => setEditDraft(d => ({ ...d, portfolio: d.portfolio.map(p => p.id === item.id ? { ...p, label: e.target.value } : p) }))}
                    placeholder="Untitled piece"
                    aria-label="Piece title"
                    className="w-full bg-transparent text-sm text-[#21326c] font-medium rounded-md px-1 -mx-1 py-0.5 border border-transparent hover:border-[#21326c]/15 focus:bg-white focus:border-[#21326c]/30 focus:ring-1 focus:ring-[#21326c]/20 focus:outline-none transition-colors placeholder:text-[#21326c]/30 placeholder:font-normal"
                  />
                  {!item.imageUrl && !item.pdfUrl && (
                    <label className="text-xs text-[#21326c]/40 hover:text-[#21326c] cursor-pointer flex items-center gap-1 mt-0.5 transition-colors">
                      <Upload size={10} /> Upload photo or PDF
                      <input type="file" accept="image/*,application/pdf" className="hidden" onChange={e => handlePortfolioImageUpload(item.id, e.target.files[0])} />
                    </label>
                  )}
                  {item.imageUrl && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <button onClick={() => setPreview(item)}
                        className="text-xs text-green-600 hover:underline">Photo uploaded ✓</button>
                      <button
                        onClick={() => setEditDraft(d => ({ ...d, portfolio: d.portfolio.map(p => p.id === item.id ? { ...p, imageUrl: null } : p) }))}
                        className="text-[#21326c]/30 hover:text-red-400 transition-colors flex-shrink-0"
                        title="Remove photo"
                      ><X size={10} /></button>
                    </div>
                  )}
                  {item.pdfUrl && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <button onClick={() => setPreview(item)}
                        className="text-xs text-green-600 truncate max-w-[110px] hover:underline">PDF: {item.pdfName}</button>
                      <button
                        onClick={() => setEditDraft(d => ({ ...d, portfolio: d.portfolio.map(p => p.id === item.id ? { ...p, pdfUrl: null, pdfName: null } : p) }))}
                        className="text-[#21326c]/30 hover:text-red-400 transition-colors flex-shrink-0"
                      ><X size={10} /></button>
                    </div>
                  )}
                </div>
                <button onClick={() => setEditDraft(d => ({ ...d, portfolio: d.portfolio.filter((_, j) => j !== i) }))}
                  className="text-[#21326c]/30 hover:text-red-400 transition-colors flex-shrink-0"><X size={14} /></button>
              </div>
            ))}
          </div>
          <p className="text-xs text-[#21326c]/40 mb-2 pt-1 border-t border-[#21326c]/10">
            Or add a blank placeholder to upload into later — pick its title, size and colour:
          </p>
          <div className="flex gap-2 items-center mb-2">
            <input type="text" placeholder="Item label" value={newPortItem.label} onChange={e => setNewPortItem(n => ({ ...n, label: e.target.value }))}
              className="flex-1 px-3 py-2 rounded-xl border border-[#21326c]/20 text-[#21326c] text-sm focus:ring-2 focus:ring-[#21326c] placeholder:text-[#21326c]/40" />
            <select value={newPortItem.h} onChange={e => setNewPortItem(n => ({ ...n, h: e.target.value }))}
              className="px-3 py-2 rounded-xl border border-[#21326c]/20 text-[#21326c] text-sm focus:ring-2 focus:ring-[#21326c]">
              {['short','medium','tall'].map(h => <option key={h} value={h}>{h}</option>)}
            </select>
          </div>
          <div className="flex gap-2 mb-2">
            {PALETTE_COLORS.map(c => (
              <button key={c} onClick={() => setNewPortItem(n => ({ ...n, color: c }))}
                className="w-7 h-7 rounded-lg transition-transform hover:scale-110"
                style={{ background: c, outline: newPortItem.color === c ? `3px solid ${c}` : 'none', outlineOffset: '2px' }} />
            ))}
          </div>
          <button onClick={addPortfolioItem}
            className="text-xs font-semibold text-[#21326c] hover:opacity-70 flex items-center gap-1">
            <Plus size={12} /> Add item
          </button>
        </div>

        <button onClick={saveEdit}
          className="w-full py-3 rounded-xl font-semibold text-white hover:opacity-90 transition-all"
          style={{ background: '#ff9044' }}>
          Save Profile
        </button>
      </div>
    </Modal>

    {/* Full-size viewer for a portfolio piece. Opened from the public grid and
        from the thumbnails in the edit modal. */}
    <Modal open={!!preview} onClose={() => setPreview(null)} title={preview?.label || 'Portfolio piece'} wide>
      {preview?.imageUrl && (
        <img src={preview.imageUrl} alt={preview.label}
          className="w-full max-h-[75vh] object-contain rounded-xl bg-[#21326c]/5" />
      )}
      {preview?.pdfUrl && !preview?.imageUrl && (
        <div className="space-y-3">
          <object data={preview.pdfUrl} type="application/pdf"
            className="w-full h-[70vh] rounded-xl bg-[#21326c]/5">
            {/* Mobile browsers generally refuse to inline-render PDFs. */}
            <p className="text-sm text-[#21326c]/70 p-4">
              This browser can't display the PDF inline — use the link below to open it.
            </p>
          </object>
          <a href={preview.pdfUrl} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#21326c] hover:opacity-70">
            <File size={14} /> Open {preview.pdfName || 'PDF'} in a new tab
          </a>
        </div>
      )}
    </Modal>
    </>
  );
}

// ─── VIEW 5: SOCIAL FEED ─────────────────────────────────────────────────────
