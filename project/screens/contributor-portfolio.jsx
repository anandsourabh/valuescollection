// Signed-link portfolio screen (bundled model)
// When a contributor has multiple locations on one signed link,
// they land on this dashboard — a list of their assigned locations
// with per-location status and independent submit.
// ------------------------------------------------------------------

// Portfolio seed for external contributor (Sam Okafor — broker for Hartwell)
const CONTRIBUTOR_PORTFOLIO = [
  { id: 'l-01', addr: '450 Industrial Pkwy', city: 'Columbus, OH', type: 'Manufacturing', tiv: 42100000, status: 'submitted', progress: 100, due: 'May 14', changes: 'material' },
  { id: 'l-02', addr: '77 Harbor Blvd',      city: 'Long Beach, CA', type: 'Cold storage', tiv: 29800000, status: 'in_progress', progress: 65, due: 'May 14', changes: null },
  { id: 'l-03', addr: '1200 Commerce Way',   city: 'Atlanta, GA', type: 'Warehouse', tiv: 18400000, status: 'approved', progress: 100, due: 'May 14', changes: 'none' },
  { id: 'l-04', addr: '505 Eagle Pass Rd',   city: 'El Paso, TX', type: 'Cold storage', tiv: 19300000, status: 'not_started', progress: 0, due: 'May 14', changes: null },
  { id: 'l-05', addr: '1100 Seaport Ave',    city: 'Seattle, WA', type: 'Warehouse', tiv: 21600000, status: 'rejected', progress: 100, due: 'May 14', changes: 'comments' },
  { id: 'l-06', addr: '902 Meridian St',     city: 'Boise, ID', type: 'Manufacturing', tiv: 34500000, status: 'not_started', progress: 0, due: 'May 14', changes: null },
  { id: 'l-07', addr: '3301 Midland Dr',     city: 'Dallas, TX', type: 'Office tower', tiv: 88500000, status: 'in_progress', progress: 25, due: 'May 14', changes: null },
];

const statusMetaCB = {
  not_started:  { label: 'Not started',     color: 'var(--ink-4)',    bg: 'var(--surface-2)',    dot: '#c7c2b8' },
  in_progress:  { label: 'In progress',     color: 'var(--accent-ink)', bg: 'var(--accent-soft)', dot: 'var(--accent)' },
  submitted:    { label: 'Submitted',       color: 'var(--warning)',  bg: 'var(--warning-soft)', dot: 'var(--warning)' },
  under_review: { label: 'Under review',    color: 'var(--warning)',  bg: 'var(--warning-soft)', dot: 'var(--warning)' },
  approved:     { label: 'Approved',        color: 'var(--positive)', bg: 'var(--positive-soft)', dot: 'var(--positive)' },
  rejected:     { label: 'Action needed',   color: 'var(--danger)',   bg: 'var(--danger-soft)',  dot: 'var(--danger)' },
};

