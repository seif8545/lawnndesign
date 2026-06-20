import { File } from 'lucide-react';

export const PRIMARY_COLOR = '#21326c';

export const PALETTE_COLORS = [PRIMARY_COLOR, '#c4622d', '#db9630', '#3c8762', '#a84f22', '#5ea580'];

export const LISTING_COLORS = PALETTE_COLORS;

// ─── SHARED FORM TEMPLATES ────────────────────────────────────────────────────────

export const EMPTY_NEWS_FORM = { title: '', excerpt: '', bodyText: '', category: 'Career Advice', readTime: '5 min read', color: PRIMARY_COLOR };

export const EMPTY_LISTING_FORM = { title: '', description: '', price: '', location: '', imageUrl: '', color: PRIMARY_COLOR };

// ─── DATE/TIME FORMATS ────────────────────────────────────────────────────────────

export const DATE_FORMAT_OPTIONS = { year: 'numeric', month: 'long', day: 'numeric' };

// ─── SKILL LIBRARY ────────────────────────────────────────────────────────────

export const SKILL_LIBRARY = [
  {
    category: 'Software & Tools',
    skills: [
      'AutoCAD', 'Rhinoceros', 'Blender', '3ds Max', 'SketchUp', 'V-Ray',
      'Revit', 'Corona Renderer', 'Adobe Photoshop', 'Adobe Illustrator',
      'Adobe InDesign', 'Figma', 'Procreate', 'Adobe Fresco', 'Corel Painter',
      'ZBrush', 'Fusion 360', 'Grasshopper', 'Lumion',
    ],
  },
  {
    category: 'Conceptual Design',
    skills: ['Spatial Thinking', 'Composition', 'Visual Hierarchy', 'Color Theory'],
  },
  {
    category: 'Space & Architecture',
    skills: ['Space Planning', 'Material Selection', 'Lighting Design', 'Technical Drawing'],
  },
  {
    category: 'Branding & Identity',
    skills: ['Branding', 'Identity Design', 'Typography', 'UI Design', 'UX Design'],
  },
  {
    category: 'Form & Craft',
    skills: ['Form Development', 'Volume Understanding', 'Material Handling', 'Structural Balance', 'Casting', 'Finishing'],
  },
  {
    category: 'Advanced Design',
    skills: ['Sustainable Design', 'Parametric Design'],
  },
  {
    category: 'Professional Skills',
    skills: ['Presentation Skills', 'Client Communication', 'Project Management', 'Time Management'],
  },
  {
    category: 'Visualization & Production',
    skills: ['3D Visualization', 'Rendering Optimization', 'Post-Production', 'Model Making', 'Digital Fabrication', 'File Preparation for Print'],
  },
  {
    category: 'Media & Content',
    skills: ['Photography', 'Videography', 'Content Creation', 'Social Media Strategy', 'Basic Coding (HTML/CSS)', 'AI Tools Usage'],
  },
  {
    category: 'Drawing & Illustration',
    skills: ['Style Development', 'Visual Storytelling', 'Freehand Drawing', 'Sketching', 'Perspective Drawing', 'Figure Drawing', 'Technical Drafting', 'Mixed Media Techniques', 'Digital Sketching'],
  },
];

// ─── SHARED COMPONENTS ───────────────────────────────────────────────────────

// LinkedIn-style skill picker — searchable list + free-type custom skills

export const AVAILABILITY = {
  open:  { label: 'Open to work',   color: '#22c55e', bg: '#dcfce7', text: '#15803d' },
  busy:  { label: 'Busy right now', color: '#f59e0b', bg: '#fef3c7', text: '#92400e' },
  away:  { label: 'Away',           color: '#9ca3af', bg: '#f3f4f6', text: '#4b5563' },
};

export const NEWS_CATEGORIES = ['Career Advice', 'Business', 'Industry', 'Legal', 'Design', 'Technology'];

export const NEWS_COLORS     = PALETTE_COLORS;

export const PROJECT_STATUS_STEPS = ['open', 'offer_accepted', 'deposit_paid', 'in_progress', 'delivered', 'completed', 'reviewed'];

export const PROJECT_DONE_STATUSES = ['completed', 'reviewed'];

export const PROJECT_STATUS_LABELS = {
  open:           { label: 'Reviewing Offers',  color: '#21326c',  bg: '#21326c12' },
  offer_accepted: { label: 'Offer Accepted',    color: '#a84f22',  bg: '#a84f2212' },
  deposit_paid:   { label: 'Deposit Paid',      color: '#db9630',  bg: '#db963012' },
  in_progress:    { label: 'In Progress',       color: '#2563eb',  bg: '#2563eb12' },
  delivered:      { label: 'Delivery Received', color: '#7c3aed',  bg: '#7c3aed12' },
  completed:      { label: 'Completed',         color: '#16a34a',  bg: '#16a34a12' },
  reviewed:       { label: 'Reviewed',          color: '#059669',  bg: '#05966912' },
};

