import { toast } from '../lib/toast.js';
import { useState } from 'react';
import { Briefcase, Camera, ChevronLeft, File, FileImage, GraduationCap, Image as ImageIcon, Info, MessageSquare, Pen, Plus, Send, Upload, Wallet, X } from 'lucide-react';
import { conversations as convApi, profiles, uploadFile } from '../lib/api.js';
import { AvailabilityBadge, Modal, PortfolioBlock, SkillPicker, StarRating, VerifiedBadge } from '../components/ui.jsx';
import { AVAILABILITY, PALETTE_COLORS } from '../lib/constants.js';

export function ProfilePage({ talent, setView, currentUser, onUpdateTalent }) {
  const [showEditModal, setShowEditModal]   = useState(false);
  const [startingChat, setStartingChat]     = useState(false);

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

  const saveEdit = () => {
    if (!talent) return; // Guard against null talent
    onUpdateTalent({ ...talent, ...editDraft });
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
        {/* Cover — avatar is absolutely positioned to straddle the bottom edge */}
        <div className="relative h-32 sm:h-44" style={{ background: `linear-gradient(135deg, ${talent.avatarColor}33, ${talent.avatarColor}88)` }}>
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
              <PortfolioBlock key={item.id || i} color={item.color} label={item.label} height={item.h} imageUrl={item.imageUrl} pdfUrl={item.pdfUrl} pdfName={item.pdfName} />
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
          <div className="space-y-2 mb-3">
            {(editDraft.portfolio || []).map((item, i) => (
              <div key={item.id || i} className="flex items-center gap-3 p-2 bg-[#21326c]/5 rounded-xl">
                {/* Thumbnail */}
                <div
                  className="w-12 h-10 rounded-lg flex-shrink-0 overflow-hidden flex items-center justify-center relative"
                  style={item.imageUrl
                    ? { backgroundImage: `url(${item.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
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
                  {item.imageUrl && (
                    <button
                      onClick={() => setEditDraft(d => ({ ...d, portfolio: d.portfolio.map(p => p.id === item.id ? { ...p, imageUrl: null } : p) }))}
                      className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity"
                      title="Remove image"
                    >
                      <X size={12} color="white" />
                    </button>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[#21326c] font-medium truncate">{item.label}</p>
                  {!item.imageUrl && !item.pdfUrl && (
                    <label className="text-xs text-[#21326c]/40 hover:text-[#21326c] cursor-pointer flex items-center gap-1 mt-0.5 transition-colors">
                      <Upload size={10} /> Upload photo or PDF
                      <input type="file" accept="image/*,application/pdf" className="hidden" onChange={e => handlePortfolioImageUpload(item.id, e.target.files[0])} />
                    </label>
                  )}
                  {item.imageUrl && <p className="text-xs text-green-600 mt-0.5">Photo uploaded ✓</p>}
                  {item.pdfUrl && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <p className="text-xs text-green-600 truncate max-w-[110px]">PDF: {item.pdfName}</p>
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
          <button onClick={() => { if (newPortItem.label) { setEditDraft(d => ({ ...d, portfolio: [...(d.portfolio || []), { id: `p${Date.now()}`, ...newPortItem, imageUrl: null }] })); setNewPortItem({ label: '', color: '#21326c', h: 'medium' }); } }}
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
    </>
  );
}

// ─── VIEW 5: SOCIAL FEED ─────────────────────────────────────────────────────
