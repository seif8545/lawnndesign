import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Bell, Briefcase, CheckCircle, DollarSign, File, MessageSquare, Plus, Search, Star, TrendingUp, X } from 'lucide-react';
import { AVAILABILITY, SKILL_LIBRARY, COMMON_SKILLS } from '../lib/constants.js';

// Quick-pick the most common skills up front, then type-ahead autocomplete over
// the full library as you type — and you can always add your own custom skill.
export function SkillPicker({ currentTags = [], onAdd }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const q = query.trim().toLowerCase();
  const allSkills = SKILL_LIBRARY.flatMap(c => c.skills);
  const notAdded = s => !currentTags.some(t => t.toLowerCase() === s.toLowerCase());

  // Typing → autocomplete over the whole library. Empty → most common skills.
  const suggestions = (q ? allSkills.filter(s => s.toLowerCase().includes(q)) : []).filter(notAdded).slice(0, 12);
  const common = COMMON_SKILLS.filter(notAdded).slice(0, 12);

  const exists = currentTags.some(t => t.toLowerCase() === q) || allSkills.some(s => s.toLowerCase() === q);
  const canAddCustom = q.length > 0 && !exists;

  const add = skill => {
    const s = (skill || '').trim();
    if (s && !currentTags.some(t => t.toLowerCase() === s.toLowerCase())) onAdd(s);
    setQuery('');
  };

  return (
    <div className="relative">
      {open && <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />}

      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border border-dashed border-[#21326c]/40 text-[#21326c] hover:border-[#21326c] hover:bg-[#21326c]/5 transition-all"
      >
        <Plus size={12} /> Add skill
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-2 z-20 bg-white rounded-2xl shadow-2xl border border-[#21326c]/10 w-72 max-h-80 flex flex-col overflow-hidden">
          {/* Search input */}
          <div className="p-3 border-b border-[#21326c]/8 flex-shrink-0">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[#21326c]/20 focus-within:border-[#21326c] transition-colors bg-[#21326c]/3">
              <Search size={12} className="text-[#21326c]/40 flex-shrink-0" />
              <input
                autoFocus
                type="text"
                placeholder="Type a skill…"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') { if (canAddCustom) add(query); else if (suggestions[0]) add(suggestions[0]); }
                  if (e.key === 'Escape') setOpen(false);
                }}
                className="flex-1 text-xs text-[#21326c] placeholder:text-[#21326c]/40 bg-transparent outline-none min-w-0"
              />
              {query && (
                <button onClick={() => setQuery('')} className="text-[#21326c]/30 hover:text-[#21326c]/60 flex-shrink-0">
                  <X size={11} />
                </button>
              )}
            </div>
          </div>

          {/* Empty → common quick-pick chips. Typing → autocomplete list. */}
          <div className="overflow-y-auto flex-1">
            {!q ? (
              <div className="px-3 pt-2 pb-3">
                <p className="text-[10px] text-[#21326c]/35 px-1 pb-2">Popular skills — or type your own</p>
                <div className="flex flex-wrap gap-1.5">
                  {common.map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => add(s)}
                      className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border border-[#21326c]/15 text-[#21326c] hover:border-[#21326c] hover:bg-[#21326c]/5 transition-all"
                    >
                      <Plus size={10} className="flex-shrink-0" style={{ color: '#ff9044' }} /> {s}
                    </button>
                  ))}
                  {common.length === 0 && (
                    <p className="text-xs text-[#21326c]/40 py-2">All popular skills added — type to find more.</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-1">
                {canAddCustom && (
                  <button
                    onClick={() => add(query)}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-left text-[#21326c] hover:bg-[#21326c]/5"
                  >
                    <Plus size={13} className="flex-shrink-0" style={{ color: '#ff9044' }} />
                    Add “<strong className="font-semibold">{query.trim()}</strong>”
                  </button>
                )}
                {suggestions.map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => add(s)}
                    className="w-full text-left px-4 py-2 text-sm text-[#21326c] hover:bg-[#21326c]/5 transition-colors"
                  >
                    {s}
                  </button>
                ))}
                {!canAddCustom && suggestions.length === 0 && (
                  <p className="text-xs text-[#21326c]/40 text-center py-4">Already added.</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Availability badge — green/amber/gray dot + label

export function AvailabilityBadge({ status = 'open', compact = false }) {
  const a = AVAILABILITY[status] || AVAILABILITY.open;
  if (compact) {
    return (
      <span
        title={a.label}
        className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
        style={{ background: a.color, boxShadow: `0 0 0 2px white` }}
      />
    );
  }
  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
      style={{ background: a.bg, color: a.text }}
    >
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: a.color }} />
      {a.label}
    </span>
  );
}

// Interactive star rating picker (for reviews)

export function StarPicker({ value, onChange, size = 20 }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1,2,3,4,5].map(n => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          className="transition-transform hover:scale-110"
        >
          <Star
            size={size}
            fill={(hover || value) >= n ? '#db9630' : 'none'}
            color={(hover || value) >= n ? '#db9630' : '#21326c40'}
          />
        </button>
      ))}
    </div>
  );
}

