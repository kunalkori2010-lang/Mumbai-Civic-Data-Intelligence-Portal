import React, { useEffect, useState } from 'react';
import {
  Briefcase,
  CheckCircle2,
  Clock,
  Mail,
  MapPin,
  Phone,
  PlusCircle,
  Search,
  Send,
  ShieldAlert,
  X,
  XCircle,
} from 'lucide-react';
import { useRole } from '../context/RoleContext.tsx';
import type { BusinessListing } from '../shared/types.ts';

const WARDS = [
  'A', 'B', 'C', 'D', 'E', 'F/N', 'F/S', 'G/N', 'G/S',
  'H/E', 'H/W', 'K/E', 'K/W', 'L', 'M/E', 'M/W', 'N',
  'P/N', 'P/S', 'R/C', 'R/N', 'R/S', 'S', 'T',
];

const BUSINESS_CATEGORIES = [
  'Grocery & Kirana',
  'Water Filtration & Plumbing',
  'Hardware & Electricals',
  'Pharmacy & Healthcare',
  'Food & Bakery',
  'Repairs & Services',
  'Stationery & Printing',
  'Other Local Retail',
];

export function BusinessConnectPage() {
  const { role, apiFetch } = useRole();
  const [tab, setTab] = useState<'discover' | 'register' | 'admin'>('discover');
  const [businesses, setBusinesses] = useState<BusinessListing[]>([]);
  const [search, setSearch] = useState('');
  const [wardFilter, setWardFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const [selectedBiz, setSelectedBiz] = useState<BusinessListing | null>(null);
  const [enquiryForm, setEnquiryForm] = useState({ senderName: '', senderContact: '', message: '' });
  const [enquiryStatus, setEnquiryStatus] = useState('');

  // Registration state
  const [regForm, setRegForm] = useState({
    businessName: '',
    category: BUSINESS_CATEGORIES[0],
    wardCode: 'K/E',
    locality: '',
    address: '',
    description: '',
    productsServices: '',
    openingHours: '09:00 AM - 09:00 PM',
    contactPhone: '',
    contactEmail: '',
    ownerEmail: '',
    consentGiven: false,
  });
  const [regMessage, setRegMessage] = useState('');

  const loadBusinesses = async () => {
    const params = new URLSearchParams();
    if (wardFilter !== 'ALL') params.set('ward', wardFilter);
    if (categoryFilter !== 'ALL') params.set('category', categoryFilter);
    if (search.trim()) params.set('search', search.trim());
    const res = await apiFetch(`/api/businesses?${params.toString()}`);
    if (res.ok) {
      const json = await res.json();
      setBusinesses(json.businesses || []);
    }
  };

  useEffect(() => {
    loadBusinesses();
  }, [wardFilter, categoryFilter, search, role, tab, apiFetch]);

  const openBusinessDetail = async (b: BusinessListing) => {
    setSelectedBiz(b);
    setEnquiryStatus('');
    await apiFetch(`/api/businesses/${b.id}/engage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventType: 'profile_view' }),
    });
    loadBusinesses();
  };

  const trackContactClick = async (id: number) => {
    await apiFetch(`/api/businesses/${id}/engage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventType: 'contact_click' }),
    });
    loadBusinesses();
  };

  const sendEnquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBiz) return;
    const res = await apiFetch(`/api/businesses/${selectedBiz.id}/enquiry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(enquiryForm),
    });
    if (res.ok) {
      setEnquiryStatus('Enquiry recorded and counted toward verified engagement metrics.');
      setEnquiryForm({ senderName: '', senderContact: '', message: '' });
      loadBusinesses();
    } else {
      const err = await res.json();
      setEnquiryStatus(err.error || 'Failed to send enquiry');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegMessage('');
    const res = await apiFetch('/api/businesses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(regForm),
    });
    const json = await res.json();
    if (!res.ok) {
      setRegMessage(json.error || 'Registration failed');
    } else {
      setRegMessage('Listing registered and queued for Administrator approval.');
      setRegForm({
        businessName: '',
        category: BUSINESS_CATEGORIES[0],
        wardCode: 'K/E',
        locality: '',
        address: '',
        description: '',
        productsServices: '',
        openingHours: '09:00 AM - 09:00 PM',
        contactPhone: '',
        contactEmail: '',
        ownerEmail: '',
        consentGiven: false,
      });
      loadBusinesses();
    }
  };

  const moderateBusiness = async (id: number, status: 'verified' | 'rejected') => {
    const res = await apiFetch(`/api/businesses/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ verificationStatus: status }),
    });
    if (res.ok) {
      loadBusinesses();
    }
  };

  return (
    <div className="space-y-5">
      {/* Header + Tabs */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Local Business Connect</h1>
          <p className="text-xs text-slate-600 mt-1">
            Consent-based locality business discovery linked to Mumbai&apos;s 24 BMC wards. No household water data is ever used to target residents.
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5 bg-slate-100 p-1 rounded-md border border-slate-200 self-start">
          <button
            type="button"
            onClick={() => setTab('discover')}
            className={`px-3 py-1.5 text-xs font-medium rounded ${
              tab === 'discover' ? 'bg-[#1E3A8A] text-white' : 'text-slate-700 hover:bg-white'
            }`}
          >
            Consumer Discovery
          </button>
          <button
            type="button"
            onClick={() => setTab('register')}
            className={`px-3 py-1.5 text-xs font-medium rounded inline-flex items-center gap-1 ${
              tab === 'register' ? 'bg-[#1E3A8A] text-white' : 'text-slate-700 hover:bg-white'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            Retailer Registration
          </button>
          <button
            type="button"
            onClick={() => setTab('admin')}
            className={`px-3 py-1.5 text-xs font-medium rounded ${
              tab === 'admin' ? 'bg-[#1E3A8A] text-white' : 'text-slate-700 hover:bg-white'
            }`}
          >
            Admin Moderation ({businesses.filter((b) => b.verificationStatus === 'pending').length} Pending)
          </button>
        </div>
      </div>

      {/* TAB 1: CONSUMER DISCOVERY */}
      {tab === 'discover' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-lg p-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search shops, products, or locality..."
                className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded-md"
              />
            </div>
            <select
              value={wardFilter}
              onChange={(e) => setWardFilter(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-300 rounded-md bg-white"
            >
              <option value="ALL">All 24 BMC Wards</option>
              {WARDS.map((w) => (
                <option key={w} value={w}>Ward {w}</option>
              ))}
            </select>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-300 rounded-md bg-white"
            >
              <option value="ALL">All Business Categories</option>
              {BUSINESS_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {businesses.filter((b) => b.verificationStatus === 'verified').length === 0 ? (
            <div className="bg-white border border-dashed border-slate-300 rounded-lg p-10 text-center space-y-3">
              <Briefcase className="w-8 h-8 text-slate-400 mx-auto" />
              <h2 className="text-sm font-bold text-slate-800">No Verified Local Businesses Listed Yet</h2>
              <p className="text-xs text-slate-600 max-w-md mx-auto">
                This portal maintains strict authenticity: no placeholder or fictional shops are pre-populated. Use the Retailer Registration tab to add a real participating local business, then approve it in Admin Moderation.
              </p>
              <button
                type="button"
                onClick={() => setTab('register')}
                className="px-4 py-2 text-xs font-semibold bg-[#1E3A8A] text-white rounded-md hover:bg-[#172554]"
              >
                Register First Participating Retailer
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {businesses
                .filter((b) => b.verificationStatus === 'verified')
                .map((b) => (
                  <div key={b.id} className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col justify-between gap-3">
                    <div>
                      <div className="text-[11px] text-[#1E3A8A] font-semibold">
                        {b.category} · Ward {b.wardCode}
                      </div>
                      <h3 className="text-base font-bold text-slate-900 mt-0.5">{b.businessName}</h3>
                      <p className="text-xs text-slate-600 mt-1 line-clamp-2">{b.description}</p>
                      <div className="mt-2.5 space-y-1 text-[11px] text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{b.locality}{b.address ? ` — ${b.address}` : ''}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{b.openingHours}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-[11px] text-slate-500 font-mono-tabular">
                        Views: {b.viewsCount ?? 0} · Enquiries: {b.enquiriesCount ?? 0}
                      </span>
                      <button
                        type="button"
                        onClick={() => openBusinessDetail(b)}
                        className="px-3 py-1.5 text-xs font-semibold bg-[#1E3A8A] text-white rounded hover:bg-[#172554]"
                      >
                        View &amp; Enquire
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: RETAILER REGISTRATION */}
      {tab === 'register' && (
        <form onSubmit={handleRegister} className="bg-white border border-slate-200 rounded-lg p-5 max-w-3xl space-y-4">
          <h2 className="text-base font-bold text-slate-900 border-b border-slate-200 pb-2.5">
            Register Local Business (Consent-First Directory)
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Business Name *</label>
              <input
                type="text"
                required
                value={regForm.businessName}
                onChange={(e) => setRegForm({ ...regForm, businessName: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-md"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Category *</label>
              <select
                value={regForm.category}
                onChange={(e) => setRegForm({ ...regForm, category: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-md bg-white"
              >
                {BUSINESS_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">BMC Ward *</label>
              <select
                value={regForm.wardCode}
                onChange={(e) => setRegForm({ ...regForm, wardCode: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-md bg-white"
              >
                {WARDS.map((w) => (
                  <option key={w} value={w}>Ward {w}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Locality *</label>
              <input
                type="text"
                required
                placeholder="e.g., Dadar West, Andheri East"
                value={regForm.locality}
                onChange={(e) => setRegForm({ ...regForm, locality: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-md"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Shop Address</label>
              <input
                type="text"
                value={regForm.address}
                onChange={(e) => setRegForm({ ...regForm, address: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-md"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Products &amp; Services</label>
              <input
                type="text"
                placeholder="e.g., RO filter servicing, plumbing fittings, municipal meter boxes"
                value={regForm.productsServices}
                onChange={(e) => setRegForm({ ...regForm, productsServices: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-md"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Business Description</label>
              <textarea
                rows={2}
                value={regForm.description}
                onChange={(e) => setRegForm({ ...regForm, description: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-md"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Operating Hours</label>
              <input
                type="text"
                value={regForm.openingHours}
                onChange={(e) => setRegForm({ ...regForm, openingHours: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-md"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Contact Phone</label>
              <input
                type="text"
                value={regForm.contactPhone}
                onChange={(e) => setRegForm({ ...regForm, contactPhone: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-md"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Public Contact Email</label>
              <input
                type="email"
                value={regForm.contactEmail}
                onChange={(e) => setRegForm({ ...regForm, contactEmail: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-md"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Owner Account Email</label>
              <input
                type="email"
                value={regForm.ownerEmail}
                onChange={(e) => setRegForm({ ...regForm, ownerEmail: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-md"
              />
            </div>
          </div>

          <label className="flex items-start gap-2.5 p-3 bg-slate-50 border border-slate-200 rounded text-xs text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              required
              checked={regForm.consentGiven}
              onChange={(e) => setRegForm({ ...regForm, consentGiven: e.target.checked })}
              className="mt-0.5"
            />
            <span>
              I give explicit consent to publish this business listing, locality, operating hours, and contact details on the Mumbai Civic Data Intelligence Portal after Administrator verification.
            </span>
          </label>

          {regMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded text-xs">
              {regMessage}
            </div>
          )}

          <button
            type="submit"
            className="px-4 py-2 text-xs font-semibold bg-[#1E3A8A] text-white rounded-md hover:bg-[#172554]"
          >
            Submit Business for Verification
          </button>
        </form>
      )}

      {/* TAB 3: ADMIN MODERATION */}
      {tab === 'admin' && (
        <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">Business Approval &amp; Moderation Queue</h2>
            {role !== 'Administrator' && (
              <span className="inline-flex items-center gap-1 text-xs text-amber-700 font-medium">
                <ShieldAlert className="w-4 h-4" />
                Switch Role in top header to Administrator to approve or reject listings.
              </span>
            )}
          </div>

          {businesses.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">No business submissions in queue yet.</p>
          ) : (
            <div className="overflow-x-auto border border-slate-200 rounded-md">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 border-b border-slate-200">
                  <tr>
                    <th className="px-3 py-2">Business</th>
                    <th className="px-3 py-2">Ward &amp; Locality</th>
                    <th className="px-3 py-2">Category</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {businesses.map((b) => (
                    <tr key={b.id}>
                      <td className="px-3 py-2">
                        <div className="font-bold text-slate-900">{b.businessName}</div>
                        <div className="text-[11px] text-slate-500">{b.productsServices}</div>
                      </td>
                      <td className="px-3 py-2">Ward {b.wardCode} · {b.locality}</td>
                      <td className="px-3 py-2">{b.category}</td>
                      <td className="px-3 py-2 font-semibold">
                        {b.verificationStatus === 'verified' && <span className="text-emerald-700">Verified</span>}
                        {b.verificationStatus === 'pending' && <span className="text-amber-700">Pending</span>}
                        {b.verificationStatus === 'rejected' && <span className="text-red-700">Rejected</span>}
                      </td>
                      <td className="px-3 py-2 text-right space-x-2">
                        <button
                          type="button"
                          disabled={role !== 'Administrator'}
                          onClick={() => moderateBusiness(b.id, 'verified')}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 text-white rounded text-[11px] disabled:opacity-40"
                        >
                          <CheckCircle2 className="w-3 h-3" /> Approve
                        </button>
                        <button
                          type="button"
                          disabled={role !== 'Administrator'}
                          onClick={() => moderateBusiness(b.id, 'rejected')}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-600 text-white rounded text-[11px] disabled:opacity-40"
                        >
                          <XCircle className="w-3 h-3" /> Reject
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Business Detail & Enquiry Modal */}
      {selectedBiz && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-lg max-w-lg w-full p-5 space-y-4">
            <div className="flex items-start justify-between border-b border-slate-200 pb-3">
              <div>
                <div className="text-[11px] font-semibold text-[#1E3A8A]">
                  {selectedBiz.category} · Ward {selectedBiz.wardCode}
                </div>
                <h3 className="text-lg font-bold text-slate-900">{selectedBiz.businessName}</h3>
              </div>
              <button type="button" onClick={() => setSelectedBiz(null)} className="p-1 text-slate-500 hover:bg-slate-100 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-700 space-y-2">
              <p>{selectedBiz.description}</p>
              <div><strong>Products &amp; Services:</strong> {selectedBiz.productsServices || 'Not specified'}</div>
              <div><strong>Location:</strong> {selectedBiz.locality}{selectedBiz.address ? `, ${selectedBiz.address}` : ''}</div>
              <div><strong>Hours:</strong> {selectedBiz.openingHours}</div>
              <div className="flex flex-wrap gap-3 pt-1">
                {selectedBiz.contactPhone && (
                  <a
                    href={`tel:${selectedBiz.contactPhone}`}
                    onClick={() => trackContactClick(selectedBiz.id)}
                    className="inline-flex items-center gap-1 text-[#1E3A8A] font-semibold underline"
                  >
                    <Phone className="w-3.5 h-3.5" /> {selectedBiz.contactPhone}
                  </a>
                )}
                {selectedBiz.contactEmail && (
                  <a
                    href={`mailto:${selectedBiz.contactEmail}`}
                    onClick={() => trackContactClick(selectedBiz.id)}
                    className="inline-flex items-center gap-1 text-[#1E3A8A] font-semibold underline"
                  >
                    <Mail className="w-3.5 h-3.5" /> {selectedBiz.contactEmail}
                  </a>
                )}
              </div>
            </div>

            <form onSubmit={sendEnquiry} className="pt-3 border-t border-slate-200 space-y-2.5 text-xs">
              <div className="font-bold text-slate-900">Send Consumer Enquiry</div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  required
                  placeholder="Your Name"
                  value={enquiryForm.senderName}
                  onChange={(e) => setEnquiryForm({ ...enquiryForm, senderName: e.target.value })}
                  className="px-2.5 py-1.5 border border-slate-300 rounded"
                />
                <input
                  type="text"
                  required
                  placeholder="Phone or Email"
                  value={enquiryForm.senderContact}
                  onChange={(e) => setEnquiryForm({ ...enquiryForm, senderContact: e.target.value })}
                  className="px-2.5 py-1.5 border border-slate-300 rounded"
                />
              </div>
              <textarea
                rows={2}
                required
                placeholder="Write your product or service enquiry..."
                value={enquiryForm.message}
                onChange={(e) => setEnquiryForm({ ...enquiryForm, message: e.target.value })}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded"
              />
              {enquiryStatus && (
                <div className="p-2 bg-emerald-50 text-emerald-800 rounded">{enquiryStatus}</div>
              )}
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1E3A8A] text-white font-semibold rounded hover:bg-[#172554]"
              >
                <Send className="w-3.5 h-3.5" /> Submit Enquiry
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
