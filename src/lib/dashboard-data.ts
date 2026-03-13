/**
 * Mock Dashboard Data for Bermont Materials
 * Based on ~$20M annual revenue, 14 materials, 2 sites (Clarion & Alico)
 */

// ── Material Inventory ──────────────────────────────────────────────
export interface InventoryItem {
  material: string;
  category: string;
  clarionStock: number;   // tons
  alicoStock: number;     // tons
  maxCapacity: number;    // tons per site
  weeklyUsage: number;    // tons/week avg
  pricePerTon: number;
  costPerTon: number;
}

export const inventoryData: InventoryItem[] = [
  { material: 'Fill Dirt (Alico)',       category: 'Fill',    clarionStock: 0,    alicoStock: 4200,  maxCapacity: 8000,  weeklyUsage: 820,  pricePerTon: 4.00,  costPerTon: 1.20 },
  { material: 'Fill Dirt (Clarion)',     category: 'Fill',    clarionStock: 5100, alicoStock: 0,     maxCapacity: 8000,  weeklyUsage: 950,  pricePerTon: 5.00,  costPerTon: 1.50 },
  { material: 'Commercial Base',        category: 'Base',    clarionStock: 3200, alicoStock: 2800,  maxCapacity: 5000,  weeklyUsage: 680,  pricePerTon: 7.50,  costPerTon: 3.80 },
  { material: 'FDOT B02 Road Base',     category: 'Base',    clarionStock: 1800, alicoStock: 2100,  maxCapacity: 4000,  weeklyUsage: 520,  pricePerTon: 9.00,  costPerTon: 4.50 },
  { material: 'Small Washed Shell',     category: 'Shell',   clarionStock: 1400, alicoStock: 1100,  maxCapacity: 3000,  weeklyUsage: 310,  pricePerTon: 15.00, costPerTon: 8.50 },
  { material: 'Medium Washed Shell',    category: 'Shell',   clarionStock: 900,  alicoStock: 750,   maxCapacity: 3000,  weeklyUsage: 240,  pricePerTon: 16.00, costPerTon: 9.00 },
  { material: 'Rip Rap 3-6"',           category: 'Rip Rap', clarionStock: 620,  alicoStock: 480,   maxCapacity: 2000,  weeklyUsage: 145,  pricePerTon: 30.50, costPerTon: 18.00 },
  { material: 'Rip Rap 6-12"',          category: 'Rip Rap', clarionStock: 350,  alicoStock: 280,   maxCapacity: 2000,  weeklyUsage: 110,  pricePerTon: 32.50, costPerTon: 19.50 },
  { material: 'Unwashed Commercial 57', category: 'Stone',   clarionStock: 2400, alicoStock: 1900,  maxCapacity: 4000,  weeklyUsage: 410,  pricePerTon: 20.00, costPerTon: 11.00 },
  { material: 'Unwashed Commercial 89', category: 'Stone',   clarionStock: 1600, alicoStock: 1300,  maxCapacity: 3500,  weeklyUsage: 350,  pricePerTon: 18.00, costPerTon: 10.00 },
  { material: 'Perc/Septic/Asphalt Sand', category: 'Sand', clarionStock: 2100, alicoStock: 1700,  maxCapacity: 4000,  weeklyUsage: 380,  pricePerTon: 8.00,  costPerTon: 3.20 },
  { material: 'FDOT Rip Rap 50-150lb',  category: 'Rip Rap', clarionStock: 180,  alicoStock: 220,   maxCapacity: 1500,  weeklyUsage: 65,   pricePerTon: 45.00, costPerTon: 28.00 },
  { material: 'Screenings',             category: 'Base',    clarionStock: 3800, alicoStock: 2900,  maxCapacity: 5000,  weeklyUsage: 590,  pricePerTon: 6.00,  costPerTon: 2.50 },
  { material: 'Limerock',               category: 'Base',    clarionStock: 2600, alicoStock: 2200,  maxCapacity: 4500,  weeklyUsage: 470,  pricePerTon: 10.00, costPerTon: 5.00 },
];

// ── Revenue Data (30 days) ──────────────────────────────────────────
export interface DailyRevenue {
  date: string;
  revenue: number;
  cost: number;
  orders: number;
}

