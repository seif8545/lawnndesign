import { useState, useEffect } from 'react';
import { ArrowRight, Building2, CheckCircle, ChevronRight, GraduationCap, Grid, Info, Palette, Pen, Sparkles } from 'lucide-react';
import { AvailabilityBadge, Avatar, CategoryPill, StarRating, VerifiedBadge } from '../components/ui.jsx';

export function HomePage({ setView, setSelectedTalent, talents, heroImageUrl, heroImages = [] }) {
  const [activeCategory, setActiveCategory] = useState('all');

  // Hero carousel: rotate through the admin-curated images every 5s.
  const [heroIndex, setHeroIndex] = useState(0);
  useEffect(() => {
    if (heroImages.length < 2) return;
    const t = setInterval(() => setHeroIndex(i => (i + 1) % heroImages.length), 5000);
    return () => clearInterval(t);
  }, [heroImages.length]);

  const categories = [
    { id: 'all', label: 'All Categories', icon: Sparkles },
    { id: 'arch', label: 'Architecture & Interiors', icon: Building2 },
    { id: 'visual', label: 'Visuals & Branding', icon: Palette },
    { id: 'arts', label: 'Fine Arts & Illustration', icon: Pen },
  ];

  const filteredTalents = activeCategory === 'all' ? talents : talents.filter(t => {
    if (activeCategory === 'arch') return t.dept.includes('Interior') || t.dept.includes('Architecture') || t.dept.includes('Urban');
    if (activeCategory === 'visual') return t.dept.includes('Graphic') || t.dept.includes('UI') || t.dept.includes('Media');
    if (activeCategory === 'arts') return t.dept.includes('Sculpture') || t.dept.includes('Calligraphy') || t.dept.includes('Painting');
    return true;
  });

  // Real stats derived from live talent data — no hardcoded figures.
  const studentCount = talents.length;
  const facultyCount = new Set(talents.map(t => t.university).filter(Boolean)).size;
  const ratedTalents = talents.filter(t => t.rating > 0);
  const avgRating = ratedTalents.length
    ? (ratedTalents.reduce((s, t) => s + t.rating, 0) / ratedTalents.length).toFixed(1)
    : null;

  // Hero feature image. An admin-chosen image (Admin → Homepage) takes priority;
  // otherwise it's pulled from a real talent's portfolio; otherwise a
  // typographic gallery card is shown.
  const heroFeature = (() => {
    if (heroImages.length) return { imageUrl: heroImages[heroIndex % heroImages.length], admin: true, carousel: true };
    if (heroImageUrl) return { imageUrl: heroImageUrl, admin: true };
    const t = talents.find(t => t.portfolio?.some(p => p.imageUrl));
    if (!t) return null;
    const item = t.portfolio.find(p => p.imageUrl);
    return { imageUrl: item.imageUrl, name: t.name, university: t.university };
  })();

  return (
    <div className="animate-fade-in">
      {/* Hero — editorial split */}
      <section className="hero-pattern border-b hairline">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-12 items-stretch">
          {/* Left — copy */}
          <div className="lg:col-span-7 px-5 sm:px-8 lg:px-12 py-14 sm:py-20 lg:py-28 lg:border-r hairline flex flex-col justify-center">
            <span className="kicker mb-5">Egypt's Creative Students · لون</span>
            <h1 className="font-display font-semibold leading-[1.05] tracking-tight text-[#21326c] text-4xl sm:text-5xl lg:text-[64px] mb-5">
              Empowering the next{' '}
              <em className="italic font-medium" style={{ color: '#ff9044' }}>Generation</em>{' '}
              of Creators.
            </h1>
            <p className="text-base sm:text-lg text-[#21326c]/80 leading-relaxed max-w-[88%] mb-8">
              Hire verified top-tier students for architecture, design, and fine arts. Exceptional creative work at honest rates.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setView('jobs')}
                className="group flex items-center gap-2 px-7 py-3 rounded-md font-semibold text-white text-sm sm:text-base transition-all hover:brightness-105"
                style={{ background: '#ff9044' }}
              >
                Post a Project <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
              </button>
              <button
                onClick={() => setView('directory')}
                className="flex items-center gap-2 px-7 py-3 rounded-md font-semibold text-sm sm:text-base border border-[#21326c] text-[#21326c] bg-transparent hover:bg-[#21326c] hover:text-white transition-all"
              >
                Browse Talent
              </button>
            </div>
            {(studentCount > 0 || avgRating) && (
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-8 text-sm text-[#21326c]/80">
                <span className="flex items-center gap-1.5 font-medium text-[#21326c]"><CheckCircle size={14} /> Verified students</span>
                {studentCount > 0 && <span className="flex items-center gap-1.5"><span className="text-[#21326c]/25">·</span> {studentCount} on Lawnn</span>}
                {facultyCount > 0 && <span className="flex items-center gap-1.5"><span className="text-[#21326c]/25">·</span> {facultyCount} facult{facultyCount === 1 ? 'y' : 'ies'}</span>}
                {avgRating && <span className="flex items-center gap-1.5"><span className="text-[#21326c]/25">·</span> {avgRating}★ avg. rating</span>}
              </div>
            )}
          </div>

          {/* Right — gallery-framed feature, drawn from live talent work */}
          <div className="lg:col-span-5 px-5 sm:px-8 lg:px-12 py-10 lg:py-0 flex items-center justify-center">
            <figure className="w-full max-w-sm">
              <div className="relative aspect-[4/5] gallery-frame bg-[#f3efe4] overflow-hidden">
                {heroFeature?.imageUrl ? (
                  <>
                    <div key={heroFeature.imageUrl} className="absolute inset-0 animate-fade-in" style={{ backgroundImage: `url(${heroFeature.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                    {heroFeature.carousel && heroImages.length > 1 && (
                      <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 z-10">
                        {heroImages.map((_, i) => (
                          <button key={i} onClick={() => setHeroIndex(i)} aria-label={`Slide ${i + 1}`}
                            className="w-2 h-2 rounded-full transition-all"
                            style={{ background: i === (heroIndex % heroImages.length) ? '#fff' : 'rgba(255,255,255,0.55)' }} />
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(150deg, #fffefb 0%, #f3efe4 45%, #e9e2d2 100%)' }} />
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-8">
                      <span className="font-display italic text-2xl text-[#21326c] leading-tight">Selected work from<br/>Egypt's creative students</span>
                      <span className="kicker mt-4">Architecture · Interiors · Visuals · Fine Art</span>
                    </div>
                  </>
                )}
              </div>
              <figcaption className="mt-3 flex items-center justify-between">
                <span className="kicker">{heroFeature ? 'Featured work' : 'A curated gallery'}</span>
                <span className="font-body text-xs text-[#21326c]/70">
                  {heroFeature?.admin
                    ? 'Lawnn'
                    : heroFeature
                      ? `${heroFeature.name}${heroFeature.university ? ' · ' + heroFeature.university : ''}`
                      : (facultyCount > 0 ? `${facultyCount} faculties` : 'Lawnn')}
                </span>
              </figcaption>
            </figure>
          </div>
        </div>
      </section>

{/* Trust Bar */}
<div className="py-3 overflow-hidden" style={{ backgroundColor: '#21326c', color: '#ffffff' }}>
    <div className="animate-marquee flex items-center gap-8 px-4 text-sm font-medium opacity-90 whitespace-nowrap">
        {[
            'Helwan Fine Arts', 
            'GUC Applied Arts', 
            'AUC Architecture & Fine Arts', 
            'MSA Arts and Design', 
            'AASTMT Arts and Design', 
            'NGU Architecture & Fine arts',
            'Ain Shams Architecture',
            'Helwan Applied Arts', 
            'BUC Applied Arts', 
            'Cairo University Architectural Engineering'
        ].concat([
            'Helwan Fine Arts', 
            'GUC Applied Arts', 
            'AUC Architecture & Fine Arts', 
            'MSA Arts and Design', 
            'AASTMT Arts and Design', 
            'NGU Architecture & Fine Arts',
            'Ain Shams Architecture',
            'Helwan Applied Arts', 
            'BUC Applied Arts', 
            'Cairo University Architectural Engineering'
        ]).map((u, i) => (
            <span key={i} className="flex items-center gap-2 flex-shrink-0">
                <GraduationCap size={14} />
                {u}
            </span>
        ))}
    </div>
</div>

      {/* Categories & Talent Grid */}
      <section className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 py-16 sm:py-20">
        <div className="flex items-end justify-between mb-8 border-b hairline pb-5">
          <div>
            <span className="kicker block mb-2">The Directory</span>
            <h2 className="font-display text-3xl sm:text-4xl font-semibold text-[#21326c] leading-none">Selected Talent</h2>
          </div>
          <button onClick={() => setView('directory')} className="text-[13px] tracking-wide uppercase font-semibold text-[#21326c] flex items-center gap-1 hover:text-[#ff9044] transition-colors pb-1">
            View all <ChevronRight size={14} />
          </button>
        </div>

        {/* Category Pills */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-8">
          {categories.map(cat => (
            <CategoryPill
              key={cat.id}
              label={cat.label}
              icon={cat.icon}
              active={activeCategory === cat.id}
              onClick={() => setActiveCategory(cat.id)}
            />
          ))}
        </div>

        {/* Talent Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTalents.map(talent => (
            <TalentCard
              key={talent.id}
              talent={talent}
              onClick={() => setView('profile', talent)}
            />
          ))}
        </div>
      </section>

    </div>
  );
}

export function TalentCard({ talent, onClick }) {
  return (
    <div
      className="talent-card bg-white rounded-2xl border border-[#21326c]/10 overflow-hidden cursor-pointer"
      onClick={onClick}
    >
      {/* Mini portfolio preview */}
      <div className="grid grid-cols-3 gap-0.5 h-28 relative">
        {talent.portfolio.slice(0, 3).map((item, i) => (
          <div
            key={i}
            className="h-full flex items-end p-1.5 overflow-hidden"
            style={item.imageUrl
              ? { backgroundImage: `url(${item.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
              : { background: `linear-gradient(160deg, ${item.color}aa, ${item.color})` }
            }
          >
            {i === 0 && <span className="text-white text-xs font-medium truncate leading-tight bg-black/30 rounded px-1" style={{ fontSize: '9px' }}>{item.label}</span>}
          </div>
        ))}
        {/* Availability dot */}
        <div className="absolute top-2 right-2">
          <AvailabilityBadge status={talent.availability} compact />
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-3">
            <Avatar initials={talent.initials} color={talent.avatarColor} size="md" />
            <div>
              <p className="font-semibold text-[#21326c] text-sm leading-tight">{talent.name}</p>
              <p className="text-xs text-[#21326c] leading-tight mt-0.5">{talent.university}</p>
            </div>
          </div>
          <StarRating rating={talent.rating} />
        </div>

        <div className="flex items-center gap-2 flex-wrap mb-2">
          <VerifiedBadge isGrad={talent.isGrad} />
          <AvailabilityBadge status={talent.availability} />
        </div>

        <div className="flex flex-wrap gap-1 mb-3">
          {talent.tags.slice(0,3).map(tag => (
            <span key={tag} className="tag-pill">{tag}</span>
          ))}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-[#21326c]/10">
          <span className="text-xs text-[#21326c]">{talent.completedJobs} projects done</span>
          <span className="text-xs text-[#21326c]">{talent.reviews} reviews</span>
        </div>
      </div>
    </div>
  );
}

// ─── VIEW 2: JOB BOARD ────────────────────────────────────────────────────────
