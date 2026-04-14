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
  BarChart2, Zap, Menu, ChevronLeft, ShoppingBag, Package, BadgeCheck,
  Trash2, MessageSquareText, UserCheck
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

// ─── AUTH / USER DATA ─────────────────────────────────────────────────────────

const MOCK_USERS = [
  { id: 1, email: 'nour@lawnn.com',   password: 'lawnn123',  role: 'student', name: 'Nour El-Sayed',        initials: 'NE', avatarColor: '#21326c', talentId: 1 },
  { id: 2, email: 'client@safwa.com', password: 'safwa2024', role: 'client',  name: 'Al-Safwa Dev.',        initials: 'AS', avatarColor: '#c4622d' },
  { id: 3, email: 'admin@lawnn.com',  password: 'admin2024', role: 'admin',   name: 'Lawnn Admin',          initials: 'LA', avatarColor: '#21326c' },
];

// ─── NEWS DATA ────────────────────────────────────────────────────────────────

const NEWS_POSTS = [
  {
    id: 1,
    title: 'How to Build a Standout Portfolio as an Art Student',
    excerpt: 'Your portfolio is your first impression. Here\'s how top Egyptian creative students structure their work to attract serious clients and opportunities.',
    author: 'Lawnn Team',
    date: 'April 8, 2026',
    category: 'Career Advice',
    readTime: '5 min read',
    color: '#21326c',
    body: [
      { type: 'paragraph', text: 'Your portfolio is the first thing any serious client will look at — and for most of them, it will be the last thing they look at before deciding whether to contact you or move on. This is not a school assignment. This is your business card, your pitch deck, and your professional reputation on one page.' },
      { type: 'heading', text: 'Quality over quantity — always' },
      { type: 'paragraph', text: 'A portfolio with six exceptional pieces will outperform one with twenty mediocre ones every single time. Clients are not scrolling through your archive for fun. They are trying to answer one question as fast as possible: can this person do what I need? If your weakest piece creates any doubt, cut it.' },
      { type: 'paragraph', text: 'Be ruthless. Show only the work you would be proud to present in a face-to-face meeting. If a project was a learning exercise and the result looks like one, leave it out. Your portfolio is a curated argument for your capabilities — not a complete record of everything you have ever made.' },
      { type: 'heading', text: 'Lead with your strongest piece' },
      { type: 'paragraph', text: 'The first project a visitor sees sets their expectation for everything that follows. Put your most impressive, most commercially relevant piece at the very top. Do not build up to it — open with it. Attention is scarce and first impressions are disproportionately powerful.' },
      { type: 'heading', text: 'Context is everything' },
      { type: 'paragraph', text: 'Do not just show images. Explain the brief, the thinking, and the decisions you made. Clients and studios do not just want to see what you produced — they want to understand how you work. A short paragraph per project explaining the client problem, your approach, and the outcome transforms a gallery into a case study.' },
      { type: 'list', items: [
        'What was the brief or problem you were solving?',
        'What constraints did you work within — budget, timeline, brand guidelines?',
        'What was the reasoning behind your key creative decisions?',
        'What was the result or client outcome?',
      ]},
      { type: 'heading', text: 'Tailor it for your audience' },
      { type: 'paragraph', text: 'If you are applying to a branding studio, lead with your brand identity and typography work. Approaching an interior design firm? Your space planning and 3D visualisation projects go first. Do not send the same portfolio to everyone. Spend ten minutes reordering and re-framing your projects for each opportunity — it makes a material difference to your response rate.' },
      { type: 'heading', text: 'Keep it current' },
      { type: 'paragraph', text: 'A portfolio showing only work from two years ago signals that you have stopped growing. Set a reminder every three months to review it. Add new work, remove pieces that no longer represent your best, and update any case studies with outcomes that emerged after the project ended. Your portfolio should be a living document.' },
      { type: 'paragraph', text: 'On Lawnn, your portfolio is visible to every client and studio on the platform. The students getting consistent, well-paid briefs are the ones who invest time in presentation — not just production.' },
    ],
  },
  {
    id: 2,
    title: 'Understanding Freelance Rates: A Guide for Egyptian Creatives',
    excerpt: 'Pricing your work is one of the hardest skills to learn. We break down how to set competitive, fair rates that respect your time and skill.',
    author: 'Lawnn Team',
    date: 'March 29, 2026',
    category: 'Business',
    readTime: '7 min read',
    color: '#c4622d',
    body: [
      { type: 'paragraph', text: 'Pricing is one of the most consequential skills a freelancer develops. Undercharge and you train clients to expect cheap work, exhaust yourself, and build a business that cannot sustain you. Overcharge without the portfolio to justify it and you lose opportunities you could have won. The goal is to find a rate that reflects your real value and attracts the right clients.' },
      { type: 'heading', text: 'Why most students undercharge' },
      { type: 'paragraph', text: 'The most common mistake is using personal financial pressure as a pricing anchor. You calculate what you need for rent and expenses and reverse-engineer a rate from there. This is not pricing — it is survival. Pricing should be based on the value you deliver to the client, not on what you personally need to get by.' },
      { type: 'paragraph', text: 'The second mistake is discounting your rate because you are a student. Your output is what the client is paying for. If your brand identity is as strong as a junior designer at an agency, it is worth as much — regardless of your year of study.' },
      { type: 'heading', text: 'The three components of a real rate' },
      { type: 'list', items: [
        'Your time: Estimate hours honestly. Include revisions, briefing calls, file preparation, and client communication — not just execution time.',
        'Your overhead: Software subscriptions, equipment depreciation, internet, and the time spent on admin and business development that does not directly bill.',
        'Your profit margin: This is not a bonus. Profit funds your growth — better equipment, courses, a studio space. Without it you are running a charity.',
      ]},
      { type: 'heading', text: 'Market benchmarks in Egypt (2026)' },
      { type: 'paragraph', text: 'These are approximate ranges based on current market conditions. Rates vary significantly based on portfolio strength, client type, and project complexity.' },
      { type: 'list', items: [
        'Logo design (single concept, 2 rounds of revisions): 1,500 – 4,000 EGP',
        'Full brand identity system (logo, typography, colour, mockups): 5,000 – 18,000 EGP',
        'Interior 3D visualisation per scene: 800 – 3,500 EGP',
        'UI/UX design per screen (wireframe to final): 200 – 600 EGP',
        'Motion graphics (15–30 second reel): 2,500 – 8,000 EGP',
        'Editorial illustration (A4 format, one revision): 500 – 2,000 EGP',
      ]},
      { type: 'heading', text: 'Fixed price vs. hourly rate' },
      { type: 'paragraph', text: 'For most projects, fixed-price quoting protects both parties. It forces you to scope clearly upfront and rewards efficiency. Hourly billing makes sense for open-ended consulting, ongoing retainers, or projects where the scope is genuinely impossible to define in advance. Never bill hourly on a project with a clear, defined deliverable — it creates friction and signals a lack of confidence in your estimation.' },
      { type: 'heading', text: 'How to handle negotiation' },
      { type: 'paragraph', text: 'When a client asks you to reduce your rate, do not simply agree. Instead, reduce the scope. "I can do the logo and primary colour palette at that budget, but the full brand system would need the original fee." This protects your rate structure, gives the client a real choice, and often results in them finding the budget they claimed not to have.' },
      { type: 'paragraph', text: 'Never apologise for your prices. State them clearly and let the silence sit. A client who respects your work will engage professionally. One who responds with pressure or dismissal is usually not the client you want.' },
    ],
  },
  {
    id: 3,
    title: 'Cairo\'s Creative Scene: Top Studios to Follow in 2026',
    excerpt: 'From Zamalek to New Cairo — meet the Egyptian studios and agencies doing the work that matters, and learn how to get your foot in the door.',
    author: 'Lawnn Editorial',
    date: 'March 15, 2026',
    category: 'Industry',
    readTime: '4 min read',
    color: '#db9630',
    body: [
      { type: 'paragraph', text: 'Egypt\'s creative industry has changed significantly in the last five years. A new generation of studios — smaller, more focused, and more internationally connected — has emerged alongside the established agencies. For students and recent graduates, knowing who is doing meaningful work, and understanding how they operate, is essential market research.' },
      { type: 'heading', text: 'What makes a studio worth following' },
      { type: 'paragraph', text: 'The studios worth your attention are not necessarily the biggest or the most awarded. Look for consistency of vision, calibre of clients, and the way they communicate about their own work. Studios that write thoughtfully about their process, share work in progress, and engage publicly with design culture are usually the ones maintaining a genuine creative standard internally.' },
      { type: 'heading', text: 'Areas of the city to know' },
      { type: 'paragraph', text: 'Creative output in Cairo is geographically concentrated. Zamalek and Downtown remain the original centres — older advertising agencies and established architecture firms are largely still based here. The last decade has seen significant movement to New Cairo, particularly Fifth Settlement, where larger studios have relocated for space and proximity to the corporate client base concentrated there. Maadi remains strong for boutique studios with international clientele.' },
      { type: 'heading', text: 'Disciplines with the most momentum in 2026' },
      { type: 'list', items: [
        'Brand identity for the F&B sector: Cairo\'s restaurant and café scene is expanding rapidly, generating consistent demand for identity, packaging, and environmental design.',
        'Real estate visual marketing: Egypt\'s development boom — New Administrative Capital, New Alamein, North Coast — is driving sustained demand for architectural visualisation and property marketing design.',
        'Digital product design: Egyptian fintech, edtech, and logistics companies have matured to the point of investing seriously in UX. It remains an underserved discipline with strong growth.',
        'Motion and content: The normalisation of short-form video across Egyptian brands has created steady demand for motion designers who understand both Arabic and international visual language.',
      ]},
      { type: 'heading', text: 'How to approach studios as a student' },
      { type: 'paragraph', text: 'Cold applications rarely work. The studios worth working at receive more CVs than they can read. What does work is building a presence — in person at events, online through consistent published work, and through people already inside those studios. Egypt\'s creative community is smaller than it appears. One warm introduction from a mutual contact is worth fifty cold emails.' },
      { type: 'paragraph', text: 'When you do reach out directly, make it specific. Reference a project of theirs you genuinely admire, explain what you would bring, and keep it short. Attach a portfolio link, not a PDF attachment. If you do not hear back within two weeks, one follow-up is appropriate. Beyond that, move on.' },
      { type: 'heading', text: 'Internships as market research' },
      { type: 'paragraph', text: 'Even a short internship inside a serious studio teaches you more about how the industry actually operates than a semester of coursework. You see how briefs are handled, how client relationships are managed, how revisions are negotiated, and what professional standards look like in practice. Approach internships not just as resume-building but as education you cannot get anywhere else.' },
    ],
  },
  {
    id: 4,
    title: 'Protecting Your Work: Watermarks, Contracts & IP Rights',
    excerpt: 'As a freelancer, protecting your intellectual property is non-negotiable. Here\'s a practical guide tailored for Egyptian law and creative practice.',
    author: 'Lawnn Legal',
    date: 'February 28, 2026',
    category: 'Legal',
    readTime: '6 min read',
    color: '#21326c',
    body: [
      { type: 'paragraph', text: 'Intellectual property theft is not an abstract risk for Egyptian creatives — it is routine. Work shared in pitches gets used without payment. Designs submitted to competitions appear on products months later. Portfolio images are lifted and used in client presentations by agencies who never hired the original designer. Understanding how to protect yourself is not paranoia — it is professional practice.' },
      { type: 'heading', text: 'Watermarks: when and how' },
      { type: 'paragraph', text: 'Watermarks should be applied to any work shared digitally during the pitch or review phase — before a contract is signed and a deposit has been received. Once a project is contracted and the deposit is cleared, you can share clean files for that stage only. Final deliverables are released upon receipt of full payment, no exceptions.' },
      { type: 'paragraph', text: 'An effective watermark is semi-transparent, positioned across the key visual area (not a corner where it can be cropped), and includes your name and the year. Lawnn\'s platform provides built-in watermarking through the Secure File Sharing feature, which also logs when files are opened and by whom — creating a timestamped record of every access.' },
      { type: 'heading', text: 'Contracts: what you actually need' },
      { type: 'paragraph', text: 'A contract does not need to be a formal legal document prepared by a lawyer. For most freelance engagements, a clear written agreement covering the following points is sufficient and enforceable under Egyptian law:' },
      { type: 'list', items: [
        'Scope of work: exactly what you are delivering, in what format, and by when.',
        'Revision policy: how many rounds are included and what the rate is for additional rounds.',
        'Payment terms: total fee, deposit amount (typically 30–50% upfront), and when the balance is due.',
        'Ownership transfer: intellectual property rights pass to the client only upon receipt of full payment.',
        'Usage rights: if the client receives a limited licence rather than full ownership, specify the medium, territory, and duration.',
        'Kill fee: what the client owes if they cancel mid-project — typically 50% of the remaining unpaid balance.',
      ]},
      { type: 'paragraph', text: 'A clear email exchange confirming these terms is legally meaningful in Egypt. A signed PDF is better. A contract template built specifically for Egyptian freelancers is available in the Lawnn resources section.' },
      { type: 'heading', text: 'Egyptian intellectual property law: the essentials' },
      { type: 'paragraph', text: 'Under Egyptian Law No. 82 of 2002 on the Protection of Intellectual Property Rights, creative works are protected from the moment of creation — registration is not required to establish copyright. The creator holds moral rights (the right to attribution) permanently, and economic rights (the right to profit from the work) for the creator\'s lifetime plus 50 years.' },
      { type: 'paragraph', text: 'In practice, enforcement is the challenge. Registration with the Egyptian Intellectual Property Office (EGYPO) creates a dated, official record of your ownership and significantly strengthens your position in any dispute. For work of substantial commercial value — a complete brand identity system, an architectural design, a major illustration series — registration is worth the cost and time.' },
      { type: 'heading', text: 'The simplest protection: documentation' },
      { type: 'paragraph', text: 'Before you share anything with a client, document it. Keep date-stamped copies of everything you send. Use email rather than phone calls for all significant decisions so there is a written record. When a client gives you a verbal approval and later claims they did not, your email thread is your evidence.' },
      { type: 'paragraph', text: 'None of this replaces good judgment about who you work with. The clients most likely to cause problems are the ones who are evasive about contracts, vague about deliverables, and slow to respond on payment terms. Trust your instincts. The deposit requirement filters most of them out before work even begins.' },
    ],
  },
];

