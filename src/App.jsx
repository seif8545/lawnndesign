import { useState, useEffect, useCallback } from 'react';
import { auth as authApi, clearToken, feed as feedApi, marketplace as marketplaceApi, news as newsApi, notifications as notifApi, onUnauthorized, profiles, projects as projectsApi, settings as settingsApi } from './lib/api.js';
import { toast } from './lib/toast.js';
import { connectSocket, disconnectSocket } from './lib/socket.js';
import { TopNav } from './components/TopNav.jsx';
import { AcceptInviteModal, ChangePasswordModal, FirstLoginSetup, LoginModal } from './components/auth.jsx';
import { ErrorBoundary } from './components/ErrorBoundary.jsx';
import { Toaster } from './components/Toaster.jsx';
import { mapApiFeedPost, mapApiJob, mapApiListing, mapApiNews, mapApiProfile, mapApiProject, mapNotification, talentToApiBody } from './lib/mappers.js';
import { AboutPage } from './pages/AboutPage.jsx';
import { AdminPage } from './pages/AdminPage.jsx';
import { ChatPage } from './pages/ChatPage.jsx';
import { ClientProfilePage } from './pages/ClientProfilePage.jsx';
import { DirectoryPage } from './pages/DirectoryPage.jsx';
import { FeedPage } from './pages/FeedPage.jsx';
import { HomePage } from './pages/HomePage.jsx';
import { InfoPage } from './pages/InfoPage.jsx';
import { JobBoardPage } from './pages/JobBoardPage.jsx';
import { MarketplacePage } from './pages/MarketplacePage.jsx';
import { NewsPage } from './pages/NewsPage.jsx';
import { OnboardingFlow } from './pages/OnboardingFlow.jsx';
import { ProfilePage } from './pages/ProfilePage.jsx';
import { ProjectsPage } from './pages/ProjectsPage.jsx';

