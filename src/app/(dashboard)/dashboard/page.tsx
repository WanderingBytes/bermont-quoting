'use client';

import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend,
} from 'recharts';
import {
  kpiData, inventoryData, revenueData, weeklyRevenueData, monthlyRevenueData,
  orderPipeline, productMargins, topCustomers, segmentData,
  forecastData, costTrends, supplyAlerts,
} from '@/lib/dashboard-data';
import { useState } from 'react';

// ── Helpers ─────────────────────────────────────────────────────────
const fmt = (n: number) => {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
};

const fmtFull = (n: number) => `$${n.toLocaleString()}`;

const pctChange = (current: number, previous: number) => {
  if (previous === 0) return 0;
  return Math.round(((current - previous) / previous) * 100);
};

const stockHealth = (stock: number, max: number) => {
  const pct = stock / max;
  if (pct >= 0.5) return 'healthy';
  if (pct >= 0.25) return 'warning';
  return 'critical';
};

// ── CHART COLORS ────────────────────────────────────────────────────
const ORANGE = '#F57C20';
const ORANGE_LIGHT = '#FFA54F';
const BLUE = '#3B82F6';
const GREEN = '#10B981';
const PURPLE = '#8B5CF6';
const RED = '#EF4444';
const GRAY = '#94A3B8';

// ── Custom Tooltip ──────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="dash-tooltip">
      <div className="dash-tooltip-label">{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} className="dash-tooltip-row">
          <span className="dash-tooltip-dot" style={{ background: p.color }} />
          <span>{p.name}: </span>
          <strong>{typeof p.value === 'number' && p.value > 100 ? fmtFull(p.value) : p.value}</strong>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
