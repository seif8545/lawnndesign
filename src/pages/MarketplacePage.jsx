import { toast } from '../lib/toast.js';
import { useState } from 'react';
import { BadgeCheck, CheckCircle, ChevronRight, DollarSign, Info, MessageCircle, Package, Pen, Plus, Send, ShoppingBag, Trash2, X } from 'lucide-react';
import { marketplace as marketplaceApi } from '../lib/api.js';
import { Avatar, Modal } from '../components/ui.jsx';
import { useBusy } from '../hooks/useBusy.js';
import { EMPTY_LISTING_FORM, LISTING_COLORS } from '../lib/constants.js';

export function MarketplacePage({ listings, setListings, pendingListings, setPendingListings, currentUser, refreshMarketplace }) {
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

  const [listingForm, setListingForm] = useState(EMPTY_LISTING_FORM);
  const [savingListing, runSaveListing] = useBusy();   // guards spam-clicks on Save/Submit

  // The current user's own listings (pending + active/sold). Sellers are
  // students or admins. Match by real user id.
  const canSell = isStudent || isAdmin;
  const myListings = canSell
    ? [
        ...pendingListings.filter(l => l.seller?.userId === currentUser?.id).map(l => ({ ...l, isPending: true })),
        ...listings.filter(l => l.seller?.userId === currentUser?.id),
      ]
    : [];

  // Active public listings for browse
  const activeListings = listings.filter(l => l.status === 'active');

  // ── Create / Edit ────────────────────────────────────────────────────────────
  const openCreate = () => {
    setListingForm(EMPTY_LISTING_FORM);
    setEditingListing(null);
    setShowListingModal(true);
    if (canSell) setTab('mine');
  };

  const openEdit = listing => {
    setListingForm({ title: listing.title, description: listing.description, price: listing.price, color: listing.color });
    setEditingListing(listing);
    setShowListingModal(true);
  };

  const saveListing = () => runSaveListing(async () => {
    if (!listingForm.title.trim()) return;
    try {
      if (editingListing) {
        // Price is locked once posted — only title/description editable via API.
        await marketplaceApi.update(editingListing.id, {
          title:       listingForm.title,
          description: listingForm.description,
        });
      } else {
        await marketplaceApi.create({
          title:       listingForm.title,
          description: listingForm.description,
          price:       Number(listingForm.price) || 0,
          category:    'Other',
        });
      }
      await refreshMarketplace?.();
      setShowListingModal(false);
    } catch (e) {
      toast.error(`Couldn't save listing: ${e.message}`);
    }
  });

  const deleteListing = async listing => {
    try {
      await marketplaceApi.delete(listing.id);
      await refreshMarketplace?.();
    } catch (e) {
      toast.error(`Couldn't delete: ${e.message}`);
    }
  };

  // ── Offer flow (backed by the API) ───────────────────────────────────────────
  const submitOffer = async () => {
    if (!offerForm.amount || !targetListing) return;
    const listingId = targetListing.id;
    try {
      await marketplaceApi.makeOffer(listingId, { amount: Number(offerForm.amount), message: offerForm.message });
      setShowOfferModal(false);
      setOfferSent(listingId);
      setTimeout(() => setOfferSent(null), 3500);
      setOfferForm({ amount: '', message: '' });
      setTargetListing(null);
      await refreshMarketplace?.();
    } catch (e) {
      toast.error(`Couldn't send offer: ${e.message}`);
    }
  };

  const acceptOffer = async (_listingId, offerId) => {
    try { await marketplaceApi.acceptOffer(offerId); await refreshMarketplace?.(); }
    catch (e) { toast.error(`Couldn't accept offer: ${e.message}`); }
  };

  const rejectOffer = async (_listingId, offerId) => {
    try { await marketplaceApi.rejectOffer(offerId); await refreshMarketplace?.(); }
    catch (e) { toast.error(`Couldn't reject offer: ${e.message}`); }
  };

  const replyToOffer = async (_listingId, offerId) => {
    const text = replyText[offerId]?.trim();
    if (!text) return;
    try {
      await marketplaceApi.replyOffer(offerId, text);
      setReplyText(r => ({ ...r, [offerId]: '' }));
      await refreshMarketplace?.();
    } catch (e) {
      toast.error(`Couldn't send reply: ${e.message}`);
    }
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
        {canSell && (
          <button
            onClick={openCreate}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold text-white hover:opacity-90 transition-all flex-shrink-0"
            style={{ background: '#ff9044' }}
          >
            <Plus size={15} /> List an Item
          </button>
        )}
      </div>

      {/* Tabs (sellers only) */}
      {canSell && (
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

      {/* ── MY LISTINGS TAB (sellers) ── */}
      {tab === 'mine' && canSell && (
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
                                  Offer accepted — Lawnn will be in touch to arrange payment and delivery.
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
      <Modal open={showListingModal} onClose={() => setShowListingModal(false)} title={editingListing ? 'Edit Listing' : 'List an Item'}>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-[#21326c] uppercase tracking-wider mb-1">Title *</label>
            <input
              type="text"
              placeholder="e.g. Original Calligraphy Print"
              value={listingForm.title}
              onChange={e => setListingForm(f => ({ ...f, title: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl border border-[#21326c]/20 text-[#21326c] text-sm focus:ring-2 focus:ring-[#21326c] transition-all placeholder:text-[#21326c]/40"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#21326c] uppercase tracking-wider mb-1">Description</label>
            <textarea
              rows={2}
              placeholder="Materials, size, condition, what's included…"
              value={listingForm.description}
              onChange={e => setListingForm(f => ({ ...f, description: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl border border-[#21326c]/20 text-[#21326c] text-sm focus:ring-2 focus:ring-[#21326c] transition-all resize-none placeholder:text-[#21326c]/40"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#21326c] uppercase tracking-wider mb-1">
              Price (EGP) *
              {editingListing && <span className="ml-2 font-normal text-[#21326c]/40 normal-case">(locked after listing)</span>}
            </label>
            <div className="relative">
              <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#21326c]/40" />
              <input
                type="number"
                placeholder="e.g. 1200"
                value={listingForm.price}
                onChange={e => setListingForm(f => ({ ...f, price: e.target.value }))}
                disabled={!!editingListing}
                className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-[#21326c]/20 text-[#21326c] text-sm focus:ring-2 focus:ring-[#21326c] transition-all placeholder:text-[#21326c]/40 disabled:opacity-40 disabled:cursor-not-allowed"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#21326c] uppercase tracking-wider mb-1">Card Colour</label>
            <div className="flex gap-2">
              {LISTING_COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setListingForm(f => ({ ...f, color: c }))}
                  className="w-7 h-7 rounded-lg transition-transform hover:scale-110"
                  style={{ background: c, outline: listingForm.color === c ? `3px solid ${c}` : 'none', outlineOffset: '2px' }}
                />
              ))}
            </div>
          </div>
          <button
            onClick={saveListing}
            disabled={savingListing || !listingForm.title.trim() || (!editingListing && !listingForm.price)}
            className="w-full py-2.5 rounded-xl font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            style={{ background: '#ff9044' }}
          >
            {savingListing
              ? (editingListing ? 'Saving…' : 'Submitting…')
              : (editingListing ? 'Save Changes' : 'Submit for Review')}
          </button>
          {!editingListing && (
            <p className="text-xs text-center text-[#21326c]/50">Goes live once approved by Lawnn admin.</p>
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
            If accepted, Lawnn will be in touch to arrange payment (by InstaPay transfer) and delivery.
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
