import { useState } from 'react';
import {
  Search, Bell, MessageSquare, Briefcase, Users, Home, Grid,
  Star, MapPin, ChevronRight, Plus, Filter, X, Send, Paperclip,
  Heart, MessageCircle, Share2, Play, Eye, Download, Shield,
  CheckCircle, Award, Clock, DollarSign, Tag, Upload, FileText,
  MoreHorizontal, ChevronDown, Camera, Palette, Building2,
  GraduationCap, Sparkles, ArrowRight, Globe, Lock, Droplets,
  BookOpen, Layers, Pen, Video, Image as ImageIcon, Stamp,
  ExternalLink, Info, UserPlus, TrendingUp, Hash, ThumbsUp,
  BarChart2, Zap, Menu, ChevronLeft
} from 'lucide-react';

// ─── MOCK DATA ────────────────────────────────────────────────────────────────

const TALENTS = [
  {
    id: 1,
    name: 'Nour El-Sayed',
    university: 'Helwan University — Fine Arts',
    dept: 'Interior Architecture',
    year: 2025,
    isGrad: false,
    rating: 4.9,
    reviews: 38,
    avatar: null,
    avatarColor: '#21326c',
    initials: 'NE',
    tags: ['3D Viz', 'AutoCAD', 'Revit'],
    bio: 'Third-year Interior Architecture student passionate about blending contemporary Egyptian aesthetics with functional design. Specialised in high-end residential and hospitality projects.',
    hourlyRate: 120,
    portfolio: [
      { color: '#c4622d', label: 'Villa Interior — New Cairo', h: 'tall' },
      { color: '#21326c', label: 'Co-working Space 3D Viz', h: 'short' },
      { color: '#db9630', label: 'Boutique Hotel Lobby', h: 'medium' },
      { color: '#21326c', label: 'Restaurant Moodboard', h: 'short' },
      { color: '#21326c', label: 'Residential Kitchen Render', h: 'tall' },
    ],
    completedJobs: 24,
    education: [{ degree: 'B.Sc Interior Architecture', school: 'Helwan University', years: '2022–Present' }],
    experience: [{ role: 'Freelance 3D Visualiser', company: 'Self-employed', years: '2023–Present' }],
  },
  {
    id: 2,
    name: 'Karim Ashraf',
    university: 'GUC — Applied Arts',
    dept: 'Graphic Design & Branding',
    year: 2024,
    isGrad: true,
    rating: 4.8,
    reviews: 61,
    avatar: null,
    avatarColor: '#c4622d',
    initials: 'KA',
    tags: ['Branding', 'Motion', 'Figma'],
    bio: 'Recent GUC Applied Arts graduate with a focus on brand identity systems and motion design. Worked with 5+ Egyptian startups on end-to-end visual identities.',
    hourlyRate: 160,
    portfolio: [
      { color: '#db9630', label: 'Brand Identity — Cairo Café', h: 'short' },
      { color: '#c4622d', label: 'Motion Reel 2024', h: 'tall' },
      { color: '#21326c', label: 'UI System — Fintech App', h: 'medium' },
      { color: '#21326c', label: 'Packaging — Organic Brand', h: 'short' },
      { color: '#21326c', label: 'Annual Report Design', h: 'tall' },
    ],
    completedJobs: 47,
    education: [{ degree: 'B.Sc Graphic Design', school: 'German University in Cairo', years: '2020–2024' }],
    experience: [
      { role: 'Brand Designer Intern', company: 'TBWA\\Egypt', years: 'Summer 2023' },
      { role: 'Freelance Motion Designer', company: 'Various Clients', years: '2022–2024' },
    ],
  },
  {
    id: 3,
    name: 'Yasmine Farouk',
    university: 'AUC — Architecture',
    dept: 'Urban Design',
    year: 2026,
    isGrad: false,
    rating: 5.0,
    reviews: 14,
    avatar: null,
    avatarColor: '#db9630',
    initials: 'YF',
    tags: ['Urban Planning', 'BIM', 'SketchUp'],
    bio: 'AUC Architecture sophomore with a deep interest in sustainable urbanism and heritage conservation in the Egyptian context. Awarded Best Studio Project 2024.',
    hourlyRate: 90,
    portfolio: [
      { color: '#21326c', label: 'Urban Masterplan — Alexandria', h: 'medium' },
      { color: '#db9630', label: 'Heritage Building Survey', h: 'tall' },
      { color: '#21326c', label: 'Sustainable Housing Concept', h: 'short' },
    ],
    completedJobs: 8,
    education: [{ degree: 'B.Sc Architecture (In Progress)', school: 'American University in Cairo', years: '2022–2026' }],
    experience: [{ role: 'Research Assistant', company: 'AUC Urban Lab', years: '2023–Present' }],
  },
  {
    id: 4,
    name: 'Omar Galal',
    university: 'Helwan University — Fine Arts',
    dept: 'Sculpture & Ceramics',
    year: 2025,
    isGrad: false,
    rating: 4.7,
    reviews: 22,
    avatar: null,
    avatarColor: '#21326c',
    initials: 'OG',
    tags: ['Sculpture', 'Ceramics', 'Illustration'],
    bio: 'Fine Arts sculptor exploring the intersection of traditional Egyptian craft and contemporary form. Works in clay, resin, and mixed media. Available for commissions and installations.',
    hourlyRate: 100,
    portfolio: [
      { color: '#db9630', label: 'Pharaonic Series — Bronze', h: 'tall' },
      { color: '#c4622d', label: 'Ceramic Wall Installation', h: 'short' },
      { color: '#21326c', label: 'Mixed Media Portrait', h: 'medium' },
    ],
    completedJobs: 15,
    education: [{ degree: 'B.F.A Sculpture', school: 'Helwan University', years: '2021–2025' }],
    experience: [{ role: 'Studio Artist', company: 'Darb 1718', years: '2023–Present' }],
  },
  {
    id: 5,
    name: 'Laila Mansour',
    university: 'MSA — Digital Media',
    dept: 'UI/UX Design',
    year: 2024,
    isGrad: true,
    rating: 4.9,
    reviews: 55,
    avatar: null,
    avatarColor: '#a84f22',
    initials: 'LM',
    tags: ['UI/UX', 'Prototyping', 'User Research'],
    bio: 'UX designer and MSA graduate with expertise in product design for mobile and web. Completed a thesis on accessibility in Arabic-language interfaces. Currently freelancing full-time.',
    hourlyRate: 180,
    portfolio: [
      { color: '#21326c', label: 'E-commerce App — Cairo', h: 'short' },
      { color: '#21326c', label: 'Health Tracking Dashboard', h: 'tall' },
      { color: '#db9630', label: 'Arabic Typography System', h: 'medium' },
      { color: '#c4622d', label: 'Banking Super App', h: 'short' },
    ],
    completedJobs: 39,
    education: [{ degree: 'B.Sc Digital Media Design', school: 'Modern Sciences & Arts Univ.', years: '2020–2024' }],
    experience: [
      { role: 'Product Design Intern', company: 'Fawry Digital', years: '2023' },
      { role: 'Freelance UX Designer', company: 'Various', years: '2022–Present' },
    ],
  },
  {
    id: 6,
    name: 'Ahmed Khalil',
    university: 'Cairo University — Fine Arts',
    dept: 'Calligraphy & Painting',
    year: 2025,
    isGrad: false,
    rating: 4.8,
    reviews: 29,
    avatar: null,
    avatarColor: '#21326c',
    initials: 'AK',
    tags: ['Calligraphy', 'Painting', 'Mural'],
    bio: 'Third-year Fine Arts student specialising in Arabic calligraphy and contemporary painting. Has completed 3 public mural commissions in Cairo and exhibited at Cairo Biennale 2023.',
    hourlyRate: 110,
    portfolio: [
      { color: '#c4622d', label: 'Arabic Calligraphy Series', h: 'medium' },
      { color: '#db9630', label: 'Mixed Media — Nile Study', h: 'tall' },
      { color: '#21326c', label: 'Public Mural — Zamalek', h: 'short' },
    ],
    completedJobs: 19,
    education: [{ degree: 'B.F.A Painting', school: 'Cairo University', years: '2022–2025' }],
    experience: [{ role: 'Teaching Assistant', company: 'Cairo University Arts Faculty', years: '2024–Present' }],
  },
];

