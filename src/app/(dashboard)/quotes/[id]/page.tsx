'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';

interface Material {
  id: string;
  name: string;
  slug: string;
  pricePerTon: string;
  location: string;
  category: string | null;
}

interface LineItem {
  id?: string;
  materialId: string | null;
  materialName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
}

interface QuoteDetail {
  id: string;
  referenceNumber: string;
  status: string;
  customerName: string | null;
  customerCompany: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  deliveryType: string | null;
  deliveryAddress: string | null;
  siteLocation: string | null;
  projectPurpose: string | null;
  startDate: string | null;
  subtotal: string | null;
  deliveryFee: string | null;
  taxRate: string | null;
  taxAmount: string | null;
  total: string | null;
  expiresAt: string | null;
  ocrData: Record<string, unknown> | null;
  ocrConfidence: number | null;
  internalNotes: string | null;
  createdAt: string;
  sentAt: string | null;
  email: {
    subject: string | null;
    fromEmail: string | null;
    toEmail: string | null;
    body: string | null;
    receivedAt: string | null;
  } | null;
  attachments: {
    id: string;
    fileName: string;
    fileType: string;
    ocrText: string | null;
  }[];
  lineItems: (LineItem & { material: Material | null })[];
}

function getConfidenceClass(confidence: number): string {
  if (confidence >= 0.7) return 'ocr-high';
  if (confidence >= 0.4) return 'ocr-medium';
  return 'ocr-low';
}

function getConfidenceLabel(confidence: number): string {
  if (confidence >= 0.7) return 'High';
  if (confidence >= 0.4) return 'Medium';
  return 'Low';
}

