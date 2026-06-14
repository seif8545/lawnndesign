import { Info } from 'lucide-react';
import { AvailabilityBadge, Avatar, StarRating, VerifiedBadge } from '../components/ui.jsx';

export function DirectoryPage({ setView, setSelectedTalent, talents }) {
  // `talents` is fetched once at the App level and already mapped to the
  // shape DirectoryCard expects — no need for a second fetch here.
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      <div className="mb-8">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#21326c] mb-1">Talent Directory</h1>
        <p className="text-sm text-[#21326c]">Verified creative students from Egypt's top faculties</p>
      </div>

      <div className="grid gap-5">
        {talents.map(talent => (
          <DirectoryCard
            key={talent.id}
            talent={talent}
            onClick={() => { setSelectedTalent(talent); setView('profile'); }}
          />
        ))}
      </div>
    </div>
  );
}

export function DirectoryCard({ talent, onClick }) {
  return (
    <div
      className="talent-card bg-white rounded-2xl border border-[#21326c]/10 p-5 cursor-pointer"
      onClick={onClick}
    >
      <div className="flex flex-col sm:flex-row gap-5">
        {/* Left: Avatar + Info */}
        <div className="flex items-start gap-4">
          <Avatar initials={talent.initials} color={talent.avatarColor} size="lg" />
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="font-semibold text-[#21326c]">{talent.name}</h3>
              <VerifiedBadge isGrad={talent.isGrad} />
            </div>
            <p className="text-sm text-[#21326c]">{talent.university}</p>
            <p className="text-xs text-[#21326c] mt-0.5">{talent.dept}</p>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <StarRating rating={talent.rating} />
              <span className="text-xs text-[#21326c]">{talent.reviews} reviews</span>
              <AvailabilityBadge status={talent.availability} />
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              {talent.tags.slice(0,4).map(tag => (
                <span key={tag} className="tag-pill">{tag}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Mini Portfolio */}
        <div className="sm:ml-auto grid grid-cols-3 gap-1.5 sm:w-52">
          {talent.portfolio.slice(0, 3).map((item, i) => (
            <div
              key={i}
              className="h-16 rounded-lg overflow-hidden"
              style={item.imageUrl
                ? { backgroundImage: `url(${item.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                : { background: `linear-gradient(160deg, ${item.color}aa, ${item.color})` }
              }
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── VIEW 4: PROFILE PAGE ─────────────────────────────────────────────────────