const ScreenContributorPortfolio = ({ onOpenLocation, model = 'bundled' }) => {
  const [filter, setFilter] = React.useState('all');
  const [locations, setLocations] = React.useState(CONTRIBUTOR_PORTFOLIO);
  const toast = useToast ? useToast() : { push: () => {} };

  const groups = {
    all: locations,
    todo: locations.filter(l => ['not_started', 'in_progress', 'rejected'].includes(l.status)),
    submitted: locations.filter(l => ['submitted', 'under_review'].includes(l.status)),
    approved: locations.filter(l => l.status === 'approved'),
  };
  const visible = groups[filter];

  const counts = {
    total: locations.length,
    done: locations.filter(l => l.status === 'approved').length,
    inflight: locations.filter(l => ['submitted', 'under_review'].includes(l.status)).length,
    todo: locations.filter(l => ['not_started', 'in_progress', 'rejected'].includes(l.status)).length,
  };
  const totalTiv = locations.reduce((s, l) => s + l.tiv, 0);
  const overallProgress = Math.round((counts.done / counts.total) * 100);

  const next = locations.find(l => l.status === 'in_progress') || locations.find(l => l.status === 'rejected') || locations.find(l => l.status === 'not_started');

  return (
    <div style={{ height: '100%', overflow: 'auto', background: 'var(--bg)' }}>
      {/* Slim branded header */}
      <div style={{ background: '#fff', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto', padding: '14px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <BrandMark size={22} />
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-1)' }}>Values Collection · Hartwell Global</div>
              <div style={{ fontSize: 11, color: 'var(--ink-4)' }}>NA Renewal 2026 · Link expires May 14, 2026</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ fontSize: 11, color: 'var(--ink-4)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Icon name="lock" size={11} /> Secure session · <span className="mono">sam@veritas-brokers.com</span>
            </div>
            <button className="btn btn-ghost btn-sm"><Icon name="mail" size={12} /> Contact owner</button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '28px 28px 60px' }}>
        {/* Hero */}
        <div className="card" style={{ padding: 28, marginBottom: 20, background: 'linear-gradient(135deg, #fff 0%, var(--accent-soft) 140%)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 24 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--accent-ink)', marginBottom: 8 }}>
                Hi Sam — welcome back
              </div>
              <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 32, fontWeight: 400, letterSpacing: '-0.02em', marginBottom: 6 }}>
                {counts.total} locations need your attention
              </h1>
              <div style={{ fontSize: 14, color: 'var(--ink-3)', marginBottom: 16 }}>
                {counts.done} complete · {counts.inflight} in review · <b style={{ color: 'var(--ink-1)' }}>{counts.todo} still to submit</b>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                <div style={{ flex: 1, maxWidth: 380 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div style={{ fontSize: 11, color: 'var(--ink-4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Overall progress</div>
                    <div className="num mono" style={{ fontSize: 12, color: 'var(--ink-2)', fontWeight: 600 }}>{overallProgress}%</div>
                  </div>
                  <div style={{ height: 8, background: 'var(--surface-3)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ width: `${overallProgress}%`, height: '100%', background: 'var(--accent)', borderRadius: 4 }} />
                  </div>
                </div>
              </div>

              {next && (
                <button className="btn btn-accent btn-lg" onClick={() => onOpenLocation && onOpenLocation(next.id)}>
                  Continue — {next.addr}, {next.city} <Icon name="arrowRight" size={14} />
                </button>
              )}
            </div>
            <div style={{ width: 220, padding: 16, background: '#fff', borderRadius: 12, border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-4)', marginBottom: 6 }}>Portfolio TIV</div>
              <div className="num" style={{ fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em' }}>{formatCurrency(totalTiv)}</div>
              <div style={{ fontSize: 11, color: 'var(--ink-4)', marginTop: 2 }}>Across {counts.total} locations</div>
              <hr className="hr" style={{ margin: '14px 0' }} />
              <div style={{ fontSize: 11, color: 'var(--ink-4)', marginBottom: 10 }}>Due in <b style={{ color: 'var(--warning)' }} className="mono">18 days</b></div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 11, color: 'var(--ink-3)' }}>
                <Icon name="mail" size={11} color="var(--ink-4)" />
                <span>2nd reminder in 11 days</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action needed banner */}
        {locations.some(l => l.status === 'rejected') && (
          <div style={{ marginBottom: 16, padding: '12px 16px', background: 'var(--danger-soft)', border: '1px solid color-mix(in oklab, var(--danger) 25%, transparent)', borderRadius: 10, display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ width: 28, height: 28, borderRadius: 14, background: 'var(--danger)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="alert" size={13} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--danger)' }}>1 location needs revision</div>
              <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>Reviewer asked for additional valuation documentation on <b>1100 Seaport Ave</b></div>
            </div>
            <button className="btn btn-danger btn-sm" onClick={() => {
              const rejected = locations.find(l => l.status === 'rejected');
              if (rejected) onOpenLocation && onOpenLocation(rejected.id);
            }}>Review comments</button>
          </div>
        )}

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 14, borderBottom: '1px solid var(--border)' }}>
          {[
            { id: 'all', label: 'All locations', count: counts.total },
            { id: 'todo', label: 'To submit', count: counts.todo },
            { id: 'submitted', label: 'In review', count: counts.inflight },
            { id: 'approved', label: 'Approved', count: counts.done },
          ].map(t => (
            <button key={t.id} onClick={() => setFilter(t.id)} style={{
              background: 'transparent', border: 'none', padding: '10px 14px',
              fontSize: 13, fontWeight: 500, cursor: 'pointer',
              color: filter === t.id ? 'var(--ink-1)' : 'var(--ink-4)',
              borderBottom: '2px solid ' + (filter === t.id ? 'var(--accent)' : 'transparent'),
              marginBottom: -1, display: 'flex', gap: 6, alignItems: 'center',
            }}>
              {t.label}
              <span style={{ fontSize: 11, padding: '1px 6px', borderRadius: 8, background: filter === t.id ? 'var(--ink-1)' : 'var(--surface-3)', color: filter === t.id ? '#fff' : 'var(--ink-4)' }}>{t.count}</span>
            </button>
          ))}
        </div>

        {/* Location list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {visible.map(loc => {
            const meta = statusMetaCB[loc.status];
            const isRejected = loc.status === 'rejected';
            return (
              <div key={loc.id} className="card" style={{
                padding: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16,
                transition: 'all .15s ease',
                borderColor: isRejected ? 'color-mix(in oklab, var(--danger) 25%, var(--border))' : 'var(--border)',
              }}
                onClick={() => onOpenLocation && onOpenLocation(loc.id)}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--ink-1)'; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = isRejected ? 'color-mix(in oklab, var(--danger) 25%, var(--border))' : 'var(--border)'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: meta.bg, color: meta.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon name="building" size={19} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 3 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-1)' }}>{loc.addr}</div>
                    <span className="mono" style={{ fontSize: 11, color: 'var(--ink-4)' }}>#{loc.id.toUpperCase()}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--ink-4)', display: 'flex', gap: 10, alignItems: 'center' }}>
                    <span>{loc.city}</span>
                    <span>·</span>
                    <span>{loc.type}</span>
                    <span>·</span>
                    <span className="mono num">{formatCurrency(loc.tiv)} TIV</span>
                    {loc.changes === 'material' && <><span>·</span><span className="badge badge-amber" style={{ fontSize: 10 }}>material change</span></>}
                  </div>
                </div>
                <div style={{ width: 140 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 11, color: 'var(--ink-4)' }}>Progress</span>
                    <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 600 }}>{loc.progress}%</span>
                  </div>
                  <div style={{ height: 5, background: 'var(--surface-3)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${loc.progress}%`, height: '100%', background: loc.status === 'approved' ? 'var(--positive)' : loc.status === 'rejected' ? 'var(--danger)' : 'var(--accent)' }} />
                  </div>
                </div>
                <div style={{ width: 120, textAlign: 'center' }}>
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '4px 10px', borderRadius: 12,
                    background: meta.bg, color: meta.color, fontSize: 11, fontWeight: 600,
                  }}>
                    <span style={{ width: 6, height: 6, borderRadius: 3, background: meta.dot }} />
                    {meta.label}
                  </div>
                </div>
                <div style={{ width: 80, textAlign: 'right' }}>
                  {loc.status === 'not_started' && <button className="btn btn-accent btn-sm" onClick={e => { e.stopPropagation(); onOpenLocation && onOpenLocation(loc.id); }}>Start</button>}
                  {loc.status === 'in_progress' && <button className="btn btn-secondary btn-sm" onClick={e => { e.stopPropagation(); onOpenLocation && onOpenLocation(loc.id); }}>Continue</button>}
                  {loc.status === 'rejected' && <button className="btn btn-danger btn-sm" onClick={e => { e.stopPropagation(); onOpenLocation && onOpenLocation(loc.id); }}>Revise</button>}
                  {(loc.status === 'submitted' || loc.status === 'under_review') && <button className="btn btn-ghost btn-sm" onClick={e => { e.stopPropagation(); onOpenLocation && onOpenLocation(loc.id); }}>View</button>}
                  {loc.status === 'approved' && <Icon name="check" size={16} color="var(--positive)" />}
                </div>
              </div>
            );
          })}
          {visible.length === 0 && (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-4)', fontSize: 13 }}>
              Nothing here — try a different filter.
            </div>
          )}
        </div>

        {/* Footer help */}
        <div style={{ marginTop: 28, padding: 18, background: 'var(--surface)', borderRadius: 10, display: 'flex', gap: 16, alignItems: 'center' }}>
          <div style={{ width: 36, height: 36, borderRadius: 18, background: 'var(--accent-soft)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="info" size={15} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-1)' }}>Submit each location independently</div>
            <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>You can work on them in any order. Your reviewer approves each one separately — you don't need to finish all locations at once.</div>
          </div>
          <button className="btn btn-ghost btn-sm"><Icon name="mail" size={12} /> Message owner</button>
        </div>
      </div>
    </div>
  );
};

// Updated signed-link landing — shows portfolio count or single location
const ScreenSignedLinkV2 = ({ model = 'bundled', onContinue }) => {
  const [passcode, setPasscode] = React.useState('');
  const isBundled = model === 'bundled';
  const locationCount = isBundled ? 7 : 1;

  return (
    <div style={{ height: '100%', background: 'linear-gradient(180deg, #FAFAF7 0%, #F0EFEA 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, overflow: 'auto' }}>
      <div style={{ maxWidth: 460, width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}><BrandMark size={28} /></div>
        <div className="card" style={{ padding: 32, boxShadow: 'var(--shadow-lg)' }}>
          <div style={{ display: 'inline-flex', padding: '4px 10px', background: 'var(--accent-soft)', color: 'var(--accent-ink)', borderRadius: 12, fontSize: 11, fontWeight: 600, marginBottom: 14, alignItems: 'center', gap: 5 }}>
            <Icon name="lock" size={11} /> SECURE VALUE COLLECTION
          </div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 28, fontWeight: 400, letterSpacing: '-0.01em', marginBottom: 8, lineHeight: 1.2 }}>
            {isBundled
              ? `You've been asked to submit values for ${locationCount} locations`
              : `You've been asked to submit values for 1 location`}
          </h1>
          <div style={{ color: 'var(--ink-3)', fontSize: 14, marginBottom: 18, lineHeight: 1.55 }}>
            <b>Hartwell Global</b> · NA Renewal 2026. Your signed link is valid until <span className="mono">May 14, 2026</span>.
          </div>

          {isBundled ? (
            <div style={{ padding: 14, background: 'var(--surface-2)', borderRadius: 10, marginBottom: 18 }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-4)', marginBottom: 8 }}>Locations in this session</div>
              <div style={{ fontSize: 13, color: 'var(--ink-2)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div>· 450 Industrial Pkwy, Columbus OH</div>
                <div>· 77 Harbor Blvd, Long Beach CA</div>
                <div>· 1200 Commerce Way, Atlanta GA</div>
                <div style={{ color: 'var(--ink-4)' }}>· + 4 more</div>
              </div>
              <hr className="hr" style={{ margin: '10px 0' }} />
              <div style={{ fontSize: 11, color: 'var(--ink-4)' }}>You can submit each independently — no need to finish in one sitting.</div>
            </div>
          ) : (
            <div style={{ padding: 14, background: 'var(--surface-2)', borderRadius: 10, marginBottom: 18 }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-4)', marginBottom: 8 }}>Location</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-1)' }}>450 Industrial Pkwy</div>
              <div style={{ fontSize: 12, color: 'var(--ink-4)', marginTop: 2 }}>Columbus, OH · Manufacturing · ~$42M TIV</div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 18 }}>
            {[
              { icon: 'clock', label: isBundled ? `~${locationCount * 12} min total` : '~15 min' },
              { icon: 'save', label: 'Save anytime' },
              { icon: 'shield', label: 'Encrypted' },
            ].map((f, i) => (
              <div key={i} style={{ padding: 10, background: 'var(--surface-2)', borderRadius: 8, textAlign: 'center' }}>
                <Icon name={f.icon} size={15} color="var(--accent)" />
                <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 4 }}>{f.label}</div>
              </div>
            ))}
          </div>
          <div className="input-group">
            <label className="input-label">Enter your access passcode</label>
            <input className="input mono" placeholder="6-digit passcode" value={passcode} onChange={e => setPasscode(e.target.value.slice(0, 6))} style={{ letterSpacing: '0.3em', textAlign: 'center', fontSize: 16, height: 44 }} />
            <div className="input-hint">Sent to you in a separate email for security.</div>
          </div>
          <button className="btn btn-accent btn-lg" style={{ width: '100%' }} onClick={() => onContinue && onContinue()}>
            {isBundled ? 'Continue to my locations' : 'Continue to form'} <Icon name="arrowRight" size={14} />
          </button>
          <div style={{ marginTop: 16, padding: '10px 14px', background: 'var(--surface-2)', borderRadius: 8, display: 'flex', gap: 10, alignItems: 'center', fontSize: 12, color: 'var(--ink-4)' }}>
            <Icon name="info" size={13} />
            Questions? Contact <span className="mono" style={{ color: 'var(--ink-2)' }}>alex.morgan@hartwell.com</span>
          </div>
        </div>
        <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--ink-4)', marginTop: 18 }}>
          Powered by Blue[i] Property · AES-256 encryption
        </div>
      </div>
    </div>
  );
};

