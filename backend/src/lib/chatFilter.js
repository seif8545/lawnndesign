// Chat content rules — what cannot be sent through Lawnn chat.
//
//  • phone numbers (Egyptian mobiles starting 01…) — contact details are kept
//    off-platform to protect the rights of both students and clients.
//  • off-site payment / contact keywords — Lawnn can't monitor or protect deals
//    made off the platform.
//
// Both categories BLOCK the message (it isn't sent). This file is duplicated at
// backend/src/lib/chatFilter.js — keep the two identical so client and server
// agree on what's allowed.

const PHONE_RE = /0[\s-]?1[\s-]?\d(?:[\s-]?\d){7,}/;
const KEYWORDS = ['instapay', 'cash', 'call', 'hawelly', 'whatsapp'];
const KEYWORD_RE = new RegExp('\\b(?:' + KEYWORDS.join('|') + ')\\b', 'i');

// Returns { blocked, reason } where reason is 'phone' | 'keyword' | null.
export function checkMessage(text) {
  const t = String(text || '');
  if (PHONE_RE.test(t)) return { blocked: true, reason: 'phone' };
  if (KEYWORD_RE.test(t)) return { blocked: true, reason: 'keyword' };
  return { blocked: false, reason: null };
}

export const CHAT_BLOCK_NOTICE = {
  phone: "For everyone's protection, phone numbers and contact details can't be shared in Lawnn chat. Keeping communication on-platform protects the rights of both students and clients.",
  keyword: "Lawnn can't monitor payments or arrangements made off the platform and isn't responsible for any losses if a transaction goes off-site. Please keep everything on Lawnn.",
};