// ─── MARKETPLACE DATA ────────────────────────────────────────────────────────

const MARKETPLACE_LISTINGS = [
  {
    id: 1,
    title: 'Original Calligraphy Print — Nile Series',
    price: 850,
    description: 'Limited edition A2 print of my "Nile at Dawn" calligraphy piece. Printed on 300gsm fine art paper with archival inks. Signed and numbered (3/10).',
    color: '#c4622d',
    seller: { name: 'Ahmed Khalil', initials: 'AK', avatarColor: '#21326c', talentId: 6 },
    status: 'active',
    postedAt: 'March 15, 2026',
    offers: [],
  },
  {
    id: 2,
    title: 'Brand Identity Package — Unused Concept',
    price: 2200,
    description: 'Full brand identity concept developed for a pitch that didn\'t proceed. Includes logo system, colour palette, typography, and 3 mockups. Figma source file included.',
    color: '#21326c',
    seller: { name: 'Karim Ashraf', initials: 'KA', avatarColor: '#c4622d', talentId: 2 },
    status: 'active',
    postedAt: 'March 28, 2026',
    offers: [],
  },
  {
    id: 3,
    title: 'Hand-Thrown Ceramic Wall Piece — 40×40cm',
    price: 1500,
    description: 'Hand-thrown and hand-painted ceramic piece, earthy tones with Arabic geometric motifs. Unique, ready to hang. Pick-up from Helwan or arrange delivery.',
    color: '#db9630',
    seller: { name: 'Omar Galal', initials: 'OG', avatarColor: '#21326c', talentId: 4 },
    status: 'active',
    postedAt: 'April 2, 2026',
    offers: [],
  },
];

const LISTING_COLORS = ['#21326c', '#c4622d', '#db9630', '#3c8762', '#a84f22', '#5ea580'];

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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 modal-backdrop" onClick={onClose}>
      <div
        className={`bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full ${wide ? 'sm:max-w-2xl' : 'sm:max-w-lg'} max-h-[92dvh] sm:max-h-[90vh] overflow-y-auto animate-fade-in`}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 sm:p-6 border-b border-[#21326c]/20">
          <h2 className="text-lg sm:text-xl font-bold text-[#21326c]">{title}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-[#21326c]/5 flex items-center justify-center hover:bg-[#21326c]/10 transition-colors flex-shrink-0">
            <X size={16} className="text-[#21326c]" />
          </button>
        </div>
        <div className="px-5 py-5 sm:p-6">{children}</div>
      </div>
    </div>
  );
}

