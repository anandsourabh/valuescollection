// Shared in-memory state — one store per prototype instance (per artboard).
// Not global so each artboard can show different scenarios.
// ------------------------------------------------------------------

const PORTFOLIOS = [
  { id: 'pf-na', name: 'North America portfolio', count: 142 },
  { id: 'pf-emea', name: 'EMEA retail sites', count: 87 },
  { id: 'pf-apac', name: 'APAC manufacturing', count: 34 },
  { id: 'pf-logistics', name: 'Global logistics hubs', count: 56 },
];

const TEAM = [
  { id: 'u1', name: 'Marcus Hale',   email: 'marcus.h@hartwell.com',    role: 'Risk analyst',   team: 'internal' },
  { id: 'u2', name: 'Priya Shah',    email: 'priya.s@hartwell.com',     role: 'Senior reviewer', team: 'internal' },
  { id: 'u3', name: 'Jing Chen',     email: 'jing.c@hartwell.com',      role: 'Regional lead',  team: 'internal' },
  { id: 'u4', name: 'Alex Morgan',   email: 'alex.m@hartwell.com',      role: 'Campaign owner', team: 'internal' },
  { id: 'u5', name: 'Sam Okafor',    email: 'sam@veritas-brokers.com',  role: 'Broker',         team: 'external' },
  { id: 'u6', name: 'Linda Rossi',   email: 'l.rossi@acme-fm.it',       role: 'Facilities mgr', team: 'external' },
  { id: 'u7', name: 'Ben Torres',    email: 'ben.t@northridge-co.com',  role: 'Site manager',   team: 'external' },
];

// Campaigns + assignment rows
const INITIAL_CAMPAIGNS = [
  {
    id: 'c-2026-na',
    name: 'NA Renewal 2026',
    owner: 'Alex Morgan',
    portfolios: ['pf-na'],
    properties: 142,
    assignments: 142,
    status: 'active',
    dueDate: '2026-05-30',
    slaDays: 21,
    progress: { not_started: 18, in_progress: 47, submitted: 22, under_review: 14, approved: 36, rejected: 5 },
    createdAt: '2026-04-02',
    slaBreaches: 3,
  },
  {
    id: 'c-2026-emea',
    name: 'EMEA Q2 Values Refresh',
    owner: 'Jing Chen',
    portfolios: ['pf-emea'],
    properties: 87,
    assignments: 87,
    status: 'active',
    dueDate: '2026-06-14',
    slaDays: 28,
    progress: { not_started: 32, in_progress: 18, submitted: 8, under_review: 4, approved: 21, rejected: 4 },
    createdAt: '2026-04-10',
    slaBreaches: 0,
  },
  {
    id: 'c-2026-apac',
    name: 'APAC Manufacturing COPE',
    owner: 'Alex Morgan',
    portfolios: ['pf-apac'],
    properties: 34,
    assignments: 34,
    status: 'draft',
    dueDate: '2026-07-01',
    slaDays: 14,
    progress: { not_started: 34, in_progress: 0, submitted: 0, under_review: 0, approved: 0, rejected: 0 },
    createdAt: '2026-04-18',
    slaBreaches: 0,
  },
  {
    id: 'c-2025-global',
    name: 'Global Logistics 2025',
    owner: 'Marcus Hale',
    portfolios: ['pf-logistics'],
    properties: 56,
    assignments: 56,
    status: 'completed',
    dueDate: '2026-01-15',
    slaDays: 21,
    progress: { not_started: 0, in_progress: 0, submitted: 0, under_review: 0, approved: 56, rejected: 0 },
    createdAt: '2025-12-01',
    slaBreaches: 2,
  },
];

// Assignments for the primary campaign
const PROPERTY_SEED = [
  { id: 'p-001', address: '1200 Commerce Way',      city: 'Atlanta',     state: 'GA', country: 'US', type: 'Warehouse',   tiv: 18400000 },
  { id: 'p-002', address: '450 Industrial Pkwy',    city: 'Columbus',    state: 'OH', country: 'US', type: 'Manufacturing', tiv: 42100000 },
  { id: 'p-003', address: '77 Harbor Blvd',         city: 'Long Beach',  state: 'CA', country: 'US', type: 'Cold storage', tiv: 29800000 },
  { id: 'p-004', address: '3301 Midland Dr',        city: 'Dallas',      state: 'TX', country: 'US', type: 'Office tower', tiv: 88500000 },
  { id: 'p-005', address: '50 Riverside Industrial',city: 'Pittsburgh',  state: 'PA', country: 'US', type: 'Warehouse',   tiv: 14200000 },
  { id: 'p-006', address: '219 Peachtree',          city: 'Atlanta',     state: 'GA', country: 'US', type: 'Retail',       tiv: 7800000  },
  { id: 'p-007', address: '1100 Seaport Ave',       city: 'Seattle',     state: 'WA', country: 'US', type: 'Warehouse',   tiv: 21600000 },
  { id: 'p-008', address: '505 Eagle Pass Rd',      city: 'El Paso',     state: 'TX', country: 'US', type: 'Cold storage', tiv: 19300000 },
  { id: 'p-009', address: '902 Meridian St',        city: 'Boise',       state: 'ID', country: 'US', type: 'Manufacturing', tiv: 34500000 },
  { id: 'p-010', address: '1777 Glacier Way',       city: 'Anchorage',   state: 'AK', country: 'US', type: 'Office',       tiv: 9900000  },
  { id: 'p-011', address: '230 Alberta Commons',    city: 'Portland',    state: 'OR', country: 'US', type: 'Retail',       tiv: 5600000  },
  { id: 'p-012', address: '12 Lakeshore East',      city: 'Chicago',     state: 'IL', country: 'US', type: 'Office tower', tiv: 112400000 },
];

