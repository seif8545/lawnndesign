import { useState } from 'react';
import { Award, BadgeCheck, Briefcase, Building2, Camera, CheckCircle, File as FileIcon, Image as ImageIcon, Layers, Palette, Plus, Search, Send, Star, Users, Video, Wallet, X } from 'lucide-react';
import { Avatar, NotificationPanel, VerifiedBadge } from '../components/ui.jsx';
import { AVAILABILITY, SKILL_LIBRARY } from '../lib/constants.js';
import { uploadFile } from '../lib/api.js';
import { toast } from '../lib/toast.js';

export function OnboardingFlow({ currentUser, talents, onUpdateTalent, onDone }) {
  const [step, setStep] = useState(0);
  const [skillQuery, setSkillQuery] = useState('');
  const [uploading, setUploading] = useState(false);

  // Student onboarding draft
  const talent = currentUser?.role === 'student' ? talents.find(t => t.userId === currentUser.id) : null;
  const [draft, setDraft] = useState({
    bio: talent?.bio || '',
    availability: talent?.availability || 'open',
    tags: talent?.tags ? [...talent.tags] : [],
    portfolio: talent?.portfolio ? talent.portfolio.map(p => ({ ...p })) : [],
  });

  // Client onboarding interest selection
  const CLIENT_INTERESTS = [
    { id: 'branding',      label: 'Brand & Identity',         icon: Palette },
    { id: 'interior',      label: 'Interior & Architecture',  icon: Building2 },
    { id: 'ux',            label: 'UI/UX & Digital',          icon: Layers },
    { id: 'illustration',  label: 'Illustration & Fine Art',  icon: ImageIcon },
    { id: 'motion',        label: 'Motion & Video',           icon: Video },
    { id: 'photography',   label: 'Photography',              icon: Camera },
  ];
  const [interests, setInterests] = useState([]);

  const isStudent = currentUser?.role === 'student';
  const isClient  = currentUser?.role === 'client';

  const STUDENT_STEPS = 4;
  const CLIENT_STEPS  = 3;
  const totalSteps = isStudent ? STUDENT_STEPS : CLIENT_STEPS;

  const handleStudentDone = () => {
    if (talent) onUpdateTalent({ ...talent, ...draft });
    onDone();
  };

  const toggleInterest = id => setInterests(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  // — STUDENT STEPS —
  const studentSteps = [
    // Step 0: Welcome
    {
      title: "Welcome to Lawnn! 🎨",
      sub: "Egypt's best creative students, in one place. Let's set up your profile in 2 minutes.",
      content: (
        <div className="space-y-6">
          <div className="rounded-2xl p-6 text-center" style={{ background: 'linear-gradient(135deg, #21326c15, #21326c05)' }}>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: '#21326c' }}>
              <Avatar initials={currentUser?.initials || '?'} color={currentUser?.avatarColor || '#21326c'} size="lg" />
            </div>
            <h3 className="font-display text-xl font-bold text-[#21326c] mb-1">{currentUser?.name}</h3>
            <p className="text-sm text-[#21326c]/60">{talent?.university} · {talent?.dept}</p>
            <div className="mt-3 flex justify-center">
              <VerifiedBadge isGrad={talent?.isGrad} />
            </div>
          </div>
          <div className="space-y-3">
            {[
              { icon: Users,        text: 'Get discovered by Egypt\'s top brands and agencies' },
              { icon: Briefcase,    text: 'Apply to curated creative projects' },
              { icon: Wallet,       text: 'Get paid for every project, coordinated by Lawnn' },
              { icon: Award,        text: 'Build your verified portfolio with real client reviews' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: '#21326c06' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#21326c15' }}>
                  <Icon size={15} className="text-[#21326c]" />
                </div>
                <p className="text-sm text-[#21326c]">{text}</p>
              </div>
            ))}
          </div>
        </div>
      ),
      cta: "Let's set up my profile →",
    },
    // Step 1: Bio + Availability
    {
      title: 'Tell clients about you',
      sub: 'A strong bio increases your chances of getting hired significantly.',
      content: (
        <div className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-[#21326c] uppercase tracking-wider mb-2">Your Bio</label>
            <textarea
              rows={4}
              value={draft.bio}
              onChange={e => setDraft(d => ({ ...d, bio: e.target.value }))}
              placeholder="Describe your style, what you love to make, and what makes you different..."
              className="w-full px-4 py-3 rounded-xl border border-[#21326c]/20 text-[#21326c] text-sm focus:ring-2 focus:ring-[#21326c] resize-none placeholder:text-[#21326c]/40 transition-all"
            />
            <p className="text-xs text-[#21326c]/40 mt-1">{draft.bio.length} characters — aim for 100–200</p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#21326c] uppercase tracking-wider mb-2">Availability</label>
            <div className="flex gap-2 flex-wrap">
              {Object.entries(AVAILABILITY).map(([key, val]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setDraft(d => ({ ...d, availability: key }))}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 text-sm font-semibold transition-all ${
                    draft.availability === key ? 'border-2' : 'border-[#21326c]/15 hover:border-[#21326c]/40'
                  }`}
                  style={draft.availability === key ? { background: val.bg, color: val.text, borderColor: val.color } : {}}
                >
                  <span className="w-2 h-2 rounded-full" style={{ background: val.color }} />
                  {val.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      ),
      cta: 'Next: Add your skills →',
    },
    // Step 2: Skills — full inline browser
    {
      title: 'Add your skills',
      sub: 'Skills help clients find you. Add at least 3 to show up in searches.',
      wide: true,
      content: (() => {
        const q = skillQuery.trim().toLowerCase();
        const allSkills = SKILL_LIBRARY.flatMap(c => c.skills);
        const visibleCategories = q
          ? [{ category: 'Search results', skills: allSkills.filter(s => s.toLowerCase().includes(q)) }]
          : SKILL_LIBRARY;
        const canAddCustom = q && !allSkills.some(s => s.toLowerCase() === q);

        return (
          <div className="flex flex-col gap-3 h-full">
            {/* Selected skills */}
            <div className="flex flex-wrap gap-1.5 min-h-8">
              {draft.tags.length === 0
                ? <p className="text-sm text-[#21326c]/40 italic self-center">No skills yet — tap any skill below to add it</p>
                : draft.tags.map(tag => (
                    <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: '#21326c', color: '#fff' }}>
                      {tag}
                      <button onClick={() => setDraft(d => ({ ...d, tags: d.tags.filter(t => t !== tag) }))} className="opacity-70 hover:opacity-100 ml-0.5"><X size={10} /></button>
                    </span>
                  ))
              }
            </div>

            {/* Search bar */}
            <div className="relative flex-shrink-0">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#21326c]/40" />
              <input
                type="text"
                value={skillQuery}
                onChange={e => setSkillQuery(e.target.value)}
                placeholder="Search or type a custom skill…"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#21326c]/20 text-sm text-[#21326c] focus:ring-2 focus:ring-[#21326c] focus:outline-none placeholder:text-[#21326c]/35 transition-all"
              />
              {skillQuery && (
                <button onClick={() => setSkillQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#21326c]/30 hover:text-[#21326c]"><X size={13} /></button>
              )}
            </div>

            {/* Skill browser — scrollable */}
            <div className="overflow-y-auto flex-1 space-y-4 pr-0.5" style={{ overscrollBehavior: 'contain' }}>
              {canAddCustom && (
                <button
                  onClick={() => { setDraft(d => ({ ...d, tags: [...d.tags, skillQuery.trim()] })); setSkillQuery(''); }}
                  className="flex items-center gap-2 w-full px-3 py-2 rounded-xl border-2 border-dashed border-[#21326c]/30 text-sm text-[#21326c] hover:border-[#21326c]/60 hover:bg-[#21326c]/5 transition-all"
                >
                  <Plus size={14} /> Add "{skillQuery.trim()}" as a custom skill
                </button>
              )}
              {visibleCategories.map(({ category, skills }) => {
                const available = skills.filter(s => !draft.tags.includes(s));
                if (available.length === 0) return null;
                return (
                  <div key={category}>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#21326c]/40 mb-2">{category}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {available.map(skill => (
                        <button
                          key={skill}
                          onClick={() => setDraft(d => ({ ...d, tags: [...d.tags, skill] }))}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border border-[#21326c]/20 text-[#21326c] hover:bg-[#21326c] hover:text-white hover:border-[#21326c] transition-all"
                        >
                          <Plus size={9} />{skill}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
              {visibleCategories.every(({ skills }) => skills.filter(s => !draft.tags.includes(s)).length === 0) && !canAddCustom && (
                <p className="text-sm text-[#21326c]/40 text-center py-4">All matching skills added!</p>
              )}
            </div>

            <p className="text-xs text-[#21326c]/40 text-right flex-shrink-0">{draft.tags.length} skill{draft.tags.length !== 1 ? 's' : ''} added</p>
          </div>
        );
      })(),
      cta: 'Next: Add your portfolio →',
    },
    // Step 3: Portfolio — required before finishing
    {
      title: 'Show your work',
      sub: 'Upload at least one piece. This is how clients judge your level — images or PDFs.',
      content: (() => {
        const items = draft.portfolio || [];
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              {items.map((item, i) => (
                <div key={item.id || i} className="relative rounded-xl overflow-hidden border border-[#21326c]/15 aspect-square bg-[#21326c]/5 flex items-center justify-center">
                  {item.imageUrl
                    ? <img src={item.imageUrl} alt={item.label || 'piece'} className="w-full h-full object-cover" />
                    : <div className="text-center px-1"><FileIcon size={18} className="mx-auto text-[#21326c]/50" /><p className="text-[10px] text-[#21326c]/60 mt-1 truncate">{item.pdfName || item.label || 'PDF'}</p></div>}
                  <button onClick={() => setDraft(d => ({ ...d, portfolio: d.portfolio.filter((_, j) => j !== i) }))}
                    className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-0.5" title="Remove">
                    <X size={12} />
                  </button>
                </div>
              ))}
              <label className={`cursor-pointer rounded-xl border-2 border-dashed border-[#21326c]/25 aspect-square flex flex-col items-center justify-center text-[#21326c]/50 hover:border-[#ff9044] hover:text-[#ff9044] transition-colors ${uploading ? 'opacity-60 pointer-events-none' : ''}`}>
                {uploading ? <span className="text-xs">Uploading…</span> : <><Plus size={20} /><span className="text-[10px] mt-1">Add piece</span></>}
                <input type="file" accept="image/*,application/pdf" className="hidden" disabled={uploading}
                  onChange={async e => {
                    const file = e.target.files?.[0];
                    e.target.value = '';
                    if (!file) return;
                    setUploading(true);
                    try {
                      const r = await uploadFile(file, 'portfolio');
                      const isPdf = file.type === 'application/pdf';
                      setDraft(d => ({ ...d, portfolio: [...(d.portfolio || []), {
                        id: `p${Date.now()}`,
                        label: file.name.replace(/\.[^.]+$/, '').slice(0, 40),
                        color: '#21326c', h: 'medium',
                        imageUrl: isPdf ? null : r.url,
                        pdfUrl:   isPdf ? r.url : null,
                        pdfName:  isPdf ? file.name : null,
                      }] }));
                    } catch (err) {
                      toast.error(`Upload failed: ${err.message}`);
                    } finally {
                      setUploading(false);
                    }
                  }} />
              </label>
            </div>
            <p className="text-xs text-[#21326c]/40">{items.length} piece{items.length !== 1 ? 's' : ''} added — at least one is required to finish.</p>
          </div>
        );
      })(),
      cta: (draft.portfolio || []).some(p => p.imageUrl || p.pdfUrl) ? 'Complete Setup ✓' : 'Upload a piece to finish',
    },
  ];

  // — CLIENT STEPS —
  const clientSteps = [
    // Step 0: Welcome
    {
      title: 'Welcome to Lawnn! 🎨',
      sub: "Hire Egypt's top creative students for your projects — fast, fairly, and safely.",
      content: (
        <div className="space-y-4">
          <div className="rounded-2xl p-5" style={{ background: 'linear-gradient(135deg, #21326c, #c4622d)' }}>
            <div className="flex items-center gap-3 mb-4">
              <Avatar initials={currentUser?.initials || '?'} color="rgba(255,255,255,0.2)" size="md" />
              <div>
                <p className="font-semibold text-white text-sm">{currentUser?.name}</p>
                <p className="text-xs text-white/70">Client account</p>
              </div>
            </div>
            <p className="text-white/80 text-sm leading-relaxed">Browse verified students from Egypt's top creative faculties.</p>
          </div>
          <div className="space-y-2">
            {[
              { icon: Search,       text: 'Browse the talent directory and find the right match' },
              { icon: Send,         text: 'Post a brief and let students apply to your project' },
              { icon: BadgeCheck,   text: 'Accept an offer, send a 50% deposit, and start' },
              { icon: Wallet,       text: 'Send the balance once you approve the delivery' },
              { icon: Star,         text: 'Leave a review and build a history of great work' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: '#21326c06' }}>
                <Icon size={14} className="text-[#21326c] flex-shrink-0" />
                <p className="text-sm text-[#21326c]">{text}</p>
              </div>
            ))}
          </div>
        </div>
      ),
      cta: "Let's explore talent →",
    },
    // Step 1: Interests
    {
      title: 'What do you usually need?',
      sub: "Select the types of creative work you hire for. We'll tailor your experience.",
      content: (
        <div className="grid grid-cols-2 gap-2">
          {CLIENT_INTERESTS.map(({ id, label, icon: Icon }) => {
            const sel = interests.includes(id);
            return (
              <button
                key={id}
                onClick={() => toggleInterest(id)}
                className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                  sel ? 'border-[#21326c] bg-[#21326c]/5' : 'border-[#21326c]/15 hover:border-[#21326c]/30'
                }`}
              >
                <Icon size={18} className={sel ? 'text-[#21326c]' : 'text-[#21326c]/40'} />
                <span className={`text-sm font-semibold ${sel ? 'text-[#21326c]' : 'text-[#21326c]/60'}`}>{label}</span>
                {sel && <CheckCircle size={14} className="text-[#21326c] ml-auto flex-shrink-0" />}
              </button>
            );
          })}
        </div>
      ),
      cta: interests.length === 0 ? 'Skip' : 'Next: How it works →',
    },
    // Step 2: How payments work
    {
      title: 'Simple, staged payments',
      sub: 'Pay a 50% deposit to start and the balance after you approve delivery — by InstaPay, coordinated by Lawnn.',
      content: (
        <div className="space-y-3">
          {[
            { num: '1', title: 'Post your project',   body: 'Describe your brief and budget. Students apply within 24–48 hours.', color: '#21326c' },
            { num: '2', title: 'Accept an offer',      body: 'Review student portfolios and applications, then accept the best fit.', color: '#a84f22' },
            { num: '3', title: 'Send 50% deposit',     body: 'Transfer the deposit by InstaPay. Lawnn confirms it and notifies the student to start.', color: '#db9630' },
            { num: '4', title: 'Receive delivery',    body: 'The student submits their work. Review it at your own pace.', color: '#2563eb' },
            { num: '5', title: 'Approve & send balance', body: 'Happy with the work? Send the final 50% by InstaPay and leave a review.', color: '#16a34a' },
          ].map(({ num, title, body, color }) => (
            <div key={num} className="flex gap-3 p-3 rounded-xl" style={{ background: `${color}08`, border: `1px solid ${color}20` }}>
              <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white mt-0.5" style={{ background: color }}>
                {num}
              </div>
              <div>
                <p className="text-sm font-semibold text-[#21326c]">{title}</p>
                <p className="text-xs text-[#21326c]/60 mt-0.5 leading-relaxed">{body}</p>
              </div>
            </div>
          ))}
        </div>
      ),
      cta: 'Start exploring →',
    },
  ];

  const steps = isStudent ? studentSteps : clientSteps;
  const current = steps[step];
  const isLast = step === totalSteps - 1;

  // Students must upload at least one portfolio piece before they can finish.
  const portfolioBlocked = isStudent && isLast && !(draft.portfolio || []).some(p => p.imageUrl || p.pdfUrl);

  const handleNext = () => {
    if (portfolioBlocked) return;
    if (isLast) {
      if (isStudent) handleStudentDone();
      else onDone();
    } else {
      setStep(s => s + 1);
    }
  };

  const isWideStep = !!current.wide;

  return (
    <div className="fixed inset-0 flex items-end sm:items-center justify-center p-0 sm:px-4 sm:pb-4 sm:pt-20" style={{ zIndex: 1000, background: 'rgba(33,50,108,0.5)', backdropFilter: 'blur(8px)' }}>
      <div
        className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full flex flex-col overflow-hidden animate-fade-in"
        style={{
          maxWidth: isWideStep ? 580 : 448,
          height: isWideStep ? '95dvh' : undefined,
          maxHeight: isWideStep ? '95dvh' : '92dvh',
        }}
      >
        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 pt-5 pb-2 flex-shrink-0">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className="rounded-full transition-all"
              style={{
                width: i === step ? 24 : 8,
                height: 8,
                background: i <= step ? '#21326c' : '#21326c20',
              }}
            />
          ))}
        </div>

        {/* Content */}
        <div className="px-6 pt-4 pb-2 flex-shrink-0">
          <h2 className="font-display text-2xl font-bold text-[#21326c] mb-1">{current.title}</h2>
          <p className="text-sm text-[#21326c]/60 leading-relaxed">{current.sub}</p>
        </div>

        <div className={`px-6 py-4 flex-1 min-h-0 ${isWideStep ? 'flex flex-col overflow-hidden' : 'overflow-y-auto'}`}>
          {current.content}
        </div>

        {/* CTA */}
        <div className="px-6 pb-6 pt-2 flex-shrink-0 space-y-2">
          <button
            onClick={handleNext}
            disabled={portfolioBlocked}
            className="w-full py-3.5 rounded-2xl font-semibold text-white hover:opacity-90 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: isLast ? '#16a34a' : '#ff9044' }}
          >
            {current.cta}
          </button>
          {!isLast && !isStudent && (
            <button onClick={onDone} className="w-full py-2 text-sm text-[#21326c]/40 hover:text-[#21326c] transition-colors">
              Skip setup
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── ROOT APP ─────────────────────────────────────────────────────────────────

// Seed notifications for logged-in roles (demo)
// Map a backend notification row to the shape NotificationPanel expects.
