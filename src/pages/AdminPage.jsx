import { toast } from '../lib/toast.js';
import { useState, useEffect } from 'react';
import { BadgeCheck, Briefcase, CheckCircle, DollarSign, GraduationCap, Grid, Hourglass, Image as ImageIcon, MessageSquareText, Plus, Search, Send, Shield, Tag, Trash2, Upload, UserCheck, Users } from 'lucide-react';
import { admin as adminApi, conversations as convApi, feed as feedApi, marketplace as marketplaceApi, projects as projectsApi, settings as settingsApi, uploadFile } from '../lib/api.js';
import { Avatar, Modal } from '../components/ui.jsx';
import { ChatPage } from './ChatPage.jsx';

export function PendingSection({ title, icon: Icon, color, items, onApprove, onReject, renderItem }) {
  if (items.length === 0) return (
    <div className="bg-white rounded-2xl border border-[#21326c]/10 p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}15` }}>
          <Icon size={15} style={{ color }} />
        </div>
        <h2 className="font-semibold text-[#21326c]">{title}</h2>
        <span className="ml-auto text-xs text-[#21326c]/40">Nothing pending</span>
      </div>
      <p className="text-sm text-[#21326c]/40 text-center py-4">All clear ✓</p>
    </div>
  );

  return (
    <div className="bg-white rounded-2xl border border-[#21326c]/10 overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3 border-b border-[#21326c]/10" style={{ background: `${color}08` }}>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${color}20` }}>
          <Icon size={14} style={{ color }} />
        </div>
        <h2 className="font-semibold text-[#21326c] text-sm">{title}</h2>
        <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ background: color }}>
          {items.length}
        </span>
      </div>
      <div className="divide-y divide-[#21326c]/5">
        {items.map(item => (
          <div key={item.id} className="p-4 flex items-start gap-3">
            <div className="flex-1 min-w-0">{renderItem(item)}</div>
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={() => onApprove(item)}
                className="px-3 py-1 rounded-full text-xs font-semibold text-white hover:opacity-90 transition-all"
                style={{ background: '#21326c' }}
              >
                Approve
              </button>
              <button
                onClick={() => onReject(item.id)}
                className="px-3 py-1 rounded-full text-xs font-semibold border border-[#21326c]/20 text-[#21326c] hover:bg-[#21326c]/5 transition-colors"
              >
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminUsersTab() {
  const [section, setSection]         = useState('students');
  const [students, setStudents]       = useState([]);
  const [clients, setClients]         = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [showCreate, setShowCreate]   = useState(false);
  const [form, setForm]               = useState({ name: '', email: '', password: '', university: '', dept: '', year: '' });
  const [creating, setCreating]       = useState(false);
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState('');

  // Bulk / individual add-by-email
  const [bulkEmails, setBulkEmails]   = useState('');
  const [bulkBusy, setBulkBusy]       = useState(false);
  const [bulkResult, setBulkResult]   = useState(null); // { created:[{email,password}], skipped:[{email,reason}] }

  // Client create flow
  const [showCreateClient, setShowCreateClient] = useState(false);
  const [clientForm, setClientForm]   = useState({ name: '', email: '', password: '' });
  const [creatingClient, setCreatingClient] = useState(false);
  const [clientError, setClientError] = useState('');
  const [clientSuccess, setClientSuccess] = useState('');

  useEffect(() => {
    Promise.all([
      adminApi.listStudents().then(setStudents).catch(() => {}),
      adminApi.listUsers().then(all => setClients(all.filter(u => u.role === 'client'))).catch(() => {}),
    ]).finally(() => setLoadingList(false));
  }, []);

  const handleCreate = async () => {
    if (!form.name || !form.email || !form.password) { setCreateError('Name, email and password are required'); return; }
    setCreating(true); setCreateError('');
    try {
      const student = await adminApi.createStudent({ ...form, year: form.year ? parseInt(form.year) : undefined });
      setStudents(s => [student, ...s]);
      setCreateSuccess(`Account created for ${student.name}. Share these credentials with them: ${form.email} / ${form.password}`);
      setForm({ name: '', email: '', password: '', university: '', dept: '', year: '' });
      setTimeout(() => { setCreateSuccess(''); setShowCreate(false); }, 6000);
    } catch (e) {
      setCreateError(e.message);
    } finally {
      setCreating(false);
    }
  };

  const handleBulkAdd = async () => {
    if (!bulkEmails.trim()) return;
    setBulkBusy(true); setBulkResult(null);
    try {
      const result = await adminApi.bulkAddStudents(bulkEmails);
      setBulkResult(result);
      if (result.created?.length) {
        adminApi.listStudents().then(setStudents).catch(() => {});
        setBulkEmails('');
      }
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBulkBusy(false);
    }
  };

  const [digestBusy, setDigestBusy] = useState(false);
  const handleSendDigest = async () => {
    setDigestBusy(true);
    try {
      const r = await adminApi.runJobDigest();
      if (r?.note) toast.info(r.note);
      else toast.success(`Digest sent to ${r.sent} student${r.sent !== 1 ? 's' : ''} · ${r.jobs} open job${r.jobs !== 1 ? 's' : ''}.`);
    } catch (e) {
      toast.error(`Couldn't send digest: ${e.message}`);
    } finally {
      setDigestBusy(false);
    }
  };

  const handleCreateClient = async () => {
    if (!clientForm.name || !clientForm.email || !clientForm.password) { setClientError('Name, email and password are required'); return; }
    setCreatingClient(true); setClientError('');
    try {
      const client = await adminApi.createClient(clientForm);
      setClients(c => [client, ...c]);
      setClientSuccess(`Client account created. Share these credentials: ${clientForm.email} / ${clientForm.password}`);
      setClientForm({ name: '', email: '', password: '' });
      setTimeout(() => { setClientSuccess(''); setShowCreateClient(false); }, 6000);
    } catch (e) {
      setClientError(e.message);
    } finally {
      setCreatingClient(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Remove ${name}'s account? This cannot be undone.`)) return;
    await adminApi.deleteStudent(id).catch(() => {});
    setStudents(s => s.filter(u => u.id !== id));
  };

  // Which student row is expanded to show their bio/skills/portfolio for review.
  const [expandedId, setExpandedId] = useState(null);

  const handleApprove = async (id) => {
    try {
      await adminApi.approveStudent(id);
      adminApi.listStudents().then(setStudents).catch(() => {});
      toast.success('Student approved — their profile is now live.');
    } catch (e) {
      toast.error(`Couldn't approve: ${e.message}`);
    }
  };

  const handleRejectStudent = async (id) => {
    const reason = window.prompt('Why is this onboarding being rejected? The student will be emailed this reason.');
    if (reason === null) return;            // cancelled
    if (!reason.trim()) { toast.error('A rejection reason is required.'); return; }
    try {
      await adminApi.rejectStudent(id, reason.trim());
      adminApi.listStudents().then(setStudents).catch(() => {});
      toast.success('Student rejected — they were emailed the reason.');
    } catch (e) {
      toast.error(`Couldn't reject: ${e.message}`);
    }
  };

  const handleDeleteClient = async (id, name) => {
    if (!window.confirm(`Remove ${name}'s account? This cannot be undone.`)) return;
    try {
      await adminApi.deleteUser(id);
      setClients(c => c.filter(u => u.id !== id));
    } catch (e) {
      toast.error(e.message);
    }
  };

  // Suspend = block login + kick active sessions + hide their public content.
  // Reversible. Students and clients both.
  const handleSuspend = async (id, name, suspend, isStudent) => {
    const msg = suspend
      ? `Suspend ${name}? They'll be logged out, unable to sign in, and hidden from public view.`
      : `Reinstate ${name}? They'll be able to sign in again and become visible.`;
    if (!window.confirm(msg)) return;
    try {
      const updated = await adminApi.suspendUser(id, suspend);
      const apply = list => list.map(u => u.id === id ? { ...u, suspended: updated.suspended } : u);
      if (isStudent) setStudents(apply); else setClients(apply);
    } catch (e) {
      toast.error(e.message);
    }
  };

  const SuspendButton = ({ user, isStudent }) => (
    <button
      onClick={() => handleSuspend(user.id, user.name, !user.suspended, isStudent)}
      className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
        user.suspended
          ? 'border-[#16a34a]/30 text-[#16a34a] hover:bg-[#16a34a]/5'
          : 'border-[#db9630]/40 text-[#db9630] hover:bg-[#db9630]/5'
      }`}
    >
      {user.suspended ? 'Reinstate' : 'Suspend'}
    </button>
  );

  return (
    <div className="space-y-4">
      {/* Section toggle */}
      <div className="flex gap-1 bg-[#21326c]/5 rounded-xl p-1 w-fit">
        {[{ id: 'students', label: 'Students' }, { id: 'clients', label: 'Clients' }].map(s => (
          <button
            key={s.id}
            onClick={() => setSection(s.id)}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={section === s.id ? { background: '#21326c', color: '#fff' } : { color: '#21326c' }}
          >
            {s.label}
          </button>
        ))}
      </div>

      {section === 'students' && (<>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm text-[#21326c]">{students.length} student{students.length !== 1 ? 's' : ''} registered</p>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleSendDigest}
            disabled={digestBusy}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-white hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: '#21326c' }}
          >
            <Send size={14} /> {digestBusy ? 'Sending…' : 'Send job digest'}
          </button>
          <button
            onClick={() => { setShowCreate(true); setCreateError(''); setCreateSuccess(''); }}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-white hover:opacity-90 transition-all"
            style={{ background: '#ff9044' }}
          >
            <Plus size={14} /> Create Student Account
          </button>
        </div>
      </div>

      {/* Create modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Student Account" wide>
        {createSuccess ? (
          <div className="py-6 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto">
              <CheckCircle size={28} className="text-green-500" />
            </div>
            <p className="font-semibold text-[#21326c]">Account created!</p>
            <div className="text-xs text-left bg-[#21326c]/5 rounded-xl p-4 leading-relaxed text-[#21326c] break-all">
              {createSuccess}
            </div>
            <p className="text-xs text-[#21326c]/50">This message will close automatically.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-xl p-3 text-xs text-[#21326c] leading-relaxed border border-[#21326c]/20" style={{ background: '#21326c08' }}>
              Create an account for a student whose Google Form application you've accepted. Share the email and password with them directly — they'll be prompted to complete their profile on first login.
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-sm font-semibold text-[#21326c] mb-1.5">Full Name *</label>
                <input type="text" placeholder="Student's full name" value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-[#21326c]/20 text-[#21326c] text-sm focus:ring-2 focus:ring-[#21326c] transition-all placeholder:text-[#21326c]/40" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-semibold text-[#21326c] mb-1.5">Email *</label>
                <input type="email" placeholder="student@university.edu.eg" value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-[#21326c]/20 text-[#21326c] text-sm focus:ring-2 focus:ring-[#21326c] transition-all placeholder:text-[#21326c]/40" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-semibold text-[#21326c] mb-1.5">Temporary Password *</label>
                <input type="text" placeholder="They can change this after signing in" value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-[#21326c]/20 text-[#21326c] text-sm focus:ring-2 focus:ring-[#21326c] transition-all placeholder:text-[#21326c]/40" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#21326c] mb-1.5">University</label>
                <input type="text" placeholder="e.g. Helwan University" value={form.university}
                  onChange={e => setForm(f => ({ ...f, university: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-[#21326c]/20 text-[#21326c] text-sm focus:ring-2 focus:ring-[#21326c] transition-all placeholder:text-[#21326c]/40" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#21326c] mb-1.5">Department</label>
                <input type="text" placeholder="e.g. Interior Architecture" value={form.dept}
                  onChange={e => setForm(f => ({ ...f, dept: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-[#21326c]/20 text-[#21326c] text-sm focus:ring-2 focus:ring-[#21326c] transition-all placeholder:text-[#21326c]/40" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#21326c] mb-1.5">Graduation Year</label>
                <input type="number" placeholder="e.g. 2026" value={form.year}
                  onChange={e => setForm(f => ({ ...f, year: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-[#21326c]/20 text-[#21326c] text-sm focus:ring-2 focus:ring-[#21326c] transition-all placeholder:text-[#21326c]/40" />
              </div>
            </div>
            {createError && <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{createError}</p>}
            <button onClick={handleCreate} disabled={creating || !form.name || !form.email || !form.password}
              className="w-full py-3 rounded-xl font-semibold text-white hover:opacity-90 transition-all disabled:opacity-50"
              style={{ background: '#ff9044' }}>
              {creating ? 'Creating…' : 'Create Account & Copy Credentials'}
            </button>
          </div>
        )}
      </Modal>

      {/* Student list */}
      {loadingList ? (
        <p className="text-sm text-[#21326c]/50 py-4 text-center">Loading students…</p>
      ) : students.length === 0 ? (
        <div className="text-center py-12 text-[#21326c]/40">
          <GraduationCap size={32} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">No student accounts yet. Create one above after accepting an application.</p>
        </div>
      ) : (
        students.map(user => {
          const complete = !!(user.profile?.bio?.trim() && (user.profile?.skills?.length > 0) && (user.profile?.portfolio || []).some(p => p.imageUrl || p.pdfUrl));
          return (
          <div key={user.id} className="bg-white rounded-2xl border border-[#21326c]/10 p-4">
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              <Avatar initials={user.initials} color={user.avatarColor} imageUrl={user.profile?.avatar} size="md" />
              <div className="flex-1 min-w-[150px]">
                <p className="font-semibold text-[#21326c] text-sm">{user.name}</p>
                <p className="text-xs text-[#21326c]/60 truncate">{user.email}</p>
                {user.profile?.university && <p className="text-xs text-[#21326c]/40 truncate">{user.profile.university} · {user.profile.dept}</p>}
              </div>
              {user.suspended ? (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: '#db963015', color: '#db9630' }}>Suspended</span>
              ) : user.approved ? (
                <span className="flex items-center gap-1 text-xs text-[#21326c]/50 flex-shrink-0">
                  <BadgeCheck size={13} className="text-[#21326c]" /> Verified Student
                </span>
              ) : complete ? (
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: '#ff904420', color: '#c4622d' }}>Pending review</span>
                  <button onClick={() => handleApprove(user.id)}
                    className="text-xs font-semibold px-3 py-1 rounded-full text-white hover:opacity-90 transition-all"
                    style={{ background: '#16a34a' }}>Approve</button>
                  <button onClick={() => handleRejectStudent(user.id)}
                    className="text-xs font-semibold px-3 py-1 rounded-full hover:opacity-90 transition-all"
                    style={{ background: '#dc262615', color: '#dc2626' }}>Reject</button>
                </div>
              ) : (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: '#21326c10', color: '#21326c99' }}>Onboarding incomplete</span>
              )}
              <button onClick={() => setExpandedId(expandedId === user.id ? null : user.id)}
                className="text-xs font-semibold px-3 py-1 rounded-full border border-[#21326c]/20 text-[#21326c] hover:bg-[#21326c]/5 transition-all flex-shrink-0">
                {expandedId === user.id ? 'Hide' : 'Review'}
              </button>
              <SuspendButton user={user} isStudent={true} />
              <button onClick={() => handleDelete(user.id, user.name)}
                className="flex-shrink-0 text-[#21326c]/20 hover:text-red-400 transition-colors">
                <Trash2 size={15} />
              </button>
            </div>

            {/* Inline review panel: everything the admin needs to judge the profile. */}
            {expandedId === user.id && (
              <div className="mt-4 pt-4 border-t border-[#21326c]/10 space-y-3">
                <div>
                  <p className="text-xs font-semibold text-[#21326c]/50 uppercase tracking-wide mb-1">Bio</p>
                  <p className="text-sm text-[#21326c] leading-relaxed whitespace-pre-line">{user.profile?.bio?.trim() || <span className="italic text-[#21326c]/40">No bio yet</span>}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#21326c]/50 uppercase tracking-wide mb-1">Skills</p>
                  {user.profile?.skills?.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {user.profile.skills.map(s => <span key={s.id || s.skill} className="tag-pill">{s.skill}</span>)}
                    </div>
                  ) : <p className="text-sm italic text-[#21326c]/40">No skills yet</p>}
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#21326c]/50 uppercase tracking-wide mb-1">Portfolio</p>
                  {(user.profile?.portfolio || []).filter(p => p.imageUrl || p.pdfUrl).length > 0 ? (
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                      {user.profile.portfolio.filter(p => p.imageUrl || p.pdfUrl).map(p => (
                        <a key={p.id} href={p.imageUrl || p.pdfUrl} target="_blank" rel="noopener noreferrer"
                          className="block rounded-xl overflow-hidden border border-[#21326c]/15 aspect-square bg-[#21326c]/5 hover:opacity-80 transition-opacity">
                          {p.imageUrl
                            ? <img src={p.imageUrl} alt={p.label || 'portfolio piece'} className="w-full h-full object-cover" />
                            : <span className="w-full h-full flex items-center justify-center text-[10px] text-[#21326c]/60 px-1 text-center break-all">{p.pdfName || p.label || 'PDF'}</span>}
                        </a>
                      ))}
                    </div>
                  ) : <p className="text-sm italic text-[#21326c]/40">No portfolio uploads yet</p>}
                </div>
              </div>
            )}
          </div>
          );
        })
      )}
      </>)}

      {section === 'clients' && (<>
      <div className="flex items-center justify-between">
        <p className="text-sm text-[#21326c]">{clients.length} client{clients.length !== 1 ? 's' : ''}</p>
        <button
          onClick={() => { setShowCreateClient(true); setClientError(''); setClientSuccess(''); }}
          className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-white hover:opacity-90 transition-all"
          style={{ background: '#ff9044' }}
        >
          <Plus size={14} /> Create Client Account
        </button>
      </div>

      {/* Create client modal */}
      <Modal open={showCreateClient} onClose={() => setShowCreateClient(false)} title="Create Client Account">
        {clientSuccess ? (
          <div className="py-6 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto">
              <CheckCircle size={28} className="text-green-500" />
            </div>
            <p className="font-semibold text-[#21326c]">Account created!</p>
            <div className="text-xs text-left bg-[#21326c]/5 rounded-xl p-4 leading-relaxed text-[#21326c] break-all">
              {clientSuccess}
            </div>
            <p className="text-xs text-[#21326c]/50">This message will close automatically.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-xl p-3 text-xs text-[#21326c] leading-relaxed border border-[#21326c]/20" style={{ background: '#21326c08' }}>
              Create an account for a client. Share the email and password with them directly — they can change it after signing in.
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#21326c] mb-1.5">Full Name / Company *</label>
              <input type="text" placeholder="Client name or company" value={clientForm.name}
                onChange={e => setClientForm(f => ({ ...f, name: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-[#21326c]/20 text-[#21326c] text-sm focus:ring-2 focus:ring-[#21326c] transition-all placeholder:text-[#21326c]/40" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#21326c] mb-1.5">Email *</label>
              <input type="email" placeholder="client@company.com" value={clientForm.email}
                onChange={e => setClientForm(f => ({ ...f, email: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-[#21326c]/20 text-[#21326c] text-sm focus:ring-2 focus:ring-[#21326c] transition-all placeholder:text-[#21326c]/40" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#21326c] mb-1.5">Temporary Password *</label>
              <input type="text" placeholder="At least 6 characters" value={clientForm.password}
                onChange={e => setClientForm(f => ({ ...f, password: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-[#21326c]/20 text-[#21326c] text-sm focus:ring-2 focus:ring-[#21326c] transition-all placeholder:text-[#21326c]/40" />
            </div>
            {clientError && <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{clientError}</p>}
            <button onClick={handleCreateClient} disabled={creatingClient || !clientForm.name || !clientForm.email || !clientForm.password}
              className="w-full py-3 rounded-xl font-semibold text-white hover:opacity-90 transition-all disabled:opacity-50"
              style={{ background: '#ff9044' }}>
              {creatingClient ? 'Creating…' : 'Create Account & Copy Credentials'}
            </button>
          </div>
        )}
      </Modal>

      {/* Client list */}
      {loadingList ? (
        <p className="text-sm text-[#21326c]/50 py-4 text-center">Loading clients…</p>
      ) : clients.length === 0 ? (
        <div className="text-center py-12 text-[#21326c]/40">
          <Users size={32} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">No client accounts yet.</p>
        </div>
      ) : (
        clients.map(user => (
          <div key={user.id} className="bg-white rounded-2xl border border-[#21326c]/10 p-4 flex items-center gap-4">
            <Avatar initials={user.initials} color={user.avatarColor} size="md" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-[#21326c] text-sm">{user.name}</p>
              <p className="text-xs text-[#21326c]/50">Client</p>
            </div>
            {user.suspended && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: '#db963015', color: '#db9630' }}>Suspended</span>
            )}
            <SuspendButton user={user} isStudent={false} />
            <button onClick={() => handleDeleteClient(user.id, user.name)}
              className="flex-shrink-0 text-[#21326c]/20 hover:text-red-400 transition-colors">
              <Trash2 size={15} />
            </button>
          </div>
        ))
      )}
      </>)}
    </div>
  );
}

// Admin-only panel to start a direct conversation with ANY user — student,
// client, or another admin. Self-contained: fetches the full user list itself.

export function AdminStartConversation({ onStarted }) {
  const [users, setUsers]     = useState([]);
  const [roleTab, setRoleTab] = useState('student');
  const [query, setQuery]     = useState('');
  const [open, setOpen]       = useState(false);
  const [busyId, setBusyId]   = useState(null);

  useEffect(() => { adminApi.listUsers().then(setUsers).catch(() => {}); }, []);

  const ROLE_TABS = [
    { id: 'student', label: 'Students' },
    { id: 'client',  label: 'Clients'  },
    { id: 'admin',   label: 'Admins'   },
  ];
  const list = users
    .filter(u => u.role === roleTab)
    .filter(u => (u.name || '').toLowerCase().includes(query.toLowerCase()));

  const start = async (u) => {
    setBusyId(u.id);
    try {
      const conv = await convApi.create({ otherUserId: u.id });
      setOpen(false);
      setQuery('');
      onStarted?.(conv);
    } catch (e) {
      toast.error(`Couldn't start chat: ${e.message}`);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-[#21326c]/10 p-4 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquareText size={16} className="text-[#21326c]" />
          <span className="text-sm font-semibold text-[#21326c]">Start a conversation</span>
        </div>
        <button
          onClick={() => setOpen(o => !o)}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all hover:opacity-90"
          style={{ background: '#ff9044' }}
        >
          {open ? 'Close' : 'New message'}
        </button>
      </div>

      {open && (
        <div className="mt-4">
          <div className="flex gap-1 mb-3 bg-[#21326c]/5 rounded-xl p-1 w-fit">
            {ROLE_TABS.map(rt => (
              <button
                key={rt.id}
                onClick={() => setRoleTab(rt.id)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={roleTab === rt.id ? { background: '#21326c', color: '#fff' } : { color: '#21326c' }}
              >
                {rt.label}
              </button>
            ))}
          </div>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by name…"
            className="w-full px-3 py-2 mb-3 rounded-xl border border-[#21326c]/20 text-[#21326c] text-sm focus:outline-none focus:ring-2 focus:ring-[#21326c] placeholder:text-[#21326c]/40"
          />
          <div className="max-h-60 overflow-y-auto space-y-1">
            {list.length === 0 && (
              <p className="text-xs text-[#21326c]/40 text-center py-4">No users found.</p>
            )}
            {list.map(u => (
              <div key={u.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#21326c]/5">
                <Avatar initials={u.initials || '?'} color={u.avatarColor || '#21326c'} size="sm" />
                <span className="text-sm text-[#21326c] flex-1 truncate">{u.name}</span>
                <button
                  onClick={() => start(u)}
                  disabled={busyId === u.id}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border border-[#21326c]/20 text-[#21326c] hover:bg-[#21326c]/5 transition-colors disabled:opacity-50"
                >
                  <Send size={11} /> {busyId === u.id ? 'Opening…' : 'Message'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function AdminPage({ pendingFeedPosts, setPendingFeedPosts, setFeedPosts, pendingJobs, setPendingJobs, setJobs, pendingListings, setPendingListings, setListings, projects, talents, currentUser, refreshJobs, refreshFeed, refreshMarketplace, refreshProjects, siteSettings, refreshSettings }) {
  const [adminTab, setAdminTab] = useState('content');

  const approveFeedPost = async post => {
    try { await feedApi.setStatus(post.id, 'approved'); await refreshFeed?.(); }
    catch (e) { toast.error(`Couldn't approve: ${e.message}`); }
  };
  const rejectFeedPost = async id => {
    try { await feedApi.delete(id); await refreshFeed?.(); }
    catch (e) { toast.error(`Couldn't reject: ${e.message}`); }
  };

  const approveJob = async job => {
    try {
      await projectsApi.setStatus(job.id, 'open');
      // Server is source of truth — refetch splits open/pending again.
      await refreshJobs?.();
    } catch (e) {
      toast.error(`Couldn't approve: ${e.message}`);
    }
  };
  const rejectJob = async id => {
    const reason = window.prompt('Why is this project being rejected? The client will be emailed this reason.');
    if (reason === null) return;            // cancelled
    if (!reason.trim()) { toast.error('A rejection reason is required.'); return; }
    try {
      await projectsApi.reject(id, reason.trim());
      await refreshJobs?.();
      toast.success('Project rejected — the client was notified.');
    } catch (e) {
      toast.error(`Couldn't reject: ${e.message}`);
    }
  };

  const approveListing = async listing => {
    try { await marketplaceApi.setStatus(listing.id, 'active'); await refreshMarketplace?.(); }
    catch (e) { toast.error(`Couldn't approve: ${e.message}`); }
  };
  const rejectListing = async id => {
    try { await marketplaceApi.delete(id); await refreshMarketplace?.(); }
    catch (e) { toast.error(`Couldn't reject: ${e.message}`); }
  };

  const totalPending = pendingFeedPosts.length + pendingJobs.length + pendingListings.length;

  // Projects awaiting a payment confirmation (deposit on offer_accepted, final
  // balance on delivered). Drives the Payments tab and its count badge.
  const paymentsAwaiting = (projects || []).filter(p => p.status === 'offer_accepted' || p.status === 'delivered');

  const ADMIN_TABS = [
    { id: 'content',       label: 'Content Queue', Icon: Shield },
    { id: 'payments',      label: paymentsAwaiting.length ? `Payments (${paymentsAwaiting.length})` : 'Payments', Icon: DollarSign },
    { id: 'conversations', label: 'Conversations',  Icon: MessageSquareText },
    { id: 'users',         label: 'Users',          Icon: UserCheck },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      <div className="mb-6">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#21326c] mb-1">Admin Dashboard</h1>
        <p className="text-sm text-[#21326c]">Review content, monitor conversations, manage users</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-8 bg-[#21326c]/5 rounded-xl p-1 w-fit">
        {ADMIN_TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setAdminTab(t.id)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={adminTab === t.id ? { background: '#21326c', color: '#fff' } : { color: '#21326c' }}
          >
            <t.Icon size={14} /> {t.label}
          </button>
        ))}
      </div>

      {/* ── CONTENT QUEUE TAB ── */}
      {adminTab === 'content' && (
        <>
          {/* Homepage feature image control */}
          <HomepageImageCard images={(() => { try { return JSON.parse(siteSettings?.homeHeroImages || '[]'); } catch { return []; } })()} refresh={refreshSettings} />

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
            {[
              { label: 'Pending Posts',    count: pendingFeedPosts.length, color: '#c4622d', Icon: Grid },
              { label: 'Pending Projects', count: pendingJobs.length,      color: '#db9630', Icon: Briefcase },
              { label: 'Pending Listings', count: pendingListings.length,  color: '#21326c', Icon: Tag },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-2xl border border-[#21326c]/10 p-5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${s.color}15` }}>
                  <s.Icon size={18} style={{ color: s.color }} />
                </div>
                <div>
                  <p className="font-display text-3xl font-bold text-[#21326c]">{s.count}</p>
                  <p className="text-xs text-[#21326c]">{s.label}</p>
                </div>
              </div>
            ))}
          </div>

          {totalPending === 0 && (
            <div className="bg-white rounded-2xl border border-[#21326c]/10 p-10 text-center mb-6">
              <CheckCircle size={36} className="mx-auto mb-3 text-[#21326c] opacity-20" />
              <p className="font-semibold text-[#21326c] mb-1">All caught up</p>
              <p className="text-sm text-[#21326c]/50">No content is pending review right now.</p>
            </div>
          )}

          <div className="space-y-6">
            <PendingSection
              title="Feed Posts"
              icon={Grid}
              color="#c4622d"
              items={pendingFeedPosts}
              onApprove={approveFeedPost}
              onReject={rejectFeedPost}
              renderItem={post => (
                <>
                  <div className="flex items-center gap-2 mb-1">
                    <Avatar initials={post.initials} color={post.authorColor} size="sm" />
                    <span className="text-xs font-semibold text-[#21326c]">{post.author}</span>
                    <span className="text-xs text-[#21326c]/50">{post.time}</span>
                  </div>
                  <p className="text-sm text-[#21326c] leading-relaxed line-clamp-3">{post.content}</p>
                </>
              )}
            />

            <PendingSection
              title="Project Postings"
              icon={Briefcase}
              color="#db9630"
              items={pendingJobs}
              onApprove={approveJob}
              onReject={rejectJob}
              renderItem={job => (
                <>
                  <p className="text-sm font-semibold text-[#21326c] mb-0.5">{job.title}</p>
                  <p className="text-xs text-[#21326c]/60">{job.client} · {job.budget} EGP</p>
                  {job.brief && (
                    <p className="text-sm text-[#21326c]/80 leading-relaxed line-clamp-3 mt-2">{job.brief}</p>
                  )}
                  {job.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {job.tags.map(t => <span key={t} className="tag-pill">{t}</span>)}
                    </div>
                  )}
                  {job.attachments?.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {job.attachments.map(att => (
                        <a key={att.id}
                          href={/^https?:\/\//i.test(att.url || '') ? att.url : undefined}
                          target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-2 px-2 py-1 rounded-lg bg-[#21326c]/5 hover:bg-[#21326c]/10 text-xs text-[#2563eb] transition-colors">
                          <ImageIcon size={12} className="flex-shrink-0" />
                          <span className="truncate">{att.name}</span>
                        </a>
                      ))}
                    </div>
                  )}
                </>
              )}
            />

            <PendingSection
              title="Marketplace Listings"
              icon={Tag}
              color="#21326c"
              items={pendingListings}
              onApprove={approveListing}
              onReject={rejectListing}
              renderItem={listing => (
                <>
                  <div className="flex items-center gap-3 mb-1">
                    <div className="w-8 h-8 rounded-lg flex-shrink-0" style={{ background: listing.color }} />
                    <div>
                      <p className="text-sm font-semibold text-[#21326c]">{listing.title}</p>
                      <p className="text-xs text-[#21326c]/60">{listing.seller?.name} · {listing.price?.toLocaleString()} EGP</p>
                    </div>
                  </div>
                  {listing.description && (
                    <p className="text-xs text-[#21326c]/70 line-clamp-2 mt-1">{listing.description}</p>
                  )}
                </>
              )}
            />
          </div>
        </>
      )}

      {/* ── PAYMENTS TAB ── */}
      {adminTab === 'payments' && (
        <AdminPaymentsTab projects={projects} refreshProjects={refreshProjects} />
      )}

      {/* ── CONVERSATIONS TAB ── (ChatPage hosts the New-message starter for admins) */}
      {adminTab === 'conversations' && (
        <ChatPage currentUser={currentUser} />
      )}

      {/* ── USERS TAB ── */}
      {adminTab === 'users' && <AdminUsersTab />}
    </div>
  );
}

// ─── HOMEPAGE FEATURE IMAGE (admin) ──────────────────────────────────────────
// Upload/replace/clear the image shown in the framed panel next to the homepage
// headline. Empty = fall back to auto-pulling a student portfolio image.
function HomepageImageCard({ images = [], refresh }) {
  const [busy, setBusy] = useState(false);

  const addImage = async (file) => {
    if (!file) return;
    setBusy(true);
    try {
      const r = await uploadFile(file, 'site');
      await settingsApi.update({ homeHeroImages: [...images, r.url] });
      await refresh?.();
      toast.success('Image added to the homepage carousel.');
    } catch (e) { toast.error(`Couldn't add: ${e.message}`); }
    finally { setBusy(false); }
  };

  const removeImage = async (url) => {
    setBusy(true);
    try {
      await settingsApi.update({ homeHeroImages: images.filter(u => u !== url) });
      await refresh?.();
    } catch (e) { toast.error(`Couldn't remove: ${e.message}`); }
    finally { setBusy(false); }
  };

  return (
    <div className="bg-white rounded-2xl border border-[#21326c]/10 p-5 mb-6">
      <div className="flex items-center gap-2 mb-1">
        <ImageIcon size={16} className="text-[#21326c]" />
        <h3 className="font-semibold text-[#21326c]">Homepage hero carousel</h3>
      </div>
      <p className="text-xs text-[#21326c]/60 mb-3">These images rotate in the framed panel next to the homepage headline. Add a few. Leave empty to auto-pick from student portfolios.</p>
      <div className="flex items-center gap-3 flex-wrap">
        {images.map(url => (
          <div key={url} className="relative w-24 h-32 rounded-xl overflow-hidden border border-[#21326c]/10">
            <img src={url} alt="Hero" className="w-full h-full object-cover" />
            <button onClick={() => removeImage(url)} disabled={busy} title="Remove"
              className="absolute top-1 right-1 w-6 h-6 rounded-full bg-white/90 flex items-center justify-center text-[#21326c] hover:text-red-500 shadow disabled:opacity-50">
              <Trash2 size={12} />
            </button>
          </div>
        ))}
        <label className="cursor-pointer w-24 h-32 rounded-xl border-2 border-dashed border-[#21326c]/25 flex flex-col items-center justify-center gap-1 text-[#21326c]/60 hover:bg-[#21326c]/5 transition-colors text-xs font-semibold">
          <Upload size={16} /> {busy ? '…' : 'Add'}
          <input type="file" accept="image/*" className="hidden" disabled={busy} onChange={e => addImage(e.target.files?.[0])} />
        </label>
      </div>
    </div>
  );
}

// ─── ADMIN PAYMENTS TAB ──────────────────────────────────────────────────────
// Queue of projects awaiting a manual-InstaPay confirmation. Each shows the
// client's uploaded transfer screenshot (signed read URL) and a Confirm button
// that advances the project (deposit → in_progress, or final → completed).
function AdminPaymentsTab({ projects, refreshProjects }) {
  const [busyId, setBusyId] = useState(null);

  const awaiting = (projects || []).filter(p => p.status === 'offer_accepted' || p.status === 'delivered');

  const confirm = async (p) => {
    setBusyId(p.id);
    try {
      await projectsApi.advance(p.id, {});
      await refreshProjects?.();
      toast.success('Payment confirmed.');
    } catch (e) {
      toast.error(`Couldn't confirm: ${e.message}`);
    } finally {
      setBusyId(null);
    }
  };

  if (awaiting.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-[#21326c]/10 p-10 text-center">
        <DollarSign size={28} className="text-[#21326c]/30 mx-auto mb-3" />
        <p className="text-[#21326c] font-semibold">No payments awaiting confirmation</p>
        <p className="text-sm text-[#21326c]/50 mt-1">When a client marks a transfer as sent, it'll appear here with their screenshot.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {awaiting.map(p => {
        const isDeposit = p.status === 'offer_accepted';
        const stage     = isDeposit ? 'Deposit (50%)' : 'Final balance';
        const amount    = isDeposit ? Math.floor(p.budget * 0.5) : (p.budget - (p.depositAmount || 0));
        const proofUrl  = isDeposit ? p.depositProofUrl : p.finalPaymentProofUrl;
        return (
          <div key={p.id} className="bg-white rounded-2xl border border-[#21326c]/10 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
              <div>
                <h3 className="font-semibold text-[#21326c]">{p.title}</h3>
                <p className="text-xs text-[#21326c]/60 mt-0.5">
                  {p.clientName || 'Client'} → {p.acceptedTalentName || 'student'} · {p.budget.toLocaleString()} EGP total
                </p>
              </div>
              <span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: '#db963012', color: '#db9630' }}>
                {stage} · {amount.toLocaleString()} EGP
              </span>
            </div>
            {proofUrl ? (
              <a href={proofUrl} target="_blank" rel="noopener noreferrer" className="block mb-3">
                <img src={proofUrl} alt="Transfer screenshot" className="max-h-56 rounded-xl border border-[#21326c]/10 hover:opacity-90 transition-opacity" />
                <span className="block mt-1 text-[11px] font-semibold text-[#2563eb]">Open full size ↗</span>
              </a>
            ) : (
              <p className="text-xs text-amber-700 mb-3 flex items-center gap-1.5">
                <Hourglass size={12} /> Waiting for the client to upload their transfer screenshot.
              </p>
            )}
            <button
              onClick={() => confirm(p)}
              disabled={busyId === p.id || !proofUrl}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-semibold text-white hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: '#16a34a' }}
            >
              {busyId === p.id ? 'Confirming…' : isDeposit ? 'Confirm Deposit & Start Project' : 'Confirm Final Payment & Complete'}
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ─── VIEW: PROJECTS (client escrow flow) ─────────────────────────────────────
