import { useState } from 'react';
import { Building2, CheckCircle, Droplets, GraduationCap, Pen, Star, Wallet, X } from 'lucide-react';
import { AvailabilityBadge, SkillPicker, VerifiedBadge } from '../components/ui.jsx';
import { AVAILABILITY } from '../lib/constants.js';

export function AboutPage({ currentUser, talents, onUpdateTalent, aboutContent, setAboutContent }) {
  const isStudent = currentUser?.role === 'student';
  const isAdmin   = currentUser?.role === 'admin';
  const talent    = isStudent ? talents.find(t => t.userId === currentUser.id) : null;

  // ── Student: inline edit ────────────────────────────────────────────────────
  const [editing, setEditing]     = useState(false);
  const [draft, setDraft]         = useState(null);
  const [saved, setSaved]         = useState(false);

  const startEdit = () => {
    if (!talent) return; // Guard against null talent
    setDraft({ bio: talent.bio, tags: [...talent.tags], availability: talent.availability || 'open' });
    setEditing(true);
  };
  const cancelEdit = () => { setEditing(false); setDraft(null); };
  const saveEdit = () => {
    if (!talent) return; // Guard against null talent
    onUpdateTalent({ ...talent, ...draft });
    setEditing(false);
    setDraft(null);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };
  const removeSkill = tag => setDraft(d => ({ ...d, tags: d.tags.filter(t => t !== tag) }));

  if (isStudent && talent) {
    const display = editing ? draft : talent;
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-[#21326c] mb-1">About Me</h1>
            <p className="text-sm text-[#21326c]">Your public profile on Lawnn</p>
          </div>
          {!editing ? (
            <button
              onClick={startEdit}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold border border-[#21326c]/30 text-[#21326c] hover:bg-[#21326c]/5 transition-colors"
            >
              <Pen size={13} /> Edit Profile
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={cancelEdit}
                className="px-4 py-2 rounded-full text-sm font-semibold border border-[#21326c]/20 text-[#21326c] hover:bg-[#21326c]/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveEdit}
                className="px-4 py-2 rounded-full text-sm font-semibold text-white transition-all hover:opacity-90"
                style={{ background: '#ff9044' }}
              >
                Save Changes
              </button>
            </div>
          )}
        </div>

        {saved && (
          <div className="mb-4 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-[#21326c] animate-fade-in" style={{ background: '#21326c0f', border: '1px solid #21326c30' }}>
            <CheckCircle size={15} /> Profile updated successfully
          </div>
        )}

        <div className="bg-white rounded-2xl border border-[#21326c]/10 overflow-hidden">
          <div className="relative h-28" style={{ background: `linear-gradient(135deg, ${talent.avatarColor}33, ${talent.avatarColor}88)` }}>
            <div
              className="absolute bottom-0 left-6 translate-y-1/2 w-18 h-18 rounded-2xl border-4 border-white flex items-center justify-center text-white text-lg font-bold shadow-lg z-10"
              style={{ background: talent.avatarColor, width: '4.5rem', height: '4.5rem' }}
            >
              {talent.initials}
            </div>
          </div>
          <div className="px-6 pb-6 pt-12">
            <div className="mb-5">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-display text-xl font-bold text-[#21326c]">{talent.name}</h2>
                <VerifiedBadge isGrad={talent.isGrad} />
              </div>
              <p className="text-sm text-[#21326c] mt-0.5">{talent.university}</p>
            </div>

            <div className="space-y-5">
              {/* Bio */}
              <div>
                <label className="block text-xs font-semibold text-[#21326c] uppercase tracking-wider mb-2">Bio</label>
                {editing ? (
                  <textarea
                    rows={4}
                    value={draft.bio}
                    onChange={e => setDraft(d => ({ ...d, bio: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-[#21326c]/20 text-[#21326c] text-sm focus:ring-2 focus:ring-[#21326c] transition-all resize-none"
                  />
                ) : (
                  <p className="text-sm text-[#21326c] leading-relaxed rounded-xl p-4" style={{ background: '#21326c08' }}>
                    {display.bio}
                  </p>
                )}
              </div>

              {/* Skills */}
              <div>
                <label className="block text-xs font-semibold text-[#21326c] uppercase tracking-wider mb-2">Skills</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {display.tags.map(tag => (
                    <span key={tag} className="tag-pill flex items-center gap-1">
                      {tag}
                      {editing && (
                        <button onClick={() => removeSkill(tag)} className="ml-1 hover:opacity-60 transition-opacity">
                          <X size={10} />
                        </button>
                      )}
                    </span>
                  ))}
                </div>
                {editing && (
                  <SkillPicker
                    currentTags={draft.tags}
                    onAdd={skill => setDraft(d => ({ ...d, tags: [...d.tags, skill] }))}
                  />
                )}
              </div>

              {/* Availability */}
              <div>
                <label className="block text-xs font-semibold text-[#21326c] uppercase tracking-wider mb-2">Availability</label>
                {editing ? (
                  <div className="flex gap-2 flex-wrap">
                    {Object.entries(AVAILABILITY).map(([key, val]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setDraft(d => ({ ...d, availability: key }))}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 text-sm font-semibold transition-all ${
                          (draft.availability || 'open') === key
                            ? 'border-[#21326c]'
                            : 'border-[#21326c]/15 hover:border-[#21326c]/40'
                        }`}
                        style={(draft.availability || 'open') === key ? { background: val.bg, color: val.text, borderColor: val.color } : {}}
                      >
                        <span className="w-2 h-2 rounded-full" style={{ background: val.color }} />
                        {val.label}
                      </button>
                    ))}
                  </div>
                ) : (
                  <AvailabilityBadge status={display.availability || talent.availability} />
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-xl p-3" style={{ background: '#21326c08' }}>
                  <p className="font-bold text-[#21326c] text-lg leading-tight">{talent.completedJobs}</p>
                  <p className="text-xs text-[#21326c] mt-0.5">Projects</p>
                </div>
                <div className="rounded-xl p-3" style={{ background: '#21326c08' }}>
                  <p className="font-bold text-[#21326c] text-lg leading-tight">{talent.rating}★</p>
                  <p className="text-xs text-[#21326c] mt-0.5">Rating</p>
                </div>
                <div className="rounded-xl p-3" style={{ background: '#21326c08' }}>
                  <p className="font-bold text-[#21326c] text-lg leading-tight">{(talent.walletBalance || 0).toLocaleString()}</p>
                  <p className="text-xs text-[#21326c] mt-0.5">EGP Wallet</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Platform About Us (guests / clients / admin) ────────────────────────────
  const [editingAbout, setEditingAbout]   = useState(false);
  const [aboutDraft, setAboutDraft]       = useState(aboutContent);
  const saveAbout = () => { setAboutContent(aboutDraft); setEditingAbout(false); };

  return (
    <div className="animate-fade-in">
      <section className="hero-pattern py-12 sm:py-20 px-4 relative">
        {isAdmin && (
          <div className="absolute top-6 right-6">
            {editingAbout ? (
              <div className="flex gap-2">
                <button onClick={() => setEditingAbout(false)} className="px-3 py-1.5 rounded-full text-xs font-semibold border border-[#21326c]/20 text-[#21326c] bg-white hover:bg-[#21326c]/5 transition-colors">Cancel</button>
                <button onClick={saveAbout} className="px-3 py-1.5 rounded-full text-xs font-semibold text-white" style={{ background: '#ff9044' }}>Save</button>
              </div>
            ) : (
              <button
                onClick={() => { setAboutDraft(aboutContent); setEditingAbout(true); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white border border-[#21326c]/20 text-[#21326c] hover:bg-[#21326c]/5 transition-colors shadow-sm"
              >
                <Pen size={11} /> Edit Page
              </button>
            )}
          </div>
        )}
        <div className="max-w-7xl mx-auto">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full mb-6" style={{ background: '#21326c', color: '#fff' }}>
              <Droplets size={12} /> Our Story
            </span>
            <h1 className="font-display text-4xl sm:text-5xl font-black text-[#21326c] leading-tight mb-6">
              Built for Egypt's{' '}
              <em className="not-italic" style={{ color: '#ff9044' }}>Creative</em>{' '}
              Generation
            </h1>
            {editingAbout ? (
              <div className="space-y-3">
                <textarea
                  rows={3}
                  value={aboutDraft.para1}
                  onChange={e => setAboutDraft(d => ({ ...d, para1: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-[#21326c]/20 text-[#21326c] text-sm focus:ring-2 focus:ring-[#21326c] resize-none bg-white/80"
                />
                <textarea
                  rows={3}
                  value={aboutDraft.para2}
                  onChange={e => setAboutDraft(d => ({ ...d, para2: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-[#21326c]/20 text-[#21326c] text-sm focus:ring-2 focus:ring-[#21326c] resize-none bg-white/80"
                />
              </div>
            ) : (
              <>
                <p className="text-lg text-[#21326c] leading-relaxed mb-4">{aboutContent.para1}</p>
                <p className="text-[#21326c] leading-relaxed">{aboutContent.para2}</p>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-16">
          {(() => {
            const studentCount = talents.length;
            const facultyCount = new Set(talents.map(t => t.university).filter(Boolean)).size;
            const rated = talents.filter(t => t.rating > 0);
            const avg = rated.length ? (rated.reduce((s, t) => s + t.rating, 0) / rated.length).toFixed(1) : null;
            const stats = [
              { label: String(studentCount), desc: 'Verified Students', Icon: GraduationCap },
              { label: String(facultyCount), desc: 'Partner Faculties',  Icon: Building2 },
              ...(avg ? [{ label: `${avg}★`, desc: 'Average Rating', Icon: Star }] : []),
            ];
            return stats.map(s => (
              <div key={s.desc} className="bg-white rounded-2xl border border-[#21326c]/10 p-6 text-center">
                <s.Icon size={24} className="mx-auto mb-3 text-[#21326c]" />
                <p className="font-display text-4xl font-bold text-[#21326c] mb-1">{s.label}</p>
                <p className="text-sm text-[#21326c]">{s.desc}</p>
              </div>
            ));
          })()}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {[
            {
              title: 'For Students',
              body: 'Once accepted by the Lawnn team, you get a verified profile, access to live client briefs, and a platform to share your work-in-progress. Your portfolio — a curated collection of PDF projects — becomes your calling card.',
              features: ['Verified student badge', 'Live job board access', 'PDF portfolio upload', 'Secure client messaging', 'Admin-managed acceptance'],
            },
            {
              title: 'For Clients',
              body: 'Browse verified student talent and post jobs to find the best match for your brief. Every student on Lawnn is verified by their faculty and reviewed by our team.',
              features: ['Vetted creative talent', 'Post jobs & receive applications', 'Secure payments via escrow', 'Direct messaging'],
            },
          ].map(card => (
            <div key={card.title} className="bg-white rounded-2xl border border-[#21326c]/10 p-8">
              <h3 className="font-display text-2xl font-bold text-[#21326c] mb-4">{card.title}</h3>
              <p className="text-[#21326c] leading-relaxed mb-5 text-sm">{card.body}</p>
              <ul className="space-y-2">
                {card.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-[#21326c]">
                    <CheckCircle size={14} className="flex-shrink-0 text-[#21326c]" /> {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

// ─── VIEW: NEWS ───────────────────────────────────────────────────────────────