function generateRevenueData(): DailyRevenue[] {
  const data: DailyRevenue[] = [];
  const now = new Date();
  // ~$55K/day avg, with weekday/weekend variation
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dayOfWeek = d.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const baseRevenue = isWeekend ? 12000 : 62000;
    const variance = (Math.random() - 0.5) * baseRevenue * 0.4;
    const revenue = Math.round(baseRevenue + variance);
    const marginPct = 0.38 + (Math.random() - 0.5) * 0.08;
    data.push({
      date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      revenue,
      cost: Math.round(revenue * (1 - marginPct)),
      orders: isWeekend ? Math.floor(Math.random() * 5) + 2 : Math.floor(Math.random() * 18) + 12,
    });
  }
  return data;
}

export const revenueData = generateRevenueData();

// ── Weekly Revenue (12 weeks) ──────────────────────────────────────
export interface WeeklyRevenue {
  week: string;
  revenue: number;
  cost: number;
}

export const weeklyRevenueData: WeeklyRevenue[] = (() => {
  const data: WeeklyRevenue[] = [];
  for (let i = 11; i >= 0; i--) {
    const baseWeekly = 385000;
    const seasonal = Math.sin((12 - i) / 12 * Math.PI) * 60000; // seasonal curve
    const variance = (Math.random() - 0.5) * 80000;
    const revenue = Math.round(baseWeekly + seasonal + variance);
    data.push({
      week: `W${12 - i}`,
      revenue,
      cost: Math.round(revenue * 0.62),
    });
  }
  return data;
})();

// ── Monthly Revenue (6 months) ──────────────────────────────────────
export interface MonthlyRevenue {
  month: string;
  revenue: number;
  cost: number;
  prevYear: number;
}

export const monthlyRevenueData: MonthlyRevenue[] = [
  { month: 'Oct',  revenue: 1580000, cost: 980000,  prevYear: 1420000 },
  { month: 'Nov',  revenue: 1720000, cost: 1060000, prevYear: 1550000 },
  { month: 'Dec',  revenue: 1340000, cost: 840000,  prevYear: 1280000 },
  { month: 'Jan',  revenue: 1890000, cost: 1170000, prevYear: 1680000 },
  { month: 'Feb',  revenue: 1960000, cost: 1200000, prevYear: 1740000 },
  { month: 'Mar',  revenue: 1650000, cost: 1020000, prevYear: 1510000 },
];

// ── Order Pipeline ──────────────────────────────────────────────────
export interface OrderStatus {
  status: string;
  count: number;
  value: number;
  color: string;
}

export const orderPipeline: OrderStatus[] = [
  { status: 'Pending',     count: 14, value: 42800,  color: '#3B82F6' },
  { status: 'In Progress', count: 8,  value: 67200,  color: '#F59E0B' },
  { status: 'Dispatched',  count: 5,  value: 38500,  color: '#8B5CF6' },
  { status: 'Completed',   count: 127, value: 892000, color: '#10B981' },
];

// ── Margin by Product ───────────────────────────────────────────────
export interface ProductMargin {
  material: string;
  margin: number;
  revenue: number;
}

export const productMargins: ProductMargin[] = inventoryData
  .map(item => ({
    material: item.material.replace(' (Alico)', '').replace(' (Clarion)', ''),
    margin: Math.round(((item.pricePerTon - item.costPerTon) / item.pricePerTon) * 100),
    revenue: Math.round(item.weeklyUsage * item.pricePerTon * 4.3), // monthly
  }))
  .filter((v, i, a) => a.findIndex(t => t.material === v.material) === i)
  .sort((a, b) => b.margin - a.margin);

// ── Top Customers ───────────────────────────────────────────────────
export interface TopCustomer {
  name: string;
  company: string;
  segment: 'Contractor' | 'Residential' | 'Commercial';
  revenue: number;
  orders: number;
  lastOrder: string;
}

export const topCustomers: TopCustomer[] = [
  { name: 'Mike Torres',     company: 'Torres Construction',     segment: 'Contractor',   revenue: 284000, orders: 47, lastOrder: '2 days ago' },
  { name: 'Sarah Chen',      company: 'Gulf Coast Paving',       segment: 'Contractor',   revenue: 231000, orders: 38, lastOrder: '1 day ago' },
  { name: 'Robert Williams', company: 'SW FL Landscaping',       segment: 'Commercial',   revenue: 198000, orders: 62, lastOrder: 'Today' },
  { name: 'David Martinez',  company: 'Martinez Grading',        segment: 'Contractor',   revenue: 176000, orders: 31, lastOrder: '3 days ago' },
  { name: 'Linda Patel',     company: 'Patel Development Group', segment: 'Commercial',   revenue: 152000, orders: 24, lastOrder: '1 week ago' },
  { name: 'James Anderson',  company: 'Anderson Homes',          segment: 'Residential',  revenue: 89000,  orders: 18, lastOrder: '4 days ago' },
  { name: 'Maria Gonzalez',  company: 'Coastal Builders Inc',    segment: 'Contractor',   revenue: 78000,  orders: 15, lastOrder: '2 days ago' },
];

