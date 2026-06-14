import { ChevronLeft } from 'lucide-react';
import { INFO_PAGES } from '../lib/constants.js';

export function InfoPage({ slug, setView }) {
  const page = INFO_PAGES[slug];
  if (!page) return null;
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 animate-fade-in">
      <div className="h-2 rounded-full mb-8" style={{ background: 'linear-gradient(90deg, #21326c, #21326c66)' }} />
      <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#21326c] mb-2">{page.title}</h1>
      <p className="text-base text-[#21326c]/70 mb-8">{page.subtitle}</p>
      <div className="space-y-8">
        {page.sections.map((s, i) => (
          <section key={i}>
            <h2 className="font-display text-lg font-bold text-[#21326c] mb-2">{s.heading}</h2>
            {s.body.map((p, j) => (
              <p key={j} className="text-sm text-[#21326c]/80 leading-relaxed mb-3">{p}</p>
            ))}
          </section>
        ))}
      </div>
      <div className="mt-12 pt-8 border-t border-[#21326c]/10">
        <button
          onClick={() => setView('home')}
          className="text-sm font-semibold text-[#21326c] flex items-center gap-1 hover:opacity-70 transition-opacity"
        >
          <ChevronLeft size={14} /> Back to home
        </button>
      </div>
    </div>
  );
}
