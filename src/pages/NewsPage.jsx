import { useState } from 'react';
import { ArrowRight, BookOpen, ChevronLeft, Pen, Plus, Trash2, X } from 'lucide-react';
import { news as newsApi } from '../lib/api.js';
import { Modal } from '../components/ui.jsx';
import { EMPTY_NEWS_FORM, NEWS_CATEGORIES, NEWS_COLORS } from '../lib/constants.js';

export function ArticleBodyBlock({ block }) {
  if (block.type === 'heading') {
    return (
      <h2 className="font-display text-xl font-bold text-[#21326c] mt-8 mb-3 leading-snug">
        {block.text}
      </h2>
    );
  }
  if (block.type === 'list') {
    return (
      <ul className="my-4 space-y-2 pl-1">
        {block.items.map((item, i) => (
          <li key={i} className="flex items-start gap-3 text-[#21326c] text-base leading-relaxed">
            <span className="mt-2 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#c4622d' }} />
            {item}
          </li>
        ))}
      </ul>
    );
  }
  return (
    <p className="text-[#21326c] text-base leading-loose mb-4">{block.text}</p>
  );
}

export function NewsPage({ newsPosts, currentUser, refreshNews }) {
  const isAdmin = currentUser?.role === 'admin';

  const [selectedArticle, setSelectedArticle] = useState(null);
  const [showModal, setShowModal]             = useState(false);
  const [editingPost, setEditingPost]         = useState(null);
  const [deleteConfirm, setDeleteConfirm]     = useState(null);
  const [saving, setSaving]                   = useState(false);

  // body is stored as plain text in the form, split on blank lines into paragraphs on save
  const [form, setForm] = useState(EMPTY_NEWS_FORM);

  const bodyToText = body => (body || [])
    .filter(b => b.type === 'paragraph')
    .map(b => b.text)
    .join('\n\n');

  const textToBody = text => text
    .split(/\n\n+/)
    .map(t => t.trim())
    .filter(Boolean)
    .map(t => ({ type: 'paragraph', text: t }));

  const openCreate = () => { setForm(EMPTY_NEWS_FORM); setEditingPost(null); setShowModal(true); };
  const openEdit   = post => {
    setForm({
      title: post.title,
      excerpt: post.excerpt,
      bodyText: bodyToText(post.body),
      category: post.category,
      readTime: post.readTime,
      color: post.color,
    });
    setEditingPost(post);
    setShowModal(true);
  };
  const closeModal = () => { setShowModal(false); setEditingPost(null); };

  const handleSave = async () => {
    if (!form.title.trim() || !form.excerpt.trim() || saving) return;
    const body = textToBody(form.bodyText);
    const payload = { title: form.title, excerpt: form.excerpt, body, category: form.category, readTime: form.readTime, color: form.color };
    setSaving(true);
    try {
      if (editingPost) {
        await newsApi.update(editingPost.id, payload);
        if (selectedArticle?.id === editingPost.id) {
          setSelectedArticle(a => ({ ...a, ...payload }));
        }
      } else {
        await newsApi.create(payload);
      }
      await refreshNews?.();
      closeModal();
    } catch (err) {
      console.warn('[news] save failed:', err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async id => {
    try {
      await newsApi.delete(id);
      await refreshNews?.();
    } catch (err) {
      console.warn('[news] delete failed:', err.message);
    }
    setDeleteConfirm(null);
    if (selectedArticle?.id === id) setSelectedArticle(null);
  };

  // ── ARTICLE READER ──
  if (selectedArticle) {
    const post = newsPosts.find(p => p.id === selectedArticle.id) || selectedArticle;
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
        {/* Back */}
        <button
          onClick={() => setSelectedArticle(null)}
          className="flex items-center gap-1.5 text-sm text-[#21326c] hover:opacity-70 transition-opacity mb-8"
        >
          <ChevronLeft size={16} /> Back to News
        </button>

        {/* Hero bar */}
        <div
          className="h-2 rounded-full mb-8"
          style={{ background: `linear-gradient(90deg, ${post.color}, ${post.color}66)` }}
        />

        {/* Meta */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: `${post.color}15`, color: post.color }}>
            {post.category}
          </span>
          <span className="text-xs text-[#21326c]/50">{post.readTime}</span>
        </div>

        {/* Title */}
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#21326c] leading-tight mb-4">
          {post.title}
        </h1>

        {/* Byline */}
        <div className="flex items-center gap-3 mb-8 pb-8 border-b border-[#21326c]/10">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: post.color }}>
            L
          </div>
          <div>
            <p className="text-sm font-semibold text-[#21326c]">{post.author}</p>
            <p className="text-xs text-[#21326c]/50">{post.date}</p>
          </div>
          {isAdmin && (
            <div className="ml-auto flex gap-1">
              <button
                onClick={() => openEdit(post)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border border-[#21326c]/20 text-[#21326c] hover:bg-[#21326c]/5 transition-colors"
              >
                <Pen size={11} /> Edit
              </button>
              {deleteConfirm === post.id ? (
                <div className="flex items-center gap-1 border border-red-100 rounded-lg px-2 py-1 bg-white shadow-sm">
                  <span className="text-xs text-red-500 font-medium">Delete?</span>
                  <button onClick={() => handleDelete(post.id)} className="text-xs font-bold text-red-500 hover:text-red-700 px-1">Yes</button>
                  <button onClick={() => setDeleteConfirm(null)} className="text-xs text-[#21326c]/50 px-1">No</button>
                </div>
              ) : (
                <button
                  onClick={() => setDeleteConfirm(post.id)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border border-red-100 text-red-400 hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={11} /> Delete
                </button>
              )}
            </div>
          )}
        </div>

        {/* Body */}
        <div className="prose-lawnn">
          {/* Excerpt as lead */}
          <p className="text-lg font-medium text-[#21326c] leading-relaxed mb-6 opacity-80">{post.excerpt}</p>

          {(post.body || []).map((block, i) => (
            <ArticleBodyBlock key={i} block={block} />
          ))}

          {(!post.body || post.body.length === 0) && (
            <p className="text-[#21326c]/40 italic text-sm">No article body has been written yet.</p>
          )}
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-[#21326c]/10 flex items-center justify-between">
          <span className="text-xs text-[#21326c]/40">{post.author} · {post.date}</span>
          <button
            onClick={() => setSelectedArticle(null)}
            className="text-xs font-semibold text-[#21326c] flex items-center gap-1 hover:opacity-70 transition-opacity"
          >
            <ChevronLeft size={12} /> All articles
          </button>
        </div>

        {/* Modal (edit in reader) */}
        <Modal open={showModal} onClose={closeModal} title="Edit Article" wide>
          <NewsArticleForm form={form} setForm={setForm} onSave={handleSave} editingPost={editingPost} saving={saving} />
        </Modal>
      </div>
    );
  }

  // ── ARTICLE LIST ──
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-8">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#21326c] mb-1">News & Insights</h1>
          <p className="text-sm text-[#21326c]">Resources, guides, and industry updates for Egypt's creative community</p>
        </div>
        {isAdmin && (
          <button
            onClick={openCreate}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold text-white transition-all hover:opacity-90 flex-shrink-0"
            style={{ background: '#ff9044' }}
          >
            <Plus size={15} /> Write Article
          </button>
        )}
      </div>

      {newsPosts.length === 0 && (
        <div className="text-center py-20 text-[#21326c]">
          <BookOpen size={40} className="mx-auto mb-3 opacity-20" />
          <p className="font-semibold mb-1">No articles yet</p>
          {isAdmin && <p className="text-sm opacity-60">Click "Write Article" to publish your first post.</p>}
        </div>
      )}

      <div className="grid gap-6">
        {newsPosts.map((post, i) => (
          <article
            key={post.id}
            className={`bg-white rounded-2xl border border-[#21326c]/10 overflow-hidden group cursor-pointer ${i === 0 ? 'lg:flex' : ''}`}
            onClick={() => setSelectedArticle(post)}
          >
            <div
              className={`${i === 0 ? 'lg:w-64 flex-shrink-0 h-48 lg:h-auto' : 'h-36'} flex items-center justify-center flex-shrink-0`}
              style={{ background: `linear-gradient(135deg, ${post.color}22, ${post.color}66)` }}
            >
              <BookOpen size={30} style={{ color: post.color }} className="opacity-30" />
            </div>
            <div className="p-6 flex-1 relative">
              {/* Admin controls */}
              {isAdmin && (
                <div className="absolute top-4 right-4 flex gap-1" onClick={e => e.stopPropagation()}>
                  <button
                    onClick={() => openEdit(post)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-[#21326c]/10 transition-colors"
                    title="Edit article"
                  >
                    <Pen size={13} className="text-[#21326c]" />
                  </button>
                  {deleteConfirm === post.id ? (
                    <div className="flex items-center gap-1 bg-white border border-red-100 rounded-lg px-2 py-1 shadow-sm">
                      <span className="text-xs text-red-500 font-medium">Delete?</span>
                      <button onClick={() => handleDelete(post.id)} className="text-xs font-bold text-red-500 hover:text-red-700 px-1">Yes</button>
                      <button onClick={() => setDeleteConfirm(null)} className="text-xs text-[#21326c]/50 hover:text-[#21326c] px-1">No</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirm(post.id)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-50 transition-colors"
                      title="Delete article"
                    >
                      <X size={13} className="text-[#21326c]/40 hover:text-red-400" />
                    </button>
                  )}
                </div>
              )}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: `${post.color}15`, color: post.color }}>
                  {post.category}
                </span>
                <span className="text-xs text-[#21326c]/60">{post.readTime}</span>
              </div>
              <h2 className="font-display text-xl font-bold text-[#21326c] mb-2 group-hover:opacity-75 transition-opacity leading-snug pr-16">
                {post.title}
              </h2>
              <p className="text-sm text-[#21326c] leading-relaxed mb-4">{post.excerpt}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#21326c]/60">{post.author} · {post.date}</span>
                <span className="text-xs font-semibold text-[#21326c] flex items-center gap-1 group-hover:gap-2 transition-all">
                  Read article <ArrowRight size={12} />
                </span>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Create / Edit Modal */}
      <Modal open={showModal} onClose={closeModal} title={editingPost ? 'Edit Article' : 'Write New Article'} wide>
        <NewsArticleForm form={form} setForm={setForm} onSave={handleSave} editingPost={editingPost} saving={saving} />
      </Modal>
    </div>
  );
}

export function NewsArticleForm({ form, setForm, onSave, editingPost, saving }) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-[#21326c] uppercase tracking-wider mb-1.5">Title *</label>
        <input
          type="text"
          placeholder="Article title"
          value={form.title}
          onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          className="w-full px-4 py-3 rounded-xl border border-[#21326c]/20 text-[#21326c] text-sm focus:ring-2 focus:ring-[#21326c] transition-all placeholder:text-[#21326c]/40"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-[#21326c] uppercase tracking-wider mb-1.5">Excerpt *</label>
        <textarea
          rows={2}
          placeholder="Short summary shown on the listing card…"
          value={form.excerpt}
          onChange={e => setForm(f => ({ ...f, excerpt: e.target.value }))}
          className="w-full px-4 py-3 rounded-xl border border-[#21326c]/20 text-[#21326c] text-sm focus:ring-2 focus:ring-[#21326c] transition-all resize-none placeholder:text-[#21326c]/40"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-[#21326c] uppercase tracking-wider mb-1.5">
          Article Body *
          <span className="ml-2 font-normal normal-case text-[#21326c]/40">Separate paragraphs with a blank line</span>
        </label>
        <textarea
          rows={14}
          placeholder="Write the full article here. Leave a blank line between paragraphs."
          value={form.bodyText}
          onChange={e => setForm(f => ({ ...f, bodyText: e.target.value }))}
          className="w-full px-4 py-3 rounded-xl border border-[#21326c]/20 text-[#21326c] text-sm focus:ring-2 focus:ring-[#21326c] transition-all resize-y placeholder:text-[#21326c]/40 font-body leading-relaxed"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-[#21326c] uppercase tracking-wider mb-1.5">Category</label>
          <select
            value={form.category}
            onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
            className="w-full px-3 py-3 rounded-xl border border-[#21326c]/20 text-[#21326c] text-sm focus:ring-2 focus:ring-[#21326c] transition-all"
          >
            {NEWS_CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-[#21326c] uppercase tracking-wider mb-1.5">Read Time</label>
          <input
            type="text"
            placeholder="e.g. 5 min read"
            value={form.readTime}
            onChange={e => setForm(f => ({ ...f, readTime: e.target.value }))}
            className="w-full px-4 py-3 rounded-xl border border-[#21326c]/20 text-[#21326c] text-sm focus:ring-2 focus:ring-[#21326c] transition-all placeholder:text-[#21326c]/40"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-[#21326c] uppercase tracking-wider mb-1.5">Card Colour</label>
        <div className="flex gap-2">
          {NEWS_COLORS.map(c => (
            <button
              key={c}
              onClick={() => setForm(f => ({ ...f, color: c }))}
              className="w-8 h-8 rounded-lg transition-transform hover:scale-110"
              style={{ background: c, outline: form.color === c ? `3px solid ${c}` : 'none', outlineOffset: '2px' }}
            />
          ))}
        </div>
      </div>
      <button
        onClick={onSave}
        disabled={saving || !form.title.trim() || !form.excerpt.trim() || !form.bodyText.trim()}
        className="w-full py-3 rounded-xl font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ background: '#ff9044' }}
      >
        {saving ? 'Saving…' : editingPost ? 'Save Changes' : 'Publish Article'}
      </button>
    </div>
  );
}

// ─── VIEW: MARKETPLACE ───────────────────────────────────────────────────────