const JOBS = [
  {
    id: 1,
    title: 'Brand Identity for F&B Startup',
    client: 'Koshary House Egypt',
    budget: '3,500',
    budgetType: 'Fixed',
    postedAgo: '2h ago',
    category: 'Visuals & Branding',
    tags: ['Logo', 'Brand Guidelines', 'Packaging'],
    brief: 'We\'re launching a modern Egyptian fast-casual restaurant chain and need a full brand identity — logo, color system, typography, and packaging templates. Must feel both youthful and authentically Egyptian.',
    applicants: 4,
    vip: true,
  },
  {
    id: 2,
    title: '3D Renders for Residential Villa — New Cairo',
    client: 'Al-Safwa Developments',
    budget: '5,000',
    budgetType: 'Fixed',
    postedAgo: '5h ago',
    category: 'Architecture & Interiors',
    tags: ['3D Viz', 'SketchUp', 'V-Ray'],
    brief: 'Need 8–10 photorealistic interior renders for a 600m² villa. Drawings will be provided. Style: modern Arabic — clean lines with arabesque detailing. Deadline: 3 weeks.',
    applicants: 7,
    vip: false,
  },
  {
    id: 3,
    title: 'UI/UX Design for HealthTech App',
    client: 'Shifa Digital',
    budget: '150',
    budgetType: '/hr',
    postedAgo: '1d ago',
    category: 'Visuals & Branding',
    tags: ['UI/UX', 'Figma', 'Mobile'],
    brief: 'Looking for a talented UX designer to redesign our patient-facing mobile app (iOS & Android). Must have experience with medical or government apps in the Egyptian market. Arabic-first interface.',
    applicants: 12,
    vip: true,
  },
  {
    id: 4,
    title: 'Calligraphy Artwork for Hotel Lobby',
    client: 'Nile Sheraton Cairo',
    budget: '8,000',
    budgetType: 'Fixed',
    postedAgo: '3d ago',
    category: 'Fine Arts & Illustration',
    tags: ['Calligraphy', 'Installation', 'Arabic'],
    brief: 'Commission for a large-format Arabic calligraphy piece (3m × 1.5m) for our refurbished lobby. A Quranic verse agreed with management. We require portfolio samples of large-scale work.',
    applicants: 3,
    vip: false,
  },
  {
    id: 5,
    title: 'Motion Graphics for Social Media Campaign',
    client: 'Banque Misr — Marketing',
    budget: '2,200',
    budgetType: 'Fixed',
    postedAgo: '6h ago',
    category: 'Visuals & Branding',
    tags: ['Motion', 'After Effects', 'Arabic'],
    brief: 'Need 5 × 15-second animated posts for Ramadan campaign across Instagram and TikTok. Storyboards ready. Brand guidelines provided. Egyptian dialect VO available separately.',
    applicants: 9,
    vip: false,
  },
];

const FEED_POSTS = [
  {
    id: 1,
    author: 'Nour El-Sayed',
    authorColor: '#21326c',
    initials: 'NE',
    university: 'Helwan — Fine Arts',
    time: '2h ago',
    content: 'Still working on this villa render — finally nailed the morning light coming through the mashrabiya screens 🌿 The client wanted something that feels unmistakably Egyptian but still ultra-modern. What do you think of the material palette?',
    tags: ['#WIP', '#3DViz', '#EgyptianDesign'],
    imageColor: '#c4622d',
    imageLabel: '3D Villa Render — Morning Light',
    likes: 142,
    comments: 23,
    shares: 8,
    hasVideo: false,
    liked: false,
  },
  {
    id: 2,
    author: 'Karim Ashraf',
    authorColor: '#c4622d',
    initials: 'KA',
    university: 'GUC — Applied Arts',
    time: '5h ago',
    content: 'Quick tutorial drop 🎬 How I build brand color systems for Egyptian clients — balancing warmth, trust, and modernity. The full video is linked below. Process from brand strategy → palette generation → accessibility testing.',
    tags: ['#WIP', '#Branding', '#Tutorial'],
    imageColor: '#21326c',
    imageLabel: 'Color System Tutorial Thumbnail',
    likes: 289,
    comments: 47,
    shares: 34,
    hasVideo: true,
    liked: true,
  },
  {
    id: 3,
    author: 'Ahmed Khalil',
    authorColor: '#21326c',
    initials: 'AK',
    university: 'Cairo University — Fine Arts',
    time: '1d ago',
    content: 'Day 3 of the Zamalek mural 🖌️ Started the final layer of the Nile scene today. Working with natural pigments mixed with acrylics to get that earthy depth. The Arabic text is a line from Naguib Mahfouz.',
    tags: ['#WIP', '#Mural', '#Calligraphy', '#Cairo'],
    imageColor: '#db9630',
    imageLabel: 'Mural Progress — Day 3',
    likes: 378,
    comments: 61,
    shares: 19,
    hasVideo: false,
    liked: false,
  },
  {
    id: 4,
    author: 'Laila Mansour',
    authorColor: '#a84f22',
    initials: 'LM',
    university: 'MSA — Digital Media',
    time: '2d ago',
    content: 'Finally finished the accessibility audit for our Arabic-first design system 📱 Key finding: most Egyptian apps have a 34% higher error rate for RTL form inputs. Here\'s the component I redesigned to fix it ↓',
    tags: ['#WIP', '#UXUI', '#Accessibility', '#ArabicDesign'],
    imageColor: '#21326c',
    imageLabel: 'RTL Form Component Redesign',
    likes: 211,
    comments: 38,
    shares: 55,
    hasVideo: false,
    liked: false,
  },
];

const CHAT_CONTACTS = [
  { id: 1, name: 'Nour El-Sayed', initials: 'NE', color: '#21326c', lastMsg: 'Sure, I can share the V-Ray files...', time: '10:32 AM', unread: 2, online: true },
  { id: 2, name: 'Al-Safwa Developments', initials: 'AS', color: '#c4622d', lastMsg: 'Great renders! Can you adjust...', time: '9:15 AM', unread: 0, online: false },
  { id: 3, name: 'Karim Ashraf', initials: 'KA', color: '#db9630', lastMsg: 'Sent the final brand guide PDF', time: 'Yesterday', unread: 0, online: true },
  { id: 4, name: 'Shifa Digital', initials: 'SD', color: '#21326c', lastMsg: 'When can we schedule a call?', time: 'Yesterday', unread: 1, online: false },
];

