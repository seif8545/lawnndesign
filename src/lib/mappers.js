import { DATE_FORMAT_OPTIONS } from './constants.js';

export function mapNotification(n) {
  return {
    id:    n.id,
    icon:  n.type,                       // money | star | bag | check | message | info
    title: n.title,
    body:  n.body || '',
    time:  formatRelativeTime(n.createdAt),
    read:  n.read,
    link:  n.link || null,
  };
}

// ─── API ↔ talent shape mappers ──────────────────────────────────────────────
// The downstream components were built against the mock TALENTS shape. These
// mappers translate to/from the API shape so we don't have to touch every
// component just to swap data sources.

export function mapApiProfile(p) {
  return {
    id:           p.id,
    userId:       p.user.id,
    name:         p.user.name,
    initials:     p.user.initials,
    avatarColor:  p.user.avatarColor,
    avatar:       p.avatar,
    bio:          p.bio || '',
    university:   p.university || '',
    dept:         p.dept || '',
    year:         p.year,
    isGrad:       p.isGrad,
    rating:       p.rating || 0,
    reviews:      p.reviewCount || 0,
    tags:         (p.skills || []).map(s => s.skill),
    hourlyRate:   p.hourlyRate || 0,
    availability: p.availability || 'open',
    walletBalance:p.walletBalance || 0,
    completedJobs:p.completedJobs || 0,
    portfolio: (p.portfolio || []).map(item => ({
      id:       item.id,
      color:    item.color,
      label:    item.label,
      h:        item.height,
      imageUrl: item.imageUrl,
      pdfUrl:   item.pdfUrl,
      pdfName:  item.pdfName,
    })),
    education:  p.education  || [],
    experience: p.experience || [],
  };
}

// Format a date-ish value as "2h ago", "3d ago", "Just now", etc.

export function formatRelativeTime(dateInput) {
  if (!dateInput) return '';
  const then = new Date(dateInput).getTime();
  const diff = Date.now() - then;
  const sec  = Math.floor(diff / 1000);
  const min  = Math.floor(sec / 60);
  const hr   = Math.floor(min / 60);
  const day  = Math.floor(hr / 24);
  if (sec < 60)  return 'Just now';
  if (min < 60)  return `${min}m ago`;
  if (hr  < 24)  return `${hr}h ago`;
  if (day < 30)  return `${day}d ago`;
  if (day < 365) return `${Math.floor(day / 30)}mo ago`;
  return `${Math.floor(day / 365)}y ago`;
}

export function mapApiJob(j) {
  return {
    id:         j.id,
    title:      j.title,
    brief:      j.brief,
    budget:     j.budget,                          // number — formatted at render
    budgetType: j.budgetType || 'Fixed',
    category:   j.category || 'Visuals & Branding',
    status:     j.status,
    clientId:   j.clientId,
    client:     j.client?.name || 'Anonymous',
    postedAgo:  formatRelativeTime(j.createdAt),
    tags:       (j.skills || []).map(s => s.skill),
    attachments:j.attachments || [],
    applicants: j._count?.applications ?? 0,
  };
}

export function mapApiFeedPost(p) {
  return {
    id:          p.id,
    author:      p.author,
    authorId:    p.authorId,
    authorColor: p.avatarColor,
    initials:    p.initials,
    university:  p.university,
    time:        formatRelativeTime(p.createdAt),
    content:     p.content,
    tags:        p.tags || [],
    imageUrl:    p.imageUrl || null,
    likes:       p.likes || 0,
    commentCount: p._count?.comments ?? 0,
    liked:       Boolean(p.liked),
    status:      p.status,
  };
}

export function mapApiListing(l) {
  return {
    id:          l.id,
    title:       l.title,
    description: l.description,
    price:       l.price,
    category:    l.category,
    location:    l.location || '',
    imageUrl:    l.imageUrl || null,
    fileUrl:     l.fileUrl,
    status:      l.status,
    color:       l.seller?.avatarColor || '#21326c',
    postedAt:    formatRelativeTime(l.createdAt),
    seller:      l.seller,           // { userId, name, initials, avatarColor }
    offers:      l.offers || [],
  };
}