function LoginModal({ open, onClose, onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = () => {
    setError('');
    setLoading(true);
    setTimeout(() => {
      const user = MOCK_USERS.find(u => u.email === email && u.password === password);
      if (user) {
        onLogin(user);
        onClose();
        setEmail('');
        setPassword('');
      } else {
        setError('Incorrect email or password. If you were recently accepted, check your welcome email for your admin-generated password.');
      }
      setLoading(false);
    }, 600);
  };

  return (
    <Modal open={open} onClose={onClose} title="Sign In to Lawnn">
      <div className="space-y-4">
        <div className="rounded-xl p-3 text-xs text-[#21326c] leading-relaxed border border-[#21326c]/20" style={{ background: '#21326c08' }}>
          <strong>Students:</strong> Use the email and admin-generated password from your acceptance email.
        </div>
        <div>
          <label className="block text-sm font-semibold text-[#21326c] mb-1.5">Email</label>
          <input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={e => { setEmail(e.target.value); setError(''); }}
            className="w-full px-4 py-3 rounded-xl border border-[#21326c]/20 text-[#21326c] text-sm focus:ring-2 focus:ring-[#21326c] focus:border-[#21326c] transition-all placeholder:text-[#21326c]/40"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-[#21326c] mb-1.5">Password</label>
          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={e => { setPassword(e.target.value); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            className="w-full px-4 py-3 rounded-xl border border-[#21326c]/20 text-[#21326c] text-sm focus:ring-2 focus:ring-[#21326c] focus:border-[#21326c] transition-all placeholder:text-[#21326c]/40"
          />
        </div>
        {error && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 leading-relaxed">{error}</p>
        )}
        <button
          onClick={handleSubmit}
          disabled={!email || !password || loading}
          className="w-full py-3 rounded-xl font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: '#ff9044' }}
        >
          {loading ? 'Signing in…' : 'Sign In'}
        </button>
        <p className="text-center text-xs text-[#21326c]/50">
          Not a student yet?{' '}
          <span className="font-medium text-[#21326c] cursor-pointer underline underline-offset-2">
            Apply to join Lawnn
          </span>
        </p>
        {/* Demo hint */}
        <div className="border-t border-[#21326c]/10 pt-3 space-y-1">
          <p className="text-xs font-semibold text-[#21326c]/40 uppercase tracking-wider">Demo credentials</p>
          <p className="text-xs text-[#21326c]/50">Student — nour@lawnn.com / lawnn123</p>
          <p className="text-xs text-[#21326c]/50">Client &nbsp;— client@safwa.com / safwa2024</p>
          <p className="text-xs text-[#21326c]/50">Admin &nbsp;— admin@lawnn.com / admin2024</p>
        </div>
      </div>
    </Modal>
  );
}

// ─── NAVIGATION / HEADER ──────────────────────────────────────────────────────

function TopNav({ view, setView, currentUser, onLoginClick, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const getNavItems = () => {
    if (currentUser?.role === 'student') return [
      { id: 'feed',        label: 'Feed',        icon: Grid },
      { id: 'about',       label: 'About Me',    icon: BookOpen },
      { id: 'news',        label: 'News',         icon: Layers },
      { id: 'profile',     label: 'My Profile',  icon: Users },
      { id: 'jobs',        label: 'Job Board',   icon: Briefcase },
      { id: 'marketplace', label: 'Marketplace', icon: ShoppingBag },
    ];
    if (currentUser?.role === 'client') return [
      { id: 'home',        label: 'Home',        icon: Home },
      { id: 'directory',   label: 'Talent',      icon: Users },
      { id: 'jobs',        label: 'Job Board',   icon: Briefcase },
      { id: 'news',        label: 'News',         icon: Layers },
      { id: 'feed',        label: 'Feed',        icon: Grid },
      { id: 'marketplace', label: 'Marketplace', icon: ShoppingBag },
    ];
    if (currentUser?.role === 'admin') return [
      { id: 'home',        label: 'Home',        icon: Home },
      { id: 'feed',        label: 'Feed',        icon: Grid },
      { id: 'directory',   label: 'Talent',      icon: Users },
      { id: 'jobs',        label: 'Job Board',   icon: Briefcase },
      { id: 'marketplace', label: 'Marketplace', icon: ShoppingBag },
      { id: 'news',        label: 'News',         icon: Layers },
      { id: 'admin',       label: 'Admin',       icon: Shield },
    ];
    // Logged-out / guest
    return [
      { id: 'home',        label: 'Home',        icon: Home },
      { id: 'jobs',        label: 'Job Board',   icon: Briefcase },
      { id: 'directory',   label: 'Talent',      icon: Users },
      { id: 'feed',        label: 'Feed',        icon: Grid },
      { id: 'marketplace', label: 'Marketplace', icon: ShoppingBag },
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
          <nav className="hidden md:flex items-center gap-1 flex-1 justify-center">
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
            {!currentUser ? (
              <>
                <button
                  onClick={onLoginClick}
                  className="hidden sm:flex text-sm font-medium text-[#21326c] px-3 py-2 rounded-lg hover:bg-[#21326c]/5 transition-colors"
                >
                  Log In
                </button>
                <button
                  onClick={() => setView('jobs')}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95"
                  style={{ background: '#ff9044' }}
                >
                  <Plus size={15} />
                  <span className="hidden sm:inline">Post a Job</span>
                </button>
              </>
            ) : (
              <div className="flex items-center gap-3">
                {currentUser.role === 'client' && (
                  <button
                    onClick={() => setView('jobs')}
                    className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold text-white transition-all hover:opacity-90"
                    style={{ background: '#ff9044' }}
                  >
                    <Plus size={15} /> Post a Job
                  </button>
                )}
                <button
                  onClick={() => setView('chat')}
                  className="relative p-2 rounded-lg hover:bg-[#21326c]/5 text-[#21326c] transition-colors"
                  title="Messages"
                >
                  <MessageSquare size={18} />
                </button>
                <div className="flex items-center gap-2 pl-3 border-l border-[#21326c]/10">
                  <Avatar initials={currentUser.initials} color={currentUser.avatarColor} size="sm" />
                  <span className="hidden sm:inline text-sm font-medium text-[#21326c]">
                    {currentUser.name.split(' ')[0]}
                  </span>
                  <button
                    onClick={onLogout}
                    className="text-xs text-[#21326c]/50 hover:text-[#21326c] transition-colors px-2 py-1 rounded-lg hover:bg-[#21326c]/5"
                  >
                    Sign out
                  </button>
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

function HomePage({ setView, setSelectedTalent, talents }) {
  const [activeCategory, setActiveCategory] = useState('all');

  const categories = [
    { id: 'all', label: 'All Categories', icon: Sparkles },
    { id: 'arch', label: 'Architecture & Interiors', icon: Building2 },
    { id: 'visual', label: 'Visuals & Branding', icon: Palette },
    { id: 'arts', label: 'Fine Arts & Illustration', icon: Pen },
  ];

  const filteredTalents = activeCategory === 'all' ? talents : talents.filter(t => {
    if (activeCategory === 'arch') return t.dept.includes('Interior') || t.dept.includes('Architecture') || t.dept.includes('Urban');
    if (activeCategory === 'visual') return t.dept.includes('Graphic') || t.dept.includes('UI') || t.dept.includes('Media');
    if (activeCategory === 'arts') return t.dept.includes('Sculpture') || t.dept.includes('Calligraphy') || t.dept.includes('Painting');
    return true;
  });

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <section className="hero-pattern py-12 sm:py-20 lg:py-24 px-4 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-8 right-8 w-64 h-64 rounded-full opacity-5" style={{ background: '#21326c', filter: 'blur(60px)' }} />
          <div className="absolute bottom-8 left-8 w-48 h-48 rounded-full opacity-5" style={{ background: '#c4622d', filter: 'blur(50px)' }} />
        </div>
        <div className="max-w-7xl mx-auto">
          <div className="max-w-2xl">
            
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-black leading-tight mb-4" style={{ color: '#21326c' }}>
              Empowering the next{' '}
              <em className="not-italic" style={{ color: '#ff9044' }}>Generation</em>{' '}
              Of Creators
            </h1>
            <p className="text-base sm:text-lg text-[#21326c] mb-6 sm:mb-8 leading-relaxed">
              Hire verified top-tier students for architecture, design, and fine arts. Exceptional creative work at honest rates — or let Lawnn pick your talent.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setView('jobs')}
                className="flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 rounded-full font-semibold text-white transition-all hover:opacity-90 shadow-lg text-sm sm:text-base"
                style={{ background: '#ff9044' }}
              >
                Post a Job <ArrowRight size={16} />
              </button>
              <button
                onClick={() => setView('directory')}
                className="flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 rounded-full font-semibold bg-white border border-[#21326c]/30 hover:border-[#21326c] transition-all text-[#21326c] text-sm sm:text-base"
              >
                <Users size={16} /> Browse Talent
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-6 text-xs sm:text-sm text-[#21326c]">
              <span className="flex items-center gap-1.5"><CheckCircle size={13} className="text-[#21326c]" /> 200+ Verified Students</span>
              <span className="flex items-center gap-1.5"><Building2 size={13} className="text-[#21326c]" /> 12 Faculties</span>
              <span className="flex items-center gap-1.5"><Star size={13} fill="#db9630" color="#db9630" /> 4.9 Avg. Rating</span>
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
        <div className="rounded-2xl p-6 sm:p-8 relative overflow-hidden" style={{ background: '#21326c' }}>
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10" style={{ background: '#db9630', filter: 'blur(60px)', transform: 'translate(30%, -30%)' }} />
          <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
            <div className="text-white">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={16} className="text-yellow-400" />
                <span className="text-yellow-400 font-semibold text-sm">VIP Concierge</span>
              </div>
              <h3 className="font-display text-2xl sm:text-3xl font-bold mb-2 text-white">Let Lawnn do the search</h3>
              <p className="text-sm sm:text-base leading-relaxed max-w-lg text-white/80">
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
          <span className="text-xs text-[#21326c]">{talent.completedJobs} jobs done</span>
          <span className="text-xs text-[#21326c]">{talent.reviews} reviews</span>
        </div>
      </div>
    </div>
  );
}

// ─── VIEW 2: JOB BOARD ────────────────────────────────────────────────────────

function JobBoardPage({ setView, jobs, setJobs, pendingJobs, setPendingJobs, currentUser }) {
  const [showPostModal, setShowPostModal] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [selectedJobForApply, setSelectedJobForApply] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [applySuccess, setApplySuccess] = useState(false);
  const [postForm, setPostForm] = useState({ title: '', brief: '', budget: '', skills: [], vip: false });
  const [applyForm, setApplyForm] = useState({ note: '', samples: [] });
  const [filterCat, setFilterCat] = useState('all');
  const [postSuccess, setPostSuccess] = useState(false);
  const [newSkill, setNewSkill] = useState('');

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

  const addSkill = () => {
    const s = newSkill.trim();
    if (s && !postForm.skills.includes(s)) setPostForm(f => ({ ...f, skills: [...f.skills, s] }));
    setNewSkill('');
  };
  const removeSkill = s => setPostForm(f => ({ ...f, skills: f.skills.filter(sk => sk !== s) }));

  const handlePost = () => {
    const job = {
      id: Date.now(),
      title: postForm.title,
      client: currentUser?.name || 'Anonymous',
      budget: postForm.budget,
      budgetType: 'Fixed',
      postedAgo: 'Just now',
      category: 'Visuals & Branding',
      tags: postForm.skills,
      brief: postForm.brief,
      applicants: 0,
      vip: postForm.vip,
    };
    // Admin posts go live immediately; clients go to pending
    if (currentUser?.role === 'admin') {
      setJobs(js => [job, ...js]);
    } else {
      setPendingJobs(js => [...js, job]);
    }
    setPostSuccess(true);
    setTimeout(() => {
      setShowPostModal(false);
      setPostSuccess(false);
      setPostForm({ title: '', brief: '', budget: '', skills: [], vip: false });
    }, 2500);
  };

  const filteredJobs = filterCat === 'all' ? jobs : jobs.filter(j => j.category.toLowerCase().includes(filterCat));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#21326c]">Job Board</h1>
          <p className="text-sm text-[#21326c] mt-1">Live creative briefs from Egypt's top brands and agencies</p>
        </div>
        <button
          onClick={() => setShowPostModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-white shadow-md hover:opacity-90 transition-all text-sm flex-shrink-0"
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
              <div className="sm:text-right flex-shrink-0 flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 sm:gap-1">
                <div>
                  <div className="text-xl sm:text-2xl font-bold text-[#21326c]">{job.budget} EGP</div>
                  <div className="text-xs text-[#21326c]">{job.budgetType === 'Fixed' ? 'Fixed price' : 'Hourly rate'} · {job.applicants} applicants</div>
                </div>
                {currentUser?.role !== 'admin' && (
                  <button
                    className="mt-2 px-4 py-2 rounded-full text-sm font-semibold text-white transition-all hover:opacity-90"
                    style={{ background: '#ff9044' }}
                    onClick={e => { e.stopPropagation(); setSelectedJobForApply(job); setShowApplyModal(true); }}
                  >
                    Apply Now
                  </button>
                )}
                {currentUser?.role === 'admin' && (
                  <button
                    onClick={e => { e.stopPropagation(); setJobs(js => js.filter(j => j.id !== job.id)); }}
                    className="mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border border-red-200 text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                  >
                    <Trash2 size={12} /> Delete
                  </button>
                )}
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
              <Clock size={32} className="text-[#21326c]" />
            </div>
            <h3 className="font-display text-xl font-bold text-[#21326c] mb-2">
              {currentUser?.role === 'admin' ? 'Job Posted!' : 'Pending Review'}
            </h3>
            <p className="text-[#21326c] text-sm leading-relaxed">
              {currentUser?.role === 'admin'
                ? 'Your brief is now live on the Lawnn job board.'
                : 'Your job posting has been submitted and is awaiting admin approval before going live.'}
            </p>
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

            {/* Skills */}
            <div>
              <label className="block text-sm font-semibold text-[#21326c] mb-1.5">Required Skills</label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {postForm.skills.map(s => (
                  <span key={s} className="tag-pill flex items-center gap-1">
                    {s}
                    <button onClick={() => removeSkill(s)} className="ml-0.5 hover:opacity-60"><X size={10} /></button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Figma, AutoCAD…"
                  value={newSkill}
                  onChange={e => setNewSkill(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addSkill()}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-[#21326c]/20 text-[#21326c] text-sm focus:ring-2 focus:ring-[#21326c] transition-all placeholder:text-[#21326c]/40"
                />
                <button
                  onClick={addSkill}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
                  style={{ background: '#21326c' }}
                >
                  Add
                </button>
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

          {applySuccess ? (
            <div className="text-center py-6">
              <div className="w-14 h-14 rounded-full bg-[#21326c]/10 flex items-center justify-center mx-auto mb-3">
                <CheckCircle size={28} className="text-[#21326c]" />
              </div>
              <p className="font-display text-lg font-bold text-[#21326c] mb-1">Application Sent!</p>
              <p className="text-sm text-[#21326c]/70">The client will review your application and respond via messages.</p>
            </div>
          ) : (
            <button
              onClick={() => { setApplySuccess(true); setTimeout(() => { setShowApplyModal(false); setApplySuccess(false); setApplyForm({ note: '', samples: [] }); }, 2500); }}
              disabled={!applyForm.note || applyForm.samples.length === 0}
              className="w-full py-3 rounded-xl font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: '#ff9044' }}
            >
              Submit Application
            </button>
          )}
        </div>
      </Modal>

      {/* JOB DETAIL MODAL */}
      <Modal open={!!selectedJob} onClose={() => setSelectedJob(null)} title="Job Details" wide>
        {selectedJob && (
          <div className="space-y-5">
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h2 className="font-display text-xl font-bold text-[#21326c]">{selectedJob.title}</h2>
                {selectedJob.vip && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: '#fdf0d3', color: '#21326c', border: '1px solid #e4ae50' }}>
                    <Sparkles size={10} /> VIP
                  </span>
                )}
              </div>
              <p className="text-sm text-[#21326c]/60">{selectedJob.client} · {selectedJob.postedAgo} · {selectedJob.applicants} applicants</p>
            </div>

            <div className="bg-[#21326c]/5 rounded-xl p-4">
              <p className="text-xs font-semibold text-[#21326c] uppercase tracking-wide mb-2">Project Brief</p>
              <p className="text-sm text-[#21326c] leading-relaxed">{selectedJob.brief}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white border border-[#21326c]/10 rounded-xl p-4">
                <p className="text-xs text-[#21326c]/50 mb-1">Budget</p>
                <p className="text-lg font-bold text-[#21326c]">{selectedJob.budget} EGP</p>
                <p className="text-xs text-[#21326c]/50">{selectedJob.budgetType === 'Fixed' ? 'Fixed price' : 'Hourly'}</p>
              </div>
              <div className="bg-white border border-[#21326c]/10 rounded-xl p-4">
                <p className="text-xs text-[#21326c]/50 mb-1">Category</p>
                <p className="text-sm font-semibold text-[#21326c]">{selectedJob.category}</p>
              </div>
            </div>

            {selectedJob.tags?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-[#21326c] uppercase tracking-wide mb-2">Required Skills</p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedJob.tags.map(t => <span key={t} className="tag-pill">{t}</span>)}
                </div>
              </div>
            )}

            {currentUser?.role === 'student' && (
              <button
                onClick={() => { setSelectedJob(null); setSelectedJobForApply(selectedJob); setShowApplyModal(true); }}
                className="w-full py-3 rounded-xl font-semibold text-white hover:opacity-90 transition-all"
                style={{ background: '#ff9044' }}
              >
                Apply for This Job
              </button>
            )}
            {!currentUser && (
              <p className="text-sm text-center text-[#21326c]/50">Sign in as a student to apply</p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

// ─── VIEW 3: TALENT DIRECTORY ─────────────────────────────────────────────────

function DirectoryPage({ setView, setSelectedTalent, talents }) {
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

function ProfilePage({ talent, setView, currentUser, onUpdateTalent }) {
  const [showHireModal, setShowHireModal]   = useState(false);
  const [hireForm, setHireForm]             = useState({ title: '', brief: '', budget: '' });
  const [hireSuccess, setHireSuccess]       = useState(false);
  const [showFullTimeModal, setShowFullTimeModal] = useState(false);
  const [ftSuccess, setFtSuccess]           = useState(false);
  const [showEditModal, setShowEditModal]   = useState(false);

  // Edit profile state
  const [editDraft, setEditDraft] = useState({});
  const [newTag, setNewTag]       = useState('');
  const [newEdu, setNewEdu]       = useState({ degree: '', school: '', years: '' });
  const [newExp, setNewExp]       = useState({ role: '', company: '', years: '' });
  const [newPortItem, setNewPortItem] = useState({ label: '', color: '#21326c', h: 'medium' });

  const isOwnProfile = currentUser?.role === 'student' && currentUser?.talentId === talent?.id;

  const openEdit = () => {
    setEditDraft({
      bio: talent.bio,
      tags: [...talent.tags],
      education: talent.education.map(e => ({ ...e })),
      experience: talent.experience.map(e => ({ ...e })),
      portfolio: talent.portfolio.map(p => ({ ...p })),
    });
    setShowEditModal(true);
  };

  const saveEdit = () => {
    onUpdateTalent({ ...talent, ...editDraft });
    setShowEditModal(false);
  };

  const submitHire = () => {
    setHireSuccess(true);
    setTimeout(() => { setShowHireModal(false); setHireSuccess(false); setHireForm({ title: '', brief: '', budget: '' }); }, 2500);
  };

  const submitFullTime = () => {
    setFtSuccess(true);
    setTimeout(() => { setShowFullTimeModal(false); setFtSuccess(false); }, 2500);
  };

  const PORT_COLORS = ['#21326c', '#c4622d', '#db9630', '#3c8762', '#a84f22', '#5ea580'];

  if (!talent) return null;

  return (
    <>
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      {/* Back */}
      <button
        onClick={() => setView(isOwnProfile ? 'feed' : 'directory')}
        className="flex items-center gap-2 text-sm text-[#21326c] hover:opacity-80 mb-6 transition-colors"
      >
        <ChevronLeft size={16} /> {isOwnProfile ? 'Back to Feed' : 'Back to Directory'}
      </button>

      {/* Hero */}
      <div className="bg-white rounded-2xl border border-[#21326c]/10 overflow-hidden mb-6">
        {/* Cover */}
        <div className="h-32 sm:h-44" style={{ background: `linear-gradient(135deg, ${talent.avatarColor}33, ${talent.avatarColor}88)` }} />

        <div className="px-6 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 -mt-10 mb-4">
            <div className="flex items-end gap-3">
              <div
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border-4 border-white flex items-center justify-center text-white text-lg sm:text-xl font-bold shadow-md flex-shrink-0"
                style={{ background: talent.avatarColor }}
              >
                {talent.initials}
              </div>
              <div className="pb-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="font-display text-xl sm:text-2xl font-bold text-[#21326c]">{talent.name}</h1>
                  <VerifiedBadge isGrad={talent.isGrad} />
                </div>
                <p className="text-xs sm:text-sm text-[#21326c]">{talent.university} · {talent.dept}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 flex-wrap">
              {isOwnProfile ? (
                <button
                  onClick={openEdit}
                  className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#21326c]/30 text-sm font-semibold text-[#21326c] hover:bg-[#21326c]/5 transition-colors"
                >
                  <Pen size={15} /> Edit Profile
                </button>
              ) : (
                <>
                  <button
                    onClick={() => setView('chat')}
                    className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#21326c]/30 text-sm font-semibold text-[#21326c] hover:bg-[#21326c]/5 transition-colors"
                  >
                    <MessageSquare size={15} /> Message
                  </button>

                  {talent.isGrad && (
                    <button
                      onClick={() => setShowFullTimeModal(true)}
                      className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-white transition-all hover:opacity-90"
                      style={{ background: '#ff9044' }}
                    >
                      <UserPlus size={15} /> Hire Full-Time
                    </button>
                  )}

                  <button
                    onClick={() => setShowHireModal(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-white transition-all hover:opacity-90"
                    style={{ background: '#ff9044' }}
                  >
                    Hire for Project
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-4 flex-wrap text-sm mb-5">
            <StarRating rating={talent.rating} />
            <span className="text-[#21326c]">{talent.reviews} reviews</span>
            <span className="text-[#21326c]">{talent.completedJobs} projects completed</span>
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
          </h3>
          <div className="masonry-grid">
            {talent.portfolio.map((item, i) => (
              <PortfolioBlock key={i} color={item.color} label={item.label} height={item.h} />
            ))}
          </div>
        </div>
      </div>
    </div>

    {/* ── HIRE FOR PROJECT MODAL ── */}
    <Modal open={showHireModal} onClose={() => { setShowHireModal(false); setHireForm({ title: '', brief: '', budget: '' }); }} title={`Hire ${talent.name} for a Project`} wide>
      {hireSuccess ? (
        <div className="text-center py-8">
          <div className="w-14 h-14 rounded-full bg-[#21326c]/10 flex items-center justify-center mx-auto mb-3">
            <CheckCircle size={28} className="text-[#21326c]" />
          </div>
          <p className="font-display text-lg font-bold text-[#21326c] mb-1">Proposal Sent!</p>
          <p className="text-sm text-[#21326c]/70">{talent.name} will review your brief and respond via messages.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-[#21326c]/5 rounded-xl mb-2">
            <Avatar initials={talent.initials} color={talent.avatarColor} size="md" />
            <div>
              <p className="font-semibold text-[#21326c] text-sm">{talent.name}</p>
              <p className="text-xs text-[#21326c]/60">{talent.dept} · {talent.university}</p>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#21326c] mb-1.5">Project Title *</label>
            <input type="text" placeholder="e.g. Brand Identity for my café" value={hireForm.title}
              onChange={e => setHireForm(f => ({ ...f, title: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-[#21326c]/20 text-[#21326c] text-sm focus:ring-2 focus:ring-[#21326c] transition-all placeholder:text-[#21326c]/40" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#21326c] mb-1.5">Project Brief *</label>
            <textarea rows={4} placeholder="Describe what you need — deliverables, style, timeline..." value={hireForm.brief}
              onChange={e => setHireForm(f => ({ ...f, brief: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-[#21326c]/20 text-[#21326c] text-sm focus:ring-2 focus:ring-[#21326c] transition-all resize-none placeholder:text-[#21326c]/40" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#21326c] mb-1.5">Budget (EGP) *</label>
            <input type="number" placeholder="e.g. 3500" value={hireForm.budget}
              onChange={e => setHireForm(f => ({ ...f, budget: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-[#21326c]/20 text-[#21326c] text-sm focus:ring-2 focus:ring-[#21326c] transition-all placeholder:text-[#21326c]/40" />
          </div>
          <div className="text-xs text-[#21326c]/50 flex items-start gap-2 p-3 bg-[#21326c]/5 rounded-xl">
            <Lock size={12} className="mt-0.5 flex-shrink-0" />
            Payment is held in escrow by Lawnn and released to the student only on your approval of the final deliverable.
          </div>
          <button onClick={submitHire} disabled={!hireForm.title || !hireForm.brief || !hireForm.budget}
            className="w-full py-3 rounded-xl font-semibold text-white hover:opacity-90 transition-all disabled:opacity-50"
            style={{ background: '#ff9044' }}>
            Send Proposal
          </button>
        </div>
      )}
    </Modal>

    {/* ── HIRE FULL-TIME MODAL ── */}
    <Modal open={showFullTimeModal} onClose={() => { setShowFullTimeModal(false); setFtSuccess(false); }} title="Full-Time Hire Request">
      {ftSuccess ? (
        <div className="text-center py-8">
          <div className="w-14 h-14 rounded-full bg-[#21326c]/10 flex items-center justify-center mx-auto mb-3">
            <CheckCircle size={28} className="text-[#21326c]" />
          </div>
          <p className="font-display text-lg font-bold text-[#21326c] mb-1">Request Received</p>
          <p className="text-sm text-[#21326c]/70">The Lawnn team will contact you within 24 hours to arrange the placement process.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-[#21326c]/5 rounded-xl">
            <Avatar initials={talent.initials} color={talent.avatarColor} size="md" />
            <div>
              <p className="font-semibold text-[#21326c] text-sm">{talent.name}</p>
              <p className="text-xs text-[#21326c]/60">{talent.dept} · {talent.university}</p>
            </div>
          </div>
          <div className="space-y-3 text-sm text-[#21326c] leading-relaxed">
            <p>Lawnn manages full-time placement for verified graduate talents. Here's how it works:</p>
            <ul className="space-y-2">
              {[
                'You submit a hire request and we verify the graduate is still available.',
                'Lawnn coordinates a structured interview process on your behalf.',
                'Upon successful hire, a one-month salary placement fee is invoiced to your company.',
                'The student transitions directly — no middleman involvement after placement.',
              ].map((s, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#21326c] text-white text-xs flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
          <button onClick={submitFullTime}
            className="w-full py-3 rounded-xl font-semibold text-white hover:opacity-90 transition-all"
            style={{ background: '#ff9044' }}>
            Request Full-Time Placement
          </button>
        </div>
      )}
    </Modal>

    {/* ── EDIT PROFILE MODAL ── */}
    <Modal open={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Your Profile" wide>
      <div className="space-y-6">
        {/* Bio */}
        <div>
          <label className="block text-xs font-semibold text-[#21326c] uppercase tracking-wider mb-1.5">Bio</label>
          <textarea rows={4} value={editDraft.bio || ''} onChange={e => setEditDraft(d => ({ ...d, bio: e.target.value }))}
            className="w-full px-4 py-3 rounded-xl border border-[#21326c]/20 text-[#21326c] text-sm focus:ring-2 focus:ring-[#21326c] transition-all resize-none" />
        </div>

        {/* Skills */}
        <div>
          <label className="block text-xs font-semibold text-[#21326c] uppercase tracking-wider mb-1.5">Skills</label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {(editDraft.tags || []).map(t => (
              <span key={t} className="tag-pill flex items-center gap-1">
                {t}
                <button onClick={() => setEditDraft(d => ({ ...d, tags: d.tags.filter(x => x !== t) }))} className="ml-0.5 hover:opacity-60"><X size={10} /></button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input type="text" placeholder="Add a skill…" value={newTag} onChange={e => setNewTag(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && newTag.trim()) { setEditDraft(d => ({ ...d, tags: [...(d.tags || []), newTag.trim()] })); setNewTag(''); } }}
              className="flex-1 px-4 py-2.5 rounded-xl border border-[#21326c]/20 text-[#21326c] text-sm focus:ring-2 focus:ring-[#21326c] transition-all placeholder:text-[#21326c]/40" />
            <button onClick={() => { if (newTag.trim()) { setEditDraft(d => ({ ...d, tags: [...(d.tags || []), newTag.trim()] })); setNewTag(''); } }}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: '#21326c' }}>Add</button>
          </div>
        </div>

        {/* Education */}
        <div>
          <label className="block text-xs font-semibold text-[#21326c] uppercase tracking-wider mb-2">Education</label>
          <div className="space-y-2 mb-3">
            {(editDraft.education || []).map((edu, i) => (
              <div key={i} className="flex items-start gap-2 p-3 bg-[#21326c]/5 rounded-xl">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-[#21326c]">{edu.degree}</p>
                  <p className="text-xs text-[#21326c]/60">{edu.school} · {edu.years}</p>
                </div>
                <button onClick={() => setEditDraft(d => ({ ...d, education: d.education.filter((_, j) => j !== i) }))}
                  className="text-[#21326c]/30 hover:text-red-400 transition-colors"><X size={14} /></button>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2 mb-2">
            <input type="text" placeholder="Degree" value={newEdu.degree} onChange={e => setNewEdu(n => ({ ...n, degree: e.target.value }))}
              className="px-3 py-2 rounded-xl border border-[#21326c]/20 text-[#21326c] text-sm focus:ring-2 focus:ring-[#21326c] placeholder:text-[#21326c]/40" />
            <input type="text" placeholder="School" value={newEdu.school} onChange={e => setNewEdu(n => ({ ...n, school: e.target.value }))}
              className="px-3 py-2 rounded-xl border border-[#21326c]/20 text-[#21326c] text-sm focus:ring-2 focus:ring-[#21326c] placeholder:text-[#21326c]/40" />
            <input type="text" placeholder="Years e.g. 2022–Present" value={newEdu.years} onChange={e => setNewEdu(n => ({ ...n, years: e.target.value }))}
              className="px-3 py-2 rounded-xl border border-[#21326c]/20 text-[#21326c] text-sm focus:ring-2 focus:ring-[#21326c] placeholder:text-[#21326c]/40" />
          </div>
          <button onClick={() => { if (newEdu.degree && newEdu.school) { setEditDraft(d => ({ ...d, education: [...(d.education || []), { ...newEdu }] })); setNewEdu({ degree: '', school: '', years: '' }); } }}
            className="text-xs font-semibold text-[#21326c] hover:opacity-70 flex items-center gap-1">
            <Plus size={12} /> Add entry
          </button>
        </div>

        {/* Experience */}
        <div>
          <label className="block text-xs font-semibold text-[#21326c] uppercase tracking-wider mb-2">Experience</label>
          <div className="space-y-2 mb-3">
            {(editDraft.experience || []).map((exp, i) => (
              <div key={i} className="flex items-start gap-2 p-3 bg-[#21326c]/5 rounded-xl">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-[#21326c]">{exp.role}</p>
                  <p className="text-xs text-[#21326c]/60">{exp.company} · {exp.years}</p>
                </div>
                <button onClick={() => setEditDraft(d => ({ ...d, experience: d.experience.filter((_, j) => j !== i) }))}
                  className="text-[#21326c]/30 hover:text-red-400 transition-colors"><X size={14} /></button>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2 mb-2">
            <input type="text" placeholder="Role" value={newExp.role} onChange={e => setNewExp(n => ({ ...n, role: e.target.value }))}
              className="px-3 py-2 rounded-xl border border-[#21326c]/20 text-[#21326c] text-sm focus:ring-2 focus:ring-[#21326c] placeholder:text-[#21326c]/40" />
            <input type="text" placeholder="Company" value={newExp.company} onChange={e => setNewExp(n => ({ ...n, company: e.target.value }))}
              className="px-3 py-2 rounded-xl border border-[#21326c]/20 text-[#21326c] text-sm focus:ring-2 focus:ring-[#21326c] placeholder:text-[#21326c]/40" />
            <input type="text" placeholder="Years e.g. 2023–Present" value={newExp.years} onChange={e => setNewExp(n => ({ ...n, years: e.target.value }))}
              className="px-3 py-2 rounded-xl border border-[#21326c]/20 text-[#21326c] text-sm focus:ring-2 focus:ring-[#21326c] placeholder:text-[#21326c]/40" />
          </div>
          <button onClick={() => { if (newExp.role && newExp.company) { setEditDraft(d => ({ ...d, experience: [...(d.experience || []), { ...newExp }] })); setNewExp({ role: '', company: '', years: '' }); } }}
            className="text-xs font-semibold text-[#21326c] hover:opacity-70 flex items-center gap-1">
            <Plus size={12} /> Add entry
          </button>
        </div>

        {/* Portfolio items */}
        <div>
          <label className="block text-xs font-semibold text-[#21326c] uppercase tracking-wider mb-2">Portfolio Items</label>
          <div className="space-y-2 mb-3">
            {(editDraft.portfolio || []).map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-2 bg-[#21326c]/5 rounded-xl">
                <div className="w-7 h-7 rounded-lg flex-shrink-0" style={{ background: item.color }} />
                <span className="text-sm text-[#21326c] flex-1">{item.label}</span>
                <button onClick={() => setEditDraft(d => ({ ...d, portfolio: d.portfolio.filter((_, j) => j !== i) }))}
                  className="text-[#21326c]/30 hover:text-red-400 transition-colors"><X size={14} /></button>
              </div>
            ))}
          </div>
          <div className="flex gap-2 items-center mb-2">
            <input type="text" placeholder="Item label" value={newPortItem.label} onChange={e => setNewPortItem(n => ({ ...n, label: e.target.value }))}
              className="flex-1 px-3 py-2 rounded-xl border border-[#21326c]/20 text-[#21326c] text-sm focus:ring-2 focus:ring-[#21326c] placeholder:text-[#21326c]/40" />
            <select value={newPortItem.h} onChange={e => setNewPortItem(n => ({ ...n, h: e.target.value }))}
              className="px-3 py-2 rounded-xl border border-[#21326c]/20 text-[#21326c] text-sm focus:ring-2 focus:ring-[#21326c]">
              {['short','medium','tall'].map(h => <option key={h} value={h}>{h}</option>)}
            </select>
          </div>
          <div className="flex gap-2 mb-2">
            {PORT_COLORS.map(c => (
              <button key={c} onClick={() => setNewPortItem(n => ({ ...n, color: c }))}
                className="w-7 h-7 rounded-lg transition-transform hover:scale-110"
                style={{ background: c, outline: newPortItem.color === c ? `3px solid ${c}` : 'none', outlineOffset: '2px' }} />
            ))}
          </div>
          <button onClick={() => { if (newPortItem.label) { setEditDraft(d => ({ ...d, portfolio: [...(d.portfolio || []), { ...newPortItem }] })); setNewPortItem({ label: '', color: '#21326c', h: 'medium' }); } }}
            className="text-xs font-semibold text-[#21326c] hover:opacity-70 flex items-center gap-1">
            <Plus size={12} /> Add item
          </button>
        </div>

        <button onClick={saveEdit}
          className="w-full py-3 rounded-xl font-semibold text-white hover:opacity-90 transition-all"
          style={{ background: '#ff9044' }}>
          Save Profile
        </button>
      </div>
    </Modal>
    </>
  );
}

// ─── VIEW 5: SOCIAL FEED ─────────────────────────────────────────────────────

function FeedPage({ feedPosts, setFeedPosts, pendingFeedPosts, setPendingFeedPosts, currentUser }) {
  const [newPost, setNewPost]         = useState('');
  const [submitBanner, setSubmitBanner] = useState(false); // pending success banner

  const isStudent = currentUser?.role === 'student';
  const isAdmin   = currentUser?.role === 'admin';

  const toggleLike = id => {
    setFeedPosts(ps => ps.map(p =>
      p.id === id ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 } : p
    ));
  };

  const handleShare = () => {
    if (!newPost.trim()) return;
    const talent = currentUser ? TALENTS.find(t => t.id === currentUser.talentId) : null;
    const draft = {
      id: Date.now(),
      author:      currentUser?.name || 'Anonymous',
      authorColor: talent?.avatarColor || '#21326c',
      initials:    currentUser?.initials || '??',
      university:  talent?.university || '',
      time:        'Just now',
      content:     newPost.trim(),
      tags:        (newPost.match(/#\w+/g) || []),
      imageColor:  talent?.avatarColor || '#21326c',
      imageLabel:  'Attached media',
      likes: 0, comments: 0, shares: 0,
      hasVideo: false, liked: false,
    };
    setPendingFeedPosts(ps => [...ps, draft]);
    setNewPost('');
    setSubmitBanner(true);
    setTimeout(() => setSubmitBanner(false), 4000);
  };

  const approvePost = post => {
    setFeedPosts(ps => [{ ...post }, ...ps]);
    setPendingFeedPosts(ps => ps.filter(p => p.id !== post.id));
  };

  const rejectPost = id => setPendingFeedPosts(ps => ps.filter(p => p.id !== id));

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

      {/* Compose — students only */}
      {isStudent && (
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
                <input type="file" accept="image/*" id="feed-img-upload" className="hidden" onChange={e => { if (e.target.files[0]) setNewPost(p => p + ` [Image: ${e.target.files[0].name}]`); }} />
                <input type="file" accept="video/*" id="feed-vid-upload" className="hidden" onChange={e => { if (e.target.files[0]) setNewPost(p => p + ` [Video: ${e.target.files[0].name}]`); }} />
                <div className="flex items-center justify-between pt-3 border-t border-[#21326c]/10">
                  <div className="flex gap-2">
                    <button onClick={() => document.getElementById('feed-img-upload').click()} title="Attach image" className="p-2 rounded-lg hover:bg-[#21326c]/5 text-[#21326c] transition-colors"><Camera size={16} /></button>
                    <button onClick={() => document.getElementById('feed-vid-upload').click()} title="Attach video" className="p-2 rounded-lg hover:bg-[#21326c]/5 text-[#21326c] transition-colors"><Video size={16} /></button>
                    <button onClick={() => setNewPost(p => p ? p + ' #' : '#')} title="Add hashtag" className="p-2 rounded-lg hover:bg-[#21326c]/5 text-[#21326c] transition-colors"><Hash size={16} /></button>
                  </div>
                  <button
                    onClick={handleShare}
                    disabled={!newPost.trim()}
                    className="px-4 py-1.5 rounded-full text-sm font-semibold text-white disabled:opacity-40 transition-all hover:opacity-90"
                    style={{ background: '#ff9044' }}
                  >
                    Submit for Review
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

function FeedPost({ post, onLike, isAdmin, onDelete }) {
  const [showComments, setShowComments] = useState(false);
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

      {/* Image / Video */}
      <div
        className="relative mx-5 mb-4 rounded-xl overflow-hidden h-52 flex items-center justify-center"
        style={{ background: `linear-gradient(160deg, ${post.imageColor}aa, ${post.imageColor})` }}
      >
        <span className="text-white font-medium text-sm bg-black/20 px-3 py-1.5 rounded-lg">{post.imageLabel}</span>
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
          <button onClick={handleShare} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-[#21326c] hover:bg-[#21326c]/5 transition-colors flex-1 justify-center">
            <Share2 size={16} /> {copied ? 'Copied!' : 'Share'}
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
  const [showEncryptionInfo, setShowEncryptionInfo] = useState(false);
  const [showChatMore, setShowChatMore] = useState(false);

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
      <div className="bg-white rounded-2xl border border-[#21326c]/10 overflow-hidden" style={{ height: 'calc(100dvh - 130px)', minHeight: '480px' }}>
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
              <div className="ml-auto flex gap-2 relative">
                <button onClick={() => setShowEncryptionInfo(v => !v)} className="p-2 rounded-lg hover:bg-[#21326c]/5 text-[#21326c] transition-colors" title="Encryption info">
                  <Shield size={16} />
                </button>
                <div className="relative">
                  <button onClick={() => setShowChatMore(v => !v)} className="p-2 rounded-lg hover:bg-[#21326c]/5 text-[#21326c] transition-colors">
                    <MoreHorizontal size={16} />
                  </button>
                  {showChatMore && (
                    <div className="absolute right-0 top-10 bg-white rounded-xl border border-[#21326c]/10 shadow-lg w-44 overflow-hidden z-50 animate-fade-in">
                      {['Mute notifications', 'Archive conversation', 'Clear chat history'].map(opt => (
                        <button key={opt} onClick={() => setShowChatMore(false)}
                          className="w-full px-4 py-2.5 text-sm text-[#21326c] hover:bg-[#21326c]/5 transition-colors text-left">
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {showEncryptionInfo && (
                  <div className="absolute right-0 top-12 bg-white rounded-xl border border-[#21326c]/10 shadow-xl w-72 p-4 z-50 animate-fade-in">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield size={16} className="text-[#21326c]" />
                      <p className="font-semibold text-[#21326c] text-sm">End-to-End Encrypted</p>
                      <button onClick={() => setShowEncryptionInfo(false)} className="ml-auto text-[#21326c]/30 hover:text-[#21326c]"><X size={14} /></button>
                    </div>
                    <p className="text-xs text-[#21326c]/70 leading-relaxed">Messages are encrypted in transit. Files shared through Lawnn Secure Vault are access-logged and watermarked. Lawnn admins can monitor conversations for platform safety.</p>
                  </div>
                )}
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

// ─── VIEW: ABOUT ME / ABOUT US ───────────────────────────────────────────────

function AboutPage({ currentUser, talents, onUpdateTalent, aboutContent, setAboutContent }) {
  const isStudent = currentUser?.role === 'student';
  const isAdmin   = currentUser?.role === 'admin';
  const talent    = isStudent ? talents.find(t => t.id === currentUser.talentId) : null;

  // ── Student: inline edit ────────────────────────────────────────────────────
  const [editing, setEditing]     = useState(false);
  const [draft, setDraft]         = useState(null);
  const [newSkill, setNewSkill]   = useState('');
  const [saved, setSaved]         = useState(false);

  const startEdit = () => {
    setDraft({ bio: talent.bio, tags: [...talent.tags] });
    setEditing(true);
  };
  const cancelEdit = () => { setEditing(false); setDraft(null); };
  const saveEdit = () => {
    onUpdateTalent({ ...talent, ...draft });
    setEditing(false);
    setDraft(null);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };
  const addSkill = () => {
    const trimmed = newSkill.trim();
    if (trimmed && !draft.tags.includes(trimmed)) {
      setDraft(d => ({ ...d, tags: [...d.tags, trimmed] }));
    }
    setNewSkill('');
  };
  const removeSkill = tag => setDraft(d => ({ ...d, tags: d.tags.filter(t => t !== tag) }));

  if (isStudent && talent) {
    const display = editing ? draft : talent;
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-[#21326c] mb-1">About Me</h1>
            <p className="text-sm text-[#21326c]">Your public profile on Lawnn</p>
          </div>
          {!editing ? (
            <button
              onClick={startEdit}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold border border-[#21326c]/30 text-[#21326c] hover:bg-[#21326c]/5 transition-colors"
            >
              <Pen size={13} /> Edit Profile
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={cancelEdit}
                className="px-4 py-2 rounded-full text-sm font-semibold border border-[#21326c]/20 text-[#21326c] hover:bg-[#21326c]/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveEdit}
                className="px-4 py-2 rounded-full text-sm font-semibold text-white transition-all hover:opacity-90"
                style={{ background: '#ff9044' }}
              >
                Save Changes
              </button>
            </div>
          )}
        </div>

        {saved && (
          <div className="mb-4 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-[#21326c] animate-fade-in" style={{ background: '#21326c0f', border: '1px solid #21326c30' }}>
            <CheckCircle size={15} /> Profile updated successfully
          </div>
        )}

        <div className="bg-white rounded-2xl border border-[#21326c]/10 overflow-hidden">
          <div className="h-28" style={{ background: `linear-gradient(135deg, ${talent.avatarColor}33, ${talent.avatarColor}88)` }} />
          <div className="px-6 pb-6">
            <div className="-mt-8 mb-5 flex items-end gap-4">
              <div
                className="w-16 h-16 rounded-2xl border-4 border-white flex items-center justify-center text-white text-lg font-bold shadow-md"
                style={{ background: talent.avatarColor }}
              >
                {talent.initials}
              </div>
              <div className="pb-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-display text-xl font-bold text-[#21326c]">{talent.name}</h2>
                  <VerifiedBadge isGrad={talent.isGrad} />
                </div>
                <p className="text-sm text-[#21326c]">{talent.university}</p>
              </div>
            </div>

            <div className="space-y-5">
              {/* Bio */}
              <div>
                <label className="block text-xs font-semibold text-[#21326c] uppercase tracking-wider mb-2">Bio</label>
                {editing ? (
                  <textarea
                    rows={4}
                    value={draft.bio}
                    onChange={e => setDraft(d => ({ ...d, bio: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-[#21326c]/20 text-[#21326c] text-sm focus:ring-2 focus:ring-[#21326c] transition-all resize-none"
                  />
                ) : (
                  <p className="text-sm text-[#21326c] leading-relaxed rounded-xl p-4" style={{ background: '#21326c08' }}>
                    {display.bio}
                  </p>
                )}
              </div>

              {/* Skills */}
              <div>
                <label className="block text-xs font-semibold text-[#21326c] uppercase tracking-wider mb-2">Skills</label>
                <div className="flex flex-wrap gap-2">
                  {display.tags.map(tag => (
                    <span key={tag} className="tag-pill flex items-center gap-1">
                      {tag}
                      {editing && (
                        <button onClick={() => removeSkill(tag)} className="ml-1 hover:opacity-60 transition-opacity">
                          <X size={10} />
                        </button>
                      )}
                    </span>
                  ))}
                  {editing && (
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={newSkill}
                        onChange={e => setNewSkill(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && addSkill()}
                        placeholder="Add skill…"
                        className="text-xs px-3 py-1 rounded-full border border-dashed border-[#21326c]/40 focus:outline-none focus:border-[#21326c] text-[#21326c] w-28"
                      />
                      <button onClick={addSkill} className="w-6 h-6 rounded-full flex items-center justify-center text-white" style={{ background: '#21326c' }}>
                        <Plus size={12} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="rounded-xl p-3" style={{ background: '#21326c08' }}>
                  <p className="font-bold text-[#21326c] text-lg leading-tight">{talent.completedJobs}</p>
                  <p className="text-xs text-[#21326c] mt-0.5">Projects</p>
                </div>
                <div className="rounded-xl p-3" style={{ background: '#21326c08' }}>
                  <p className="font-bold text-[#21326c] text-lg leading-tight">{talent.rating}★</p>
                  <p className="text-xs text-[#21326c] mt-0.5">Rating</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Platform About Us (guests / clients / admin) ────────────────────────────
  const [editingAbout, setEditingAbout]   = useState(false);
  const [aboutDraft, setAboutDraft]       = useState(aboutContent);
  const saveAbout = () => { setAboutContent(aboutDraft); setEditingAbout(false); };

  return (
    <div className="animate-fade-in">
      <section className="hero-pattern py-12 sm:py-20 px-4 relative">
        {isAdmin && (
          <div className="absolute top-6 right-6">
            {editingAbout ? (
              <div className="flex gap-2">
                <button onClick={() => setEditingAbout(false)} className="px-3 py-1.5 rounded-full text-xs font-semibold border border-[#21326c]/20 text-[#21326c] bg-white hover:bg-[#21326c]/5 transition-colors">Cancel</button>
                <button onClick={saveAbout} className="px-3 py-1.5 rounded-full text-xs font-semibold text-white" style={{ background: '#ff9044' }}>Save</button>
              </div>
            ) : (
              <button
                onClick={() => { setAboutDraft(aboutContent); setEditingAbout(true); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white border border-[#21326c]/20 text-[#21326c] hover:bg-[#21326c]/5 transition-colors shadow-sm"
              >
                <Pen size={11} /> Edit Page
              </button>
            )}
          </div>
        )}
        <div className="max-w-7xl mx-auto">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full mb-6" style={{ background: '#21326c', color: '#fff' }}>
              <Droplets size={12} /> Our Story
            </span>
            <h1 className="font-display text-4xl sm:text-5xl font-black text-[#21326c] leading-tight mb-6">
              Built for Egypt's{' '}
              <em className="not-italic" style={{ color: '#ff9044' }}>Creative</em>{' '}
              Generation
            </h1>
            {editingAbout ? (
              <div className="space-y-3">
                <textarea
                  rows={3}
                  value={aboutDraft.para1}
                  onChange={e => setAboutDraft(d => ({ ...d, para1: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-[#21326c]/20 text-[#21326c] text-sm focus:ring-2 focus:ring-[#21326c] resize-none bg-white/80"
                />
                <textarea
                  rows={3}
                  value={aboutDraft.para2}
                  onChange={e => setAboutDraft(d => ({ ...d, para2: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-[#21326c]/20 text-[#21326c] text-sm focus:ring-2 focus:ring-[#21326c] resize-none bg-white/80"
                />
              </div>
            ) : (
              <>
                <p className="text-lg text-[#21326c] leading-relaxed mb-4">{aboutContent.para1}</p>
                <p className="text-[#21326c] leading-relaxed">{aboutContent.para2}</p>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-16">
          {[
            { label: '200+', desc: 'Verified Students', Icon: GraduationCap },
            { label: '12',   desc: 'Partner Faculties',  Icon: Building2 },
            { label: '4.9★', desc: 'Average Rating',     Icon: Star },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl border border-[#21326c]/10 p-6 text-center">
              <s.Icon size={24} className="mx-auto mb-3 text-[#21326c]" />
              <p className="font-display text-4xl font-bold text-[#21326c] mb-1">{s.label}</p>
              <p className="text-sm text-[#21326c]">{s.desc}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {[
            {
              title: 'For Students',
              body: 'Once accepted by the Lawnn team, you get a verified profile, access to live client briefs, and a platform to share your work-in-progress. Your portfolio — a curated collection of PDF projects — becomes your calling card.',
              features: ['Verified student badge', 'Live job board access', 'PDF portfolio upload', 'Secure client messaging', 'Admin-managed acceptance'],
            },
            {
              title: 'For Clients',
              body: 'Browse verified student talent, post jobs, or let our VIP Concierge hand-pick the best match for your brief. Every student on Lawnn is verified by their faculty and reviewed by our team.',
              features: ['Vetted creative talent', 'Post jobs & receive applications', 'VIP concierge matching', 'Secure payments via escrow', 'Direct messaging'],
            },
          ].map(card => (
            <div key={card.title} className="bg-white rounded-2xl border border-[#21326c]/10 p-8">
              <h3 className="font-display text-2xl font-bold text-[#21326c] mb-4">{card.title}</h3>
              <p className="text-[#21326c] leading-relaxed mb-5 text-sm">{card.body}</p>
              <ul className="space-y-2">
                {card.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-[#21326c]">
                    <CheckCircle size={14} className="flex-shrink-0 text-[#21326c]" /> {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

// ─── VIEW: NEWS ───────────────────────────────────────────────────────────────

const NEWS_CATEGORIES = ['Career Advice', 'Business', 'Industry', 'Legal', 'Design', 'Technology'];
const NEWS_COLORS     = ['#21326c', '#c4622d', '#db9630', '#3c8762', '#a84f22', '#5ea580'];

function ArticleBodyBlock({ block }) {
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

function NewsPage({ newsPosts, setNewsPosts, currentUser }) {
  const isAdmin = currentUser?.role === 'admin';

  const [selectedArticle, setSelectedArticle] = useState(null);
  const [showModal, setShowModal]             = useState(false);
  const [editingPost, setEditingPost]         = useState(null);
  const [deleteConfirm, setDeleteConfirm]     = useState(null);

  // body is stored as plain text in the form, split on blank lines into paragraphs on save
  const emptyForm = { title: '', excerpt: '', bodyText: '', category: 'Career Advice', readTime: '5 min read', color: '#21326c' };
  const [form, setForm] = useState(emptyForm);

  const bodyToText = body => (body || [])
    .filter(b => b.type === 'paragraph')
    .map(b => b.text)
    .join('\n\n');

  const textToBody = text => text
    .split(/\n\n+/)
    .map(t => t.trim())
    .filter(Boolean)
    .map(t => ({ type: 'paragraph', text: t }));

  const openCreate = () => { setForm(emptyForm); setEditingPost(null); setShowModal(true); };
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

  const handleSave = () => {
    if (!form.title.trim() || !form.excerpt.trim()) return;
    const body = textToBody(form.bodyText);
    if (editingPost) {
      setNewsPosts(ps => ps.map(p => p.id === editingPost.id ? { ...p, title: form.title, excerpt: form.excerpt, body, category: form.category, readTime: form.readTime, color: form.color } : p));
      if (selectedArticle?.id === editingPost.id) {
        setSelectedArticle(a => ({ ...a, title: form.title, excerpt: form.excerpt, body, category: form.category, readTime: form.readTime, color: form.color }));
      }
    } else {
      const now = new Date();
      const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      const newPost = { id: Date.now(), author: 'Lawnn Admin', date: dateStr, title: form.title, excerpt: form.excerpt, body, category: form.category, readTime: form.readTime, color: form.color };
      setNewsPosts(ps => [newPost, ...ps]);
    }
    closeModal();
  };

  const handleDelete = id => {
    setNewsPosts(ps => ps.filter(p => p.id !== id));
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
          <NewsArticleForm form={form} setForm={setForm} onSave={handleSave} editingPost={editingPost} />
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
        <NewsArticleForm form={form} setForm={setForm} onSave={handleSave} editingPost={editingPost} />
      </Modal>
    </div>
  );
}

function NewsArticleForm({ form, setForm, onSave, editingPost }) {
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
        disabled={!form.title.trim() || !form.excerpt.trim() || !form.bodyText.trim()}
        className="w-full py-3 rounded-xl font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ background: '#ff9044' }}
      >
        {editingPost ? 'Save Changes' : 'Publish Article'}
      </button>
    </div>
  );
}

// ─── VIEW: MARKETPLACE ───────────────────────────────────────────────────────

function MarketplacePage({ listings, setListings, pendingListings, setPendingListings, currentUser }) {
  const isStudent = currentUser?.role === 'student';
  const isClient  = currentUser?.role === 'client';
  const isAdmin   = currentUser?.role === 'admin';

  const [tab, setTab]                       = useState('browse');
  const [showListingModal, setShowListingModal] = useState(false);
  const [editingListing, setEditingListing] = useState(null);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [targetListing, setTargetListing]   = useState(null);
  const [offerForm, setOfferForm]           = useState({ amount: '', message: '' });
  const [expandedOffers, setExpandedOffers] = useState({});
  const [replyText, setReplyText]           = useState({});
  const [offerSent, setOfferSent]           = useState(null);

  const emptyForm = { title: '', description: '', price: '', color: '#21326c' };
  const [listingForm, setListingForm] = useState(emptyForm);

  // Student's own listings (pending + active/sold)
  const myListings = isStudent
    ? [
        ...pendingListings.filter(l => l.seller.talentId === currentUser.talentId).map(l => ({ ...l, isPending: true })),
        ...listings.filter(l => l.seller.talentId === currentUser.talentId),
      ]
    : [];

  // Active public listings for browse
  const activeListings = listings.filter(l => l.status === 'active');

  // ── Create / Edit ────────────────────────────────────────────────────────────
  const openCreate = () => {
    setListingForm(emptyForm);
    setEditingListing(null);
    setShowListingModal(true);
    if (isStudent) setTab('mine');
  };

  const openEdit = listing => {
    setListingForm({ title: listing.title, description: listing.description, price: listing.price, color: listing.color });
    setEditingListing(listing);
    setShowListingModal(true);
  };

  const saveListing = () => {
    if (!listingForm.title.trim()) return;
    if (editingListing) {
      // Price is locked — only title, description, color editable
      const updated = { ...editingListing, title: listingForm.title, description: listingForm.description, color: listingForm.color };
      if (editingListing.isPending) {
        setPendingListings(ls => ls.map(l => l.id === editingListing.id ? updated : l));
      } else {
        setListings(ls => ls.map(l => l.id === editingListing.id ? updated : l));
      }
    } else {
      const newListing = {
        id: Date.now(),
        title: listingForm.title,
        description: listingForm.description,
        price: Number(listingForm.price),
        color: listingForm.color,
        seller: { name: currentUser.name, initials: currentUser.initials, avatarColor: currentUser.avatarColor, talentId: currentUser.talentId },
        status: 'pending',
        postedAt: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
        offers: [],
      };
      setPendingListings(ls => [...ls, newListing]);
    }
    setShowListingModal(false);
  };

  const deleteListing = listing => {
    if (listing.isPending) {
      setPendingListings(ls => ls.filter(l => l.id !== listing.id));
    } else {
      setListings(ls => ls.filter(l => l.id !== listing.id));
    }
  };

  // ── Offer flow ───────────────────────────────────────────────────────────────
  const submitOffer = () => {
    if (!offerForm.amount || !targetListing) return;
    const offer = {
      id: Date.now(),
      from: currentUser.name,
      fromInitials: currentUser.initials,
      fromColor: currentUser.avatarColor,
      amount: Number(offerForm.amount),
      message: offerForm.message,
      status: 'pending',
      reply: null,
    };
    setListings(ls => ls.map(l => l.id === targetListing.id ? { ...l, offers: [...l.offers, offer] } : l));
    setShowOfferModal(false);
    setOfferSent(targetListing.id);
    setTimeout(() => setOfferSent(null), 3500);
    setOfferForm({ amount: '', message: '' });
    setTargetListing(null);
  };

  const acceptOffer = (listingId, offerId) => {
    setListings(ls => ls.map(l => {
      if (l.id !== listingId) return l;
      return {
        ...l,
        status: 'sold',
        offers: l.offers.map(o => ({
          ...o,
          status: o.id === offerId ? 'accepted' : (o.status === 'pending' ? 'rejected' : o.status),
        })),
      };
    }));
  };

  const rejectOffer = (listingId, offerId) => {
    setListings(ls => ls.map(l => {
      if (l.id !== listingId) return l;
      return { ...l, offers: l.offers.map(o => o.id === offerId ? { ...o, status: 'rejected' } : o) };
    }));
  };

  const replyToOffer = (listingId, offerId) => {
    const text = replyText[offerId]?.trim();
    if (!text) return;
    setListings(ls => ls.map(l => {
      if (l.id !== listingId) return l;
      return { ...l, offers: l.offers.map(o => o.id === offerId ? { ...o, reply: text } : o) };
    }));
    setReplyText(r => ({ ...r, [offerId]: '' }));
  };

  // ── Status badge ─────────────────────────────────────────────────────────────
  const StatusBadge = ({ status }) => {
    const map = {
      active:  { label: 'Active',          bg: '#21326c15', color: '#21326c' },
      sold:    { label: 'Sold',            bg: '#c4622d15', color: '#c4622d' },
      pending: { label: 'Pending Review',  bg: '#db963015', color: '#db9630' },
    };
    const s = map[status] || map.pending;
    return (
      <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: s.bg, color: s.color }}>
        {s.label}
      </span>
    );
  };

  // ── Offer status badge ───────────────────────────────────────────────────────
  const offerStatusColor = s => ({ pending: '#db9630', accepted: '#21326c', rejected: '#c4622d' }[s] || '#21326c');

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#21326c] mb-1">Marketplace</h1>
          <p className="text-sm text-[#21326c]">Student-made work, prints, and creative assets for sale</p>
        </div>
        {isStudent && (
          <button
            onClick={openCreate}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold text-white hover:opacity-90 transition-all flex-shrink-0"
            style={{ background: '#ff9044' }}
          >
            <Plus size={15} /> List an Item
          </button>
        )}
      </div>

      {/* Tabs (students only) */}
      {isStudent && (
        <div className="flex gap-1 mb-6 bg-[#21326c]/5 rounded-xl p-1 w-fit">
          {[{ id: 'browse', label: 'Browse' }, { id: 'mine', label: `My Listings${myListings.length ? ` (${myListings.length})` : ''}` }].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={tab === t.id ? { background: '#21326c', color: '#fff' } : { color: '#21326c' }}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {/* ── BROWSE TAB ── */}
      {tab === 'browse' && (
        <>
          {activeListings.length === 0 && (
            <div className="text-center py-20 text-[#21326c]">
              <ShoppingBag size={40} className="mx-auto mb-3 opacity-20" />
              <p className="font-semibold">No listings yet</p>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {activeListings.map(listing => (
              <div key={listing.id} className="bg-white rounded-2xl border border-[#21326c]/10 overflow-hidden group">
                {/* Image placeholder */}
                <div
                  className="h-40 flex items-center justify-center"
                  style={{ background: `linear-gradient(135deg, ${listing.color}33, ${listing.color}88)` }}
                >
                  <Package size={32} style={{ color: listing.color }} className="opacity-30" />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-[#21326c] mb-1 leading-snug">{listing.title}</h3>
                  <p className="text-xs text-[#21326c]/60 mb-3 line-clamp-2">{listing.description}</p>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Avatar initials={listing.seller.initials} color={listing.seller.avatarColor} size="sm" />
                      <span className="text-xs text-[#21326c]">{listing.seller.name}</span>
                    </div>
                    <span className="font-bold text-[#21326c]">{listing.price.toLocaleString()} EGP</span>
                  </div>
                  {/* Offer sent confirmation */}
                  {offerSent === listing.id && (
                    <div className="text-xs text-center py-1.5 rounded-lg font-medium" style={{ background: '#21326c10', color: '#21326c' }}>
                      <CheckCircle size={12} className="inline mr-1" /> Offer sent!
                    </div>
                  )}
                  {/* CTA */}
                  {isClient && offerSent !== listing.id && (
                    <button
                      onClick={() => { setTargetListing(listing); setShowOfferModal(true); }}
                      className="w-full py-2 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-all"
                      style={{ background: '#ff9044' }}
                    >
                      Make an Offer
                    </button>
                  )}
                  {isAdmin && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setTargetListing(listing); setShowOfferModal(true); }}
                        className="flex-1 py-2 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-all"
                        style={{ background: '#ff9044' }}
                      >
                        Make Offer
                      </button>
                      <button
                        onClick={() => setListings(ls => ls.filter(l => l.id !== listing.id))}
                        className="p-2 rounded-xl border border-red-200 text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                        title="Delete listing"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                  {!currentUser && (
                    <p className="text-xs text-center text-[#21326c]/50 py-1">Sign in to make an offer</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── MY LISTINGS TAB (student) ── */}
      {tab === 'mine' && isStudent && (
        <>
          {myListings.length === 0 && (
            <div className="text-center py-20 text-[#21326c]">
              <Package size={40} className="mx-auto mb-3 opacity-20" />
              <p className="font-semibold mb-1">No listings yet</p>
              <p className="text-sm opacity-60">Click "List an Item" to sell your creative work.</p>
            </div>
          )}
          <div className="grid gap-5">
            {myListings.map(listing => {
              const offersOpen = expandedOffers[listing.id];
              const pendingOffers = listing.offers.filter(o => o.status === 'pending');
              return (
                <div key={listing.id} className="bg-white rounded-2xl border border-[#21326c]/10 overflow-hidden">
                  <div className="flex items-stretch">
                    {/* Color strip */}
                    <div className="w-2 flex-shrink-0" style={{ background: `linear-gradient(180deg, ${listing.color}88, ${listing.color})` }} />
                    <div className="flex-1 p-5">
                      {/* Top row */}
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h3 className="font-semibold text-[#21326c] leading-snug">{listing.title}</h3>
                            <StatusBadge status={listing.isPending ? 'pending' : listing.status} />
                          </div>
                          <p className="text-xl font-bold text-[#21326c]">{listing.price.toLocaleString()} EGP
                            <span className="text-xs font-normal text-[#21326c]/40 ml-1">(price locked)</span>
                          </p>
                        </div>
                        {/* Actions */}
                        {listing.status !== 'sold' && (
                          <div className="flex gap-2 flex-shrink-0">
                            <button
                              onClick={() => openEdit(listing)}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-[#21326c]/20 text-[#21326c] hover:bg-[#21326c]/5 transition-colors flex items-center gap-1"
                            >
                              <Pen size={11} /> Edit
                            </button>
                            <button
                              onClick={() => deleteListing(listing)}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-red-100 text-red-400 hover:bg-red-50 transition-colors flex items-center gap-1"
                            >
                              <X size={11} /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-[#21326c]/70 mb-3 leading-relaxed">{listing.description}</p>

                      {/* Offers toggle */}
                      {!listing.isPending && (
                        <button
                          onClick={() => setExpandedOffers(e => ({ ...e, [listing.id]: !e[listing.id] }))}
                          className="flex items-center gap-1.5 text-xs font-semibold text-[#21326c] hover:opacity-70 transition-opacity"
                        >
                          <MessageCircle size={13} />
                          {listing.offers.length === 0
                            ? 'No offers yet'
                            : `${listing.offers.length} offer${listing.offers.length > 1 ? 's' : ''}${pendingOffers.length ? ` · ${pendingOffers.length} pending` : ''}`}
                          <ChevronRight size={12} className={`transition-transform ${offersOpen ? 'rotate-90' : ''}`} />
                        </button>
                      )}

                      {/* Offers panel */}
                      {offersOpen && listing.offers.length > 0 && (
                        <div className="mt-3 space-y-3 border-t border-[#21326c]/10 pt-3">
                          {listing.offers.map(offer => (
                            <div key={offer.id} className="rounded-xl p-3 border border-[#21326c]/10" style={{ background: '#21326c04' }}>
                              <div className="flex items-center gap-2 mb-1">
                                <Avatar initials={offer.fromInitials} color={offer.fromColor} size="sm" />
                                <span className="text-xs font-semibold text-[#21326c]">{offer.from}</span>
                                <span className="text-xs font-bold text-[#21326c] ml-auto">{offer.amount.toLocaleString()} EGP</span>
                                <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: `${offerStatusColor(offer.status)}15`, color: offerStatusColor(offer.status) }}>
                                  {offer.status.charAt(0).toUpperCase() + offer.status.slice(1)}
                                </span>
                              </div>
                              {offer.message && <p className="text-xs text-[#21326c]/70 mb-2 leading-relaxed">{offer.message}</p>}

                              {/* Reply */}
                              {offer.reply && (
                                <div className="flex items-start gap-1.5 mb-2 pl-2 border-l-2 border-[#21326c]/20">
                                  <p className="text-xs text-[#21326c]/70 italic">"{offer.reply}"</p>
                                </div>
                              )}

                              {/* Controls */}
                              {offer.status === 'pending' && listing.status !== 'sold' && (
                                <div className="flex items-center gap-2 mt-2">
                                  <button
                                    onClick={() => acceptOffer(listing.id, offer.id)}
                                    className="px-3 py-1 rounded-full text-xs font-semibold text-white" style={{ background: '#21326c' }}
                                  >
                                    Accept
                                  </button>
                                  <button
                                    onClick={() => rejectOffer(listing.id, offer.id)}
                                    className="px-3 py-1 rounded-full text-xs font-semibold border border-[#21326c]/20 text-[#21326c] hover:bg-[#21326c]/5"
                                  >
                                    Reject
                                  </button>
                                  {!offer.reply && (
                                    <div className="flex items-center gap-1 ml-auto flex-1">
                                      <input
                                        type="text"
                                        value={replyText[offer.id] || ''}
                                        onChange={e => setReplyText(r => ({ ...r, [offer.id]: e.target.value }))}
                                        onKeyDown={e => e.key === 'Enter' && replyToOffer(listing.id, offer.id)}
                                        placeholder="Reply…"
                                        className="flex-1 text-xs px-2.5 py-1.5 rounded-lg border border-[#21326c]/20 focus:outline-none focus:ring-1 focus:ring-[#21326c] text-[#21326c] placeholder:text-[#21326c]/40"
                                      />
                                      <button
                                        onClick={() => replyToOffer(listing.id, offer.id)}
                                        className="p-1.5 rounded-lg text-white" style={{ background: '#21326c' }}
                                      >
                                        <Send size={11} />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )}

                              {offer.status === 'accepted' && (
                                <div className="mt-2 flex items-center gap-1.5 text-xs font-medium" style={{ color: '#21326c' }}>
                                  <BadgeCheck size={13} />
                                  Offer accepted — payment held in escrow by Lawnn until delivery is confirmed.
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ── CREATE / EDIT MODAL ── */}
      <Modal open={showListingModal} onClose={() => setShowListingModal(false)} title={editingListing ? 'Edit Listing' : 'List an Item'} wide>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#21326c] uppercase tracking-wider mb-1.5">Title *</label>
            <input
              type="text"
              placeholder="e.g. Original Calligraphy Print"
              value={listingForm.title}
              onChange={e => setListingForm(f => ({ ...f, title: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-[#21326c]/20 text-[#21326c] text-sm focus:ring-2 focus:ring-[#21326c] transition-all placeholder:text-[#21326c]/40"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#21326c] uppercase tracking-wider mb-1.5">Description</label>
            <textarea
              rows={3}
              placeholder="Describe what you're selling — materials, size, condition, what's included…"
              value={listingForm.description}
              onChange={e => setListingForm(f => ({ ...f, description: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-[#21326c]/20 text-[#21326c] text-sm focus:ring-2 focus:ring-[#21326c] transition-all resize-none placeholder:text-[#21326c]/40"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#21326c] uppercase tracking-wider mb-1.5">
              Price (EGP) *
              {editingListing && <span className="ml-2 font-normal text-[#21326c]/40 normal-case">(cannot be changed after listing)</span>}
            </label>
            <div className="relative">
              <DollarSign size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#21326c]/40" />
              <input
                type="number"
                placeholder="e.g. 1200"
                value={listingForm.price}
                onChange={e => setListingForm(f => ({ ...f, price: e.target.value }))}
                disabled={!!editingListing}
                className="w-full pl-9 pr-4 py-3 rounded-xl border border-[#21326c]/20 text-[#21326c] text-sm focus:ring-2 focus:ring-[#21326c] transition-all placeholder:text-[#21326c]/40 disabled:opacity-40 disabled:cursor-not-allowed"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#21326c] uppercase tracking-wider mb-1.5">Card Colour</label>
            <div className="flex gap-2">
              {LISTING_COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setListingForm(f => ({ ...f, color: c }))}
                  className="w-8 h-8 rounded-lg transition-transform hover:scale-110"
                  style={{ background: c, outline: listingForm.color === c ? `3px solid ${c}` : 'none', outlineOffset: '2px' }}
                />
              ))}
            </div>
          </div>
          <button
            onClick={saveListing}
            disabled={!listingForm.title.trim() || (!editingListing && !listingForm.price)}
            className="w-full py-3 rounded-xl font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: '#ff9044' }}
          >
            {editingListing ? 'Save Changes' : 'Submit for Review'}
          </button>
          {!editingListing && (
            <p className="text-xs text-center text-[#21326c]/50">Your listing will go live once approved by the Lawnn admin team.</p>
          )}
        </div>
      </Modal>

      {/* ── MAKE AN OFFER MODAL ── */}
      <Modal open={showOfferModal} onClose={() => setShowOfferModal(false)} title={`Make an Offer — ${targetListing?.title || ''}`}>
        <div className="space-y-4">
          <div className="rounded-xl p-4 border border-[#21326c]/10" style={{ background: '#21326c05' }}>
            <p className="text-xs font-semibold text-[#21326c] mb-0.5">Listed price</p>
            <p className="text-xl font-bold text-[#21326c]">{targetListing?.price?.toLocaleString()} EGP</p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#21326c] uppercase tracking-wider mb-1.5">Your Offer (EGP) *</label>
            <div className="relative">
              <DollarSign size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#21326c]/40" />
              <input
                type="number"
                placeholder={targetListing?.price}
                value={offerForm.amount}
                onChange={e => setOfferForm(f => ({ ...f, amount: e.target.value }))}
                className="w-full pl-9 pr-4 py-3 rounded-xl border border-[#21326c]/20 text-[#21326c] text-sm focus:ring-2 focus:ring-[#21326c] transition-all placeholder:text-[#21326c]/40"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#21326c] uppercase tracking-wider mb-1.5">Message (optional)</label>
            <textarea
              rows={3}
              placeholder="Introduce yourself and explain why you're interested…"
              value={offerForm.message}
              onChange={e => setOfferForm(f => ({ ...f, message: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-[#21326c]/20 text-[#21326c] text-sm focus:ring-2 focus:ring-[#21326c] transition-all resize-none placeholder:text-[#21326c]/40"
            />
          </div>
          <div className="flex items-start gap-2 rounded-xl px-3 py-2.5 text-xs text-[#21326c]" style={{ background: '#21326c08' }}>
            <Info size={13} className="flex-shrink-0 mt-0.5" />
            If accepted, payment will be held in escrow by Lawnn until the seller confirms delivery.
          </div>
          <button
            onClick={submitOffer}
            disabled={!offerForm.amount}
            className="w-full py-3 rounded-xl font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: '#ff9044' }}
          >
            Send Offer
          </button>
        </div>
      </Modal>
    </div>
  );
}

// ─── VIEW: ADMIN DASHBOARD ────────────────────────────────────────────────────

function PendingSection({ title, icon: Icon, color, items, onApprove, onReject, renderItem }) {
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

function AdminPage({ pendingFeedPosts, setPendingFeedPosts, setFeedPosts, pendingJobs, setPendingJobs, setJobs, pendingListings, setPendingListings, setListings }) {
  const [adminTab, setAdminTab] = useState('content');
  const [activeConvo, setActiveConvo] = useState(CHAT_CONTACTS[0]);

  const approveFeedPost = post => {
    setFeedPosts(ps => [post, ...ps]);
    setPendingFeedPosts(ps => ps.filter(p => p.id !== post.id));
  };
  const rejectFeedPost = id => setPendingFeedPosts(ps => ps.filter(p => p.id !== id));

  const approveJob = job => {
    setJobs(js => [job, ...js]);
    setPendingJobs(js => js.filter(j => j.id !== job.id));
  };
  const rejectJob = id => setPendingJobs(js => js.filter(j => j.id !== id));

  const approveListing = listing => {
    setListings(ls => [{ ...listing, status: 'active' }, ...ls]);
    setPendingListings(ls => ls.filter(l => l.id !== listing.id));
  };
  const rejectListing = id => setPendingListings(ls => ls.filter(l => l.id !== id));

  const totalPending = pendingFeedPosts.length + pendingJobs.length + pendingListings.length;

  const ADMIN_TABS = [
    { id: 'content',       label: 'Content Queue', Icon: Shield },
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
          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
            {[
              { label: 'Pending Posts',    count: pendingFeedPosts.length, color: '#c4622d', Icon: Grid },
              { label: 'Pending Jobs',     count: pendingJobs.length,      color: '#db9630', Icon: Briefcase },
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
              title="Job Postings"
              icon={Briefcase}
              color="#db9630"
              items={pendingJobs}
              onApprove={approveJob}
              onReject={rejectJob}
              renderItem={job => (
                <>
                  <p className="text-sm font-semibold text-[#21326c] mb-0.5">{job.title}</p>
                  <p className="text-xs text-[#21326c]/60">{job.client} · {job.budget} EGP</p>
                  {job.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {job.tags.map(t => <span key={t} className="tag-pill">{t}</span>)}
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

      {/* ── CONVERSATIONS TAB ── */}
      {adminTab === 'conversations' && (
        <div className="bg-white rounded-2xl border border-[#21326c]/10 overflow-hidden" style={{ minHeight: '520px' }}>
          <div className="flex flex-col sm:flex-row" style={{ minHeight: '520px' }}>
            {/* Contact list */}
            <div className="w-full sm:w-64 sm:flex-shrink-0 border-b sm:border-b-0 sm:border-r border-[#21326c]/10 flex flex-col" style={{ maxHeight: '180px', overflowY: 'auto' }}>
              <div className="px-4 py-3 border-b border-[#21326c]/10 bg-[#21326c]/5">
                <p className="text-xs font-semibold text-[#21326c] uppercase tracking-wide">All Conversations</p>
              </div>
              <div className="flex-1 overflow-y-auto divide-y divide-[#21326c]/5">
                {CHAT_CONTACTS.map(contact => (
                  <button
                    key={contact.id}
                    onClick={() => setActiveConvo(contact)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-[#21326c]/5 transition-colors text-left"
                    style={activeConvo.id === contact.id ? { background: '#21326c10', borderLeft: '3px solid #21326c' } : {}}
                  >
                    <Avatar initials={contact.initials} color={contact.color} size="sm" online={contact.online} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-[#21326c] truncate">{contact.name}</p>
                      <p className="text-xs text-[#21326c]/50 truncate">{contact.lastMsg}</p>
                    </div>
                    {contact.unread > 0 && (
                      <span className="w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: '#c4622d', fontSize: '10px' }}>
                        {contact.unread}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Message thread */}
            <div className="flex-1 flex flex-col min-w-0 min-h-0">
              <div className="flex items-center gap-3 p-4 border-b border-[#21326c]/10">
                <Avatar initials={activeConvo.initials} color={activeConvo.color} size="md" online={activeConvo.online} />
                <div>
                  <p className="font-semibold text-[#21326c] text-sm">{activeConvo.name}</p>
                  <p className="text-xs text-[#21326c]/50">{activeConvo.online ? 'Online' : 'Offline'} · Read-only view</p>
                </div>
                <div className="ml-auto">
                  <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ background: '#21326c10', color: '#21326c' }}>
                    <Shield size={10} className="inline mr-1" />Admin Monitor
                  </span>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {CHAT_MESSAGES.map(msg => (
                  <div key={msg.id} className={`flex ${msg.from === 'me' ? 'justify-end' : 'justify-start'}`}>
                    {msg.from === 'them' && (
                      <Avatar initials={activeConvo.initials} color={activeConvo.color} size="sm" />
                    )}
                    <div className={`max-w-sm mx-2 px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      msg.from === 'me'
                        ? 'bg-[#21326c] text-white rounded-br-sm'
                        : 'bg-[#21326c]/10 text-[#21326c] rounded-bl-sm'
                    }`}>
                      {msg.text}
                      <p className={`text-xs mt-1 ${msg.from === 'me' ? 'text-white/50' : 'text-[#21326c]/50'}`}>{msg.time}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-3 border-t border-[#21326c]/10 bg-[#21326c]/3">
                <p className="text-xs text-center text-[#21326c]/40">
                  <Lock size={10} className="inline mr-1" />Admins can view but not send messages in monitored conversations
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── USERS TAB ── */}
      {adminTab === 'users' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-[#21326c]">{MOCK_USERS.length} registered users</p>
          </div>
          {MOCK_USERS.map(user => (
            <div key={user.id} className="bg-white rounded-2xl border border-[#21326c]/10 p-4 flex items-center gap-4">
              <Avatar initials={user.initials} color={user.avatarColor} size="md" />
              <div className="flex-1">
                <p className="font-semibold text-[#21326c] text-sm">{user.name}</p>
                <p className="text-xs text-[#21326c]/60">{user.email}</p>
              </div>
              <span
                className="text-xs font-semibold px-3 py-1 rounded-full capitalize"
                style={{
                  background: user.role === 'admin' ? '#21326c15' : user.role === 'student' ? '#3c876215' : '#c4622d15',
                  color:      user.role === 'admin' ? '#21326c'   : user.role === 'student' ? '#3c8762'   : '#c4622d',
                }}
              >
                {user.role}
              </span>
              {user.role === 'student' && (
                <span className="flex items-center gap-1 text-xs text-[#21326c]/50">
                  <BadgeCheck size={13} className="text-[#21326c]" /> Verified
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── ROOT APP ─────────────────────────────────────────────────────────────────

export default function App() {
  const [view, setView] = useState('home');
  const [selectedTalent, setSelectedTalent] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [showLogin, setShowLogin] = useState(false);

  // Lifted mutable state so edits propagate across all views
  const [talents, setTalents]                   = useState(TALENTS);
  const [newsPosts, setNewsPosts]               = useState(NEWS_POSTS);
  const [feedPosts, setFeedPosts]                       = useState(FEED_POSTS);
  const [pendingFeedPosts, setPendingFeedPosts]         = useState([]);
  const [jobs, setJobs]                                 = useState(JOBS);
  const [pendingJobs, setPendingJobs]                   = useState([]);
  const [listings, setListings]                         = useState(MARKETPLACE_LISTINGS);
  const [pendingListings, setPendingListings]           = useState([]);
  const [aboutContent, setAboutContent] = useState({
    para1: "Lawnn was born from a simple observation: Egypt's art and design faculties produce world-class talent, but that talent rarely gets the visibility or opportunity it deserves.",
    para2: "We built a platform that verifies students from Egypt's top creative institutions, connects them with real clients and briefs, and gives them the tools to grow a sustainable creative career — all while they're still studying.",
  });

  const handleLogin = user => {
    setCurrentUser(user);
    if (user.role === 'student') setView('feed');
    else if (user.role === 'client') setView('home');
    else if (user.role === 'admin') setView('admin');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setView('home');
  };

  const handleUpdateTalent = updated => {
    setTalents(ts => ts.map(t => t.id === updated.id ? updated : t));
    if (selectedTalent?.id === updated.id) setSelectedTalent(updated);
  };

  const handleNavChange = v => {
    if (v === 'profile' && currentUser?.role === 'student') {
      const talent = talents.find(t => t.id === currentUser.talentId);
      if (talent) setSelectedTalent(talent);
    }
    setView(v);
  };

  const renderView = () => {
    switch (view) {
      case 'home':
        return <HomePage setView={handleNavChange} setSelectedTalent={setSelectedTalent} talents={talents} />;
      case 'jobs':
        return <JobBoardPage setView={handleNavChange} jobs={jobs} setJobs={setJobs} pendingJobs={pendingJobs} setPendingJobs={setPendingJobs} currentUser={currentUser} />;
      case 'directory':
        return <DirectoryPage setView={handleNavChange} setSelectedTalent={setSelectedTalent} talents={talents} />;
      case 'profile':
        return selectedTalent
          ? <ProfilePage talent={selectedTalent} setView={handleNavChange} currentUser={currentUser} onUpdateTalent={handleUpdateTalent} />
          : <DirectoryPage setView={handleNavChange} setSelectedTalent={setSelectedTalent} talents={talents} />;
      case 'feed':
        return <FeedPage feedPosts={feedPosts} setFeedPosts={setFeedPosts} pendingFeedPosts={pendingFeedPosts} setPendingFeedPosts={setPendingFeedPosts} currentUser={currentUser} />;
      case 'chat':
        return <ChatPage />;
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
        return <NewsPage newsPosts={newsPosts} setNewsPosts={setNewsPosts} currentUser={currentUser} />;
      case 'marketplace':
        return <MarketplacePage listings={listings} setListings={setListings} pendingListings={pendingListings} setPendingListings={setPendingListings} currentUser={currentUser} />;
      case 'admin':
        return currentUser?.role === 'admin'
          ? <AdminPage
              pendingFeedPosts={pendingFeedPosts} setPendingFeedPosts={setPendingFeedPosts} setFeedPosts={setFeedPosts}
              pendingJobs={pendingJobs} setPendingJobs={setPendingJobs} setJobs={setJobs}
              pendingListings={pendingListings} setPendingListings={setPendingListings} setListings={setListings}
            />
          : <HomePage setView={handleNavChange} setSelectedTalent={setSelectedTalent} talents={talents} />;
      default:
        return <HomePage setView={handleNavChange} setSelectedTalent={setSelectedTalent} talents={talents} />;
    }
  };

  return (
    <div className="min-h-screen" style={{ background: '#fffcf4' }}>
      <TopNav
        view={view}
        setView={handleNavChange}
        currentUser={currentUser}
        onLoginClick={() => setShowLogin(true)}
        onLogout={handleLogout}
      />

      <LoginModal
        open={showLogin}
        onClose={() => setShowLogin(false)}
        onLogin={handleLogin}
      />

      <main>{renderView()}</main>

      {/* Footer */}
      <footer className="mt-16 border-t border-[#21326c]/10 py-8 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-[#21326c]">
          <div className="flex items-center gap-2">
            <Droplets size={16} className="text-[#21326c]" />
            <span className="font-display font-bold text-[#21326c]">Lawnn</span>
            <span style={{ fontFamily: 'Noto Naskh Arabic' }}>لون</span>
            <span>— Egyptian Creative Talent Platform</span>
          </div>
          <div className="flex gap-4">
            <button onClick={() => handleNavChange('about')} className="hover:opacity-80 transition-colors">About</button>
            <button onClick={() => handleNavChange('news')}  className="hover:opacity-80 transition-colors">News</button>
            <button onClick={() => handleNavChange('jobs')}  className="hover:opacity-80 transition-colors">For Clients</button>
            <a href="#" className="hover:opacity-80 transition-colors">Privacy</a>
          </div>
        </div>
      </footer>
    </div>
  );
}