const CHAT_MESSAGES = [
  { id: 1, from: 'them', text: 'Hi Nour! I just reviewed your portfolio — absolutely love your interior renders. Can you share the V-Ray project files for the hotel lobby concept?', time: '9:45 AM' },
  { id: 2, from: 'me', text: 'Thank you so much! Really glad you liked it. I can share the files, but I normally send the finished renders as a View-Only PDF first so the composition is locked before handing over assets. Does that work for you?', time: '9:52 AM' },
  { id: 3, from: 'them', text: 'That actually makes perfect sense — especially at this early stage. Go ahead with the PDF first, we\'ll review internally and get back to you.', time: '10:01 AM' },
  { id: 4, from: 'me', text: 'Perfect. Also I\'ll apply a watermark with your company name so the images are protected during review. Sending now 📎', time: '10:04 AM' },
  { id: 5, from: 'them', text: 'Great. We also need a few tweaks on the material palette — the marble in the living room feels too cold. Something warmer?', time: '10:18 AM' },
  { id: 6, from: 'me', text: 'Absolutely — I was thinking travertine or a warm Sinai marble. I\'ll prepare 3 material options and send swatches this afternoon.', time: '10:32 AM' },
];

// ─── SHARED COMPONENTS ───────────────────────────────────────────────────────

function Avatar({ initials, color, size = 'md', online = false }) {
  const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-14 h-14 text-base', xl: 'w-20 h-20 text-xl' };
  return (
    <div className="relative inline-block">
      <div
        className={`${sizes[size]} rounded-full flex items-center justify-center font-bold text-white flex-shrink-0`}
        style={{ background: color }}
      >
        {initials}
      </div>
      {online && (
        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white rounded-full" />
      )}
    </div>
  );
}

function VerifiedBadge({ isGrad = false }) {
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full badge-pulse`}
    style={isGrad ? { background: '#fdf0d3', color: '#21326c', borderColor: '#e4ae50' } : { background: '#21326c', color: '#ffffff', borderColor: '#21326c' }}>
      {isGrad ? <TrendingUp size={10} /> : <CheckCircle size={10} />}
      {isGrad ? 'Rising Talent (Grad)' : 'Verified Student'}
    </span>
  );
}

function StarRating({ rating }) {
  return (
    <span className="flex items-center gap-1">
      <Star size={13} fill="#db9630" color="#db9630" />
      <span className="text-sm font-semibold text-[#21326c]">{rating}</span>
    </span>
  );
}

function PortfolioBlock({ color, label, height = 'medium' }) {
  const heights = { short: 'h-24', medium: 'h-36', tall: 'h-48' };
  return (
    <div
      className={`portfolio-card ${heights[height]} rounded-xl flex items-end p-3 cursor-pointer overflow-hidden`}
      style={{ background: `linear-gradient(160deg, ${color}cc, ${color})` }}
    >
      <span className="text-white text-xs font-medium leading-tight bg-black/20 rounded-lg px-2 py-1">
        {label}
      </span>
    </div>
  );
}

function CategoryPill({ label, icon: Icon, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-all duration-200 whitespace-nowrap`}
      style={{
        backgroundColor: active ? '#ff9044' : '#21326c',
        color: '#ffffff',
        borderColor: active ? '#ff9044' : '#21326c'
      }}
    >
      {Icon && <Icon size={15} />}
      {label}
    </button>
  );
}