// ── Segment Revenue ─────────────────────────────────────────────────
export interface SegmentData {
  segment: string;
  revenue: number;
  percentage: number;
  color: string;
}

export const segmentData: SegmentData[] = [
  { segment: 'Contractor',  revenue: 12400000, percentage: 62, color: '#F57C20' },
  { segment: 'Commercial',  revenue: 5200000,  percentage: 26, color: '#3B82F6' },
  { segment: 'Residential', revenue: 2400000,  percentage: 12, color: '#10B981' },
];

// ── Demand Forecast (next 30 days) ──────────────────────────────────
export interface ForecastPoint {
  date: string;
  actual?: number;
  forecast: number;
  lower: number;
  upper: number;
}

export const forecastData: ForecastPoint[] = (() => {
  const data: ForecastPoint[] = [];
  const now = new Date();
  // 15 days of historical "actual"
  for (let i = 14; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const base = 58000;
    const actual = Math.round(base + (Math.random() - 0.5) * 25000);
    data.push({
      date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      actual,
      forecast: actual,
      lower: actual,
      upper: actual,
    });
  }
  // 15 days of forecast
  for (let i = 1; i <= 15; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    const trend = 58000 + (i * 800); // slight uptrend
    const uncertainty = i * 2500;
    data.push({
      date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      forecast: Math.round(trend + (Math.random() - 0.5) * 8000),
      lower: Math.round(trend - uncertainty),
      upper: Math.round(trend + uncertainty),
    });
  }
  return data;
})();

// ── Cost Trend (6 months) ───────────────────────────────────────────
export interface CostTrend {
  month: string;
  diesel: number;       // $/gallon
  aggregate: number;    // index (100 = baseline)
  transport: number;    // index
}

export const costTrends: CostTrend[] = [
  { month: 'Oct', diesel: 3.82, aggregate: 100, transport: 100 },
  { month: 'Nov', diesel: 3.75, aggregate: 101, transport: 102 },
  { month: 'Dec', diesel: 3.68, aggregate: 103, transport: 101 },
  { month: 'Jan', diesel: 3.91, aggregate: 105, transport: 104 },
  { month: 'Feb', diesel: 4.02, aggregate: 107, transport: 106 },
  { month: 'Mar', diesel: 4.15, aggregate: 108, transport: 108 },
];

// ── Supply Alerts ───────────────────────────────────────────────────
export interface SupplyAlert {
  type: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  material?: string;
  site?: string;
}

export const supplyAlerts: SupplyAlert[] = [
  { type: 'critical', title: 'Low Stock', message: 'FDOT Rip Rap 50-150lb at Clarion is at 12% capacity. Reorder recommended.', material: 'FDOT Rip Rap 50-150lb', site: 'Clarion' },
  { type: 'warning',  title: 'Diesel Cost Rising', message: 'Diesel prices up 8.6% over 3 months. Delivery margins may be impacted.', },
  { type: 'warning',  title: 'Stock Depleting Fast', message: 'Rip Rap 6-12" weekly usage exceeds restock rate. ~3.2 weeks of supply remaining.', material: 'Rip Rap 6-12"', site: 'Both' },
  { type: 'info',     title: 'Seasonal Demand Shift', message: 'Dry season construction boom expected. Fill Dirt and Base demand projected +22% in April.', },
];

// ── KPI Summary ─────────────────────────────────────────────────────
export const kpiData = {
  todayRevenue: revenueData[revenueData.length - 1]?.revenue || 57400,
  yesterdayRevenue: revenueData[revenueData.length - 2]?.revenue || 52100,
  weekRevenue: revenueData.slice(-7).reduce((s, d) => s + d.revenue, 0),
  prevWeekRevenue: revenueData.slice(-14, -7).reduce((s, d) => s + d.revenue, 0),
  monthRevenue: revenueData.reduce((s, d) => s + d.revenue, 0),
  activeOrders: orderPipeline.filter(o => o.status !== 'Completed').reduce((s, o) => s + o.count, 0),
  totalInventoryTons: inventoryData.reduce((s, i) => s + i.clarionStock + i.alicoStock, 0),
  avgMargin: Math.round(productMargins.reduce((s, p) => s + p.margin, 0) / productMargins.length),
};