export const INFO_PAGES = {
  'about-lawnn': {
    title: 'About Lawnn',
    subtitle: "Egypt's home for creative student talent.",
    sections: [
      { heading: 'Our mission', body: ["Lawnn (لون) connects Egypt's most talented art and design students with the clients, studios, and brands who need their work. We believe the country's creative faculties produce world-class talent that too often goes unseen — and we're building the platform that changes that."] },
      { heading: 'What we do', body: ["We verify students from Egypt's top creative institutions, surface them to real clients through a curated projects board and talent directory, and guide both sides through managed projects. From a first brief to final payment, the whole engagement lives in one place."] },
      { heading: 'How it works', body: ["Clients post briefs and discover talent. Students build verified portfolios, apply to briefs, and grow a sustainable creative career while they study. When a client hires, the work becomes a managed project with clear stages, messaging, and Lawnn-coordinated payments — so everyone can focus on the creative work."] },
      { heading: 'Why it matters', body: ["Freelancing as a student is hard: getting discovered, pricing fairly, and getting paid on time. Lawnn removes that friction so emerging Egyptian creatives can do their best work and be paid what it's worth."] },
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    subtitle: 'How we collect, use, and protect your information.',
    sections: [
      { heading: 'Information we collect', body: ["We collect the information you provide when you create an account or profile — such as your name, email, university, portfolio, and the content you post — along with basic technical data needed to operate the service (e.g. authentication tokens and uploaded files)."] },
      { heading: 'How we use it', body: ["We use your information to operate the platform: to authenticate you, show your profile and work to relevant clients, enable messaging and projects, and coordinate project payments. We do not sell your personal data, and we do not show third-party advertising."] },
      { heading: 'File storage', body: ["Uploaded files are stored in secured cloud storage. Public assets (portfolio images, feed media) are served via a public bucket; sensitive files such as job-application attachments are kept in a private bucket and only shared through short-lived signed links with authorised parties."] },
      { heading: 'Your choices', body: ["You can edit or remove most of your information from your profile at any time. To delete your account or request a copy of your data, contact us through the Contact page."] },
      { heading: 'Changes', body: ["We may update this policy as the product evolves. Material changes will be reflected here with an updated date."] },
    ],
  },
  terms: {
    title: 'Terms of Service',
    subtitle: 'The rules for using Lawnn.',
    sections: [
      { heading: 'Accounts', body: ["You're responsible for the activity on your account and for keeping your credentials secure. Student accounts are created via admin invitation; you agree to provide accurate information about yourself and your work."] },
      { heading: 'Conduct', body: ["Don't post content that is unlawful, infringing, misleading, or harmful. Don't misrepresent your skills or impersonate others. Clients must post genuine briefs; students must only submit work they have the right to share. Lawnn admins moderate posted content and may remove anything that breaks these rules."] },
      { heading: 'Projects and payments', body: ["Hiring a student creates a project governed by Lawnn's payment flow: a 50% deposit to start and the balance on delivery, paid by InstaPay transfer and confirmed by Lawnn. Both parties agree to engage in good faith — delivering work as briefed and paying for accepted work."] },
      { heading: 'Intellectual property', body: ["Creators retain rights to their work until ownership transfers under the agreed terms of a project, typically on full payment. Posting work to Lawnn grants us a limited licence to display it on the platform for the purpose of operating the service."] },
      { heading: 'Liability', body: ["Lawnn is provided on an ‘as is’ basis during this research preview. We work hard to keep the service reliable but can't guarantee uninterrupted availability."] },
    ],
  },
  contact: {
    title: 'Contact & FAQ',
    subtitle: 'Questions? We’re here to help.',
    sections: [
      { heading: 'Get in touch', body: ["The fastest way to reach us is from inside the app: open Messages and tap ‘Contact support’ to start a direct conversation with a Lawnn admin. You can also email us at hello@lawnndesign.com."] },
      { heading: 'How do I join as a student?', body: ["Student accounts are created by invitation once your application is accepted. If you're a student from an Egyptian creative faculty and want to join, reach out and tell us about your work."] },
      { heading: 'How do I hire someone?', body: ["Create a client account, post a project (it goes live after a quick admin review), and review applications. When you hire an applicant, that same project moves into Lawnn's managed payment flow, coordinated end to end."] },
      { heading: 'How do payments work?', body: ["Payments are made by InstaPay transfer, coordinated by Lawnn: a 50% deposit to start the project, and the balance once you approve the delivery. We confirm each transfer before the project moves forward."] },
      { heading: 'Is my work protected?', body: ["Yes — application files are kept private and shared only via secure signed links, and you keep the rights to your work until ownership transfers under your project's agreed terms."] },
    ],
  },
};
