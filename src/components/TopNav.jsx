import { useState } from 'react';
import { BookOpen, Briefcase, ChevronDown, Droplets, Grid, Home, KeyRound, LogOut, Menu, MessageSquare, Package, Plus, Shield, ShoppingBag, UserCheck, Users } from 'lucide-react';
import { Avatar, NotificationPanel } from './ui.jsx';

export function TopNav({ view, setView, currentUser, onLoginClick, onLogout, onChangePassword, notifications = [], onMarkNotifRead, onMarkAllNotifRead }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const getNavItems = () => {
    // Students: find work, network, manage their own profile.
    if (currentUser?.role === 'student') return [
      { id: 'feed',        label: 'Feed',        icon: Grid },
      { id: 'jobs',        label: 'Projects',    icon: Briefcase },
      { id: 'projects',    label: 'My Projects', icon: Package },
      { id: 'marketplace', label: 'Marketplace', icon: ShoppingBag },
      { id: 'news',        label: 'News',        icon: BookOpen },
    ];
    // Clients: hire talent, post jobs, manage their projects.
    if (currentUser?.role === 'client') return [
      { id: 'home',        label: 'Home',        icon: Home },
      { id: 'directory',   label: 'Talent',      icon: Users },
      { id: 'jobs',        label: 'Projects',    icon: Briefcase },
      { id: 'projects',    label: 'My Projects', icon: Package },
      { id: 'feed',        label: 'Feed',        icon: Grid },
      { id: 'marketplace', label: 'Marketplace', icon: ShoppingBag },
      { id: 'news',        label: 'News',        icon: BookOpen },
    ];
    // Admins: moderation first, then the surfaces they oversee.
    if (currentUser?.role === 'admin') return [
      { id: 'admin',       label: 'Admin',       icon: Shield },
      { id: 'home',        label: 'Home',        icon: Home },
      { id: 'feed',        label: 'Feed',        icon: Grid },
      { id: 'directory',   label: 'Talent',      icon: Users },
      { id: 'jobs',        label: 'Projects',    icon: Briefcase },
      { id: 'projects',    label: 'My Projects', icon: Package },
      { id: 'marketplace', label: 'Marketplace', icon: ShoppingBag },
      { id: 'news',        label: 'News',        icon: BookOpen },
    ];
    // Logged-out / guest: public browsing surfaces.
    return [
      { id: 'home',        label: 'Home',        icon: Home },
      { id: 'directory',   label: 'Talent',      icon: Users },
      { id: 'jobs',        label: 'Projects',    icon: Briefcase },
      { id: 'feed',        label: 'Feed',        icon: Grid },
      { id: 'marketplace', label: 'Marketplace', icon: ShoppingBag },
      { id: 'news',        label: 'News',        icon: BookOpen },
    ];
  };

  const navItems = getNavItems();

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-[#21326c]/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 gap-4">

          {/* Logo */}
          <button onClick={() => setView('home')} className="flex items-center gap-2 flex-shrink-0">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#21326c' }}>
              <Droplets size={18} color="white" />
            </div>
            <div>
              <span className="font-display text-xl font-bold text-[#21326c]">Lawnn</span>
              <span className="text-xs text-[#21326c] mr-1 block leading-none" style={{ fontFamily: 'Noto Naskh Arabic' }}>لون</span>
            </div>
          </button>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-0.5 flex-1 justify-center">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className={`px-3.5 py-2 text-sm transition-colors ${
                  view === item.id
                    ? 'text-[#21326c] font-semibold'
                    : 'text-[#21326c]/55 font-medium hover:text-[#21326c]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {!currentUser ? (
              <>
                <button
                  onClick={onLoginClick}
                  className="hidden sm:flex text-sm font-medium text-[#21326c] px-3 py-2 rounded-lg hover:bg-[#21326c]/5 transition-colors"
                >
                  Log In
                </button>
                <button
                  onClick={onLoginClick}
                  className="flex items-center gap-1.5 px-4 py-2 rounded text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95"
                  style={{ background: '#ff9044' }}
                >
                  <Plus size={15} />
                  <span className="hidden sm:inline">Post a Project</span>
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                {currentUser.role === 'client' && (
                  <button
                    onClick={() => setView('jobs')}
                    className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded text-sm font-semibold text-white transition-all hover:opacity-90"
                    style={{ background: '#ff9044' }}
                  >
                    <Plus size={15} /> Post a Project
                  </button>
                )}
                <button
                  onClick={() => setView('chat')}
                  className="relative p-2 rounded-lg hover:bg-[#21326c]/5 text-[#21326c] transition-colors"
                  title="Messages"
                >
                  <MessageSquare size={18} />
                </button>
                <NotificationPanel
                  notifications={notifications}
                  onMarkRead={onMarkNotifRead}
                  onMarkAllRead={onMarkAllNotifRead}
                />
                <div className="relative pl-2 border-l border-[#21326c]/10">
                  {profileOpen && <div className="fixed inset-0 z-30" onClick={() => setProfileOpen(false)} />}
                  <button
                    onClick={() => setProfileOpen(o => !o)}
                    className="flex items-center gap-2 rounded-lg px-1.5 py-1 hover:bg-[#21326c]/5 transition-colors"
                  >
                    <Avatar initials={currentUser.initials} color={currentUser.avatarColor} size="sm" />
                    <span className="hidden sm:inline text-sm font-medium text-[#21326c]">
                      {currentUser.name.split(' ')[0]}
                    </span>
                    <ChevronDown size={14} className="hidden sm:inline text-[#21326c]/40" />
                  </button>
                  {profileOpen && (
                    <div className="absolute right-0 top-full mt-2 z-40 bg-white rounded-xl shadow-2xl border border-[#21326c]/10 w-52 py-1.5 overflow-hidden">
                      <div className="px-4 py-2 border-b border-[#21326c]/8">
                        <p className="text-sm font-semibold text-[#21326c] truncate">{currentUser.name}</p>
                        <p className="text-xs text-[#21326c]/45 capitalize">{currentUser.role}</p>
                      </div>
                      {(currentUser.role === 'student' || currentUser.role === 'client') && (
                        <button
                          onClick={() => { setProfileOpen(false); setView('profile'); }}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#21326c] hover:bg-[#21326c]/5 transition-colors"
                        >
                          <UserCheck size={15} className="text-[#21326c]/60" /> My Profile
                        </button>
                      )}
                      <button
                        onClick={() => { setProfileOpen(false); onChangePassword?.(); }}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#21326c] hover:bg-[#21326c]/5 transition-colors"
                      >
                        <KeyRound size={15} className="text-[#21326c]/60" /> Change password
                      </button>
                      <button
                        onClick={() => { setProfileOpen(false); onLogout(); }}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#21326c] hover:bg-[#21326c]/5 transition-colors"
                      >
                        <LogOut size={15} className="text-[#21326c]/60" /> Sign out
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-[#21326c]/5 text-[#21326c]"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <Menu size={20} />
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        {menuOpen && (
          <div className="md:hidden pb-3 flex gap-2 overflow-x-auto">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => { setView(item.id); setMenuOpen(false); }}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl text-xs font-medium flex-shrink-0 transition-colors ${
                  view === item.id ? 'bg-[#21326c] text-white' : 'bg-[#21326c]/5 text-[#21326c]'
                }`}
              >
                <item.icon size={16} />
                {item.label}
              </button>
            ))}
            {!currentUser && (
              <button
                onClick={() => { onLoginClick(); setMenuOpen(false); }}
                className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl text-xs font-medium flex-shrink-0 bg-[#21326c]/5 text-[#21326c]"
              >
                <Users size={16} />
                Log In
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

// ─── VIEW 1: HOME PAGE ────────────────────────────────────────────────────────