function Modal({ open, onClose, title, children, wide = false }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop" onClick={onClose}>
      <div
        className={`bg-white rounded-2xl shadow-2xl w-full ${wide ? 'max-w-2xl' : 'max-w-lg'} max-h-[90vh] overflow-y-auto animate-fade-in`}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-[#21326c]/20">
          <h2 className="text-xl font-bold text-[#21326c]">{title}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-[#21326c]/5 flex items-center justify-center hover:bg-[#21326c]/10 transition-colors">
            <X size={16} className="text-[#21326c]" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

// ─── NAVIGATION / HEADER ──────────────────────────────────────────────────────

function TopNav({ view, setView }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'jobs', label: 'Job Board', icon: Briefcase },
    { id: 'directory', label: 'Talent', icon: Users },
    { id: 'feed', label: 'Feed', icon: Grid },
    { id: 'chat', label: 'Messages', icon: MessageSquare },
  ];

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
              <span className="text-xs text-[#21326c] font-arabic mr-1 block leading-none" style={{ fontFamily: 'Noto Naskh Arabic' }}>لون</span>
            </div>
          </button>

          {/* Search */}
          <div className="hidden sm:flex flex-1 max-w-md relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#21326c]" />
            <input
              type="text"
              placeholder="What creative service do you need today?"
              className="w-full pl-9 pr-4 py-2 text-sm rounded-full border border-[#21326c]/20 bg-[#21326c]/5 focus:ring-2 focus:ring-[#21326c] focus:border-[#21326c] transition-all text-[#21326c] placeholder:text-[#21326c]"
            />
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  view === item.id ? 'bg-[#21326c]/10 text-[#21326c]' : 'text-[#21326c] hover:bg-[#21326c]/5'
                }`}
              >
                <item.icon size={15} />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-[#21326c] px-3 py-2 rounded-lg hover:bg-[#21326c]/5 transition-colors">
              <GraduationCap size={16} />
              <span className="hidden lg:inline">Become a Student</span>
            </button>
            <button className="hidden sm:flex text-sm font-medium text-[#21326c] px-3 py-2 rounded-lg hover:bg-[#21326c]/5 transition-colors">Log In</button>
            <button
              onClick={() => setView('jobs')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95"
              style={{ background: '#ff9044' }}
            >
              <Plus size={15} />
              <span>Post a Job</span>
            </button>
            <button className="relative md:hidden p-2 rounded-lg hover:bg-[#21326c]/5 text-[#21326c]" onClick={() => setMenuOpen(!menuOpen)}>
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
          </div>
        )}
      </div>
    </header>
  );
}

// ─── VIEW 1: HOME PAGE ────────────────────────────────────────────────────────

function HomePage({ setView, setSelectedTalent }) {
  const [activeCategory, setActiveCategory] = useState('all');

  const categories = [
    { id: 'all', label: 'All Categories', icon: Sparkles },
    { id: 'arch', label: 'Architecture & Interiors', icon: Building2 },
    { id: 'visual', label: 'Visuals & Branding', icon: Palette },
    { id: 'arts', label: 'Fine Arts & Illustration', icon: Pen },
  ];

  const filteredTalents = activeCategory === 'all' ? TALENTS : TALENTS.filter(t => {
    if (activeCategory === 'arch') return t.dept.includes('Interior') || t.dept.includes('Architecture') || t.dept.includes('Urban');
    if (activeCategory === 'visual') return t.dept.includes('Graphic') || t.dept.includes('UI') || t.dept.includes('Media');
    if (activeCategory === 'arts') return t.dept.includes('Sculpture') || t.dept.includes('Calligraphy') || t.dept.includes('Painting');
    return true;
  });

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <section className="hero-pattern py-16 sm:py-24 px-4 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-8 right-8 w-64 h-64 rounded-full opacity-5" style={{ background: '#21326c', filter: 'blur(60px)' }} />
          <div className="absolute bottom-8 left-8 w-48 h-48 rounded-full opacity-5" style={{ background: '#c4622d', filter: 'blur(50px)' }} />
        </div>
        <div className="max-w-7xl mx-auto">
          <div className="max-w-2xl">
            
            <h1 className="font-display text-5xl sm:text-6xl font-black leading-tight mb-4" style={{ color: '#21326c' }}>
              Empowering the next <br />
              <em className="not-italic" style={{ color: '#ff9044' }}>Generation</em> <br />
              Of Creators
            </h1>
            <p className="text-lg text-[#21326c] mb-8 leading-relaxed">
              Hire verified top-tier students for architecture, design, and fine arts. Exceptional creative work at honest rates — or let Lawnn pick your talent.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setView('jobs')}
                className="flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-white transition-all hover:opacity-90 shadow-lg"
                style={{ background: '#ff9044' }}
              >
                Post a Job <ArrowRight size={16} />
              </button>
              <button
                onClick={() => setView('directory')}
                className="flex items-center gap-2 px-6 py-3 rounded-full font-semibold bg-white border border-[#21326c]/30 hover:border-[#21326c] transition-all text-[#21326c]"
              >
                <Users size={16} /> Browse Talent
              </button>
            </div>
            <div className="flex items-center gap-6 mt-8 text-sm text-[#21326c]">
              <span className="flex items-center gap-1.5"><CheckCircle size={14} className="text-[#21326c]" /> 200+ Verified Students</span>
              <span className="flex items-center gap-1.5"><Building2 size={14} className="text-[#21326c]" /> 12 Faculties</span>
              <span className="flex items-center gap-1.5"><Star size={14} fill="#db9630" color="#db9630" /> 4.9 Avg. Rating</span>
            </div>
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
            'Newgiza Fine Arts', 
            'Ain Shams Architecture'
        ].concat([
            'Helwan Fine Arts', 
            'GUC Applied Arts', 
            'AUC Architecture & Fine Arts', 
            'MSA Arts and Design', 
            'AASTMT Arts and Design', 
            'Newgiza Fine Arts', 
            'Ain Shams Architecture'
        ]).map((u, i) => (
            <span key={i} className="flex items-center gap-2 flex-shrink-0">
                <GraduationCap size={14} />
                {u}
            </span>
        ))}
    </div>
</div>

      {/* Categories & Talent Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-2xl font-bold text-[#21326c]">Trending Talent</h2>
          <button onClick={() => setView('directory')} className="text-sm font-medium text-[#21326c] flex items-center gap-1 hover:opacity-80">
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
              onClick={() => { setSelectedTalent(talent); setView('profile'); }}
            />
          ))}
        </div>
      </section>

      {/* VIP Concierge Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
        <div className="rounded-2xl p-8 relative overflow-hidden" style={{ background: '#21326c' }}>
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10" style={{ background: '#db9630', filter: 'blur(60px)', transform: 'translate(30%, -30%)' }} />
          <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="text-white">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={18} className="text-yellow-400" />
                <span className="text-yellow-400 font-semibold text-sm">VIP Concierge</span>
              </div>
              <h3 className="font-display text-3xl font-bold mb-2 text-white">Let Lawnn do the search</h3>
              <p className="leading-relaxed max-w-lg text-white/80">
                Post your job with VIP Concierge (+200 EGP) and our team hand-picks the top 3 matching students for you. No scrolling, no guesswork — just curated talent delivered.
              </p>
            </div>
            <button
              onClick={() => setView('jobs')}
              className="flex-shrink-0 flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition-all hover:opacity-90"
              style={{ background: '#ff9044', color: '#fff' }}
            >
              <Zap size={16} /> Post with VIP
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function TalentCard({ talent, onClick }) {
  return (
    <div
      className="talent-card bg-white rounded-2xl border border-[#21326c]/10 overflow-hidden cursor-pointer"
      onClick={onClick}
    >
      {/* Mini portfolio preview */}
      <div className="grid grid-cols-3 gap-0.5 h-28">
        {talent.portfolio.slice(0, 3).map((item, i) => (
          <div
            key={i}
            className="h-full flex items-end p-1.5"
            style={{ background: `linear-gradient(160deg, ${item.color}aa, ${item.color})` }}
          >
            {i === 0 && <span className="text-white text-xs font-medium truncate leading-tight bg-black/20 rounded px-1" style={{ fontSize: '9px' }}>{item.label}</span>}
          </div>
        ))}
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <Avatar initials={talent.initials} color={talent.avatarColor} size="md" />
            <div>
              <p className="font-semibold text-[#21326c] text-sm leading-tight">{talent.name}</p>
              <p className="text-xs text-[#21326c] leading-tight mt-0.5">{talent.university}</p>
            </div>
          </div>
          <StarRating rating={talent.rating} />
        </div>

        <div className="flex items-center gap-2 flex-wrap mb-3">
          <VerifiedBadge isGrad={talent.isGrad} />
          <span className="text-xs text-[#21326c]">{talent.reviews} reviews</span>
        </div>

        <div className="flex flex-wrap gap-1 mb-3">
          {talent.tags.map(tag => (
            <span key={tag} className="tag-pill">{tag}</span>
          ))}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-[#21326c]/10">
          <span className="text-sm font-semibold text-[#21326c]">
            <span className="text-xs font-normal text-[#21326c] mr-0.5">From</span>
            {talent.hourlyRate} EGP/hr
          </span>
          <span className="text-xs text-[#21326c]">{talent.completedJobs} jobs done</span>
        </div>
      </div>
    </div>
  );
}

// ─── VIEW 2: JOB BOARD ────────────────────────────────────────────────────────

function JobBoardPage({ setView, setSelectedJob }) {
  const [showPostModal, setShowPostModal] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [selectedJobForApply, setSelectedJobForApply] = useState(null);
  const [postForm, setPostForm] = useState({ title: '', brief: '', budget: '', vip: false });
  const [applyForm, setApplyForm] = useState({ note: '', samples: [] });
  const [filterCat, setFilterCat] = useState('all');
  const [postSuccess, setPostSuccess] = useState(false);

  const PORTFOLIO_SAMPLES = [
    { id: 'a', label: 'Villa Interior — New Cairo', color: '#c4622d' },
    { id: 'b', label: 'Co-working Space 3D Viz', color: '#21326c' },
    { id: 'c', label: 'Boutique Hotel Lobby', color: '#db9630' },
    { id: 'd', label: 'Restaurant Moodboard', color: '#21326c' },
    { id: 'e', label: 'Residential Kitchen Render', color: '#21326c' },
  ];

  const toggleSample = id => {
    setApplyForm(f => ({
      ...f,
      samples: f.samples.includes(id)
        ? f.samples.filter(s => s !== id)
        : f.samples.length < 3 ? [...f.samples, id] : f.samples,
    }));
  };

  const handlePost = () => {
    setPostSuccess(true);
    setTimeout(() => { setShowPostModal(false); setPostSuccess(false); }, 2000);
  };

  const filteredJobs = filterCat === 'all' ? JOBS : JOBS.filter(j => j.category.toLowerCase().includes(filterCat));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-[#21326c]">Job Board</h1>
          <p className="text-[#21326c] mt-1">Live creative briefs from Egypt's top brands and agencies</p>
        </div>
        <button
          onClick={() => setShowPostModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-white shadow-md hover:opacity-90 transition-all"
          style={{ background: '#ff9044' }}
        >
          <Plus size={16} /> Post a Job
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-6">
        {[
          { id: 'all', label: 'All Jobs' },
          { id: 'architecture', label: 'Architecture & Interiors' },
          { id: 'visuals', label: 'Visuals & Branding' },
          { id: 'fine arts', label: 'Fine Arts' },
        ].map(f => (
          <CategoryPill key={f.id} label={f.label} active={filterCat === f.id} onClick={() => setFilterCat(f.id)} />
        ))}
      </div>

      {/* Job List */}
      <div className="grid gap-4">
        {filteredJobs.map(job => (
          <div
            key={job.id}
            className="job-card bg-white rounded-2xl border border-[#21326c]/10 p-6 cursor-pointer"
            onClick={() => setSelectedJob(job)}
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <h3 className="font-semibold text-[#21326c] text-lg leading-tight">{job.title}</h3>
                  {job.vip && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: '#fdf0d3', color: '#21326c', borderColor: '#e4ae50', border: '1px solid' }}>
                      <Sparkles size={10} /> VIP Concierge
                    </span>
                  )}
                </div>
                <p className="text-sm text-[#21326c] mb-3">{job.client} · {job.postedAgo}</p>
                <p className="text-sm text-[#21326c] mb-4 leading-relaxed line-clamp-2">{job.brief}</p>
                <div className="flex flex-wrap gap-1.5">
                  {job.tags.map(tag => (
                    <span key={tag} className="tag-pill">{tag}</span>
                  ))}
                </div>
              </div>
              <div className="sm:text-right flex-shrink-0">
                <div className="text-2xl font-bold text-[#21326c]">{job.budget} EGP{job.budgetType === '/hr' ? '/hr' : ''}</div>
                <div className="text-xs text-[#21326c] mt-0.5">{job.budgetType === 'Fixed' ? 'Fixed price' : 'Hourly'}</div>
                <div className="text-xs text-[#21326c] mt-2">{job.applicants} applicants</div>
                <button
                  className="mt-3 px-4 py-2 rounded-full text-sm font-semibold text-white transition-all hover:opacity-90"
                  style={{ background: '#ff9044' }}
                  onClick={e => { e.stopPropagation(); setSelectedJobForApply(job); setShowApplyModal(true); }}
                >
                  Apply Now
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* POST A JOB MODAL */}
      <Modal open={showPostModal} onClose={() => setShowPostModal(false)} title="Post a Creative Job" wide>
        {postSuccess ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-[#21326c]/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} className="text-[#21326c]" />
            </div>
            <h3 className="font-display text-xl font-bold text-[#21326c] mb-2">Job Posted!</h3>
            <p className="text-[#21326c]">Your brief is now live on the Lawnn job board.</p>
          </div>
        ) : (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-[#21326c] mb-1.5">Job Title *</label>
              <input
                type="text"
                placeholder="e.g. Brand Identity for F&B Startup"
                value={postForm.title}
                onChange={e => setPostForm(f => ({ ...f, title: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-[#21326c]/20 text-[#21326c] text-sm focus:ring-2 focus:ring-[#21326c] focus:border-[#21326c] transition-all placeholder:text-[#21326c]"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#21326c] mb-1.5">Project Brief *</label>
              <textarea
                rows={4}
                placeholder="Describe your project — what you need, style preferences, deliverables, timeline..."
                value={postForm.brief}
                onChange={e => setPostForm(f => ({ ...f, brief: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-[#21326c]/20 text-[#21326c] text-sm focus:ring-2 focus:ring-[#21326c] focus:border-[#21326c] transition-all resize-none placeholder:text-[#21326c]"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#21326c] mb-1.5">Budget (EGP) *</label>
              <div className="relative">
                <DollarSign size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#21326c]" />
                <input
                  type="number"
                  placeholder="e.g. 3500"
                  value={postForm.budget}
                  onChange={e => setPostForm(f => ({ ...f, budget: e.target.value }))}
                  className="w-full pl-9 pr-4 py-3 rounded-xl border border-[#21326c]/20 text-[#21326c] text-sm focus:ring-2 focus:ring-[#21326c] focus:border-[#21326c] transition-all placeholder:text-[#21326c]"
                />
              </div>
            </div>

            {/* VIP Toggle */}
            <div
              className={`rounded-xl border-2 p-4 cursor-pointer transition-all ${postForm.vip ? 'border-yellow-400 bg-yellow-50' : 'border-[#21326c]/10 bg-[#21326c]/5'}`}
              onClick={() => setPostForm(f => ({ ...f, vip: !f.vip }))}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Sparkles size={20} className={postForm.vip ? 'text-yellow-500' : 'text-[#21326c]'} />
                  <div>
                    <p className="font-semibold text-[#21326c] text-sm">VIP Concierge (+200 EGP)</p>
                    <p className="text-xs text-[#21326c] mt-0.5">Let Lawnn hand-pick the top 3 matching students for your project</p>
                  </div>
                </div>
                <div className={`w-11 h-6 rounded-full transition-colors flex items-center px-0.5 ${postForm.vip ? 'bg-yellow-400' : 'bg-[#21326c]/30'}`}>
                  <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${postForm.vip ? 'translate-x-5' : 'translate-x-0'}`} />
                </div>
              </div>
            </div>

            <button
              onClick={handlePost}
              disabled={!postForm.title || !postForm.brief || !postForm.budget}
              className="w-full py-3 rounded-xl font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: '#ff9044' }}
            >
              {postForm.vip ? `Post Job — ${(parseInt(postForm.budget || 0) + 200).toLocaleString()} EGP total` : 'Post Job'}
            </button>
          </div>
        )}
      </Modal>

      {/* APPLY MODAL */}
      <Modal
        open={showApplyModal}
        onClose={() => { setShowApplyModal(false); setApplyForm({ note: '', samples: [] }); }}
        title={`Apply: ${selectedJobForApply?.title || ''}`}
        wide
      >
        <div className="space-y-5">
          <div className="bg-[#21326c]/5 rounded-xl p-4 border border-[#21326c]/10">
            <p className="text-sm font-medium text-[#21326c] mb-1">{selectedJobForApply?.client}</p>
            <p className="text-xs text-[#21326c] leading-relaxed">{selectedJobForApply?.brief}</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#21326c] mb-1.5">Your Application Note</label>
            <textarea
              rows={4}
              placeholder="Tell the client why you're the right fit. Mention relevant experience, your approach, and estimated timeline..."
              value={applyForm.note}
              onChange={e => setApplyForm(f => ({ ...f, note: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-[#21326c]/20 text-[#21326c] text-sm focus:ring-2 focus:ring-[#21326c] resize-none placeholder:text-[#21326c]"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#21326c] mb-1">Select up to 3 Portfolio Samples</label>
            <p className="text-xs text-[#21326c] mb-3">Choose pieces that best match this brief</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {PORTFOLIO_SAMPLES.map(sample => {
                const selected = applyForm.samples.includes(sample.id);
                return (
                  <div
                    key={sample.id}
                    onClick={() => toggleSample(sample.id)}
                    className={`relative rounded-xl cursor-pointer overflow-hidden border-2 transition-all ${selected ? 'border-[#21326c]' : 'border-transparent'}`}
                  >
                    <div
                      className="h-20 flex items-end p-2"
                      style={{ background: `linear-gradient(160deg, ${sample.color}aa, ${sample.color})` }}
                    >
                      <span className="text-white font-medium leading-tight" style={{ fontSize: '9px' }}>{sample.label}</span>
                    </div>
                    {selected && (
                      <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-[#21326c] flex items-center justify-center">
                        <CheckCircle size={12} color="white" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-[#21326c] mt-2">{applyForm.samples.length}/3 selected</p>
          </div>

          <button
            disabled={!applyForm.note || applyForm.samples.length === 0}
            className="w-full py-3 rounded-xl font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: '#ff9044' }}
          >
            Submit Application
          </button>
        </div>
      </Modal>
    </div>
  );
}

// ─── VIEW 3: TALENT DIRECTORY ─────────────────────────────────────────────────

function DirectoryPage({ setView, setSelectedTalent }) {
  const [filters, setFilters] = useState({ university: 'all', year: 'all', dept: 'all' });
  const [search, setSearch] = useState('');

  const universities = ['all', 'Helwan University', 'GUC', 'AUC', 'Cairo University', 'MSA'];
  const depts = ['all', 'Interior Architecture', 'Graphic Design & Branding', 'UI/UX Design', 'Urban Design', 'Sculpture & Ceramics', 'Calligraphy & Painting'];

  const filtered = TALENTS.filter(t => {
    const matchUniv = filters.university === 'all' || t.university.includes(filters.university);
    const matchDept = filters.dept === 'all' || t.dept === filters.dept;
    const matchSearch = !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()));
    return matchUniv && matchDept && matchSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Filters */}
        <aside className="lg:w-64 flex-shrink-0">
          <div className="bg-white rounded-2xl border border-[#21326c]/10 p-5 sticky top-24">
            <h3 className="font-semibold text-[#21326c] mb-4 flex items-center gap-2">
              <Filter size={16} /> Filters
            </h3>

            <div className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-[#21326c] uppercase tracking-wider mb-2">University</label>
                <select
                  value={filters.university}
                  onChange={e => setFilters(f => ({ ...f, university: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none"
                  style={{ backgroundColor: '#21326c', color: '#ffffff', borderColor: '#21326c' }}
                >
                  {universities.map(u => <option key={u} value={u}>{u === 'all' ? 'All Universities' : u}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#21326c] uppercase tracking-wider mb-2">Department</label>
                <select
                  value={filters.dept}
                  onChange={e => setFilters(f => ({ ...f, dept: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg text-sm focus:outline-none"
                  style={{ backgroundColor: '#21326c', color: '#ffffff', borderColor: '#21326c' }}
                >
                  {depts.map(d => <option key={d} value={d}>{d === 'all' ? 'All Departments' : d}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#21326c] uppercase tracking-wider mb-2">Status</label>
                <div className="space-y-2">
                  {['All', 'Current Students', 'Recent Graduates'].map(s => (
                    <label key={s} className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="status" defaultChecked={s === 'All'} className="accent-[#21326c]" />
                      <span className="text-sm text-[#21326c]">{s}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#21326c] uppercase tracking-wider mb-2">Min. Rating</label>
                <div className="flex items-center gap-2">
                  {[4.5, 4.7, 4.9].map(r => (
                    <button key={r} className="flex-1 py-1.5 rounded-lg text-xs font-medium border border-[#21326c]/20 hover:border-[#21326c] hover:bg-[#21326c]/5 transition-colors text-[#21326c]">
                      {r}+
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Grid */}
        <div className="flex-1">
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#21326c]" />
              <input
                type="text"
                placeholder="Search by name, skill, or style..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-full border border-[#21326c]/20 text-[#21326c] text-sm focus:ring-2 focus:ring-[#21326c] transition-all placeholder:text-[#21326c]"
              />
            </div>
            <span className="text-sm text-[#21326c] flex-shrink-0">{filtered.length} talents</span>
          </div>

          <div className="grid gap-5">
            {filtered.map(talent => (
              <DirectoryCard
                key={talent.id}
                talent={talent}
                onClick={() => { setSelectedTalent(talent); setView('profile'); }}
              />
            ))}
            {filtered.length === 0 && (
              <div className="text-center py-16 text-[#21326c]">
                <Users size={40} className="mx-auto mb-3 opacity-30" />
                <p>No talents match your filters</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DirectoryCard({ talent, onClick }) {
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
            <div className="flex items-center gap-3 mt-2">
              <StarRating rating={talent.rating} />
              <span className="text-xs text-[#21326c]">{talent.reviews} reviews</span>
              <span className="text-xs text-[#21326c]">{talent.completedJobs} jobs done</span>
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              {talent.tags.map(tag => (
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
              className="h-16 rounded-lg"
              style={{ background: `linear-gradient(160deg, ${item.color}aa, ${item.color})` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── VIEW 4: PROFILE PAGE ─────────────────────────────────────────────────────

function ProfilePage({ talent, setView }) {
  const [showHireTooltip, setShowHireTooltip] = useState(false);

  if (!talent) return null;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      {/* Back */}
      <button
        onClick={() => setView('directory')}
        className="flex items-center gap-2 text-sm text-[#21326c] hover:opacity-80 mb-6 transition-colors"
      >
        <ChevronLeft size={16} /> Back to Directory
      </button>

      {/* Hero */}
      <div className="bg-white rounded-2xl border border-[#21326c]/10 overflow-hidden mb-6">
        {/* Cover */}
        <div className="h-32 sm:h-44" style={{ background: `linear-gradient(135deg, ${talent.avatarColor}33, ${talent.avatarColor}88)` }} />

        <div className="px-6 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 -mt-10 mb-4">
            <div className="flex items-end gap-4">
              <div
                className="w-20 h-20 rounded-2xl border-4 border-white flex items-center justify-center text-white text-xl font-bold shadow-md"
                style={{ background: talent.avatarColor }}
              >
                {talent.initials}
              </div>
              <div className="pb-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="font-display text-2xl font-bold text-[#21326c]">{talent.name}</h1>
                  <VerifiedBadge isGrad={talent.isGrad} />
                </div>
                <p className="text-sm text-[#21326c]">{talent.university} · {talent.dept}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => {/* setView('chat') */}}
                className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#21326c]/30 text-sm font-semibold text-[#21326c] hover:bg-[#21326c]/5 transition-colors"
              >
                <MessageSquare size={15} /> Message
              </button>

              {talent.isGrad && (
                <div className="relative tooltip">
                  <button
                    className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-white transition-all hover:opacity-90"
                    style={{ background: '#ff9044' }}
                  >
                    <UserPlus size={15} /> Hire Full-Time
                  </button>
                  <span className="tooltip-text">
                    Full-time recruitment incurs a 1-month salary headhunter fee, billed upon successful placement. Managed by Lawnn.
                  </span>
                </div>
              )}

              <button
                className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-white transition-all hover:opacity-90"
                style={{ background: '#ff9044' }}
              >
                Hire for Project
              </button>
            </div>
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-6 flex-wrap text-sm mb-5">
            <StarRating rating={talent.rating} />
            <span className="text-[#21326c]">{talent.reviews} reviews</span>
            <span className="text-[#21326c]">{talent.completedJobs} projects completed</span>
            <span className="font-semibold text-[#21326c]">{talent.hourlyRate} EGP/hr</span>
          </div>

          {/* Bio */}
          <p className="text-[#21326c] leading-relaxed mb-5 max-w-2xl">{talent.bio}</p>

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {talent.tags.map(tag => (
              <span key={tag} className="tag-pill text-sm px-3 py-1">{tag}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CV sidebar */}
        <div className="space-y-4">
          {/* Education */}
          <div className="bg-white rounded-2xl border border-[#21326c]/10 p-5">
            <h3 className="font-semibold text-[#21326c] mb-4 flex items-center gap-2">
              <GraduationCap size={16} className="text-[#21326c]" /> Education
            </h3>
            <div className="space-y-3">
              {talent.education.map((edu, i) => (
                <div key={i} className="border-l-2 border-[#21326c]/20 pl-3">
                  <p className="text-sm font-semibold text-[#21326c]">{edu.degree}</p>
                  <p className="text-xs text-[#21326c]">{edu.school}</p>
                  <p className="text-xs text-[#21326c] mt-0.5">{edu.years}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Experience */}
          <div className="bg-white rounded-2xl border border-[#21326c]/10 p-5">
            <h3 className="font-semibold text-[#21326c] mb-4 flex items-center gap-2">
              <Briefcase size={16} className="text-[#21326c]" /> Experience
            </h3>
            <div className="space-y-3">
              {talent.experience.map((exp, i) => (
                <div key={i} className="border-l-2 pl-3" style={{ borderColor: '#c4622d' }}>
                  <p className="text-sm font-semibold text-[#21326c]">{exp.role}</p>
                  <p className="text-xs text-[#21326c]">{exp.company}</p>
                  <p className="text-xs text-[#21326c] mt-0.5">{exp.years}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Grad Notice */}
          {talent.isGrad && (
            <div className="rounded-2xl p-4 border" style={{ background: '#fffcf4', borderColor: '#e4ae50' }}>
              <div className="flex items-start gap-2">
                <Info size={15} className="flex-shrink-0 mt-0.5" style={{ color: '#db9630' }} />
                <p className="text-xs leading-relaxed text-[#21326c]">
                  <strong>Graduate Profile:</strong> This talent graduated and is available for freelance projects and full-time opportunities for up to 12 months from graduation. After that, profiles are archived.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Portfolio Masonry */}
        <div className="lg:col-span-2">
          <h3 className="font-semibold text-[#21326c] mb-4 flex items-center gap-2">
            <ImageIcon size={16} className="text-[#21326c]" /> Portfolio
            <span className="text-xs text-[#21326c] font-normal">(view only)</span>
          </h3>
          <div className="masonry-grid">
            {talent.portfolio.map((item, i) => (
              <PortfolioBlock key={i} color={item.color} label={item.label} height={item.h} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── VIEW 5: SOCIAL FEED ─────────────────────────────────────────────────────

function FeedPage() {
  const [posts, setPosts] = useState(FEED_POSTS);
  const [newPost, setNewPost] = useState('');

  const toggleLike = id => {
    setPosts(ps => ps.map(p =>
      p.id === id ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 } : p
    ));
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-[#21326c] mb-1">Student Feed</h1>
        <p className="text-[#21326c] text-sm">Follow the creative process — <span className="font-semibold text-[#21326c]">#WIP</span> work from Egypt's top talents</p>
      </div>

      {/* New Post */}
      <div className="bg-white rounded-2xl border border-[#21326c]/10 p-4 mb-6">
        <div className="flex gap-3">
          <Avatar initials="YF" color="#db9630" size="md" />
          <div className="flex-1">
            <textarea
              rows={2}
              placeholder="Share your work in progress... #WIP"
              value={newPost}
              onChange={e => setNewPost(e.target.value)}
              className="w-full text-[#21326c] text-sm resize-none border-0 focus:outline-none placeholder:text-[#21326c] bg-transparent"
            />
            <div className="flex items-center justify-between pt-3 border-t border-[#21326c]/10">
              <div className="flex gap-2">
                <button className="p-2 rounded-lg hover:bg-[#21326c]/5 text-[#21326c] transition-colors">
                  <Camera size={16} />
                </button>
                <button className="p-2 rounded-lg hover:bg-[#21326c]/5 text-[#21326c] transition-colors">
                  <Video size={16} />
                </button>
                <button className="p-2 rounded-lg hover:bg-[#21326c]/5 text-[#21326c] transition-colors">
                  <Hash size={16} />
                </button>
              </div>
              <button
                disabled={!newPost.trim()}
                className="px-4 py-1.5 rounded-full text-sm font-semibold text-white disabled:opacity-40 transition-all"
                style={{ background: '#ff9044' }}
              >
                Share
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Feed */}
      <div className="space-y-5">
        {posts.map(post => (
          <FeedPost key={post.id} post={post} onLike={() => toggleLike(post.id)} />
        ))}
      </div>
    </div>
  );
}

function FeedPost({ post, onLike }) {
  const [showComments, setShowComments] = useState(false);

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
          <button className="p-2 rounded-lg hover:bg-[#21326c]/5 text-[#21326c] transition-colors">
            <MoreHorizontal size={16} />
          </button>
        </div>

        <p className="text-sm text-[#21326c] leading-relaxed mt-3 mb-2">{post.content}</p>

        <div className="flex flex-wrap gap-1.5 mb-3">
          {post.tags.map(tag => (
            <span key={tag} className="text-xs font-medium text-[#21326c] cursor-pointer hover:underline">{tag}</span>
          ))}
        </div>
      </div>

      {/* Image / Video */}
      <div
        className="relative mx-5 mb-4 rounded-xl overflow-hidden h-52 flex items-center justify-center"
        style={{ background: `linear-gradient(160deg, ${post.imageColor}aa, ${post.imageColor})` }}
      >
        <span className="text-white font-medium text-sm bg-black/20 px-3 py-1.5 rounded-lg">{post.imageLabel}</span>
        {post.hasVideo && (
          <button className="absolute inset-0 flex items-center justify-center">
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

      {/* Actions */}
      <div className="px-5 pb-4">
        <div className="flex items-center gap-1 mb-3">
          <div className="flex -space-x-1">
            {['#21326c', '#c4622d', '#db9630'].map((c, i) => (
              <div key={i} className="w-5 h-5 rounded-full border-2 border-white" style={{ background: c }} />
            ))}
          </div>
          <span className="text-xs text-[#21326c] ml-1">{post.likes} likes</span>
          <span className="text-xs text-[#21326c] ml-2">{post.comments} comments</span>
        </div>

        <div className="flex items-center gap-1 border-t border-[#21326c]/10 pt-3">
          <button
            onClick={onLike}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex-1 justify-center ${
              post.liked ? 'text-red-500 bg-red-50' : 'text-[#21326c] hover:bg-[#21326c]/5'
            }`}
          >
            <Heart size={16} fill={post.liked ? '#ef4444' : 'none'} />
            Like
          </button>
          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-[#21326c] hover:bg-[#21326c]/5 transition-colors flex-1 justify-center"
          >
            <MessageCircle size={16} /> Comment
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-[#21326c] hover:bg-[#21326c]/5 transition-colors flex-1 justify-center">
            <Share2 size={16} /> Share
          </button>
        </div>

        {showComments && (
          <div className="mt-3 pt-3 border-t border-[#21326c]/10">
            <div className="flex gap-2">
              <Avatar initials="YF" color="#db9630" size="sm" />
              <input
                type="text"
                placeholder="Add a comment..."
                className="flex-1 text-sm px-3 py-2 rounded-full bg-[#21326c]/5 border-0 focus:outline-none focus:ring-2 focus:ring-[#21326c] text-[#21326c] placeholder:text-[#21326c]"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── VIEW 6: CHAT ─────────────────────────────────────────────────────────────

function ChatPage() {
  const [activeContact, setActiveContact] = useState(CHAT_CONTACTS[0]);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState(CHAT_MESSAGES);
  const [showFileMenu, setShowFileMenu] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);

  const sendMessage = () => {
    if (!message.trim()) return;
    setMessages(m => [...m, { id: Date.now(), from: 'me', text: message, time: 'Now' }]);
    setMessage('');
  };

  const FILE_OPTIONS = [
    { icon: Upload, label: 'Standard Upload', desc: 'Recipient can download', color: '#21326c' },
    { icon: Eye, label: 'View Only PDF', desc: 'No download allowed', color: '#c4622d' },
    { icon: Stamp, label: 'Apply Watermark', desc: 'Add protection overlay', color: '#db9630' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 animate-fade-in">
      <div className="bg-white rounded-2xl border border-[#21326c]/10 overflow-hidden" style={{ height: 'calc(100vh - 160px)', minHeight: '500px' }}>
        <div className="flex h-full">
          {/* Contacts Sidebar */}
          <div className={`${showSidebar ? 'flex' : 'hidden'} sm:flex flex-col w-full sm:w-72 border-r border-[#21326c]/10 flex-shrink-0`}>
            <div className="p-4 border-b border-[#21326c]/10">
              <h2 className="font-semibold text-[#21326c] mb-3">Messages</h2>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#21326c]" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  className="w-full pl-8 pr-4 py-2 text-sm rounded-full bg-[#21326c]/5 text-[#21326c] placeholder:text-[#21326c] focus:outline-none"
                />
              </div>
            </div>

            <div className="overflow-y-auto flex-1">
              {CHAT_CONTACTS.map(contact => (
                <button
                  key={contact.id}
                  onClick={() => { setActiveContact(contact); setShowSidebar(false); }}
                  className={`w-full flex items-center gap-3 p-4 hover:bg-[#21326c]/5 transition-colors text-left ${
                    activeContact.id === contact.id ? 'bg-[#21326c]/10 border-l-3' : ''
                  }`}
                  style={activeContact.id === contact.id ? { borderLeft: '3px solid #21326c' } : {}}
                >
                  <Avatar initials={contact.initials} color={contact.color} size="md" online={contact.online} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="text-sm font-semibold text-[#21326c] truncate">{contact.name}</p>
                      <span className="text-xs text-[#21326c] flex-shrink-0 ml-1">{contact.time}</span>
                    </div>
                    <p className="text-xs text-[#21326c] truncate">{contact.lastMsg}</p>
                  </div>
                  {contact.unread > 0 && (
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: '#21326c' }}>
                      {contact.unread}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Chat Area */}
          <div className={`${!showSidebar ? 'flex' : 'hidden'} sm:flex flex-col flex-1 min-w-0`}>
            {/* Chat Header */}
            <div className="flex items-center gap-3 p-4 border-b border-[#21326c]/10">
              <button
                onClick={() => setShowSidebar(true)}
                className="sm:hidden p-1 rounded-lg hover:bg-[#21326c]/5"
              >
                <ChevronLeft size={18} className="text-[#21326c]" />
              </button>
              <Avatar initials={activeContact.initials} color={activeContact.color} size="md" online={activeContact.online} />
              <div>
                <p className="font-semibold text-[#21326c] text-sm">{activeContact.name}</p>
                <p className="text-xs text-[#21326c]">{activeContact.online ? 'Online now' : 'Last seen recently'}</p>
              </div>
              <div className="ml-auto flex gap-2">
                <button className="p-2 rounded-lg hover:bg-[#21326c]/5 text-[#21326c] transition-colors">
                  <Shield size={16} />
                </button>
                <button className="p-2 rounded-lg hover:bg-[#21326c]/5 text-[#21326c] transition-colors">
                  <MoreHorizontal size={16} />
                </button>
              </div>
            </div>

            {/* Security Notice */}
            <div className="mx-4 mt-3 px-3 py-2 rounded-xl text-xs text-center" style={{ background: '#f0f4ff', color: '#21326c' }}>
              <Lock size={11} className="inline mr-1" />
              End-to-end encrypted · File sharing managed by Lawnn Secure Vault
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.from === 'me' ? 'justify-end' : 'justify-start'}`}>
                  {msg.from === 'them' && (
                    <Avatar initials={activeContact.initials} color={activeContact.color} size="sm" />
                  )}
                  <div className={`max-w-xs sm:max-w-sm mx-2 px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    msg.from === 'me'
                      ? 'bg-[#21326c] text-white rounded-br-sm'
                      : 'bg-[#21326c]/10 text-[#21326c] rounded-bl-sm'
                  }`}>
                    {msg.text}
                    <p className={`text-xs mt-1 ${msg.from === 'me' ? 'text-white/60' : 'text-[#21326c]/60'}`}>{msg.time}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-[#21326c]/10">
              <div className="flex items-end gap-2">
                {/* File Share Dropdown */}
                <div className="relative flex-shrink-0">
                  <button
                    onClick={() => setShowFileMenu(!showFileMenu)}
                    className="p-2.5 rounded-xl border border-[#21326c]/20 hover:bg-[#21326c]/5 text-[#21326c] transition-colors"
                  >
                    <Paperclip size={18} />
                  </button>

                  {showFileMenu && (
                    <div className="absolute bottom-12 left-0 bg-white rounded-2xl border border-[#21326c]/10 shadow-xl w-60 overflow-hidden z-50 animate-fade-in">
                      <div className="p-3 bg-[#21326c]/5 border-b border-[#21326c]/10">
                        <p className="text-xs font-semibold text-[#21326c]">Secure File Sharing</p>
                      </div>
                      {FILE_OPTIONS.map(opt => (
                        <button
                          key={opt.label}
                          onClick={() => setShowFileMenu(false)}
                          className="w-full flex items-center gap-3 p-3 hover:bg-[#21326c]/5 transition-colors text-left"
                        >
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${opt.color}20` }}>
                            <opt.icon size={15} style={{ color: opt.color }} />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-[#21326c]">{opt.label}</p>
                            <p className="text-xs text-[#21326c]">{opt.desc}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex-1 relative">
                  <textarea
                    rows={1}
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                    placeholder="Message..."
                    className="w-full px-4 py-2.5 rounded-2xl border border-[#21326c]/20 text-[#21326c] text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#21326c] transition-all placeholder:text-[#21326c]"
                    style={{ maxHeight: '100px' }}
                  />
                </div>

                <button
                  onClick={sendMessage}
                  disabled={!message.trim()}
                  className="p-2.5 rounded-xl text-white transition-all hover:opacity-90 disabled:opacity-40 flex-shrink-0"
                  style={{ background: '#ff9044' }}
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── ROOT APP ─────────────────────────────────────────────────────────────────

export default function App() {
  const [view, setView] = useState('home');
  const [selectedTalent, setSelectedTalent] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);

  const renderView = () => {
    switch (view) {
      case 'home':
        return <HomePage setView={setView} setSelectedTalent={setSelectedTalent} />;
      case 'jobs':
        return <JobBoardPage setView={setView} setSelectedJob={setSelectedJob} />;
      case 'directory':
        return <DirectoryPage setView={setView} setSelectedTalent={setSelectedTalent} />;
      case 'profile':
        return selectedTalent ? <ProfilePage talent={selectedTalent} setView={setView} /> : <DirectoryPage setView={setView} setSelectedTalent={setSelectedTalent} />;
      case 'feed':
        return <FeedPage />;
      case 'chat':
        return <ChatPage />;
      default:
        return <HomePage setView={setView} setSelectedTalent={setSelectedTalent} />;
    }
  };

  return (
    <div className="min-h-screen" style={{ background: '#fffcf4' }}>
      <TopNav view={view} setView={setView} />
      <main>{renderView()}</main>

      {/* Footer */}
      <footer className="mt-16 border-t border-[#21326c]/10 py-8 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-[#21326c]">
          <div className="flex items-center gap-2">
            <Droplets size={16} className="text-[#21326c]" />
            <span className="font-display font-bold text-[#21326c]">Lawnn</span>
            <span className="font-arabic text-[#21326c]" style={{ fontFamily: 'Noto Naskh Arabic' }}>لون</span>
            <span>— Egyptian Creative Talent Platform</span>
          </div>
          <div className="flex gap-4">
            <a href="#" className="hover:opacity-80 transition-colors">About</a>
            <a href="#" className="hover:opacity-80 transition-colors">For Students</a>
            <a href="#" className="hover:opacity-80 transition-colors">For Clients</a>
            <a href="#" className="hover:opacity-80 transition-colors">Privacy</a>
          </div>
        </div>
      </footer>
    </div>
  );
}