export default function QuoteDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [quote, setQuote] = useState<QuoteDetail | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Editable form state
  const [customerName, setCustomerName] = useState('');
  const [customerCompany, setCustomerCompany] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryType, setDeliveryType] = useState('pickup');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [siteLocation, setSiteLocation] = useState('');
  const [projectPurpose, setProjectPurpose] = useState('');
  const [startDate, setStartDate] = useState('');
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [internalNotes, setInternalNotes] = useState('');
  const [lineItems, setLineItems] = useState<LineItem[]>([]);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchQuote = useCallback(async () => {
    try {
      const res = await fetch(`/api/quotes/${id}`);
      if (res.ok) {
        const data = await res.json();
        setQuote(data);
        // Pre-fill form
        setCustomerName(data.customerName || '');
        setCustomerCompany(data.customerCompany || '');
        setCustomerEmail(data.customerEmail || '');
        setCustomerPhone(data.customerPhone || '');
        setDeliveryType(data.deliveryType || 'pickup');
        setDeliveryAddress(data.deliveryAddress || '');
        setSiteLocation(data.siteLocation || '');
        setProjectPurpose(data.projectPurpose || '');
        setStartDate(data.startDate ? data.startDate.slice(0, 10) : '');
        setDeliveryFee(data.deliveryFee ? parseFloat(data.deliveryFee) : 0);
        setInternalNotes(data.internalNotes || '');
        setLineItems(data.lineItems.map((li: LineItem & { material: Material | null }) => ({
          materialId: li.materialId,
          materialName: li.materialName,
          quantity: Number(li.quantity),
          unit: li.unit,
          unitPrice: Number(li.unitPrice),
          total: Number(li.total),
        })));
      }
    } catch (error) {
      console.error('Failed to fetch quote:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchQuote();
    fetch('/api/materials')
      .then(res => res.json())
      .then(setMaterials)
      .catch(console.error);
  }, [fetchQuote]);

  // Calculations
  const subtotal = lineItems.reduce((sum, li) => sum + (li.quantity * li.unitPrice), 0);
  const taxRate = 0.07;
  const taxAmount = subtotal * taxRate;
  const total = subtotal + deliveryFee + taxAmount;

  const handleMaterialChange = (index: number, materialId: string) => {
    const mat = materials.find(m => m.id === materialId);
    if (!mat) return;

    setLineItems(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        materialId: mat.id,
        materialName: mat.name,
        unitPrice: parseFloat(mat.pricePerTon),
        total: updated[index].quantity * parseFloat(mat.pricePerTon),
      };
      return updated;
    });
  };

  const handleQuantityChange = (index: number, qty: number) => {
    setLineItems(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        quantity: qty,
        total: qty * updated[index].unitPrice,
      };
      return updated;
    });
  };

  const handlePriceChange = (index: number, price: number) => {
    setLineItems(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        unitPrice: price,
        total: updated[index].quantity * price,
      };
      return updated;
    });
  };

  const addLineItem = () => {
    setLineItems(prev => [...prev, {
      materialId: null,
      materialName: '',
      quantity: 0,
      unit: 'ton',
      unitPrice: 0,
      total: 0,
    }]);
  };

  const removeLineItem = (index: number) => {
    setLineItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/quotes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName,
          customerCompany,
          customerEmail,
          customerPhone,
          deliveryType,
          deliveryAddress,
          siteLocation,
          projectPurpose,
          startDate: startDate || null,
          deliveryFee,
          internalNotes,
          status: 'PRICED',
          lineItems: lineItems.map(li => ({
            materialId: li.materialId,
            materialName: li.materialName,
            quantity: li.quantity,
            unit: li.unit,
            unitPrice: li.unitPrice,
          })),
        }),
      });

      if (res.ok) {
        showToast('Quote saved successfully', 'success');
        fetchQuote();
      } else {
        showToast('Failed to save quote', 'error');
      }
    } catch {
      showToast('Failed to save quote', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSend = async () => {
    if (!customerEmail) {
      showToast('Customer email is required to send quote', 'error');
      return;
    }

    // Save first
    await handleSave();

    setSending(true);
    try {
      const res = await fetch(`/api/quotes/${id}/send`, { method: 'POST' });
      const data = await res.json();

      if (res.ok) {
        showToast(`Quote sent to ${data.sentTo}`, 'success');
        fetchQuote();
      } else {
        showToast(data.error || 'Failed to send quote', 'error');
      }
    } catch {
      showToast('Failed to send quote', 'error');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <>
        <div className="main-header"><h2>Loading...</h2></div>
        <div className="main-body"><div className="queue-loading">Loading quote details...</div></div>
      </>
    );
  }

  if (!quote) {
    return (
      <>
        <div className="main-header"><h2>Not Found</h2></div>
        <div className="main-body"><p>Quote not found.</p></div>
      </>
    );
  }

  const ocrConfidence = quote.ocrData as Record<string, unknown> | null;
  const confidenceMap = (ocrConfidence?.confidence || {}) as Record<string, number>;

  return (
    <>
      {toast && (
        <div className={`toast toast-${toast.type}`}>{toast.message}</div>
      )}

      <div className="main-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span className="back-link" onClick={() => router.push('/quotes')}>← Back</span>
          <h2>{quote.referenceNumber}</h2>
          <span className={`status-badge ${getStatusBadgeClass(quote.status)}`}>
            {quote.status.replace('_', ' ')}
          </span>
          {quote.ocrConfidence !== null && (
            <span className={`status-badge badge-confidence-${getConfidenceClass(quote.ocrConfidence).replace('ocr-', '')}`}>
              {Math.round(quote.ocrConfidence * 100)}% OCR — {getConfidenceLabel(quote.ocrConfidence)}
            </span>
          )}
        </div>
        <div className="queue-actions">
          <button onClick={handleSave} disabled={saving} className="btn btn-secondary">
            {saving ? '⏳ Saving...' : '💾 Save Draft'}
          </button>
          <button onClick={handleSend} disabled={sending || !customerEmail} className="btn btn-success">
            {sending ? '⏳ Sending...' : '📧 Send Quote'}
          </button>
        </div>
      </div>

      <div className="main-body" style={{ padding: '16px' }}>
        <div className="split-panel">
          {/* LEFT PANEL — Email Content */}
          <div className="panel">
            <div className="panel-header">
              <h3>📧 Original Email</h3>
            </div>
            <div className="panel-body">
              {quote.email && (
                <>
                  <div className="email-meta">
                    <div className="email-meta-row">
                      <span className="email-meta-label">From</span>
                      <span className="email-meta-value">{quote.email.fromEmail}</span>
                    </div>
                    <div className="email-meta-row">
                      <span className="email-meta-label">To</span>
                      <span className="email-meta-value">{quote.email.toEmail}</span>
                    </div>
                    <div className="email-meta-row">
                      <span className="email-meta-label">Subject</span>
                      <span className="email-meta-value" style={{ fontWeight: 600 }}>{quote.email.subject}</span>
                    </div>
                    <div className="email-meta-row">
                      <span className="email-meta-label">Received</span>
                      <span className="email-meta-value">
                        {quote.email.receivedAt ? new Date(quote.email.receivedAt).toLocaleString() : '—'}
                      </span>
                    </div>
                  </div>

                  <div className="email-body">{quote.email.body}</div>
                </>
              )}

              {quote.attachments.length > 0 && (
                <div className="email-attachments">
                  <h4 style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: '#737373', marginBottom: '8px' }}>
                    Attachments ({quote.attachments.length})
                  </h4>
                  {quote.attachments.map(att => (
                    <div key={att.id} className="email-attachment-item">
                      <span>📎</span>
                      <span style={{ fontWeight: 500 }}>{att.fileName}</span>
                      <span className="text-muted" style={{ marginLeft: 'auto', fontSize: '12px' }}>{att.fileType}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT PANEL — Editable Fields */}
          <div className="panel">
            <div className="panel-header">
              <h3>✏️ Quote Details</h3>
            </div>
            <div className="panel-body">
              {/* Customer Info */}
              <div className="form-section">
                <div className="form-section-title">Customer Information</div>
                <div className="form-row">
                  <div className="form-field">
                    <label>
                      Name
                      {confidenceMap.customerName && (
                        <span className={`ocr-indicator ${getConfidenceClass(confidenceMap.customerName)}`}
                          title={`OCR: ${Math.round(confidenceMap.customerName * 100)}%`} />
                      )}
                    </label>
                    <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Customer name" />
                  </div>
                  <div className="form-field">
                    <label>
                      Company
                      {confidenceMap.customerCompany && (
                        <span className={`ocr-indicator ${getConfidenceClass(confidenceMap.customerCompany)}`}
                          title={`OCR: ${Math.round(confidenceMap.customerCompany * 100)}%`} />
                      )}
                    </label>
                    <input type="text" value={customerCompany} onChange={e => setCustomerCompany(e.target.value)} placeholder="Company name" />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-field">
                    <label>
                      Email
                      {confidenceMap.customerEmail && (
                        <span className={`ocr-indicator ${getConfidenceClass(confidenceMap.customerEmail)}`}
                          title={`OCR: ${Math.round(confidenceMap.customerEmail * 100)}%`} />
                      )}
                    </label>
                    <input type="email" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} placeholder="email@example.com" />
                  </div>
                  <div className="form-field">
                    <label>
                      Phone
                      {confidenceMap.customerPhone && (
                        <span className={`ocr-indicator ${getConfidenceClass(confidenceMap.customerPhone)}`}
                          title={`OCR: ${Math.round(confidenceMap.customerPhone * 100)}%`} />
                      )}
                    </label>
                    <input type="tel" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="(xxx) xxx-xxxx" />
                  </div>
                </div>
              </div>

              {/* Materials */}
              <div className="form-section">
                <div className="form-section-title">Materials</div>
                <div className="line-items">
                  {lineItems.map((item, index) => (
                    <div key={index} className="line-item">
                      <select
                        value={item.materialId || ''}
                        onChange={e => handleMaterialChange(index, e.target.value)}
                      >
                        <option value="">Select material...</option>
                        {materials.map(m => (
                          <option key={m.id} value={m.id}>{m.name} (${parseFloat(m.pricePerTon).toFixed(2)}/{m.location})</option>
                        ))}
                      </select>
                      <input
                        type="number"
                        value={item.quantity || ''}
                        onChange={e => handleQuantityChange(index, parseFloat(e.target.value) || 0)}
                        placeholder="Qty"
                        min="0"
                        style={{ textAlign: 'center' }}
                      />
                      <input
                        type="number"
                        value={item.unitPrice || ''}
                        onChange={e => handlePriceChange(index, parseFloat(e.target.value) || 0)}
                        placeholder="$/ton"
                        min="0"
                        step="0.50"
                        style={{ textAlign: 'right' }}
                      />
                      <span className="line-item-total">${(item.quantity * item.unitPrice).toFixed(2)}</span>
                      <button className="line-item-remove" onClick={() => removeLineItem(index)} title="Remove">✕</button>
                    </div>
                  ))}
                </div>
                <button className="btn btn-secondary btn-sm mt-2" onClick={addLineItem}>+ Add Material</button>
              </div>

              {/* Delivery */}
              <div className="form-section">
                <div className="form-section-title">Delivery</div>
                <div className="form-field">
                  <label>Type</label>
                  <div className="radio-group">
                    <div
                      className={`radio-option ${deliveryType === 'pickup' ? 'selected' : ''}`}
                      onClick={() => setDeliveryType('pickup')}
                    >
                      🏗️ Pickup
                    </div>
                    <div
                      className={`radio-option ${deliveryType === 'delivery' ? 'selected' : ''}`}
                      onClick={() => setDeliveryType('delivery')}
                    >
                      🚛 Delivery
                    </div>
                  </div>
                </div>
                {deliveryType === 'delivery' && (
                  <>
                    <div className="form-field">
                      <label>Delivery Address</label>
                      <input type="text" value={deliveryAddress} onChange={e => setDeliveryAddress(e.target.value)} placeholder="Street, City, FL ZIP" />
                    </div>
                    <div className="form-field">
                      <label>Delivery Fee</label>
                      <input type="number" value={deliveryFee || ''} onChange={e => setDeliveryFee(parseFloat(e.target.value) || 0)} placeholder="0.00" min="0" step="25" />
                    </div>
                  </>
                )}
                <div className="form-row">
                  <div className="form-field">
                    <label>Pickup/Source Location</label>
                    <select value={siteLocation} onChange={e => setSiteLocation(e.target.value)}>
                      <option value="">Select...</option>
                      <option value="clarion">Clarion — Punta Gorda</option>
                      <option value="alico">Alico — Fort Myers</option>
                    </select>
                  </div>
                  <div className="form-field">
                    <label>Start Date</label>
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                  </div>
                </div>
                <div className="form-field">
                  <label>Project Purpose</label>
                  <input type="text" value={projectPurpose} onChange={e => setProjectPurpose(e.target.value)} placeholder="e.g., Parking lot, Seawall repair, Driveway" />
                </div>
              </div>

              {/* Pricing Summary */}
              <div className="form-section">
                <div className="form-section-title">Pricing Summary</div>
                <div className="pricing-summary">
                  <div className="pricing-row">
                    <span>Subtotal ({lineItems.length} items)</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  {deliveryFee > 0 && (
                    <div className="pricing-row">
                      <span>Delivery Fee</span>
                      <span>${deliveryFee.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="pricing-row">
                    <span>Tax (7%)</span>
                    <span>${taxAmount.toFixed(2)}</span>
                  </div>
                  <div className="pricing-row total">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Internal Notes */}
              <div className="form-section">
                <div className="form-section-title">Internal Notes</div>
                <div className="form-field">
                  <textarea
                    value={internalNotes}
                    onChange={e => setInternalNotes(e.target.value)}
                    placeholder="Notes for internal use only (not sent to customer)"
                    rows={3}
                  />
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="panel-actions">
              <button onClick={handleSave} disabled={saving} className="btn btn-secondary">
                {saving ? '⏳ Saving...' : '💾 Save Draft'}
              </button>
              <button onClick={handleSend} disabled={sending || !customerEmail} className="btn btn-success">
                {sending ? '⏳ Sending...' : '📧 Send Quote'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

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
