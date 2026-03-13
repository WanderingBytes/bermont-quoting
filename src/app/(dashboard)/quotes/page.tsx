'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface QuoteRow {
  id: string;
  referenceNumber: string;
  status: string;
  customerName: string | null;
  customerCompany: string | null;
  customerEmail: string | null;
  total: string | null;
  createdAt: string;
  email: { subject: string | null; fromEmail: string | null; receivedAt: string | null } | null;
  lineItems: { materialName: string; quantity: string; unit: string }[];
  _count: { lineItems: number };
}

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'All Quotes' },
  { value: 'NEW', label: '🔵 New' },
  { value: 'IN_REVIEW', label: '🟡 In Review' },
  { value: 'PRICED', label: '🟣 Priced' },
  { value: 'SENT', label: '🟢 Sent' },
  { value: 'ACCEPTED', label: '✅ Accepted' },
  { value: 'DECLINED', label: '🔴 Declined' },
  { value: 'EXPIRED', label: '⚪ Expired' },
];

function getStatusBadgeClass(status: string): string {
  const map: Record<string, string> = {
    NEW: 'badge-new',
    IN_REVIEW: 'badge-in-review',
    PRICED: 'badge-priced',
    SENT: 'badge-sent',
    ACCEPTED: 'badge-accepted',
    DECLINED: 'badge-declined',
    EXPIRED: 'badge-expired',
  };
  return map[status] || 'badge-new';
}

export default function QuotesPage() {
  const router = useRouter();
  const [quotes, setQuotes] = useState<QuoteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [intakeLoading, setIntakeLoading] = useState(false);
  const [intakeResult, setIntakeResult] = useState<string | null>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout>>(null);

  const fetchQuotes = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (search) params.set('search', search);
      params.set('sort', 'createdAt');
      params.set('order', 'desc');
      params.set('_t', Date.now().toString()); // Cache buster

      const res = await fetch(`/api/quotes?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setQuotes(data.quotes);
        setTotal(data.total);
      }
    } catch (error) {
      console.error('Failed to fetch quotes:', error);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    setLoading(true);
    fetchQuotes();
  }, [fetchQuotes]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {}, 300);
  };

  const handleIntake = async () => {
    setIntakeLoading(true);
    setIntakeResult(null);
    try {
      const res = await fetch('/api/email/intake', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setIntakeResult(`✅ ${data.message}`);
        fetchQuotes();
      } else {
        setIntakeResult(`❌ ${data.error}`);
      }
    } catch (error) {
      setIntakeResult(`❌ Failed: ${String(error)}`);
    } finally {
      setIntakeLoading(false);
    }
  };

  const formatCurrency = (amount: string | null) => {
    if (!amount) return '—';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(parseFloat(amount));
  };

  const formatDate = (date: string | null) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (date: string | null) => {
    if (!date) return '';
    return new Date(date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  return (
    <>
      <div className="main-header">
        <h2>Quote Requests</h2>
        <div className="queue-actions">
          <button
            onClick={handleIntake}
            disabled={intakeLoading}
            className="btn btn-primary"
          >
            {intakeLoading ? '⏳ Processing...' : '📧 Run Email Intake'}
          </button>
        </div>
      </div>
      <div className="main-body">
        {intakeResult && (
          <div className="intake-result">{intakeResult}</div>
        )}

        <div className="queue-page-header">
          <div>
            <h1>📋 Incoming Quotes</h1>
            <p className="queue-count">{total} quote{total !== 1 ? 's' : ''}</p>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="filter-bar">
          <div className="filter-search">
            <span className="filter-search-icon">🔍</span>
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search quotes, customers, emails..."
              className="filter-search-input"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="btn btn-secondary"
            style={{ appearance: 'auto', padding: '8px 12px' }}
          >
            {STATUS_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Table */}
        {loading ? (
          <div className="queue-loading">Loading quotes...</div>
        ) : quotes.length === 0 ? (
          <div className="queue-empty">
            <div className="queue-empty-icon">📭</div>
            <h3>No quotes yet</h3>
            <p>Click &quot;Run Email Intake&quot; to simulate receiving quote request emails from contractors.</p>
          </div>
        ) : (
          <div className="queue-table-wrapper">
            <table className="queue-table">
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Customer</th>
                  <th>Subject</th>
                  <th>Materials</th>
                  <th style={{ textAlign: 'right' }}>Total</th>
                  <th>Received</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {quotes.map((q) => (
                  <tr
                    key={q.id}
                    className="queue-row"
                    onClick={() => router.push(`/quotes/${q.id}`)}
                  >
                    <td className="queue-cell-primary">{q.referenceNumber}</td>
                    <td>
                      <div className="queue-cell-vendor">
                        <span className="vendor-name">{q.customerName || q.customerCompany || 'Unknown'}</span>
                        <span className="vendor-email">{q.customerEmail || q.email?.fromEmail}</span>
                      </div>
                    </td>
                    <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {q.email?.subject || '—'}
                    </td>
                    <td>
                      {q._count.lineItems > 0 ? (
                        <span className="status-badge badge-new">{q._count.lineItems} item{q._count.lineItems > 1 ? 's' : ''}</span>
                      ) : (
                        <span className="text-muted">None detected</span>
                      )}
                    </td>
                    <td className="queue-cell-amount">{formatCurrency(q.total)}</td>
                    <td>
                      <div>{formatDate(q.createdAt)}</div>
                      <div className="text-muted" style={{ fontSize: '11px' }}>{formatTime(q.createdAt)}</div>
                    </td>
                    <td>
                      <span className={`status-badge ${getStatusBadgeClass(q.status)}`}>
                        {q.status.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
