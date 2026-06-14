import { useState } from 'react';
import { Camera, Clock, ExternalLink, GraduationCap, Hash, Heart, MoreHorizontal, Play, Share2, Shield, Trash2, Video, X } from 'lucide-react';
import { feed as feedApi, uploadFile } from '../lib/api.js';
import { Avatar } from '../components/ui.jsx';
import { useBusy } from '../hooks/useBusy.js';

export function FeedPage({ feedPosts, setFeedPosts, pendingFeedPosts, setPendingFeedPosts, currentUser, refreshFeed }) {
  const [newPost, setNewPost]         = useState('');
  const [submitBanner, setSubmitBanner] = useState(false); // pending success banner
  const [sharing, runShare]           = useBusy();         // guards spam-clicks on Submit
  const [imageFile, setImageFile]     = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const clearImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview(null);
  };

  const isStudent = currentUser?.role === 'student';
  const isClient  = currentUser?.role === 'client';
  const isAdmin   = currentUser?.role === 'admin';

  // Optimistic toggle, then reconcile with the server's authoritative count.
  const toggleLike = async id => {
    setFeedPosts(ps => ps.map(p =>
      p.id === id ? { ...p, liked: !p.liked, likes: p.likes + (p.liked ? -1 : 1) } : p
    ));
    try {
      const res = await feedApi.like(id);
      setFeedPosts(ps => ps.map(p =>
        p.id === id ? { ...p, liked: res.liked, likes: res.likes } : p
      ));
    } catch (err) {
      console.warn('[feed] like failed:', err.message);
    }
  };

  const handleShare = () => runShare(async () => {
    if (!newPost.trim() && !imageFile) return;
    try {
      let imageUrl = null;
      if (imageFile) {
        const up = await uploadFile(imageFile, 'feed');
        imageUrl = up.url;
      }
      await feedApi.create({
        content:  newPost.trim(),
        tags:     newPost.match(/#\w+/g) || [],
        imageUrl,
      });
      await refreshFeed?.();   // admin posts appear instantly; others stay pending
      setNewPost('');
      clearImage();
      setSubmitBanner(true);
      setTimeout(() => setSubmitBanner(false), 4000);
    } catch (e) {
      alert(`Couldn't post: ${e.message}`);
    }
  });

  const approvePost = async post => {
    try { await feedApi.setStatus(post.id, 'approved'); await refreshFeed?.(); }
    catch (e) { alert(`Couldn't approve: ${e.message}`); }
  };

  const rejectPost = async id => {
    try { await feedApi.delete(id); await refreshFeed?.(); }
    catch (e) { alert(`Couldn't reject: ${e.message}`); }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      <div className="mb-8">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#21326c] mb-1">Student Feed</h1>
        <p className="text-[#21326c] text-sm">Follow the creative process — <span className="font-semibold">#WIP</span> work from Egypt's top talents</p>
      </div>

      {/* Admin: pending approval queue */}
      {isAdmin && pendingFeedPosts.length > 0 && (
        <div className="mb-6 rounded-2xl border border-[#db9630]/40 overflow-hidden" style={{ background: '#fffcf4' }}>
          <div className="flex items-center gap-2 px-5 py-3 border-b border-[#db9630]/20" style={{ background: '#fdf0d3' }}>
            <Clock size={14} style={{ color: '#db9630' }} />
            <span className="text-sm font-semibold text-[#21326c]">Pending Review</span>
            <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ background: '#db9630' }}>
              {pendingFeedPosts.length}
            </span>
          </div>
          <div className="divide-y divide-[#21326c]/5">
            {pendingFeedPosts.map(post => (
              <div key={post.id} className="p-4 flex items-start gap-3">
                <Avatar initials={post.initials} color={post.authorColor} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-[#21326c]">{post.author}</p>
                  <p className="text-sm text-[#21326c] mt-1 leading-relaxed line-clamp-2">{post.content}</p>
                </div>
                <div className="flex gap-2 flex-shrink-0 mt-0.5">
                  <button
                    onClick={() => approvePost(post)}
                    className="px-3 py-1 rounded-full text-xs font-semibold text-white transition-all hover:opacity-90"
                    style={{ background: '#21326c' }}
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => rejectPost(post.id)}
                    className="px-3 py-1 rounded-full text-xs font-semibold border border-[#21326c]/20 text-[#21326c] hover:bg-[#21326c]/5 transition-colors"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Compose — students and clients */}
      {(isStudent || isClient) && (
        <>
          {submitBanner && (
            <div className="mb-4 flex items-start gap-2 px-4 py-3 rounded-xl text-sm text-[#21326c] animate-fade-in" style={{ background: '#fdf0d3', border: '1px solid #e4ae50' }}>
              <Clock size={15} className="mt-0.5 flex-shrink-0" style={{ color: '#db9630' }} />
              <span><strong>Your post is pending review.</strong> It will appear in the feed once approved by the Lawnn team.</span>
            </div>
          )}
          <div className="bg-white rounded-2xl border border-[#21326c]/10 p-4 mb-6">
            <div className="flex gap-3">
              <Avatar initials={currentUser.initials} color={currentUser.avatarColor} size="md" />
              <div className="flex-1">
                <textarea
                  rows={2}
                  placeholder="Share your work in progress… #WIP"
                  value={newPost}
                  onChange={e => setNewPost(e.target.value)}
                  className="w-full text-[#21326c] text-sm resize-none border-0 focus:outline-none placeholder:text-[#21326c]/50 bg-transparent"
                />
                <input type="file" accept="image/*" id="feed-img-upload" className="hidden" onChange={e => { const f = e.target.files[0]; if (f) { if (imagePreview) URL.revokeObjectURL(imagePreview); setImageFile(f); setImagePreview(URL.createObjectURL(f)); } e.target.value = ''; }} />
                <input type="file" accept="video/*" id="feed-vid-upload" className="hidden" onChange={e => { if (e.target.files[0]) setNewPost(p => p + ` [Video: ${e.target.files[0].name}]`); }} />
                {imagePreview && (
                  <div className="relative mt-2 inline-block">
                    <img src={imagePreview} alt="Selected" className="max-h-48 rounded-xl border border-[#21326c]/10" />
                    <button onClick={clearImage} title="Remove image" className="absolute top-1 right-1 bg-white/90 rounded-full p-1 text-[#21326c] hover:bg-white shadow-sm">
                      <X size={14} />
                    </button>
                  </div>
                )}
                <div className="flex items-center justify-between pt-3 border-t border-[#21326c]/10">
                  <div className="flex gap-2">
                    <button onClick={() => document.getElementById('feed-img-upload').click()} title="Attach image" className="p-2 rounded-lg hover:bg-[#21326c]/5 text-[#21326c] transition-colors"><Camera size={16} /></button>
                    <button onClick={() => document.getElementById('feed-vid-upload').click()} title="Attach video" className="p-2 rounded-lg hover:bg-[#21326c]/5 text-[#21326c] transition-colors"><Video size={16} /></button>
                    <button onClick={() => setNewPost(p => p ? p + ' #' : '#')} title="Add hashtag" className="p-2 rounded-lg hover:bg-[#21326c]/5 text-[#21326c] transition-colors"><Hash size={16} /></button>
                  </div>
                  <button
                    onClick={handleShare}
                    disabled={sharing || (!newPost.trim() && !imageFile)}
                    className="px-4 py-1.5 rounded-full text-sm font-semibold text-white disabled:opacity-40 transition-all hover:opacity-90"
                    style={{ background: '#ff9044' }}
                  >
                    {sharing ? 'Submitting…' : 'Submit for Review'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Guest / client: sign-in nudge */}
      {!currentUser && (
        <div className="bg-white rounded-2xl border border-[#21326c]/10 p-5 mb-6 text-center text-sm text-[#21326c]">
          <GraduationCap size={20} className="mx-auto mb-2 opacity-30" />
          <p>Sign in as a student to post your work to the feed.</p>
        </div>
      )}

      {/* Feed */}
      <div className="space-y-5">
        {feedPosts.map(post => (
          <FeedPost
            key={post.id}
            post={post}
            onLike={() => toggleLike(post.id)}
            isAdmin={isAdmin}
            onDelete={id => setFeedPosts(ps => ps.filter(p => p.id !== id))}
          />
        ))}
      </div>
    </div>
  );
}

export function FeedPost({ post, onLike, isAdmin, onDelete }) {
  const [copied, setCopied] = useState(false);
  const [showMore, setShowMore] = useState(false);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="feed-card bg-white rounded-2xl border border-[#21326c]/10 overflow-hidden">
      {/* Header */}
      <div className="p-5 pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar initials={post.initials} color={post.authorColor} size="md" />
            <div>
              <p className="font-semibold text-[#21326c] text-sm">{post.author}</p>
              <p className="text-xs text-[#21326c]">{post.university} · {post.time}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {isAdmin && (
              <button
                onClick={() => onDelete(post.id)}
                className="p-2 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors"
                title="Delete post"
              >
                <Trash2 size={14} />
              </button>
            )}
            <div className="relative">
              <button onClick={() => setShowMore(v => !v)} className="p-2 rounded-lg hover:bg-[#21326c]/5 text-[#21326c] transition-colors">
                <MoreHorizontal size={16} />
              </button>
              {showMore && (
                <div className="absolute right-0 top-9 bg-white rounded-xl border border-[#21326c]/10 shadow-lg w-40 overflow-hidden z-50 animate-fade-in">
                  <button onClick={() => { navigator.clipboard.writeText(window.location.href).catch(()=>{}); setShowMore(false); }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-[#21326c] hover:bg-[#21326c]/5 transition-colors text-left">
                    <ExternalLink size={13} /> Copy link
                  </button>
                  <button onClick={() => setShowMore(false)}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-[#21326c] hover:bg-[#21326c]/5 transition-colors text-left">
                    <Shield size={13} /> Report post
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <p className="text-sm text-[#21326c] leading-relaxed mt-3 mb-2">{post.content}</p>

        <div className="flex flex-wrap gap-1.5 mb-3">
          {post.tags.map(tag => (
            <span key={tag} className="text-xs font-medium text-[#21326c] cursor-pointer hover:underline">{tag}</span>
          ))}
        </div>
      </div>

      {/* Image / Video — only when the post actually has media */}
      {(post.imageUrl || post.hasVideo) && (
        <div className="relative mx-5 mb-4 rounded-xl overflow-hidden">
          {post.imageUrl ? (
            <img src={post.imageUrl} alt="" className="w-full max-h-96 object-cover" />
          ) : (
            <div className="h-52 flex items-center justify-center" style={{ background: `linear-gradient(160deg, ${post.imageColor}aa, ${post.imageColor})` }}>
              <span className="text-white font-medium text-sm bg-black/20 px-3 py-1.5 rounded-lg">{post.imageLabel}</span>
            </div>
          )}
          {post.hasVideo && (
            <button onClick={() => alert('Video playback requires a media server. Coming soon.')} className="absolute inset-0 flex items-center justify-center">
              <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg hover:scale-105 transition-transform">
                <Play size={20} fill="#21326c" color="#21326c" />
              </div>
            </button>
          )}
          {post.hasVideo && (
            <span className="absolute top-3 right-3 text-xs font-semibold bg-red-500 text-white px-2 py-0.5 rounded-full flex items-center gap-1">
              <Play size={10} fill="white" /> Tutorial
            </span>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="px-5 pb-4">
        {post.likes > 0 && (
          <div className="flex items-center gap-1.5 mb-3">
            <Heart size={12} fill="#ef4444" className="text-red-500" />
            <span className="text-xs text-[#21326c]">{post.likes} {post.likes === 1 ? 'like' : 'likes'}</span>
          </div>
        )}

        <div className="flex items-center gap-1 border-t border-[#21326c]/10 pt-3">
          <button
            onClick={onLike}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex-1 justify-center ${
              post.liked ? 'text-red-500 bg-red-50' : 'text-[#21326c] hover:bg-[#21326c]/5'
            }`}
          >
            <Heart size={16} fill={post.liked ? '#ef4444' : 'none'} />
            {post.liked ? 'Liked' : 'Like'}
          </button>
          <button onClick={handleShare} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-[#21326c] hover:bg-[#21326c]/5 transition-colors flex-1 justify-center">
            <Share2 size={16} /> {copied ? 'Copied!' : 'Share'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── VIEW 6: CHAT ─────────────────────────────────────────────────────────────
