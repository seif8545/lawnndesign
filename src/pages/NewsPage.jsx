import { useState, useRef, useEffect, useCallback } from 'react';
import {
  AlignCenter, AlignLeft, AlignRight, ArrowRight, Bold, BookOpen,
  ChevronLeft, Heading1, Heading2, Heading3, Image as ImageIcon,
  Italic, Link, List, ListOrdered, Minus, Palette, Pen, Plus,
  Quote, Strikethrough, Trash2, Type, Underline, X,
} from 'lucide-react';
import { news as newsApi, uploadFile } from '../lib/api.js';
import { Modal } from '../components/ui.jsx';
import { EMPTY_NEWS_FORM, NEWS_CATEGORIES, NEWS_COLORS } from '../lib/constants.js';
import { toast } from '../lib/toast.js';

// ─── TEXT COLOUR SWATCHES ────────────────────────────────────────────────────
const TEXT_COLORS = [
  { label: 'Navy',   color: '#21326c' },
  { label: 'Terra',  color: '#c4622d' },
  { label: 'Gold',   color: '#db9630' },
  { label: 'Green',  color: '#16a34a' },
  { label: 'Blue',   color: '#2563eb' },
  { label: 'Purple', color: '#7c3aed' },
  { label: 'Red',    color: '#dc2626' },
  { label: 'Teal',   color: '#0891b2' },
  { label: 'Gray',   color: '#6b7280' },
  { label: 'Black',  color: '#111111' },
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const isBodyEmpty = (html) => !html || html.replace(/<[^>]*>/g, '').trim() === '';

const escHtml = (t) =>
  t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Convert old block format -> HTML string for the editor */
const bodyToHtml = (body) => {
  if (!body || body.length === 0) return '';
  return body.map(block => {
    if (block.type === 'html')    return block.html || '';
    if (block.type === 'heading') return `<h2>${escHtml(block.text || '')}</h2>`;
    if (block.type === 'list')    return `<ul>${(block.items || []).map(i => `<li>${escHtml(i)}</li>`).join('')}</ul>`;
    return `<p>${escHtml(block.text || '')}</p>`;
  }).join('\n');
};

/** Convert editor HTML -> body array the backend stores */
const htmlToBody = (html) => {
  if (isBodyEmpty(html)) return [];
  return [{ type: 'html', html }];
};

// ─── RICH TEXT EDITOR ────────────────────────────────────────────────────────
function RichTextEditor({ value, onChange }) {
  const editorRef    = useRef(null);
  const lastValueRef = useRef('');
  const [showColors, setShowColors] = useState(false);
  const [showLink,   setShowLink]   = useState(false);
  const [linkUrl,    setLinkUrl]    = useState('');
  const savedRange   = useRef(null);
  const [uploading,  setUploading]  = useState(false);

  // Sync external value -> DOM (only when it actually changed from outside)
  useEffect(() => {
    if (editorRef.current && value !== lastValueRef.current) {
      editorRef.current.innerHTML = value || '';
      lastValueRef.current = value;
    }
  }, [value]);

  const notify = useCallback(() => {
    const html = editorRef.current?.innerHTML || '';
    lastValueRef.current = html;
    onChange(html);
  }, [onChange]);

  const exec = useCallback((cmd, val) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, val ?? null);
    notify();
  }, [notify]);

  const execBlock = useCallback((tag) => {
    editorRef.current?.focus();
    document.execCommand('formatBlock', false, tag);
    notify();
  }, [notify]);

  const saveRange = () => {
    const sel = window.getSelection();
    if (sel?.rangeCount) savedRange.current = sel.getRangeAt(0).cloneRange();
  };

  const restoreRange = () => {
    const r = savedRange.current;
    if (!r) return;
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(r);
  };

  // Link
  const openLink = () => {
    saveRange();
    setLinkUrl('');
    setShowLink(true);
    setShowColors(false);
  };

  const insertLink = () => {
    if (!linkUrl.trim()) { setShowLink(false); return; }
    restoreRange();
    editorRef.current?.focus();
    const url = /^https?:\/\//i.test(linkUrl.trim()) ? linkUrl.trim() : `https://${linkUrl.trim()}`;
    document.execCommand('createLink', false, url);
    // Make it open in a new tab
    const sel = window.getSelection();
    const anchor = sel?.anchorNode?.parentElement?.closest('a')
      || editorRef.current?.querySelector(`a[href="${url}"]`);
    if (anchor) { anchor.target = '_blank'; anchor.rel = 'noopener noreferrer'; }
    notify();
    setShowLink(false);
    setLinkUrl('');
    savedRange.current = null;
  };

  // Image
  const insertImage = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const result = await uploadFile(file, 'site');
      editorRef.current?.focus();
      document.execCommand('insertHTML', false,
        `<img src="${result.url}" alt="${file.name}" />`);
      notify();
    } catch (e) {
      toast.error(`Image upload failed: ${e.message}`);
    } finally {
      setUploading(false);
    }
  };

  const Btn = ({ onClick, title, children }) => (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      title={title}
      className="min-w-[28px] h-7 px-1.5 rounded flex items-center justify-center transition-all hover:bg-[#21326c]/10 text-[#21326c]/60 hover:text-[#21326c]"
    >
      {children}
    </button>
  );

  const Sep = () => <div className="w-px h-5 bg-[#21326c]/15 mx-0.5 flex-shrink-0" />;

  return (
    <div className="rounded-xl border border-[#21326c]/20 overflow-visible focus-within:ring-2 focus-within:ring-[#21326c]/20 focus-within:border-[#21326c]/40 transition-all">

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-[#21326c]/10 bg-[#21326c]/[0.02] rounded-t-xl">
        <Btn onClick={() => exec('bold')}          title="Bold (Ctrl+B)"><Bold size={13} /></Btn>
        <Btn onClick={() => exec('italic')}        title="Italic (Ctrl+I)"><Italic size={13} /></Btn>
        <Btn onClick={() => exec('underline')}     title="Underline (Ctrl+U)"><Underline size={13} /></Btn>
        <Btn onClick={() => exec('strikeThrough')} title="Strikethrough"><Strikethrough size={13} /></Btn>

        <Sep />

        <Btn onClick={() => execBlock('h1')}         title="Heading 1"><Heading1 size={13} /></Btn>
        <Btn onClick={() => execBlock('h2')}         title="Heading 2"><Heading2 size={13} /></Btn>
        <Btn onClick={() => execBlock('h3')}         title="Heading 3"><Heading3 size={13} /></Btn>
        <Btn onClick={() => execBlock('p')}          title="Normal paragraph"><Type size={13} /></Btn>
        <Btn onClick={() => execBlock('blockquote')} title="Blockquote"><Quote size={13} /></Btn>

        <Sep />

        <Btn onClick={() => exec('insertUnorderedList')} title="Bullet list"><List size={13} /></Btn>
        <Btn onClick={() => exec('insertOrderedList')}   title="Numbered list"><ListOrdered size={13} /></Btn>

        <Sep />

        <Btn onClick={() => exec('justifyLeft')}   title="Align left"><AlignLeft size={13} /></Btn>
        <Btn onClick={() => exec('justifyCenter')} title="Center"><AlignCenter size={13} /></Btn>
        <Btn onClick={() => exec('justifyRight')}  title="Align right"><AlignRight size={13} /></Btn>

        <Sep />

        {/* Colour picker */}
        <div className="relative">
          <Btn
            onClick={() => { saveRange(); setShowColors(c => !c); setShowLink(false); }}
            title="Text colour"
          >
            <Palette size={13} />
          </Btn>
          {showColors && (
            <div
              className="absolute top-full left-0 mt-1 z-50 bg-white rounded-xl border border-[#21326c]/15 shadow-xl p-3"
              style={{ minWidth: '168px' }}
              onMouseDown={e => e.preventDefault()}
            >
              <p className="text-[10px] font-semibold text-[#21326c]/40 uppercase tracking-wider mb-2">Text colour</p>
              <div className="grid grid-cols-5 gap-1.5 mb-3">
                {TEXT_COLORS.map(({ label, color }) => (
                  <button
                    key={color}
                    type="button"
                    title={label}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      restoreRange();
                      editorRef.current?.focus();
                      document.execCommand('foreColor', false, color);
                      notify();
                      setShowColors(false);
                    }}
                    className="w-6 h-6 rounded-md hover:scale-110 transition-transform shadow-sm"
                    style={{ background: color, outline: '1.5px solid rgba(33,50,108,0.12)', outlineOffset: '1px' }}
                  />
                ))}
              </div>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  restoreRange();
                  editorRef.current?.focus();
                  document.execCommand('removeFormat', false, null);
                  notify();
                  setShowColors(false);
                }}
                className="w-full text-[11px] font-semibold text-[#21326c]/45 hover:text-[#21326c] px-2 py-1 rounded-lg hover:bg-[#21326c]/5 transition-colors text-left"
              >
                ✕  Clear all formatting
              </button>
            </div>
          )}
        </div>

        <Sep />

        {/* Link */}
        <Btn onClick={openLink} title="Insert / edit link"><Link size={13} /></Btn>

        {/* Image upload */}
        <label
          title="Insert image"
          className="min-w-[28px] h-7 px-1.5 rounded flex items-center justify-center transition-all hover:bg-[#21326c]/10 text-[#21326c]/60 hover:text-[#21326c] cursor-pointer"
        >
          {uploading
            ? <span className="text-[9px] font-bold text-[#21326c]/50 animate-pulse">…</span>
            : <ImageIcon size={13} />
          }
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={uploading}
            onChange={e => insertImage(e.target.files?.[0])}
          />
        </label>

        {/* HR */}
        <Btn onClick={() => exec('insertHorizontalRule')} title="Horizontal rule"><Minus size={13} /></Btn>
      </div>

      {/* Link input bar */}
      {showLink && (
        <div className="flex items-center gap-2 px-3 py-2 border-b border-[#21326c]/10 bg-[#21326c]/[0.02]">
          <Link size={12} className="text-[#21326c]/35 flex-shrink-0" />
          <input
            type="url"
            value={linkUrl}
            onChange={e => setLinkUrl(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter')  { e.preventDefault(); insertLink(); }
              if (e.key === 'Escape') setShowLink(false);
            }}
            placeholder="https://example.com"
            autoFocus
            className="flex-1 text-sm bg-transparent outline-none text-[#21326c] placeholder:text-[#21326c]/28"
          />
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); insertLink(); }}
            className="px-3 py-1 rounded-lg text-white text-xs font-semibold hover:opacity-90 flex-shrink-0"
            style={{ background: '#21326c' }}
          >
            Insert
          </button>
          <button
            type="button"
            onClick={() => setShowLink(false)}
            className="p-1 rounded hover:bg-[#21326c]/10 text-[#21326c]/35 flex-shrink-0"
          >
            <X size={12} />
          </button>
        </div>
      )}

      {/* Editable canvas */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={notify}
        onClick={() => setShowColors(false)}
        data-placeholder="Start writing your article here…"
        className="rich-editor min-h-[300px] px-5 py-4 text-sm leading-relaxed focus:outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-[#21326c]/22 empty:before:pointer-events-none"
      />
    </div>
  );
}