export function mapApiNews(n) {
  return {
    id:       n.id,
    title:    n.title,
    excerpt:  n.excerpt,
    author:   n.author,
    category: n.category,
    readTime: n.readTime,
    color:    n.color,
    body:     Array.isArray(n.body) ? n.body : [],
    date:     n.createdAt
      ? new Date(n.createdAt).toLocaleDateString('en-US', DATE_FORMAT_OPTIONS)
      : '',
  };
}

export function mapApiProject(p) {
  const clientReview = p.reviews?.find(r => r.authorId === p.clientId);
  const talentReview = p.reviews?.find(r => r.authorId === p.talentId);
  const applications = (p.applications || []).map(a => ({
    id:             a.id,
    talentId:       a.user?.id,
    talentName:     a.user?.name,
    talentInitials: a.user?.initials,
    talentColor:    a.user?.avatarColor,
    note:           a.note,
    status:         a.status,
    submittedAt:    formatRelativeTime(a.createdAt),
    files:          a.files || [],
    proposedAmount: null,        // applications inherit the project budget
  }));
  return {
    id:                     p.id,
    title:                  p.title,
    brief:                  p.brief,
    budget:                 p.budget,
    budgetType:             p.budgetType || 'Fixed',
    category:               p.category || 'Visuals & Branding',
    status:                 p.status,
    clientId:               p.clientId,
    clientName:             p.client?.name || '',
    tags:                   (p.skills || []).map(s => s.skill),
    attachments:            p.attachments || [],
    applicants:             p._count?.applications ?? applications.length,
    acceptedTalentId:       p.talentId,
    acceptedTalentName:     p.talent?.name,
    acceptedTalentInitials: p.talent?.initials,
    acceptedTalentColor:    p.talent?.avatarColor,
    postedAt:               formatRelativeTime(p.createdAt),
    depositAmount:          p.depositAmount,
    depositPaidAt:          p.depositPaidAt ? formatRelativeTime(p.depositPaidAt) : null,
    depositProofUrl:        p.depositProofUrl || null,
    finalPaymentProofUrl:   p.finalPaymentProofUrl || null,
    deliveryNote:           p.deliveryNote,
    deliveredAt:            p.deliveredAt ? formatRelativeTime(p.deliveredAt) : null,
    clientApproved:         Boolean(p.clientApproved),
    completedAt:            p.completedAt ? formatRelativeTime(p.completedAt) : null,
    clientReview: clientReview ? { rating: clientReview.rating, text: clientReview.comment } : null,
    talentReview: talentReview ? { rating: talentReview.rating, text: talentReview.comment } : null,
    applications,
    acceptedApplicationId: applications.find(a => a.status === 'accepted')?.id || null,
    files: (p.files || []).map(f => ({
      id:               f.id,
      name:             f.name,
      url:              f.url,
      mimeType:         f.mimeType,
      note:             f.note,
      createdAt:        formatRelativeTime(f.createdAt),
      uploaderId:       f.uploader?.id,
      uploaderName:     f.uploader?.name || 'Someone',
      uploaderInitials: f.uploader?.initials || '??',
      uploaderColor:    f.uploader?.avatarColor || '#21326c',
    })),
  };
}

export function talentToApiBody(t) {
  return {
    bio:          t.bio,
    availability: t.availability,
    hourlyRate:   t.hourlyRate,
    university:   t.university,
    dept:         t.dept,
    year:         t.year,
    isGrad:       t.isGrad,
    avatar:       t.avatar,
    skills:       t.tags || [],
    portfolio:    (t.portfolio || []).map(p => ({
      label:    p.label,
      color:    p.color,
      h:        p.h,
      imageUrl: p.imageUrl,
      pdfUrl:   p.pdfUrl,
      pdfName:  p.pdfName,
    })),
    education:  t.education,
    experience: t.experience,
  };
}

// ─── VIEW: CLIENT PROFILE ────────────────────────────────────────────────────
// A client's own profile: their account details, the jobs they've posted, and
// the projects those jobs became after hiring.
