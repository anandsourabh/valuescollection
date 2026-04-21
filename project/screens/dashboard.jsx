// Admin: Campaign overview dashboard
// ------------------------------------------------------------------
const ScreenDashboard = ({ onOpenCampaign, onNav }) => {
  const store = useStore();
  const activeCampaigns = store.campaigns.filter(c => c.status === 'active');
  const totalAssignments = activeCampaigns.reduce((a, c) => a + c.assignments, 0);
  const approvedTotal = activeCampaigns.reduce((a, c) => a + c.progress.approved, 0);
  const overdueTotal = activeCampaigns.reduce((a, c) => a + c.slaBreaches, 0);

  return (
    <PagePad>
      <div style={{ marginBottom: 20, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 34, fontWeight: 400, letterSpacing: '-0.01em', marginBottom: 2 }}>
            Good afternoon, Alex
          </h1>
          <div style={{ color: 'var(--ink-4)', fontSize: 14 }}>3 active campaigns · 319 assignments in flight</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary"><Icon name="download" size={14} /> Export</button>
          <button className="btn btn-accent" onClick={() => onNav && onNav('campaigns', { createNew: true })}>
            <Icon name="plus" size={14} /> New campaign
          </button>
        </div>
      </div>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Active campaigns',    value: '3',    trend: '+1 vs Q1',   color: 'var(--accent)',   icon: 'campaigns' },
          { label: 'Assignments total',   value: totalAssignments, trend: '265 active', color: 'var(--ink-1)', icon: 'assignments' },
          { label: 'Approved',            value: approvedTotal, trend: '26% complete', color: 'var(--positive)', icon: 'check' },
          { label: 'SLA breaches',        value: overdueTotal, trend: 'Needs attention', color: 'var(--danger)', icon: 'alert' },
        ].map((k, i) => (
          <div key={i} className="card" style={{ padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: k.color }}>
                <Icon name={k.icon} size={15} />
              </div>
            </div>
            <div style={{ fontSize: 11, color: 'var(--ink-4)', fontWeight: 500, marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{k.label}</div>
            <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--ink-1)' }} className="num">{k.value}</div>
            <div style={{ fontSize: 11, color: 'var(--ink-4)', marginTop: 4 }}>{k.trend}</div>
          </div>
        ))}
      </div>

      {/* Active campaigns */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <h2>Active campaigns</h2>
        <button className="btn btn-ghost btn-sm">View all <Icon name="chevronRight" size={12} /></button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 24 }}>
        {activeCampaigns.map(c => {
          const t = totalsFor(c);
          return (
            <div key={c.id} className="card" style={{ padding: 18, cursor: 'pointer', transition: 'box-shadow .15s, border-color .15s' }}
              onClick={() => onOpenCampaign && onOpenCampaign(c.id)}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--ink-1)', fontSize: 15, marginBottom: 2 }}>{c.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-4)' }}>{c.properties} properties · owned by {c.owner}</div>
                </div>
                {c.slaBreaches > 0 && (
                  <span className="badge badge-red">
                    <Icon name="alert" size={10} /> {c.slaBreaches} breach
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12, color: 'var(--ink-4)' }}>
                <span>{t.percent}% approved</span>
                <span className="mono num">{t.done} / {t.total}</span>
              </div>
              {/* stacked segmented progress */}
              <div style={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', background: 'var(--surface-3)', marginBottom: 12 }}>
                {[
                  { k: 'approved', c: 'var(--positive)' },
                  { k: 'under_review', c: 'var(--warning)' },
                  { k: 'submitted', c: '#7B3FE4' },
                  { k: 'in_progress', c: 'var(--accent)' },
                  { k: 'rejected', c: 'var(--danger)' },
                ].map(seg => (
                  <div key={seg.k} style={{ width: `${(c.progress[seg.k] / t.total) * 100}%`, background: seg.c }} />
                ))}
              </div>

              <div style={{ display: 'flex', gap: 16, fontSize: 12, flexWrap: 'wrap' }}>
                <span style={{ color: 'var(--ink-4)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <Icon name="calendar" size={12} /> Due {new Date(c.dueDate).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                </span>
                <span style={{ color: 'var(--ink-4)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <Icon name="clock" size={12} /> T+{c.slaDays} SLA
                </span>
                <span style={{ color: 'var(--ink-4)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <Icon name="users" size={12} /> 4 assignees
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Two-col: activity + upcoming breaches */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 12 }}>
        <div className="card" style={{ padding: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3>Recent activity</h3>
            <button className="btn btn-ghost btn-sm">All events</button>
          </div>
          {[
            { icon: 'check', color: 'var(--positive)', text: <><b>Priya Shah</b> approved <span className="mono">1200 Commerce Way</span></>, time: '2m ago' },
            { icon: 'send', color: 'var(--accent)', text: <><b>Ben Torres</b> submitted values for <span className="mono">Harbor Blvd · Long Beach</span></>, time: '14m ago' },
            { icon: 'alert', color: 'var(--danger)', text: <>SLA breached for <span className="mono">Glacier Way · Anchorage</span></>, time: '1h ago' },
            { icon: 'mail', color: 'var(--warning)', text: <>Reminder sent to <b>12 assignees</b> · EMEA Q2</>, time: '3h ago' },
            { icon: 'link', color: 'var(--ink-3)', text: <><b>Alex Morgan</b> issued 4 external signed links</>, time: '5h ago' },
          ].map((a, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: i < 4 ? '1px solid var(--divider)' : 'none', alignItems: 'center' }}>
              <div style={{ width: 28, height: 28, borderRadius: 14, background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: a.color, flexShrink: 0 }}>
                <Icon name={a.icon} size={13} />
              </div>
              <div style={{ flex: 1, fontSize: 13, color: 'var(--ink-2)' }}>{a.text}</div>
              <div style={{ fontSize: 11, color: 'var(--ink-4)' }}>{a.time}</div>
            </div>
          ))}
        </div>

        <div className="card" style={{ padding: 18 }}>
          <div style={{ marginBottom: 12 }}>
            <h3>Upcoming SLA</h3>
            <div style={{ fontSize: 12, color: 'var(--ink-4)', marginTop: 2 }}>Assignments due this week</div>
          </div>
          {store.assignments.filter(a => a.daysRemaining <= 5 && a.daysRemaining >= -3 && !['approved', 'rejected'].includes(a.status)).slice(0, 5).map((a, i, arr) => (
            <div key={a.id} style={{ display: 'flex', gap: 10, padding: '10px 0', borderBottom: i < arr.length - 1 ? '1px solid var(--divider)' : 'none', alignItems: 'center' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.property.address}</div>
                <div style={{ fontSize: 11, color: 'var(--ink-4)' }}>{a.assignee}</div>
              </div>
              <span className={'badge ' + (a.daysRemaining < 0 ? 'badge-red' : a.daysRemaining <= 2 ? 'badge-amber' : 'badge-gray')} style={{ fontSize: 10 }}>
                {a.daysRemaining < 0 ? `${-a.daysRemaining}d late` : `${a.daysRemaining}d left`}
              </span>
            </div>
          ))}
        </div>
      </div>
    </PagePad>
  );
};

Object.assign(window, { ScreenDashboard });
