import { File } from 'lucide-react';

export const PRIMARY_COLOR = '#21326c';

export const PALETTE_COLORS = [PRIMARY_COLOR, '#c4622d', '#db9630', '#3c8762', '#a84f22', '#5ea580'];

export const LISTING_COLORS = PALETTE_COLORS;

// ─── SHARED FORM TEMPLATES ────────────────────────────────────────────────────────

export const EMPTY_NEWS_FORM = { title: '', excerpt: '', bodyHtml: '', category: 'Career Advice', readTime: '5 min read', color: PRIMARY_COLOR };

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

// Most commonly picked skills — surfaced as quick-add chips before the user
// starts typing. All drawn from SKILL_LIBRARY above.
export const COMMON_SKILLS = [
  'AutoCAD', 'SketchUp', 'Adobe Photoshop', 'Adobe Illustrator', 'Figma',
  '3ds Max', 'Blender', 'V-Ray', 'Rhinoceros', 'Revit',
  '3D Visualization', 'Space Planning', 'Branding', 'Rendering Optimization',
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
  terms: {
    title: 'Terms & Conditions',
    subtitle: 'The rules for using Lawnn · Last updated June 2026',
    sections: [
      { heading: 'Acceptance', body: ["By creating an account or using Lawnn (لون), you agree to these Terms. Lawnn connects Egyptian creative students with clients and coordinates their projects from brief to final payment."] },
      { heading: 'General rules', body: ["Be honest — no fake profiles, fake reviews, or scams. Be respectful and treat everyone the way you'd want to be treated. Deliver and pay on time, and engage in good faith. No adult content, spam, harassment, or illegal activity."] },
      { heading: 'Accounts', body: ["You're responsible for everything that happens on your account and for keeping your login secure. Student (creative) accounts are created by admin invitation once an application is accepted; you agree to provide accurate information about yourself and your work. Clients must post genuine briefs."] },
      { heading: 'Communication & disputes', body: ["All communication about a project must stay on Lawnn — in any dispute, only the chats, files, and screenshots shared on the platform will be reviewed. For safety and fairness, on-platform conversations may be reviewed by Lawnn admins when a dispute is raised. Do not share personal contact details (phone numbers, emails, social handles, or addresses) inside chats."] },
      { heading: 'Keeping deals on Lawnn', body: ["Lawnn's protection — escrow, dispute resolution, and refunds — only works when the deal happens on the platform. Attempting to move a project off Lawnn to avoid fees or oversight undermines that protection and may result in suspension of your account and forfeiture of any service-fee benefits."] },
      { heading: 'Payments & protection (escrow)', body: ["Hiring a creative creates a managed project governed by Lawnn's payment flow: a 50% deposit to start the work, and the balance once the client approves the delivery.", "Payments are made by InstaPay transfer and confirmed by Lawnn before the project advances. Funds are coordinated through Lawnn until the agreed stage is met — no project is considered complete until the client confirms they're satisfied."] },
      { heading: 'Service fee', body: ["Lawnn charges a 5% service fee on the value of each project. As a launch promotion, this fee is currently fully waived (0%) to help the community grow. You will always see the exact fee, if any, before you confirm a payment. Lawnn reserves the right to apply the standard 5% fee in the future, with notice."] },
      { heading: 'Payment methods', body: ["InstaPay: no fee charged by Lawnn; transfers are usually completed within an hour (and may take up to one working day). Any future card or third-party payment options will display any provider fees before you pay."] },
      { heading: 'Intellectual property', body: ["Creatives retain the rights to their work until ownership transfers under the agreed terms of a project — typically on full payment. Posting work to Lawnn grants Lawnn a limited licence to display it on the platform for the purpose of operating the service."] },
      { heading: 'Quality, deadlines & accountability', body: ["Creatives agree to deliver work as briefed and by the agreed deadline. If work is late or doesn't meet the agreed standard without a valid reason, a portion of the payment may be deducted. In serious cases — significantly late or substandard work with no valid reason — the client may be matched with a different creative and payment may be forfeited. We value our creatives: this only applies where no reasonable explanation is given and the work is genuinely substandard."] },
      { heading: 'Account actions', body: ["Lawnn may freeze or ban accounts for rudeness, harassment, suspected cheating, or any breach of these Terms. Serious violations may result in termination without warning."] },
      { heading: 'Liability', body: ["Lawnn is provided on an ‘as is’ basis during this research preview. We work hard to keep the service reliable and fair but can't guarantee uninterrupted availability."] },
      { heading: 'Changes', body: ["We may update these Terms as the product evolves. Material changes will be reflected here with an updated date. Questions? Email info@lawnndesign.com."] },
    ],
  },
  refund: {
    title: 'Refund Policy',
    subtitle: 'How escrow refunds work on Lawnn · Last updated June 2026',
    sections: [
      { heading: 'Overview', body: ["Lawnn coordinates payments through escrow so both sides are protected. Funds you pay are held and released stage by stage — and refunded to your Lawnn balance when the situations below apply. For any issue, email info@lawnndesign.com (or use Contact support in the app) with screenshots and a short explanation, and the Lawnn team will review it as quickly as possible."] },
      { heading: 'Missed deadline', body: ["Once you pay, the creative has until the agreed deadline to deliver. If the deadline passes with no work delivered — no progress, no valid reason — we refund the full amount you've paid to your Lawnn balance. If you'd like, we'll also help match you with a new creative to pick the project back up."] },
      { heading: "Work doesn't match the brief", body: ["If the work is delivered but doesn't match what was agreed, we review the brief, chats, files, and screenshots — so please keep everything on the platform. If the creative delivered what was agreed, the payment is released to them. If the client is right, the amount is refunded to your Lawnn balance."] },
      { heading: 'Midway refunds', body: ["Because a project starts with a 50% deposit, that deposit covers the creative beginning the work. We don't issue midway refunds once work is genuinely underway — except where the creative shows no meaningful progress by the halfway point of the agreed timeline. Email info@lawnndesign.com with your case and the Lawnn team will review the on-platform record and be as helpful as possible."] },
      { heading: 'How refunds are paid', body: ["Approved refunds are credited to your Lawnn balance, which you can put toward another project or withdraw per the agreed payout process. Refunds rely on the record of communication and files kept on Lawnn — another reason to keep your whole project on the platform."] },
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    subtitle: 'How we collect, use, and protect your information · Last updated June 2026',
    sections: [
      { heading: 'Information we collect', body: ["We collect what's needed to run the platform: the information you provide when you create an account or profile (such as your name, email, university, department, portfolio, and the content you post); the messages and files you exchange in project chats; payment-related information such as the InstaPay transfer screenshots you upload; and basic technical data needed to operate the service (such as authentication tokens and uploaded files)."] },
      { heading: 'How we use it', body: ["We use your information to operate Lawnn: to authenticate you, show your profile and work to relevant clients, enable messaging and managed projects, coordinate and confirm project payments, and provide support. We do not sell your personal data, and we do not show third-party advertising."] },
      { heading: 'Communication monitoring & disputes', body: ["To keep the platform safe and fair, chats and files shared on Lawnn may be reviewed by admins when a dispute is raised. In any conflict, only the communication and files kept on the platform will be considered. Please don't share personal contact details in chats."] },
      { heading: 'File storage', body: ["Uploaded files are stored in secured cloud storage. Public assets (such as portfolio images and feed media) are served from a public bucket. Sensitive files — such as job-application attachments, chat attachments, and payment screenshots — are kept in a private bucket and shared only through short-lived signed links with authorised parties."] },
      { heading: 'Sharing', body: ["We don't sell or rent your personal information. We share data only as needed to operate the service (for example, showing your profile to clients) or where required by law."] },
      { heading: 'Your choices', body: ["You can edit or remove most of your information from your profile at any time. To delete your account or request a copy of your data, contact us at info@lawnndesign.com."] },
      { heading: 'Security', body: ["We take reasonable measures to protect your data, including encrypted password storage, access controls, and private storage with signed links for sensitive files. No system is perfectly secure, but we work continuously to protect your information."] },
      { heading: 'Changes', body: ["We may update this policy as the product evolves. Material changes will be reflected here with an updated date."] },
    ],
  },
  contact: {
    title: 'Contact & FAQ',
    subtitle: 'Questions? We’re here to help.',
    sections: [
      { heading: 'Get in touch', body: ["The fastest way to reach us is from inside the app: open Messages and tap ‘Contact support’ to start a direct conversation with a Lawnn admin. You can also email us at info@lawnndesign.com."] },
      { heading: 'How do I raise a dispute or request a refund?', body: ["Email info@lawnndesign.com (or use Contact support in the app) with a short explanation and any screenshots. Because disputes are reviewed using the record of chats and files kept on Lawnn, please keep your whole project on the platform. See our Refund Policy for what's covered."] },
      { heading: 'How do I join as a creative?', body: ["Creative (student) accounts are created by invitation once an application is accepted. If you're a student at an Egyptian creative faculty and want to join, reach out and tell us about your work."] },
      { heading: 'How do I hire someone?', body: ["Create a client account, post a project (it goes live after a quick admin review), and review applications. When you hire an applicant, that same project moves into Lawnn's managed, escrow-backed payment flow, coordinated end to end."] },
      { heading: 'How do payments and fees work?', body: ["Payments are made by InstaPay transfer, coordinated by Lawnn: a 50% deposit to start the project, and the balance once you approve the delivery. We confirm each transfer before the project moves forward. Lawnn's standard 5% service fee is currently waived as a launch promotion, and you'll always see any fee before you confirm a payment."] },
      { heading: 'Is my work protected?', body: ["Yes — application, chat, and payment files are kept private and shared only via secure signed links, and you keep the rights to your work until ownership transfers under your project's agreed terms."] },
    ],
  },
};