export default function DashboardPage() {
  const [revPeriod, setRevPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const todayChange = pctChange(kpiData.todayRevenue, kpiData.yesterdayRevenue);
  const weekChange = pctChange(kpiData.weekRevenue, kpiData.prevWeekRevenue);

  const revChartData = revPeriod === 'daily' ? revenueData
    : revPeriod === 'weekly' ? weeklyRevenueData.map(w => ({ date: w.week, revenue: w.revenue, cost: w.cost }))
    : monthlyRevenueData.map(m => ({ date: m.month, revenue: m.revenue, cost: m.cost }));

  return (
    <>
      <div className="main-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h2>Dashboard</h2>
          <span style={{ fontSize: '12px', color: '#737373', fontWeight: 500 }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </span>
        </div>
        <div className="queue-actions">
          <span style={{ fontSize: '11px', color: '#a3a3a3', fontWeight: 500 }}>Live data simulation</span>
          <span className="dash-live-dot" />
        </div>
      </div>

      <div className="main-body" style={{ padding: '20px', gap: '20px', display: 'flex', flexDirection: 'column' }}>

        {/* ═══ KPI HERO ROW ═══ */}
        <div className="dash-kpi-row">
          <div className="dash-kpi-card">
            <div className="dash-kpi-header">
              <span className="dash-kpi-icon">💰</span>
              <span className={`dash-kpi-trend ${todayChange >= 0 ? 'up' : 'down'}`}>
                {todayChange >= 0 ? '↑' : '↓'} {Math.abs(todayChange)}%
              </span>
            </div>
            <div className="dash-kpi-value">{fmt(kpiData.todayRevenue)}</div>
            <div className="dash-kpi-label">Today&apos;s Revenue</div>
            <div className="dash-kpi-sub">vs {fmt(kpiData.yesterdayRevenue)} yesterday</div>
          </div>

          <div className="dash-kpi-card">
            <div className="dash-kpi-header">
              <span className="dash-kpi-icon">📦</span>
              <span className="dash-kpi-trend up">Active</span>
            </div>
            <div className="dash-kpi-value">{kpiData.activeOrders}</div>
            <div className="dash-kpi-label">Active Orders</div>
            <div className="dash-kpi-sub">{orderPipeline[0].count} pending · {orderPipeline[1].count} in progress</div>
          </div>

          <div className="dash-kpi-card">
            <div className="dash-kpi-header">
              <span className="dash-kpi-icon">🏗️</span>
            </div>
            <div className="dash-kpi-value">{kpiData.totalInventoryTons.toLocaleString()}<span className="dash-kpi-unit"> tons</span></div>
            <div className="dash-kpi-label">Total Inventory</div>
            <div className="dash-kpi-sub">Across Clarion & Alico</div>
          </div>

          <div className="dash-kpi-card">
            <div className="dash-kpi-header">
              <span className="dash-kpi-icon">📈</span>
              <span className={`dash-kpi-trend ${weekChange >= 0 ? 'up' : 'down'}`}>
                {weekChange >= 0 ? '↑' : '↓'} {Math.abs(weekChange)}%
              </span>
            </div>
            <div className="dash-kpi-value">{kpiData.avgMargin}%</div>
            <div className="dash-kpi-label">Avg Margin</div>
            <div className="dash-kpi-sub">This week: {fmt(kpiData.weekRevenue)}</div>
          </div>
        </div>

        {/* ═══ INVENTORY & ORDERS ═══ */}
        <div className="dash-grid-2">
          {/* Inventory by Site */}
          <div className="dash-card">
            <div className="dash-card-header">
              <h3>📦 Inventory by Site</h3>
              <span className="dash-card-sub">Stock levels in tons</span>
            </div>
            <div className="dash-card-body" style={{ height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={inventoryData.slice(0, 10)} layout="vertical" margin={{ left: 20, right: 20, top: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#94A3B8' }} tickFormatter={(v) => `${v}`} />
                  <YAxis type="category" dataKey="material" width={140} tick={{ fontSize: 11, fill: '#525252' }}
                    tickFormatter={(v: string) => v.length > 18 ? v.slice(0, 18) + '…' : v} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="clarionStock" name="Clarion" fill={ORANGE} radius={[0, 3, 3, 0]} barSize={10} />
                  <Bar dataKey="alicoStock" name="Alico" fill={BLUE} radius={[0, 3, 3, 0]} barSize={10} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Order Pipeline */}
          <div className="dash-card">
            <div className="dash-card-header">
              <h3>🚛 Order Pipeline</h3>
              <span className="dash-card-sub">{orderPipeline.reduce((s, o) => s + o.count, 0)} total orders</span>
            </div>
            <div className="dash-card-body">
              <div className="dash-pipeline">
                {orderPipeline.map((stage) => {
                  const total = orderPipeline.reduce((s, o) => s + o.count, 0);
                  const pct = Math.round((stage.count / total) * 100);
                  return (
                    <div key={stage.status} className="dash-pipeline-stage">
                      <div className="dash-pipeline-bar-wrap">
                        <div className="dash-pipeline-bar" style={{
                          width: `${Math.max(pct, 5)}%`,
                          background: stage.color,
                        }} />
                      </div>
                      <div className="dash-pipeline-info">
                        <div className="dash-pipeline-dot" style={{ background: stage.color }} />
                        <span className="dash-pipeline-name">{stage.status}</span>
                        <span className="dash-pipeline-count">{stage.count}</span>
                        <span className="dash-pipeline-value">{fmt(stage.value)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Velocity Table */}
              <div className="dash-card-header" style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid #f0f0f0' }}>
                <h3>⚡ Inventory Velocity</h3>
                <span className="dash-card-sub">Top movers (tons/week)</span>
              </div>
              <div className="dash-velocity-list">
                {inventoryData
                  .sort((a, b) => b.weeklyUsage - a.weeklyUsage)
                  .slice(0, 6)
                  .map((item, i) => {
                    const weeksLeft = Math.round((item.clarionStock + item.alicoStock) / item.weeklyUsage * 10) / 10;
                    return (
                      <div key={i} className="dash-velocity-row">
                        <span className="dash-velocity-name">{item.material}</span>
                        <div className="dash-velocity-bar-wrap">
                          <div className="dash-velocity-bar" style={{
                            width: `${Math.min((item.weeklyUsage / 1000) * 100, 100)}%`,
                            background: weeksLeft < 4 ? RED : weeksLeft < 6 ? '#F59E0B' : GREEN,
                          }} />
                        </div>
                        <span className="dash-velocity-val">{item.weeklyUsage}</span>
                        <span className={`dash-velocity-weeks ${weeksLeft < 4 ? 'critical' : weeksLeft < 6 ? 'warning' : ''}`}>
                          {weeksLeft}w left
                        </span>
                      </div>
                    );
                  })
                }
              </div>
            </div>
          </div>
        </div>

        {/* ═══ SALES METRICS ═══ */}
        <div className="dash-grid-3">
          {/* Revenue Over Time */}
          <div className="dash-card" style={{ gridColumn: 'span 2' }}>
            <div className="dash-card-header">
              <h3>💵 Revenue & Costs</h3>
              <div className="dash-toggle-group">
                {(['daily', 'weekly', 'monthly'] as const).map(p => (
                  <button key={p} className={`dash-toggle ${revPeriod === p ? 'active' : ''}`} onClick={() => setRevPeriod(p)}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div className="dash-card-body" style={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={revChartData} margin={{ left: 10, right: 10, top: 5, bottom: 5 }}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={ORANGE} stopOpacity={0.15} />
                      <stop offset="100%" stopColor={ORANGE} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} tickFormatter={(v) => fmt(v)} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="revenue" name="Revenue" stroke={ORANGE} fill="url(#revGrad)" strokeWidth={2} />
                  <Line type="monotone" dataKey="cost" name="Costs" stroke={GRAY} strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Customer Segments */}
          <div className="dash-card">
            <div className="dash-card-header">
              <h3>👥 Revenue by Segment</h3>
            </div>
            <div className="dash-card-body">
              <div className="dash-segments">
                {segmentData.map((seg) => (
                  <div key={seg.segment} className="dash-segment-item">
                    <div className="dash-segment-header">
                      <span className="dash-segment-dot" style={{ background: seg.color }} />
                      <span className="dash-segment-name">{seg.segment}</span>
                      <span className="dash-segment-pct">{seg.percentage}%</span>
                    </div>
                    <div className="dash-segment-bar-wrap">
                      <div className="dash-segment-bar" style={{ width: `${seg.percentage}%`, background: seg.color }} />
                    </div>
                    <div className="dash-segment-revenue">{fmt(seg.revenue)}</div>
                  </div>
                ))}
              </div>

              {/* Top Customers mini table */}
              <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid #f0f0f0' }}>
                <div className="dash-card-header" style={{ padding: 0, marginBottom: 10 }}>
                  <h3>🏆 Top Customers</h3>
                </div>
                <div className="dash-top-customers">
                  {topCustomers.slice(0, 5).map((c, i) => (
                    <div key={i} className="dash-customer-row">
                      <span className="dash-customer-rank">#{i + 1}</span>
                      <div className="dash-customer-info">
                        <span className="dash-customer-name">{c.company}</span>
                        <span className="dash-customer-meta">{c.segment} · {c.orders} orders</span>
                      </div>
                      <span className="dash-customer-rev">{fmt(c.revenue)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Margin by Product */}
        <div className="dash-card">
          <div className="dash-card-header">
            <h3>📊 Margin by Product</h3>
            <span className="dash-card-sub">Gross margin % per material</span>
          </div>
          <div className="dash-card-body" style={{ height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={productMargins} margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="material" tick={{ fontSize: 10, fill: '#94A3B8' }} interval={0} angle={-25} textAnchor="end" height={60}
                  tickFormatter={(v: string) => v.length > 16 ? v.slice(0, 16) + '…' : v} />
                <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} tickFormatter={(v) => `${v}%`} domain={[0, 80]} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="margin" name="Margin %" radius={[4, 4, 0, 0]} barSize={32}>
                  {productMargins.map((entry, i) => (
                    <Cell key={i} fill={entry.margin >= 60 ? GREEN : entry.margin >= 40 ? ORANGE : RED} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ═══ FORECASTING & ALERTS ═══ */}
        <div className="dash-grid-2">
          {/* Demand Forecast */}
          <div className="dash-card">
            <div className="dash-card-header">
              <h3>🔮 Demand Forecast</h3>
              <span className="dash-card-sub">15-day projection</span>
            </div>
            <div className="dash-card-body" style={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={forecastData} margin={{ left: 10, right: 10, top: 5, bottom: 5 }}>
                  <defs>
                    <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={PURPLE} stopOpacity={0.1} />
                      <stop offset="100%" stopColor={PURPLE} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94A3B8' }} interval={4} />
                  <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} tickFormatter={(v) => fmt(v)} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="upper" name="Upper Bound" stroke="none" fill={PURPLE} fillOpacity={0.06} />
                  <Area type="monotone" dataKey="lower" name="Lower Bound" stroke="none" fill="white" fillOpacity={1} />
                  <Line type="monotone" dataKey="actual" name="Actual" stroke={ORANGE} strokeWidth={2} dot={{ r: 2 }} />
                  <Line type="monotone" dataKey="forecast" name="Forecast" stroke={PURPLE} strokeWidth={2} strokeDasharray="5 5" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Cost Trends & Alerts */}
          <div className="dash-card">
            <div className="dash-card-header">
              <h3>📉 Cost Trends</h3>
              <span className="dash-card-sub">6-month rolling</span>
            </div>
            <div className="dash-card-body" style={{ height: 160 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={costTrends} margin={{ left: 10, right: 10, top: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#94A3B8' }} tickFormatter={(v) => `$${v}`} domain={[3.5, 4.5]} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#94A3B8' }} domain={[95, 115]} />
                  <Tooltip content={<ChartTooltip />} />
                  <Line yAxisId="left" type="monotone" dataKey="diesel" name="Diesel ($/gal)" stroke={RED} strokeWidth={2} dot={{ r: 3 }} />
                  <Line yAxisId="right" type="monotone" dataKey="aggregate" name="Aggregate Index" stroke={BLUE} strokeWidth={2} dot={{ r: 3 }} />
                  <Line yAxisId="right" type="monotone" dataKey="transport" name="Transport Index" stroke={ORANGE_LIGHT} strokeWidth={2} dot={{ r: 3 }} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Supply Alerts */}
            <div style={{ marginTop: 16, borderTop: '1px solid #f0f0f0', paddingTop: 16 }}>
              <div className="dash-card-header" style={{ padding: 0, marginBottom: 10 }}>
                <h3>⚠️ Supply Alerts</h3>
              </div>
              <div className="dash-alerts">
                {supplyAlerts.map((alert, i) => (
                  <div key={i} className={`dash-alert dash-alert-${alert.type}`}>
                    <span className="dash-alert-icon">
                      {alert.type === 'critical' ? '🔴' : alert.type === 'warning' ? '🟡' : 'ℹ️'}
                    </span>
                    <div className="dash-alert-content">
                      <strong>{alert.title}</strong>
                      <span>{alert.message}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