// Wrapped mini-flow: landing → portfolio → form
const SignedLinkFlow = ({ model = 'bundled', startAt = 'landing' }) => {
  const [phase, setPhase] = React.useState(startAt);
  const [openId, setOpenId] = React.useState(null);

  return (
    <div className="app-root" style={{ height: '100%' }}>
      {phase === 'landing' && (
        <ScreenSignedLinkV2 model={model} onContinue={() => setPhase(model === 'bundled' ? 'portfolio' : 'form')} />
      )}
      {phase === 'portfolio' && (
        <ScreenContributorPortfolio onOpenLocation={(id) => { setOpenId(id); setPhase('form'); }} />
      )}
      {phase === 'form' && (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          {model === 'bundled' && (
            <div style={{ padding: '10px 20px', background: '#fff', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setPhase('portfolio')}>
                <Icon name="chevronLeft" size={13} /> All locations
              </button>
              <div style={{ fontSize: 12, color: 'var(--ink-4)' }}>
                <span className="mono">{openId || 'l-02'}</span> · 77 Harbor Blvd, Long Beach CA
              </div>
              <div style={{ flex: 1 }} />
              <div style={{ fontSize: 11, color: 'var(--ink-4)' }}>2 of 7 · <span style={{ color: 'var(--accent)' }}>Draft auto-saved</span></div>
            </div>
          )}
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <ScreenContributorForm assignmentId="a-102" embedded={false} onSubmitted={() => setPhase(model === 'bundled' ? 'portfolio' : 'landing')} onExit={() => setPhase(model === 'bundled' ? 'portfolio' : 'landing')} />
          </div>
        </div>
      )}
    </div>
  );
};

Object.assign(window, { ScreenContributorPortfolio, ScreenSignedLinkV2, SignedLinkFlow });
