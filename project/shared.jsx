// Shared components + icon set + toast + state store
// ------------------------------------------------------------------

// Icons — minimal outlined set
const Icon = ({ name, size = 16, color = 'currentColor', style }) => {
  const s = size;
  const c = color;
  const common = { width: s, height: s, viewBox: '0 0 24 24', fill: 'none', stroke: c, strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', style };
  const paths = {
    dashboard: <><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></>,
    campaigns: <><path d="M4 5v14"/><path d="M4 5l8 3 8-3v10l-8 3-8-3"/></>,
    assignments: <><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 9h6M9 13h6M9 17h4"/></>,
    forms: <><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 9h8M8 13h8M8 17h5"/></>,
    reviews: <><path d="M20 6L9 17l-5-5"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.34 1.87l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.7 1.7 0 00-1.87-.34 1.7 1.7 0 00-1.03 1.56V21a2 2 0 01-4 0v-.1A1.7 1.7 0 008 19.4a1.7 1.7 0 00-1.87.34l-.06.06a2 2 0 11-2.83-2.83l.06-.06A1.7 1.7 0 003.64 15a1.7 1.7 0 00-1.56-1.03H2a2 2 0 010-4h.1A1.7 1.7 0 003.66 8a1.7 1.7 0 00-.34-1.87l-.06-.06a2 2 0 112.83-2.83l.06.06A1.7 1.7 0 008 3.64a1.7 1.7 0 001.03-1.56V2a2 2 0 014 0v.1a1.7 1.7 0 001.03 1.56 1.7 1.7 0 001.87-.34l.06-.06a2 2 0 112.83 2.83l-.06.06a1.7 1.7 0 00-.34 1.87V8a1.7 1.7 0 001.56 1.03H22a2 2 0 010 4h-.1a1.7 1.7 0 00-1.56 1.03z"/></>,
    bell: <><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></>,
    search: <><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></>,
    plus: <><path d="M12 5v14M5 12h14"/></>,
    x: <><path d="M18 6L6 18M6 6l12 12"/></>,
    check: <><path d="M20 6L9 17l-5-5"/></>,
    chevronRight: <><path d="M9 6l6 6-6 6"/></>,
    chevronLeft: <><path d="M15 6l-6 6 6 6"/></>,
    chevronDown: <><path d="M6 9l6 6 6-6"/></>,
    chevronUp: <><path d="M18 15l-6-6-6 6"/></>,
    arrowRight: <><path d="M5 12h14M13 5l7 7-7 7"/></>,
    download: <><path d="M12 3v12M6 9l6 6 6-6M4 21h16"/></>,
    upload: <><path d="M12 21V9M18 15l-6-6-6 6M4 3h16"/></>,
    filter: <><path d="M3 5h18M7 12h10M10 19h4"/></>,
    sort: <><path d="M7 4v16M3 8l4-4 4 4M17 20V4M13 16l4 4 4-4"/></>,
    more: <><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></>,
    edit: <><path d="M17 3a2.828 2.828 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></>,
    trash: <><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></>,
    copy: <><rect x="8" y="8" width="13" height="13" rx="2"/><path d="M4 16V5a2 2 0 012-2h11"/></>,
    link: <><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></>,
    calendar: <><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></>,
    building: <><rect x="4" y="2" width="16" height="20" rx="1"/><path d="M9 22v-4h6v4M8 6h.01M12 6h.01M16 6h.01M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01"/></>,
    mapPin: <><path d="M20 10c0 7-8 12-8 12s-8-5-8-12a8 8 0 0116 0z"/><circle cx="12" cy="10" r="3"/></>,
    user: <><circle cx="12" cy="8" r="4"/><path d="M4 21v-1a7 7 0 0114 0v1"/></>,
    users: <><circle cx="9" cy="8" r="4"/><path d="M3 21v-1a6 6 0 0112 0v1"/><path d="M16 3.13a4 4 0 010 7.75M21 21v-1a6 6 0 00-4-5.65"/></>,
    mail: <><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 7l10 6 10-6"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    alert: <><path d="M12 2L1 21h22L12 2z"/><path d="M12 9v4M12 17h.01"/></>,
    info: <><circle cx="12" cy="12" r="9"/><path d="M12 8h.01M11 12h1v4h1"/></>,
    paperclip: <><path d="M21 10l-9.5 9.5a5 5 0 01-7-7L13 3.5a3.5 3.5 0 015 5L9 17.5a2 2 0 01-3-3L13.5 7"/></>,
    camera: <><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></>,
    file: <><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/></>,
    image: <><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></>,
    eye: <><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></>,
    menu: <><path d="M3 6h18M3 12h18M3 18h18"/></>,
    logo: <><rect x="3" y="3" width="7" height="18" rx="1.5" fill={c} stroke="none"/><rect x="13" y="3" width="8" height="8" rx="1.5" stroke={c}/><rect x="13" y="14" width="8" height="7" rx="1.5" fill={c} stroke="none"/></>,
    grip: <><circle cx="9" cy="6" r="1.3"/><circle cx="15" cy="6" r="1.3"/><circle cx="9" cy="12" r="1.3"/><circle cx="15" cy="12" r="1.3"/><circle cx="9" cy="18" r="1.3"/><circle cx="15" cy="18" r="1.3"/></>,
    bolt: <><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></>,
    shield: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></>,
    globe: <><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18"/></>,
    save: <><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><path d="M17 21v-8H7v8M7 3v5h8"/></>,
    send: <><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></>,
    play: <><path d="M5 3l14 9-14 9V3z"/></>,
    archive: <><rect x="2" y="3" width="20" height="5" rx="1"/><path d="M4 8v11a2 2 0 002 2h12a2 2 0 002-2V8M10 12h4"/></>,
    flag: <><path d="M4 22V4a1 1 0 011-1h13l-3 5 3 5H5"/></>,
    refresh: <><path d="M3 12a9 9 0 0115-6.7L21 8M21 3v5h-5M21 12a9 9 0 01-15 6.7L3 16M3 21v-5h5"/></>,
    lock: <><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></>,
    external: <><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"/></>,
    device: <><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M11 18h2"/></>,
    trendUp: <><path d="M23 6l-9.5 9.5-5-5L1 18"/><path d="M17 6h6v6"/></>,
    dollar: <><path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></>,
    drag: <><path d="M8 6h.01M16 6h.01M8 12h.01M16 12h.01M8 18h.01M16 18h.01"/></>,
  };
  return <svg {...common}>{paths[name]}</svg>;
};

// Checkbox
const Checkbox = ({ checked, indeterminate, onChange, label, size = 16 }) => (
  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none' }}>
    <span className={'cb ' + (checked ? 'checked' : indeterminate ? 'indet' : '')} style={{ width: size, height: size }}
      onClick={(e) => { e.preventDefault(); onChange && onChange(!checked); }}>
      {checked && <Icon name="check" size={size - 4} />}
      {indeterminate && !checked && <div style={{ width: 8, height: 2, background: '#fff', borderRadius: 1 }} />}
    </span>
    {label && <span style={{ fontSize: 13, color: 'var(--ink-2)' }}>{label}</span>}
  </label>
);

// Status dot + label
const STATUS_META = {
  not_started:  { label: 'Not started',  cls: 'badge-gray',   color: '#7B8192' },
  in_progress:  { label: 'In progress',  cls: 'badge-blue',   color: '#2E4BFF' },
  submitted:    { label: 'Submitted',    cls: 'badge-purple', color: '#7B3FE4' },
  under_review: { label: 'Under review', cls: 'badge-amber',  color: '#B45309' },
  approved:     { label: 'Approved',     cls: 'badge-green',  color: '#1B8454' },
  rejected:     { label: 'Rejected',     cls: 'badge-red',    color: '#B42318' },
  expired:      { label: 'Expired',      cls: 'badge-gray',   color: '#4A5160' },
  overdue:      { label: 'Overdue',      cls: 'badge-red',    color: '#B42318' },
};

const StatusBadge = ({ status }) => {
  const m = STATUS_META[status] || { label: status, cls: 'badge-gray', color: '#7B8192' };
  return (
    <span className={'badge ' + m.cls}>
      <span className="badge-dot" style={{ background: m.color }} />
      {m.label}
    </span>
  );
};

// Avatar
const Avatar = ({ name, size = 24, color }) => {
  const initials = (name || '?').split(' ').map(x => x[0]).slice(0, 2).join('').toUpperCase();
  const palette = ['#2E4BFF', '#1B8454', '#B45309', '#7B3FE4', '#0E7490', '#B91C1C'];
  const c = color || palette[(name || '').charCodeAt(0) % palette.length];
  return (
    <span style={{
      width: size, height: size, borderRadius: size / 2,
      background: c, color: '#fff', fontSize: size * 0.42, fontWeight: 600,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>{initials}</span>
  );
};

// Progress bar + completion meter
const ProgressBar = ({ value, color }) => (
  <div className="progress">
    <div className={'progress-fill ' + (color || '')} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
  </div>
);

// Segmented tabs
const Tabs = ({ tabs, active, onChange }) => (
  <div style={{ display: 'flex', gap: 2, borderBottom: '1px solid var(--divider)' }}>
    {tabs.map(t => (
      <button key={t.id} onClick={() => onChange(t.id)}
        style={{
          border: 'none', background: 'transparent',
          padding: '10px 14px', fontSize: 13, fontWeight: 500,
          color: active === t.id ? 'var(--ink-1)' : 'var(--ink-4)',
          borderBottom: '2px solid ' + (active === t.id ? 'var(--ink-1)' : 'transparent'),
          marginBottom: -1, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 6,
          fontFamily: 'inherit',
        }}>
        {t.label}
        {t.count != null && <span className="badge badge-gray" style={{ height: 18, fontSize: 10, padding: '0 6px' }}>{t.count}</span>}
      </button>
    ))}
  </div>
);

// Toast
const ToastCtx = React.createContext({ push: () => {} });
const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = React.useState([]);
  const push = React.useCallback((msg, kind = 'default') => {
    const id = Math.random().toString(36).slice(2);
    setToasts(t => [...t, { id, msg, kind }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3200);
  }, []);
  return (
    <ToastCtx.Provider value={{ push }}>
      {children}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={'toast ' + t.kind}>
            {t.kind === 'success' && <Icon name="check" size={15} />}
            {t.kind === 'error' && <Icon name="alert" size={15} />}
            <span>{t.msg}</span>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
};
const useToast = () => React.useContext(ToastCtx);

// Logo + brand wordmark
const BrandMark = ({ size = 22 }) => (
  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
    <div style={{
      width: size, height: size, borderRadius: 5,
      background: 'linear-gradient(135deg, #0E1116 0%, #2E4BFF 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontWeight: 700, fontSize: size * 0.55, letterSpacing: -0.5,
      fontFamily: 'var(--font-sans)',
    }}>i</div>
    <span style={{ fontSize: 14, fontWeight: 600, letterSpacing: -0.2, color: 'var(--ink-1)' }}>
      Blue<span style={{ color: 'var(--accent)' }}>[i]</span> Property
    </span>
  </div>
);

// Sidebar
const Sidebar = ({ active, onNav, role = 'admin' }) => {
  const items = role === 'reviewer'
    ? [
        { id: 'review', label: 'Review queue', icon: 'reviews' },
        { id: 'dashboard', label: 'Campaigns', icon: 'campaigns' },
        { id: 'settings', label: 'Settings', icon: 'settings' },
      ]
    : [
        { id: 'dashboard', label: 'Overview', icon: 'dashboard' },
        { id: 'campaigns', label: 'Campaigns', icon: 'campaigns' },
        { id: 'assignments', label: 'Assignments', icon: 'assignments' },
        { id: 'forms', label: 'Form builder', icon: 'forms' },
        { id: 'review', label: 'Reviews', icon: 'reviews' },
        { id: 'settings', label: 'Settings', icon: 'settings' },
      ];
  return (
    <nav className="side-nav">
      <div style={{ padding: '18px 20px 14px' }}>
        <BrandMark />
      </div>
      <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-4)', padding: '12px 20px 6px', fontWeight: 600 }}>
        Values Collection
      </div>
      <div style={{ flex: 1 }}>
        {items.map(it => (
          <div key={it.id} className={'nav-item ' + (active === it.id ? 'active' : '')} onClick={() => onNav(it.id)}>
            <Icon name={it.icon} size={15} />
            <span>{it.label}</span>
          </div>
        ))}
      </div>
      <div style={{ padding: 14, borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <Avatar name={role === 'reviewer' ? 'Priya Shah' : 'Alex Morgan'} size={30} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {role === 'reviewer' ? 'Priya Shah' : 'Alex Morgan'}
          </div>
          <div style={{ fontSize: 11, color: 'var(--ink-4)' }}>
            {role === 'reviewer' ? 'Senior reviewer' : 'Campaign owner'}
          </div>
        </div>
        <Icon name="settings" size={14} color="var(--ink-4)" />
      </div>
    </nav>
  );
};

// Topbar
const Topbar = ({ title, subtitle, actions, breadcrumb }) => (
  <div className="topbar">
    <div>
      {breadcrumb && (
        <div style={{ fontSize: 12, color: 'var(--ink-4)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
          {breadcrumb.map((b, i) => (
            <React.Fragment key={i}>
              {i > 0 && <Icon name="chevronRight" size={11} color="var(--ink-5)" />}
              <span style={{ color: i === breadcrumb.length - 1 ? 'var(--ink-2)' : 'var(--ink-4)' }}>{b}</span>
            </React.Fragment>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--ink-1)', letterSpacing: '-0.015em' }}>{title}</div>
        {subtitle && <div style={{ fontSize: 13, color: 'var(--ink-4)' }}>{subtitle}</div>}
      </div>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {actions}
    </div>
  </div>
);

// Empty card frame used for new modules
const PagePad = ({ children, style }) => (
  <div style={{ padding: '24px 28px', overflow: 'auto', height: '100%', ...style }}>
    {children}
  </div>
);

// Expose
Object.assign(window, {
  Icon, Checkbox, StatusBadge, Avatar, ProgressBar, Tabs,
  ToastProvider, useToast, BrandMark, Sidebar, Topbar, PagePad,
  STATUS_META,
});