// ─── ARTICLE BODY BLOCK ──────────────────────────────────────────────────────
export function ArticleBodyBlock({ block }) {
  // Rich HTML stored by the new editor
  if (block.type === 'html') {
    return (
      <div
        className="rich-content"
        dangerouslySetInnerHTML={{ __html: block.html || '' }}
      />
    );
  }
  // Legacy block types (backward compat)
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

// ─── NEWS PAGE ────────────────────────────────────────────────────────────────
export function NewsPage({ newsPosts, currentUser, refreshNews }) {
  const isAdmin = currentUser?.role === 'admin';

  const [selectedArticle, setSelectedArticle] = useState(null);
  const [showModal, setShowModal]             = useState(false);
  const [editingPost, setEditingPost]         = useState(null);
  const [deleteConfirm, setDeleteConfirm]     = useState(null);
  const [saving, setSaving]                   = useState(false);

  const [form, setForm] = useState(EMPTY_NEWS_FORM);

  const openCreate = () => { setForm(EMPTY_NEWS_FORM); setEditingPost(null); setShowModal(true); };

  const openEdit = post => {
    setForm({
      title:    post.title,
      excerpt:  post.excerpt,
      bodyHtml: bodyToHtml(post.body),
      category: post.category,
      readTime: post.readTime,
      color:    post.color,
    });
    setEditingPost(post);
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setEditingPost(null); };

  const handleSave = async () => {
    if (!form.title.trim() || !form.excerpt.trim() || saving) return;
    const body    = htmlToBody(form.bodyHtml);
    const payload = {
      title:    form.title,
      excerpt:  form.excerpt,
      body,
      category: form.category,
      readTime: form.readTime,
      color:    form.color,
    };
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
      toast.error(`Couldn't save article: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async id => {
    try {
      await newsApi.delete(id);
      await refreshNews?.();
    } catch (err) {
      toast.error(`Couldn't delete: ${err.message}`);
    }
    setDeleteConfirm(null);
    if (selectedArticle?.id === id) setSelectedArticle(null);
  };

  // ── ARTICLE READER ──
  if (selectedArticle) {
    const post = newsPosts.find(p => p.id === selectedArticle.id) || selectedArticle;
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
        <button
          onClick={() => setSelectedArticle(null)}
          className="flex items-center gap-1.5 text-sm text-[#21326c] hover:opacity-70 transition-opacity mb-8"
        >
          <ChevronLeft size={16} /> Back to News
        </button>

        <div
          className="h-2 rounded-full mb-8"
          style={{ background: `linear-gradient(90deg, ${post.color}, ${post.color}66)` }}
        />

        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: `${post.color}15`, color: post.color }}>
            {post.category}
          </span>
          <span className="text-xs text-[#21326c]/50">{post.readTime}</span>
        </div>

        <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#21326c] leading-tight mb-4">
          {post.title}
        </h1>

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

        <div className="prose-lawnn">
          <p className="text-lg font-medium text-[#21326c] leading-relaxed mb-6 opacity-80">{post.excerpt}</p>
          {(post.body || []).map((block, i) => (
            <ArticleBodyBlock key={i} block={block} />
          ))}
          {(!post.body || post.body.length === 0) && (
            <p className="text-[#21326c]/40 italic text-sm">No article body has been written yet.</p>
          )}
        </div>

        <div className="mt-12 pt-8 border-t border-[#21326c]/10 flex items-center justify-between">
          <span className="text-xs text-[#21326c]/40">{post.author} · {post.date}</span>
          <button
            onClick={() => setSelectedArticle(null)}
            className="text-xs font-semibold text-[#21326c] flex items-center gap-1 hover:opacity-70 transition-opacity"
          >
            <ChevronLeft size={12} /> All articles
          </button>
        </div>

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
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#21326c] mb-1">News &amp; Insights</h1>
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

      <Modal open={showModal} onClose={closeModal} title={editingPost ? 'Edit Article' : 'Write New Article'} wide>
        <NewsArticleForm form={form} setForm={setForm} onSave={handleSave} editingPost={editingPost} saving={saving} />
      </Modal>
    </div>
  );
}