const ASSIGNMENT_SEED = PROPERTY_SEED.map((p, i) => {
  const statuses = ['approved', 'in_progress', 'submitted', 'under_review', 'not_started', 'approved', 'rejected', 'in_progress', 'submitted', 'not_started', 'under_review', 'approved'];
  const assignees = ['Marcus Hale', 'Linda Rossi', 'Sam Okafor', 'Ben Torres', 'Jing Chen', 'Marcus Hale'];
  const dueOffsets = [-2, 5, 3, 12, 18, -7, 2, 9, 4, 21, 1, -5];
  return {
    id: 'a-' + (100 + i),
    campaignId: 'c-2026-na',
    property: p,
    status: statuses[i % statuses.length],
    assignee: assignees[i % assignees.length],
    assigneeType: i % 3 === 1 ? 'external' : 'internal',
    dueDate: `2026-05-${String(15 + dueOffsets[i % dueOffsets.length]).padStart(2, '0')}`,
    daysRemaining: dueOffsets[i % dueOffsets.length],
    lastActivity: `Apr ${14 + (i % 6)}`,
    reminderCount: i % 3,
    submittedTiv: ['submitted', 'under_review', 'approved', 'rejected'].includes(statuses[i % statuses.length]) ? p.tiv + (i * 13000) : null,
  };
});

// Compose store factory so each instance can mutate independently
function createStore(overrides = {}) {
  return {
    campaigns: overrides.campaigns || INITIAL_CAMPAIGNS,
    assignments: overrides.assignments || ASSIGNMENT_SEED,
    portfolios: PORTFOLIOS,
    team: TEAM,
  };
}

const StoreCtx = React.createContext(null);
const StoreProvider = ({ children, initial }) => {
  const [state, setState] = React.useState(() => createStore(initial));
  const api = React.useMemo(() => ({
    ...state,
    updateAssignment: (id, patch) => setState(s => ({
      ...s,
      assignments: s.assignments.map(a => a.id === id ? { ...a, ...patch } : a),
    })),
    bulkUpdateAssignments: (ids, patch) => setState(s => ({
      ...s,
      assignments: s.assignments.map(a => ids.includes(a.id) ? { ...a, ...patch } : a),
    })),
    updateCampaign: (id, patch) => setState(s => ({
      ...s,
      campaigns: s.campaigns.map(c => c.id === id ? { ...c, ...patch } : c),
    })),
    addCampaign: (c) => setState(s => ({ ...s, campaigns: [c, ...s.campaigns] })),
  }), [state]);
  return <StoreCtx.Provider value={api}>{children}</StoreCtx.Provider>;
};
const useStore = () => React.useContext(StoreCtx);

const formatCurrency = (n) => {
  if (n == null) return '—';
  if (n >= 1e9) return '$' + (n / 1e9).toFixed(2) + 'B';
  if (n >= 1e6) return '$' + (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return '$' + (n / 1e3).toFixed(0) + 'K';
  return '$' + n.toLocaleString();
};
const formatCurrencyFull = (n) => '$' + (n || 0).toLocaleString();

const totalsFor = (campaign) => {
  const p = campaign.progress;
  const total = Object.values(p).reduce((a, b) => a + b, 0);
  const done = p.approved + p.rejected;
  const inflight = p.in_progress + p.submitted + p.under_review;
  return { total, done, inflight, percent: Math.round((p.approved / total) * 100) };
};

Object.assign(window, {
  StoreProvider, useStore, createStore,
  PORTFOLIOS, TEAM, PROPERTY_SEED, INITIAL_CAMPAIGNS, ASSIGNMENT_SEED,
  formatCurrency, formatCurrencyFull, totalsFor,
});
