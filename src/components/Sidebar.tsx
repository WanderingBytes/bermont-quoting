'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: '📊' },
  { label: 'Quotes', href: '/quotes', icon: '📋' },
  { label: 'Materials', href: '/materials', icon: '🪨' },
];

const placeholderItems = [
  { label: 'Customers', href: '/customers', icon: '👥' },
  { label: 'Finance', href: '/finance', icon: '💰' },
  { label: 'Purchase Orders', href: '/po', icon: '📦' },
  { label: 'Invoices', href: '/invoices', icon: '🧾' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <h1>Bermont</h1>
        <p>Materials Quoting System</p>
      </div>

      <div className="sidebar-section">
        <div className="sidebar-section-label">Operations</div>
        <nav className="sidebar-nav">
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-nav-item ${pathname.startsWith(item.href) ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="sidebar-section">
        <div className="sidebar-section-label">Coming Soon</div>
        <nav className="sidebar-nav">
          {placeholderItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-nav-item ${pathname === item.href ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      <div style={{ marginTop: 'auto', padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ fontSize: '12px', color: '#737373' }}>
          <div style={{ fontWeight: 600, color: '#a3a3a3' }}>Bermont Materials</div>
          <div>Punta Gorda, FL</div>
          <div>(866) 367-9557</div>
        </div>
      </div>
    </aside>
  );
}
