import { toast } from '../lib/toast.js';
import { useState, useRef, useEffect, useCallback } from 'react';
import { CheckCircle, ChevronLeft, File as FileIcon, Lock, MessageSquare, MessageSquareText, Paperclip, Search, Send, Shield, X } from 'lucide-react';
import { conversations as convApi, uploadFile } from '../lib/api.js';
import { getSocket } from '../lib/socket.js';
import { Avatar } from '../components/ui.jsx';
import { AdminStartConversation } from './AdminPage.jsx';

export function ChatPage({ currentUser }) {
  const [convos, setConvos]             = useState([]);
  const [activeConvo, setActiveConvo]   = useState(null);
  const [messages, setMessages]         = useState([]);
  const [message, setMessage]           = useState('');
  const [typingUsers, setTypingUsers]   = useState({});   // { userId: true }
  const [showSidebar, setShowSidebar]   = useState(true);
  const [showEncryptionInfo, setShowEncryptionInfo] = useState(false);
  const [loadingConvos, setLoadingConvos] = useState(true);
  const [loadingMsgs, setLoadingMsgs]   = useState(false);
  const [searchQ, setSearchQ]           = useState('');
  const messagesEndRef                  = useRef(null);
  const typingTimerRef                  = useRef(null);
  const textareaRef                     = useRef(null);

  const isAdmin = currentUser?.role === 'admin';

  // ── Load conversation list ────────────────────────────────────────────────
  const loadConvos = useCallback((selectId) => {
    return convApi.list().then(data => {
      setConvos(data);
      if (selectId) {
        const found = data.find(c => c.id === selectId);
        if (found) setActiveConvo(found);
      } else {
        setActiveConvo(prev => prev || (data.length > 0 ? data[0] : null));
      }
    }).catch(console.error).finally(() => setLoadingConvos(false));
  }, []);
  useEffect(() => { loadConvos(); }, [loadConvos]);

  // Admin starts a new DM (or a user opens support): join its socket room,
  // reload the list, open it.
  const handleStartConversation = useCallback(async (conv) => {
    if (!conv) return;
    getSocket()?.emit('join_conversation', { conversationId: conv.id });
    await loadConvos(conv.id);
    setShowSidebar(true);
  }, [loadConvos]);

  const [supportBusy, setSupportBusy] = useState(false);
  const handleContactSupport = useCallback(async () => {
    setSupportBusy(true);
    try {
      const conv = await convApi.support();
      await handleStartConversation(conv);
    } catch (e) {
      toast.error(`Couldn't reach support: ${e.message}`);
    } finally {
      setSupportBusy(false);
    }
  }, [handleStartConversation]);

  // ── Load messages when active convo changes ───────────────────────────────
  useEffect(() => {
    if (!activeConvo) return;
    // Join this conversation's realtime room on open — covers conversations
    // created after the socket connected (e.g. started from a marketplace
    // listing), which otherwise wouldn't receive live messages.
    getSocket()?.emit('join_conversation', { conversationId: activeConvo.id });
    setLoadingMsgs(true);
    convApi.messages(activeConvo.id).then(msgs => {
      setMessages(msgs);
      // Mark as read
      const socket = getSocket();
      if (socket && amParticipant(activeConvo)) socket.emit('mark_read', { conversationId: activeConvo.id });
      // Clear unread badge
      setConvos(prev => prev.map(c => c.id === activeConvo.id ? { ...c, unreadCount: 0 } : c));
    }).catch(console.error).finally(() => setLoadingMsgs(false));
  }, [activeConvo?.id]);

  // ── Auto-scroll to bottom ─────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Socket event listeners ────────────────────────────────────────────────
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleMessage = (msg) => {
      // If it's for the active conversation, append it
      if (msg.conversationId === activeConvo?.id) {
        setMessages(prev => [...prev, msg]);
        // Mark it read immediately if we're looking at it
        if (amParticipant(activeConvo)) socket.emit('mark_read', { conversationId: msg.conversationId });
      } else {
        // Bump unread count for the other conversation
        setConvos(prev => prev.map(c =>
          c.id === msg.conversationId
            ? { ...c, unreadCount: (c.unreadCount || 0) + 1, messages: [msg] }
            : c
        ));
      }
      // Always move that conversation to the top of the list
      setConvos(prev => {
        const idx = prev.findIndex(c => c.id === msg.conversationId);
        if (idx < 0) return prev;
        const updated = [...prev];
        updated[idx] = { ...updated[idx], updatedAt: msg.createdAt };
        updated.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        return updated;
      });
    };

    const handleTyping = ({ userId, isTyping }) => {
      setTypingUsers(prev => {
        const next = { ...prev };
        if (isTyping) next[userId] = true;
        else delete next[userId];
        return next;
      });
    };

    const handleMessagesRead = ({ conversationId }) => {
      if (conversationId === activeConvo?.id) {
        setMessages(prev => prev.map(m => m.readAt ? m : { ...m, readAt: new Date().toISOString() }));
      }
    };

    socket.on('message', handleMessage);
    socket.on('typing', handleTyping);
    socket.on('messages_read', handleMessagesRead);

    return () => {
      socket.off('message', handleMessage);
      socket.off('typing', handleTyping);
      socket.off('messages_read', handleMessagesRead);
    };
  }, [activeConvo?.id, isAdmin]);

  // ── Send message ──────────────────────────────────────────────────────────
  const sendMessage = useCallback(() => {
    const socket = getSocket();
    if (!message.trim() || !activeConvo || !socket || !amParticipant(activeConvo)) return;
    socket.emit('send_message', { conversationId: activeConvo.id, content: message.trim() });
    setMessage('');
    textareaRef.current?.focus();
  }, [message, activeConvo, isAdmin]);

  // Attach a file — uploads privately, then sends it as a message attachment.
  const [attaching, setAttaching] = useState(false);
  const attachFile = useCallback(async (fileList) => {
    const f = fileList?.[0];
    const socket = getSocket();
    if (!f || !activeConvo || !socket || !amParticipant(activeConvo)) return;
    setAttaching(true);
    try {
      const r = await uploadFile(f, 'chat');
      socket.emit('send_message', {
        conversationId: activeConvo.id,
        content: message.trim() || `Shared a file: ${f.name}`,
        fileUrl: r.path, fileName: f.name, fileMime: f.type,
      });
      setMessage('');
    } catch (e) {
      toast.error(`Upload failed: ${e.message}`);
    } finally {
      setAttaching(false);
    }
  }, [activeConvo, message]);

  // ── Typing indicator ──────────────────────────────────────────────────────
  const handleTyping = () => {
    const socket = getSocket();
    if (!socket || !activeConvo || !amParticipant(activeConvo)) return;
    socket.emit('typing', { conversationId: activeConvo.id, isTyping: true });
    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      socket.emit('typing', { conversationId: activeConvo.id, isTyping: false });
    }, 2000);
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  // True when the current user is an actual participant (client, student, or the
  // admin on an admin-initiated thread) — vs. an admin merely observing.
  const amParticipant = (conv) =>
    !!conv && !!currentUser && [conv.clientId, conv.talentId, conv.adminId].includes(currentUser.id);

  const getContact = (conv) => {
    if (!conv) return null;
    if (!currentUser) return conv.client || conv.talent || conv.admin;
    if (currentUser.id === conv.adminId)  return conv.talent || conv.client;
    if (currentUser.id === conv.clientId) return conv.talent || conv.admin;
    if (currentUser.id === conv.talentId) return conv.client || conv.admin;
    return conv.client || conv.talent || conv.admin; // admin observing others
  };

  const formatTime = (iso) => {
    const d = new Date(iso);
    const now = new Date();
    const diffDays = Math.floor((now - d) / 86400000);
    if (diffDays === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return d.toLocaleDateString([], { weekday: 'short' });
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const filteredConvos = convos.filter(c => {
    if (!searchQ) return true;
    const contact = getContact(c);
    return contact?.name?.toLowerCase().includes(searchQ.toLowerCase())
      || c.project?.title?.toLowerCase().includes(searchQ.toLowerCase());
  });

  const typingNames = Object.keys(typingUsers).length > 0 ? 'typing…' : null;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 animate-fade-in">

      {isAdmin
        ? <AdminStartConversation onStarted={handleStartConversation} />
        : (
          <div className="flex justify-end mb-4">
            <button
              onClick={handleContactSupport}
              disabled={supportBusy}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold border border-[#21326c]/20 text-[#21326c] hover:bg-[#21326c]/5 transition-colors disabled:opacity-50"
            >
              <MessageSquareText size={14} /> {supportBusy ? 'Opening…' : 'Contact support'}
            </button>
          </div>
        )}

      {!loadingConvos && convos.length === 0 && (
        <div className="bg-white rounded-2xl border border-[#21326c]/10 p-14 text-center">
          <MessageSquare size={40} className="mx-auto mb-4 text-[#21326c] opacity-20" />
          <p className="font-semibold text-[#21326c] mb-1">No conversations yet</p>
          <p className="text-sm text-[#21326c]/50 max-w-xs mx-auto mb-4">
            {currentUser?.role === 'student'
              ? 'Once a client contacts you, conversations will appear here. Need help? Contact an admin anytime.'
              : isAdmin
              ? 'All conversations will appear here.'
              : 'Message a talent from their profile, or reach an admin with Contact support.'}
          </p>
          {!isAdmin && (
            <button
              onClick={handleContactSupport}
              disabled={supportBusy}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
              style={{ background: '#ff9044' }}
            >
              <MessageSquareText size={14} /> {supportBusy ? 'Opening…' : 'Contact support'}
            </button>
          )}
        </div>
      )}

      {(loadingConvos || convos.length > 0) && (
        <div className="bg-white rounded-2xl border border-[#21326c]/10 overflow-hidden" style={{ height: 'calc(100dvh - 130px)', minHeight: '480px' }}>
          <div className="flex h-full">

            {/* ── Sidebar ─────────────────────────────────────────────────── */}
            <div className={`${showSidebar ? 'flex' : 'hidden'} sm:flex flex-col w-full sm:w-72 border-r border-[#21326c]/10 flex-shrink-0`}>
              <div className="p-4 border-b border-[#21326c]/10">
                <h2 className="font-semibold text-[#21326c] mb-3">Messages</h2>
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#21326c]/40" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQ}
                    onChange={e => setSearchQ(e.target.value)}
                    className="w-full pl-8 pr-4 py-2 text-sm rounded-full bg-[#21326c]/5 text-[#21326c] placeholder:text-[#21326c]/40 focus:outline-none"
                  />
                </div>
              </div>
              <div className="overflow-y-auto flex-1">
                {loadingConvos && (
                  <p className="text-center text-xs text-[#21326c]/40 pt-8">Loading…</p>
                )}
                {filteredConvos.map(conv => {
                  const contact = getContact(conv);
                  const lastMsg = conv.messages?.[0];
                  const isActive = activeConvo?.id === conv.id;
                  return (
                    <button
                      key={conv.id}
                      onClick={() => { setActiveConvo(conv); setShowSidebar(false); }}
                      className="w-full flex items-center gap-3 p-4 hover:bg-[#21326c]/5 transition-colors text-left"
                      style={isActive ? { borderLeft: '3px solid #21326c', background: '#21326c0a' } : {}}
                    >
                      <div className="relative flex-shrink-0">
                        <Avatar
                          initials={contact?.initials || '?'}
                          color={contact?.avatarColor || '#21326c'}
                          imageUrl={contact?.profile?.avatar}
                          size="md"
                        />
                        {conv.unreadCount > 0 && (
                          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-white text-[10px] font-bold flex items-center justify-center" style={{ background: '#ff9044' }}>
                            {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <p className="text-sm font-semibold text-[#21326c] truncate">{contact?.name || '—'}</p>
                          {lastMsg && <span className="text-xs text-[#21326c]/40 flex-shrink-0 ml-1">{formatTime(lastMsg.createdAt)}</span>}
                        </div>
                        <p className="text-xs text-[#21326c]/50 truncate">
                          {lastMsg ? lastMsg.content : (conv.project?.title || 'New conversation')}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── Chat area ───────────────────────────────────────────────── */}
            {activeConvo && (
              <div className={`${!showSidebar ? 'flex' : 'hidden'} sm:flex flex-col flex-1 min-w-0`}>
                {/* Header */}
                <div className="flex items-center gap-3 p-4 border-b border-[#21326c]/10">
                  <button onClick={() => setShowSidebar(true)} className="sm:hidden p-1 rounded-lg hover:bg-[#21326c]/5">
                    <ChevronLeft size={18} className="text-[#21326c]" />
                  </button>
                  {(() => {
                    const contact = getContact(activeConvo);
                    return (
                      <>
                        <Avatar initials={contact?.initials || '?'} color={contact?.avatarColor || '#21326c'} imageUrl={contact?.profile?.avatar} size="md" />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-[#21326c] text-sm">{contact?.name || '—'}</p>
                          <p className="text-xs text-[#21326c]/50 truncate">
                            {typingNames ? <span className="italic text-[#ff9044]">{typingNames}</span> : (activeConvo.project ? `re: ${activeConvo.project.title}` : 'Direct message')}
                          </p>
                        </div>
                      </>
                    );
                  })()}
                  <div className="relative flex-shrink-0">
                    <button onClick={() => setShowEncryptionInfo(v => !v)} className="p-2 rounded-lg hover:bg-[#21326c]/5 text-[#21326c] transition-colors" title="Security info">
                      <Shield size={16} />
                    </button>
                    {showEncryptionInfo && (
                      <div className="absolute right-0 top-12 bg-white rounded-xl border border-[#21326c]/10 shadow-xl w-72 p-4 z-50 animate-fade-in">
                        <div className="flex items-center gap-2 mb-2">
                          <Shield size={16} className="text-[#21326c]" />
                          <p className="font-semibold text-[#21326c] text-sm">Encrypted & Monitored</p>
                          <button onClick={() => setShowEncryptionInfo(false)} className="ml-auto text-[#21326c]/30 hover:text-[#21326c]"><X size={14} /></button>
                        </div>
                        <p className="text-xs text-[#21326c]/70 leading-relaxed">Messages are encrypted in transit. Lawnn admins may monitor conversations for platform safety.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Security notice */}
                <div className="mx-4 mt-3 px-3 py-2 rounded-xl text-xs text-center" style={{ background: '#f0f4ff', color: '#21326c' }}>
                  <Lock size={11} className="inline mr-1" />
                  End-to-end encrypted · Admin-monitored for safety
                  {!amParticipant(activeConvo) && <span className="ml-2 font-semibold">(Read-only)</span>}
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {loadingMsgs && <p className="text-center text-sm text-[#21326c]/40 pt-8">Loading messages…</p>}
                  {!loadingMsgs && messages.length === 0 && (
                    <p className="text-center text-sm text-[#21326c]/40 pt-8">No messages yet — say hello!</p>
                  )}
                  {messages.map((msg, i) => {
                    const isMe = msg.senderId === currentUser?.id;
                    const contact = getContact(activeConvo);
                    const showAvatar = !isMe && (i === 0 || messages[i - 1]?.senderId !== msg.senderId);
                    return (
                      <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} items-end gap-2`}>
                        {!isMe && (
                          <div style={{ width: 28, flexShrink: 0 }}>
                            {showAvatar && (
                              <Avatar initials={msg.sender?.initials || '?'} color={msg.sender?.avatarColor || '#21326c'} imageUrl={msg.sender?.profile?.avatar} size="sm" />
                            )}
                          </div>
                        )}
                        <div className={`max-w-xs sm:max-w-sm px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${isMe ? 'bg-[#21326c] text-white rounded-br-sm' : 'bg-[#21326c]/10 text-[#21326c] rounded-bl-sm'}`}>
                          {msg.fileUrl && (
                            (msg.fileMime || '').startsWith('image/') ? (
                              <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" className="block mb-1">
                                <img src={msg.fileUrl} alt={msg.fileName || 'attachment'} className="max-h-44 rounded-lg" />
                              </a>
                            ) : (
                              <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-2 mb-1 underline ${isMe ? 'text-white' : 'text-[#2563eb]'}`}>
                                <FileIcon size={14} /> {msg.fileName || 'Download file'}
                              </a>
                            )
                          )}
                          {msg.content}
                          <div className={`flex items-center gap-1 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <span className={`text-[10px] ${isMe ? 'text-white/50' : 'text-[#21326c]/40'}`}>{formatTime(msg.createdAt)}</span>
                            {isMe && msg.readAt && <CheckCircle size={10} className="text-white/50" />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input — shown only to actual participants (admins can send in
                    their own DMs, but stay read-only when observing others) */}
                {amParticipant(activeConvo) && (
                  <div className="p-4 border-t border-[#21326c]/10">
                    <div className="flex items-end gap-2">
                      <label className="p-2.5 rounded-xl hover:bg-[#21326c]/5 text-[#21326c] cursor-pointer flex-shrink-0" title="Attach a file">
                        <input type="file" accept="image/*,application/pdf" className="hidden" disabled={attaching} onChange={e => { attachFile(e.target.files); e.target.value = ''; }} />
                        <Paperclip size={18} className={attaching ? 'opacity-40' : ''} />
                      </label>
                      <div className="flex-1">
                        <textarea
                          ref={textareaRef}
                          rows={1}
                          value={message}
                          onChange={e => { setMessage(e.target.value); handleTyping(); }}
                          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                          placeholder={attaching ? 'Uploading…' : 'Message…'}
                          className="w-full px-4 py-2.5 rounded-2xl border border-[#21326c]/20 text-[#21326c] text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#21326c] transition-all placeholder:text-[#21326c]/40"
                          style={{ maxHeight: '100px' }}
                        />
                      </div>
                      <button onClick={sendMessage} disabled={!message.trim()} className="p-2.5 rounded-xl text-white transition-all hover:opacity-90 disabled:opacity-40 flex-shrink-0" style={{ background: '#ff9044' }}>
                        <Send size={18} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Placeholder when no active convo on desktop */}
            {!activeConvo && !loadingConvos && (
              <div className="hidden sm:flex flex-col flex-1 items-center justify-center text-center p-8">
                <MessageSquare size={36} className="mb-3 text-[#21326c] opacity-20" />
                <p className="text-sm text-[#21326c]/40">Select a conversation</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── VIEW: ABOUT ME / ABOUT US ───────────────────────────────────────────────