// Notification panel — dropdown from bell icon

export function NotificationPanel({ notifications, onMarkRead, onMarkAllRead }) {
  const unread = notifications.filter(n => !n.read).length;
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      {open && <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />}
      <button
        onClick={() => { setOpen(o => !o); if (!open) onMarkAllRead?.(); }}
        className="relative p-2 rounded-lg hover:bg-[#21326c]/5 text-[#21326c] transition-colors"
        title="Notifications"
      >
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-white text-[9px] font-bold" style={{ background: '#ff9044' }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 z-40 bg-white rounded-2xl shadow-2xl border border-[#21326c]/10 w-80 max-h-96 flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-[#21326c]/10 flex items-center justify-between flex-shrink-0">
            <p className="font-semibold text-[#21326c] text-sm">Notifications</p>
            {unread > 0 && (
              <button onClick={onMarkAllRead} className="text-xs text-[#21326c]/50 hover:text-[#21326c] transition-colors">Mark all read</button>
            )}
          </div>
          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <p className="text-center text-sm text-[#21326c]/40 py-8">No notifications yet</p>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  onClick={() => onMarkRead(n.id)}
                  className={`px-4 py-3 border-b border-[#21326c]/5 cursor-pointer hover:bg-[#21326c]/3 transition-colors ${!n.read ? 'bg-[#21326c]/5' : ''}`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: n.iconBg || '#21326c15' }}>
                      {n.icon === 'money'   && <DollarSign size={14} style={{ color: '#22c55e' }} />}
                      {n.icon === 'check'   && <CheckCircle size={14} style={{ color: '#21326c' }} />}
                      {n.icon === 'message' && <MessageSquare size={14} style={{ color: '#21326c' }} />}
                      {n.icon === 'star'    && <Star size={14} style={{ color: '#db9630' }} />}
                      {n.icon === 'bag'     && <Briefcase size={14} style={{ color: '#c4622d' }} />}
                      {!n.icon             && <Bell size={14} style={{ color: '#21326c' }} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs leading-snug text-[#21326c] ${!n.read ? 'font-semibold' : ''}`}>{n.title}</p>
                      <p className="text-xs text-[#21326c]/50 mt-0.5 leading-snug">{n.body}</p>
                      <p className="text-[10px] text-[#21326c]/30 mt-1">{n.time}</p>
                    </div>
                    {!n.read && <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={{ background: '#ff9044' }} />}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function Avatar({ initials, color, imageUrl, size = 'md', online = false }) {
  const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-14 h-14 text-base', xl: 'w-20 h-20 text-xl' };
  return (
    <div className="relative inline-block">
      <div
        className={`${sizes[size]} rounded-full flex items-center justify-center font-bold text-white flex-shrink-0 overflow-hidden`}
        style={imageUrl ? {} : { background: color }}
      >
        {imageUrl
          ? <img src={imageUrl} alt={initials} className="w-full h-full object-cover" />
          : initials}
      </div>
      {online && (
        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white rounded-full" />
      )}
    </div>
  );
}

export function VerifiedBadge({ isGrad = false }) {
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full badge-pulse`}
    style={isGrad ? { background: '#fdf0d3', color: '#21326c', borderColor: '#e4ae50' } : { background: '#21326c', color: '#ffffff', borderColor: '#21326c' }}>
      {isGrad ? <TrendingUp size={10} /> : <CheckCircle size={10} />}
      {isGrad ? 'Rising Talent (Grad)' : 'Verified Student'}
    </span>
  );
}

export function StarRating({ rating }) {
  return (
    <span className="flex items-center gap-1">
      <Star size={13} fill="#db9630" color="#db9630" />
      <span className="text-sm font-semibold text-[#21326c]">{rating}</span>
    </span>
  );
}

export function PortfolioBlock({ color, label, height = 'medium', imageUrl, pdfUrl, pdfName }) {
  const heights = { short: 'h-24', medium: 'h-36', tall: 'h-48' };
  return (
    <div
      className={`portfolio-card ${heights[height]} rounded-xl flex items-end p-3 cursor-pointer overflow-hidden relative`}
      style={imageUrl
        ? { backgroundImage: `url("${encodeURI(imageUrl).replace(/"/g, '%22')}")`, backgroundSize: 'cover', backgroundPosition: 'center' }
        : { background: `linear-gradient(160deg, ${color}cc, ${color})` }
      }
    >
      {pdfUrl && !imageUrl && (
        <div className="absolute top-2 right-2 flex items-center gap-1 bg-white/20 backdrop-blur-sm rounded-lg px-2 py-1">
          <File size={10} color="white" />
          <span className="text-white font-semibold" style={{ fontSize: '9px' }}>PDF</span>
        </div>
      )}
      <span className="text-white text-xs font-medium leading-tight bg-black/30 rounded-lg px-2 py-1">
        {label}
      </span>
    </div>
  );
}