// ─── ARTICLE FORM with rich text editor ──────────────────────────────────────
export function NewsArticleForm({ form, setForm, onSave, editingPost, saving }) {
  return (
    <div className="space-y-5">
      <div>
        <label className="block text-xs font-semibold text-[#21326c] uppercase tracking-wider mb-1.5">Title *</label>
        <input
          type="text"
          placeholder="Article title"
          value={form.title}
          onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          className="w-full px-4 py-3 rounded-xl border border-[#21326c]/20 text-[#21326c] text-sm focus:ring-2 focus:ring-[#21326c]/25 focus:border-[#21326c]/40 transition-all placeholder:text-[#21326c]/30"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-[#21326c] uppercase tracking-wider mb-1.5">
          Excerpt * <span className="font-normal normal-case text-[#21326c]/40">— shown on the news card</span>
        </label>
        <textarea
          rows={2}
          placeholder="Short summary shown on the listing card…"
          value={form.excerpt}
          onChange={e => setForm(f => ({ ...f, excerpt: e.target.value }))}
          className="w-full px-4 py-3 rounded-xl border border-[#21326c]/20 text-[#21326c] text-sm focus:ring-2 focus:ring-[#21326c]/25 focus:border-[#21326c]/40 transition-all resize-none placeholder:text-[#21326c]/30"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-[#21326c] uppercase tracking-wider mb-1.5">
          Article Body *
        </label>
        <RichTextEditor
          value={form.bodyHtml || ''}
          onChange={html => setForm(f => ({ ...f, bodyHtml: html }))}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-[#21326c] uppercase tracking-wider mb-1.5">Category</label>
          <select
            value={form.category}
            onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
            className="w-full px-3 py-3 rounded-xl border border-[#21326c]/20 text-[#21326c] text-sm focus:ring-2 focus:ring-[#21326c]/25 transition-all"
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
            className="w-full px-4 py-3 rounded-xl border border-[#21326c]/20 text-[#21326c] text-sm focus:ring-2 focus:ring-[#21326c]/25 transition-all placeholder:text-[#21326c]/30"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-[#21326c] uppercase tracking-wider mb-1.5">Card Colour</label>
        <div className="flex gap-2">
          {NEWS_COLORS.map(c => (
            <button
              key={c}
              type="button"
              onClick={() => setForm(f => ({ ...f, color: c }))}
              className="w-8 h-8 rounded-lg transition-transform hover:scale-110"
              style={{
                background: c,
                outline: form.color === c ? `3px solid ${c}` : 'none',
                outlineOffset: '2px',
              }}
            />
          ))}
        </div>
      </div>

      <button
        onClick={onSave}
        disabled={saving || !form.title.trim() || !form.excerpt.trim() || isBodyEmpty(form.bodyHtml)}
        className="w-full py-3 rounded-xl font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ background: '#ff9044' }}
      >
        {saving ? 'Saving…' : editingPost ? 'Save Changes' : 'Publish Article'}
      </button>
    </div>
  );
}

// ─── VIEW: MARKETPLACE ───────────────────────────────────────────────────────