export default function App() {
  const [view, setView] = useState('home');
  const [selectedTalent, setSelectedTalent] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  // Tracks if the student closed onboarding this session, so the completeness
  // effect doesn't immediately reopen it after they dismiss without finishing.
  const [onboardingDismissed, setOnboardingDismissed] = useState(false);
  const [inviteToken, setInviteToken] = useState(null);
  const [focusPost, setFocusPost] = useState(null);

  // First-load: detect an invite token in the URL, otherwise hydrate from stored JWT.
  useEffect(() => {
    const url = new URL(window.location.href);
    // Shared post deep link (?post=<id>) — open the feed at that post.
    const sharedPost = url.searchParams.get('post');
    if (sharedPost) {
      setFocusPost(sharedPost);
      setView('feed');
      url.searchParams.delete('post');
      window.history.replaceState({}, '', url.toString());
    }
    const t = url.searchParams.get('token');
    if (t) {
      setInviteToken(t);
      // Strip the token from the address bar so a refresh doesn't re-prompt.
      url.searchParams.delete('token');
      window.history.replaceState({}, '', url.toString());
      return;
    }
    const stored = localStorage.getItem('lawnn_token');
    if (!stored) return;
    authApi.me()
      .then(({ user }) => handleLogin(user))
      .catch(() => clearToken()); // token expired or invalid — clear it silently
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Lifted mutable state so edits propagate across all views
  const [talents, setTalents]                   = useState([]);

  // Load real talent profiles from the backend.
  useEffect(() => {
    profiles.list()
      .then(list => setTalents(list.map(mapApiProfile)))
      .catch(err => console.warn('[talents] failed to load:', err.message));
  }, []);

  // Reusable Projects board refresher — open projects accepting applications.
  // Admin sees pending ones via the board endpoint's visibility; split locally.
  const refreshJobs = useCallback(() => {
    return projectsApi.board()
      .then(list => {
        const mapped = list.map(mapApiJob);
        setJobs(mapped.filter(j => j.status === 'open'));
        setPendingJobs(mapped.filter(j => j.status === 'pending'));
      })
      .catch(err => console.warn('[board] failed to load:', err.message));
  }, []);
  useEffect(() => { refreshJobs(); }, [refreshJobs, currentUser]);

  // Reusable projects refresher (auth-required endpoint — only runs when logged in).
  const refreshProjects = useCallback(() => {
    if (!currentUser) { setProjects([]); return Promise.resolve(); }
    return projectsApi.list()
      .then(list => setProjects(list.map(mapApiProject)))
      .catch(err => console.warn('[projects] failed to load:', err.message));
  }, [currentUser]);
  useEffect(() => { refreshProjects(); }, [refreshProjects]);

  // Reusable feed refresher. Admin (when logged in) also gets pending posts;
  // split here so AdminPage's moderation queue picks them up.
  const refreshFeed = useCallback(() => {
    return feedApi.list()
      .then(list => {
        const mapped = list.map(mapApiFeedPost);
        setFeedPosts(mapped.filter(p => p.status === 'approved'));
        setPendingFeedPosts(mapped.filter(p => p.status === 'pending'));
      })
      .catch(err => console.warn('[feed] failed to load:', err.message));
  }, []);
  useEffect(() => { refreshFeed(); }, [refreshFeed, currentUser]);
  // Reusable marketplace refresher. Splits active/sold from pending.
  const refreshMarketplace = useCallback(() => {
    return marketplaceApi.list()
      .then(list => {
        const mapped = list.map(mapApiListing);
        setListings(mapped.filter(l => l.status !== 'pending'));
        setPendingListings(mapped.filter(l => l.status === 'pending'));
      })
      .catch(err => console.warn('[marketplace] failed to load:', err.message));
  }, []);
  useEffect(() => { refreshMarketplace(); }, [refreshMarketplace, currentUser]);
  // Reusable news refresher — public endpoint, articles authored by admins.
  const refreshNews = useCallback(() => {
    return newsApi.list()
      .then(list => setNewsPosts(list.map(mapApiNews)))
      .catch(err => console.warn('[news] failed to load:', err.message));
  }, []);
  useEffect(() => { refreshNews(); }, [refreshNews]);
  // Editable site settings (e.g. homepage feature image).
  const [siteSettings, setSiteSettings]         = useState({});
  const refreshSettings = useCallback(() => {
    return settingsApi.get()
      .then(setSiteSettings)
      .catch(err => console.warn('[settings] failed to load:', err.message));
  }, []);
  useEffect(() => { refreshSettings(); }, [refreshSettings]);
  const [newsPosts, setNewsPosts]               = useState([]);
  const [feedPosts, setFeedPosts]                       = useState([]);
  const [pendingFeedPosts, setPendingFeedPosts]         = useState([]);
  const [jobs, setJobs]                                 = useState([]);
  const [pendingJobs, setPendingJobs]                   = useState([]);
  const [listings, setListings]                         = useState([]);
  const [pendingListings, setPendingListings]           = useState([]);
  const [projects, setProjects]                         = useState([]);
  const [notifications, setNotifications]               = useState([]);
  const [aboutContent, setAboutContent] = useState({
    para1: "Lawnn was born from a simple observation: Egypt's art and design faculties produce world-class talent, but that talent rarely gets the visibility or opportunity it deserves.",
    para2: "We built a platform that verifies students from Egypt's top creative institutions, connects them with real clients and briefs, and gives them the tools to grow a sustainable creative career — all while they're still studying.",
  });

  // Live notifications from the backend. addNotification still exists for
  // ephemeral, client-side feedback (it won't survive a refresh).
  const refreshNotifications = useCallback(() => {
    if (!currentUser) { setNotifications([]); return Promise.resolve(); }
    return notifApi.list()
      .then(list => setNotifications(list.map(mapNotification)))
      .catch(err => console.warn('[notifications] failed to load:', err.message));
  }, [currentUser]);
  useEffect(() => { refreshNotifications(); }, [refreshNotifications]);
  useEffect(() => {
    const onFocus = () => refreshNotifications();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [refreshNotifications]);

  const addNotification = (notif) => {
    setNotifications(ns => [{ ...notif, id: `local-${Date.now()}`, read: false }, ...ns]);
  };
  const markNotifRead = (id) => {
    setNotifications(ns => ns.map(n => n.id === id ? { ...n, read: true } : n));
    notifApi.read(id).catch(() => {});
  };
  const markAllNotifsRead = () => {
    setNotifications(ns => ns.map(n => ({ ...n, read: true })));
    notifApi.readAll().catch(() => {});
  };

  const handleLogin = user => {
    setCurrentUser(user);
    // Connect socket with the stored JWT
    const token = localStorage.getItem('lawnn_token');
    if (token) connectSocket(token);
    // Notifications load via the refreshNotifications effect once currentUser is set.
    // Students are prompted whenever their profile is incomplete — driven by the
    // completeness effect once talent profiles load (reset the session flag here).
    // Clients keep one-time, per-device dismissal.
    setOnboardingDismissed(false);
    const dismissed = localStorage.getItem(`lawnn_onboarding_done_${user.id}`);
    if (!dismissed && user.role === 'client') {
      setShowOnboarding(true);
    }
    if (user.role === 'student') setView('feed');
    else if (user.role === 'client') setView('projects');
    else if (user.role === 'admin') setView('admin');
  };

  const handleLogout = () => {
    disconnectSocket();
    clearToken();
    setCurrentUser(null);
    setView('home');
    setNotifications([]);
    setShowOnboarding(false);
    setOnboardingDismissed(false);
  };

  // Auto-logout when the API reports an expired/invalid session (401 on an
  // authenticated request). The token is already cleared in api.js; here we
  // reset app state and tell the user. handleLogout only touches stable
  // setters, so registering the first-render closure once is safe.
  useEffect(() => {
    onUnauthorized(() => {
      handleLogout();
      toast.error('Your session expired — please sign in again.');
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Prompt students to finish their profile whenever it's incomplete (no bio or
  // no skills). Runs once talent profiles have loaded; the session-dismissed flag
  // stops it from reopening immediately after the student closes it.
  useEffect(() => {
    if (!currentUser || currentUser.role !== 'student' || onboardingDismissed) return;
    const talent = talents.find(t => t.userId === currentUser.id);
    if (!talent) return; // profile not loaded yet
    const incomplete = !talent.bio?.trim() || !(talent.tags?.length > 0);
    if (incomplete) setShowOnboarding(true);
  }, [currentUser, talents, onboardingDismissed]);

  const handleUpdateTalent = updated => {
    // Optimistic local update — UI reflects the change immediately.
    setTalents(ts => ts.map(t => t.id === updated.id ? updated : t));
    if (selectedTalent?.id === updated.id) setSelectedTalent(updated);
    // Persist to backend. Only the talent themselves (or admin) can write.
    if (currentUser?.role === 'student' || currentUser?.role === 'admin') {
      profiles.update(updated.id, talentToApiBody(updated))
        .catch(err => console.warn('[profile] save failed:', err.message));
    }
  };

  const handleNavChange = v => {
    if (v === 'profile' && currentUser?.role === 'student') {
      // Real students: their profile is the one whose userId matches.
      const talent = talents.find(t => t.userId === currentUser.id);
      if (talent) setSelectedTalent(talent);
    } else if (v === 'profile' && currentUser?.role === 'client') {
      // Clients have their own profile view — clear any talent we were viewing.
      setSelectedTalent(null);
    }
    setView(v);
  };

  const renderView = () => {
    switch (view) {
      case 'home':
        return <HomePage setView={handleNavChange} setSelectedTalent={setSelectedTalent} talents={talents} heroImageUrl={siteSettings.homeHeroImageUrl} />;
      case 'jobs':
        return <JobBoardPage setView={handleNavChange} jobs={jobs} setJobs={setJobs} pendingJobs={pendingJobs} setPendingJobs={setPendingJobs} currentUser={currentUser} talents={talents} refreshJobs={refreshJobs} refreshProjects={refreshProjects} />;
      case 'directory':
        return <DirectoryPage setView={handleNavChange} setSelectedTalent={setSelectedTalent} talents={talents} />;
      case 'profile': {
        // Viewing a specific talent (e.g. clicked from the directory) always
        // shows that talent's profile, whoever is logged in.
        if (selectedTalent) {
          return <ProfilePage talent={selectedTalent} setView={handleNavChange} currentUser={currentUser} onUpdateTalent={handleUpdateTalent} />;
        }
        // A client's own profile.
        if (currentUser?.role === 'client') {
          return <ClientProfilePage currentUser={currentUser} jobs={jobs} pendingJobs={pendingJobs} projects={projects} setView={handleNavChange} />;
        }
        const profileTalent = currentUser?.role === 'student' ? talents.find(t => t.userId === currentUser.id) : null;
        return profileTalent
          ? <ProfilePage talent={profileTalent} setView={handleNavChange} currentUser={currentUser} onUpdateTalent={handleUpdateTalent} />
          : <DirectoryPage setView={handleNavChange} setSelectedTalent={setSelectedTalent} talents={talents} />;
      }
      case 'feed':
        return <FeedPage feedPosts={feedPosts} setFeedPosts={setFeedPosts} pendingFeedPosts={pendingFeedPosts} setPendingFeedPosts={setPendingFeedPosts} currentUser={currentUser} refreshFeed={refreshFeed} focusPost={focusPost} />;
      case 'chat':
        return <ChatPage currentUser={currentUser} />;
      case 'about':
        return (
          <AboutPage
            currentUser={currentUser}
            talents={talents}
            onUpdateTalent={handleUpdateTalent}
            aboutContent={aboutContent}
            setAboutContent={setAboutContent}
          />
        );
      case 'news':
        return <NewsPage newsPosts={newsPosts} currentUser={currentUser} refreshNews={refreshNews} />;
      case 'about-lawnn':
        return <InfoPage slug="about-lawnn" setView={handleNavChange} />;
      case 'privacy':
        return <InfoPage slug="privacy" setView={handleNavChange} />;
      case 'terms':
        return <InfoPage slug="terms" setView={handleNavChange} />;
      case 'contact':
        return <InfoPage slug="contact" setView={handleNavChange} />;
      case 'marketplace':
        return <MarketplacePage listings={listings} setListings={setListings} pendingListings={pendingListings} setPendingListings={setPendingListings} currentUser={currentUser} refreshMarketplace={refreshMarketplace} setView={handleNavChange} />;
      case 'projects':
        return currentUser
          ? <ProjectsPage projects={projects} setProjects={setProjects} currentUser={currentUser} setView={handleNavChange} setSelectedTalent={setSelectedTalent} talents={talents} addNotification={addNotification} refreshProjects={refreshProjects} refreshJobs={refreshJobs} />
          : <HomePage setView={handleNavChange} setSelectedTalent={setSelectedTalent} talents={talents} />;
      case 'admin':
        return currentUser?.role === 'admin'
          ? <AdminPage
              pendingFeedPosts={pendingFeedPosts} setPendingFeedPosts={setPendingFeedPosts} setFeedPosts={setFeedPosts}
              pendingJobs={pendingJobs} setPendingJobs={setPendingJobs} setJobs={setJobs}
              pendingListings={pendingListings} setPendingListings={setPendingListings} setListings={setListings}
              projects={projects} talents={talents} currentUser={currentUser}
              refreshJobs={refreshJobs} refreshFeed={refreshFeed} refreshMarketplace={refreshMarketplace} refreshProjects={refreshProjects}
              siteSettings={siteSettings} refreshSettings={refreshSettings}
            />
          : <HomePage setView={handleNavChange} setSelectedTalent={setSelectedTalent} talents={talents} />;
      default:
        return <HomePage setView={handleNavChange} setSelectedTalent={setSelectedTalent} talents={talents} heroImageUrl={siteSettings.homeHeroImageUrl} />;
    }
  };

  return (
    <div className="min-h-screen" style={{ background: '#fffcf4' }}>
      <Toaster />
      <TopNav
        view={view}
        setView={handleNavChange}
        currentUser={currentUser}
        onLoginClick={() => setShowLogin(true)}
        onLogout={handleLogout}
        onChangePassword={() => setShowChangePassword(true)}
        notifications={notifications}
        onMarkNotifRead={markNotifRead}
        onMarkAllNotifRead={markAllNotifsRead}
      />

      <LoginModal
        open={showLogin}
        onClose={() => setShowLogin(false)}
        onLogin={user => { handleLogin(user); setShowLogin(false); }}
      />

      {currentUser && (
        <ChangePasswordModal
          open={showChangePassword}
          onClose={() => setShowChangePassword(false)}
          onChanged={updated => updated && setCurrentUser(updated)}
        />
      )}

      {inviteToken && (
        <AcceptInviteModal
          token={inviteToken}
          onAccept={user => { handleLogin(user); setInviteToken(null); }}
          onClose={() => setInviteToken(null)}
        />
      )}

      {/* Forced first-login setup for students added by email */}
      {currentUser?.mustChangePassword && (
        <FirstLoginSetup
          user={currentUser}
          onDone={updated => setCurrentUser(updated)}
        />
      )}

      {/* Onboarding overlay */}
      {showOnboarding && currentUser && (
        <OnboardingFlow
          currentUser={currentUser}
          talents={talents}
          onUpdateTalent={handleUpdateTalent}
          onDone={() => {
            localStorage.setItem(`lawnn_onboarding_done_${currentUser.id}`, '1');
            setShowOnboarding(false);
            setOnboardingDismissed(true);
          }}
        />
      )}

      <main>
        <ErrorBoundary resetKey={view}>{renderView()}</ErrorBoundary>
      </main>

      {/* Footer */}
      <footer className="mt-20 border-t hairline py-10 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-display font-bold text-[#21326c] text-base">Lawnn</span>
              <span className="text-[#21326c]/50 text-sm" style={{ fontFamily: 'Noto Naskh Arabic' }}>لون</span>
            </div>
            <p className="text-xs text-[#21326c]/45">Egyptian Creative Talent Platform · © {new Date().getFullYear()}</p>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {[
              { label: 'About', nav: 'about-lawnn' },
              { label: 'News', nav: 'news' },
              { label: 'For Clients', nav: 'jobs' },
              { label: 'Contact', nav: 'contact' },
              { label: 'Privacy', nav: 'privacy' },
              { label: 'Terms', nav: 'terms' },
            ].map(({ label, nav }) => (
              <button
                key={nav}
                onClick={() => handleNavChange(nav)}
                className="text-xs text-[#21326c]/55 hover:text-[#21326c] transition-colors font-medium"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