export function CategoryPill({ label, icon: Icon, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium border transition-all duration-200 whitespace-nowrap ${
        active
          ? 'bg-[#21326c] text-white border-[#21326c]'
          : 'bg-transparent text-[#21326c] border-[#21326c]/20 hover:border-[#21326c]/50 hover:bg-[#21326c]/5'
      }`}
    >
      {Icon && <Icon size={15} />}
      {label}
    </button>
  );
}

export function Modal({ open, onClose, title, children, wide = false }) {
  if (!open) return null;
  // Close only when BOTH mousedown and mouseup land on the backdrop. Using
  // onClick fires whenever press + release share a common ancestor — so a
  // drag-select that starts in an input and ends over the dimmed area would
  // close the modal. Tracking mousedown origin avoids that.
  const handleMouseDown = e => {
    if (e.target === e.currentTarget) e.currentTarget.dataset.pressed = '1';
    else delete e.currentTarget.dataset.pressed;
  };
  const handleMouseUp = e => {
    if (e.target === e.currentTarget && e.currentTarget.dataset.pressed === '1') {
      delete e.currentTarget.dataset.pressed;
      onClose();
    } else {
      delete e.currentTarget.dataset.pressed;
    }
  };
  return createPortal(
    <div
      className="fixed inset-0 flex items-end sm:items-center justify-center p-0 sm:px-4 sm:pb-4 sm:pt-20 modal-backdrop"
      style={{ zIndex: 1000 }}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
    >
      <div
        className={`bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full ${wide ? 'sm:max-w-2xl' : 'sm:max-w-lg'} max-h-[92dvh] sm:max-h-[85vh] overflow-y-auto animate-fade-in`}
      >
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#21326c]/20">
          <h2 className="text-base font-bold text-[#21326c]">{title}</h2>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-[#21326c]/5 flex items-center justify-center hover:bg-[#21326c]/10 transition-colors flex-shrink-0">
            <X size={14} className="text-[#21326c]" />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>,
    document.body
  );
}
