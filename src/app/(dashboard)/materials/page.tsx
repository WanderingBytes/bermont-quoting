'use client';

import { useState, useEffect } from 'react';

interface Material {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  pricePerTon: string;
  unit: string;
  location: string;
  category: string | null;
  isActive: boolean;
}

const CATEGORY_LABELS: Record<string, { icon: string; label: string }> = {
  fill: { icon: '🏔️', label: 'Fill' },
  base: { icon: '🛣️', label: 'Base' },
  sand: { icon: '⏳', label: 'Sand' },
  shell: { icon: '🐚', label: 'Shell' },
  stone: { icon: '🪨', label: 'Stone' },
  'rip-rap': { icon: '🧱', label: 'Rip Rap' },
};

const LOCATION_LABELS: Record<string, string> = {
  clarion: '📍 Clarion',
  alico: '📍 Alico',
  both: '📍 Both Sites',
};

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/materials')
      .then(res => res.json())
      .then(data => {
        setMaterials(data);
        setLoading(false);
      })
      .catch(console.error);
  }, []);

  return (
    <>
      <div className="main-header">
        <h2>Materials Catalog</h2>
      </div>
      <div className="main-body">
        <div className="queue-page-header">
          <div>
            <h1>🪨 Aggregate Materials</h1>
            <p className="queue-count">{materials.length} active materials · Prices per ton</p>
          </div>
        </div>

        {loading ? (
          <div className="queue-loading">Loading materials...</div>
        ) : (
          <div className="material-grid">
            {materials.map(mat => {
              const cat = mat.category ? CATEGORY_LABELS[mat.category] : null;
              return (
                <div key={mat.id} className="material-card">
                  <div className="material-card-name">{mat.name}</div>
                  <div className="material-card-meta">
                    {cat && <span className="status-badge badge-new">{cat.icon} {cat.label}</span>}
                    <span className="status-badge badge-in-review">{LOCATION_LABELS[mat.location] || mat.location}</span>
                  </div>
                  {mat.description && (
                    <p style={{ fontSize: '12px', color: '#737373', marginBottom: '12px', lineHeight: '1.5' }}>
                      {mat.description}
                    </p>
                  )}
                  <div>
                    <span className="material-card-price">${parseFloat(mat.pricePerTon).toFixed(2)}</span>
                    <span className="material-card-unit"> / {mat.unit}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
