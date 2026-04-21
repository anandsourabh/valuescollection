// Admin: Campaigns list & detail (assignments table)
// ------------------------------------------------------------------
const ScreenCampaigns = ({ onOpenCampaign, onNav }) => {
  const store = useStore();
  const [filter, setFilter] = React.useState('all');
  const filtered = store.campaigns.filter(c => filter === 'all' ? true : c.status === filter);
  return (
    <PagePad>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h1>Campaigns</h1>
          <div style={{ color: 'var(--ink-4)', fontSize: 13 }}>Manage value-collection campaigns across portfolios</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary"><Icon name="download" size={14} /> Export</button>
          <button className="btn btn-accent" onClick={() => onNav && onNav('create-campaign')}><Icon name="plus" size={14} /> New campaign</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 12, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 320 }}>
          <Icon name="search" size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-4)' }} />
          <input className="input" placeholder="Search campaigns, owners, portfolios…" style={{ paddingLeft: 34 }} />
        </div>
        <div style={{ display: 'flex', gap: 2, background: 'var(--surface-2)', borderRadius: 8, padding: 3 }}>
          {[
            { id: 'all', label: 'All', count: store.campaigns.length },
            { id: 'active', label: 'Active', count: store.campaigns.filter(c => c.status === 'active').length },
            { id: 'draft', label: 'Draft', count: store.campaigns.filter(c => c.status === 'draft').length },
            { id: 'completed', label: 'Completed', count: store.campaigns.filter(c => c.status === 'completed').length },
          ].map(t => (
            <button key={t.id} onClick={() => setFilter(t.id)} style={{
              border: 'none', background: filter === t.id ? 'var(--surface)' : 'transparent',
              color: filter === t.id ? 'var(--ink-1)' : 'var(--ink-4)',
              padding: '5px 12px', borderRadius: 5, fontSize: 12, fontWeight: 500, cursor: 'pointer',
              boxShadow: filter === t.id ? 'var(--shadow-xs)' : 'none', fontFamily: 'inherit',
              display: 'inline-flex', alignItems: 'center', gap: 6,
            }}>
              {t.label}
              <span style={{ fontSize: 10, opacity: 0.6 }}>{t.count}</span>
            </button>
          ))}
        </div>
        <button className="btn btn-ghost btn-sm"><Icon name="filter" size={13} /> Filter</button>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <table className="tbl">
          <thead>
            <tr>
              <th style={{ width: 36 }}></th>
              <th>Campaign</th>
              <th>Owner</th>
              <th>Portfolio</th>
              <th style={{ width: 200 }}>Progress</th>
              <th>Due</th>
              <th>Status</th>
              <th style={{ width: 40 }}></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => {
              const t = totalsFor(c);
              const pf = store.portfolios.find(p => p.id === c.portfolios[0]);
              const statusMap = {
                active: { cls: 'badge-blue', label: 'Active' },
                draft: { cls: 'badge-gray', label: 'Draft' },
                completed: { cls: 'badge-green', label: 'Completed' },
              };
              return (
                <tr key={c.id} onClick={() => onOpenCampaign(c.id)} style={{ cursor: 'pointer' }}>
                  <td><Checkbox onChange={() => {}} /></td>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--ink-1)' }}>{c.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--ink-4)' }} className="mono">{c.id}</div>
                  </td>
                  <td><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Avatar name={c.owner} size={22} />{c.owner}</div></td>
                  <td>{pf && pf.name}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1 }}><ProgressBar value={t.percent} color={c.status === 'completed' ? 'green' : ''} /></div>
                      <span className="mono num" style={{ fontSize: 11, color: 'var(--ink-4)', minWidth: 36 }}>{t.percent}%</span>
                    </div>
                  </td>
                  <td className="mono num" style={{ fontSize: 12 }}>{new Date(c.dueDate).toLocaleDateString('en', { month: 'short', day: 'numeric' })}</td>
                  <td><span className={'badge ' + statusMap[c.status].cls}>{statusMap[c.status].label}</span></td>
                  <td><button className="btn btn-ghost btn-icon btn-sm" onClick={(e) => e.stopPropagation()}><Icon name="more" size={14} /></button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </PagePad>
  );
};

// Campaign detail — assignments list with bulk actions
const ScreenCampaignDetail = ({ campaignId, onBack, onOpenAssignment, onOpenReview }) => {
  const store = useStore();
  const toast = useToast();
  const c = store.campaigns.find(x => x.id === campaignId);
  const assignments = store.assignments.filter(a => a.campaignId === campaignId);
  const [tab, setTab] = React.useState('assignments');
  const [selected, setSelected] = React.useState([]);
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [sort, setSort] = React.useState({ col: 'dueDate', dir: 'asc' });
  const [showBulkMenu, setShowBulkMenu] = React.useState(false);

  if (!c) return null;
  const t = totalsFor(c);

  const filtered = assignments
    .filter(a => statusFilter === 'all' ? true : a.status === statusFilter)
    .sort((x, y) => {
      const d = sort.dir === 'asc' ? 1 : -1;
      if (sort.col === 'dueDate') return (x.dueDate > y.dueDate ? 1 : -1) * d;
      if (sort.col === 'tiv') return ((x.property.tiv - y.property.tiv)) * d;
      if (sort.col === 'status') return (x.status > y.status ? 1 : -1) * d;
      return 0;
    });

  const toggleAll = () => setSelected(selected.length === filtered.length ? [] : filtered.map(a => a.id));
  const toggleOne = (id) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

  const doBulk = (action) => {
    if (action === 'remind') {
      toast.push(`Reminder sent to ${selected.length} assignees`, 'success');
    } else if (action === 'reassign') {
      toast.push(`${selected.length} assignments marked for reassignment`, 'success');
    } else if (action === 'approve') {
      store.bulkUpdateAssignments(selected, { status: 'approved' });
      toast.push(`Approved ${selected.length} submissions`, 'success');
    }
    setSelected([]);
    setShowBulkMenu(false);
  };

  const sortBy = (col) => setSort(s => s.col === col ? { col, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { col, dir: 'asc' });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Topbar
        breadcrumb={['Campaigns', c.name]}
        title={c.name}
        actions={<>
          <button className="btn btn-secondary btn-sm"><Icon name="link" size={13} /> Issue external link</button>
          <button className="btn btn-secondary btn-sm"><Icon name="download" size={13} /> Export CSV</button>
          <button className="btn btn-primary btn-sm">Campaign settings</button>
        </>}
      />
      <div style={{ padding: '20px 28px 0' }}>
        {/* KPI strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10, marginBottom: 18 }}>
          {[
            { label: 'Properties', value: c.properties, color: 'var(--ink-3)' },
            { label: 'In progress', value: c.progress.in_progress, color: 'var(--accent)' },
            { label: 'Submitted', value: c.progress.submitted, color: '#7B3FE4' },
            { label: 'Under review', value: c.progress.under_review, color: 'var(--warning)' },
            { label: 'Approved', value: c.progress.approved, color: 'var(--positive)' },
            { label: 'SLA breaches', value: c.slaBreaches, color: 'var(--danger)' },
          ].map((k, i) => (
            <div key={i} style={{ padding: '10px 14px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8 }}>
              <div style={{ fontSize: 10, color: 'var(--ink-4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{k.label}</div>
              <div className="num" style={{ fontSize: 22, fontWeight: 600, color: k.color }}>{k.value}</div>
            </div>
          ))}
        </div>

        <Tabs active={tab} onChange={setTab} tabs={[
          { id: 'assignments', label: 'Assignments', count: assignments.length },
          { id: 'progress', label: 'Progress' },
          { id: 'reminders', label: 'Reminders' },
          { id: 'audit', label: 'Audit trail' },
        ]} />
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '16px 28px 28px' }}>
        {tab === 'assignments' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, gap: 12 }}>
              <div style={{ position: 'relative', flex: 1, maxWidth: 280 }}>
                <Icon name="search" size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-4)' }} />
                <input className="input input-sm" placeholder="Search address, assignee…" style={{ paddingLeft: 34, height: 32, fontSize: 12 }} />
              </div>
              <select className="select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ width: 160, height: 32, fontSize: 12 }}>
                <option value="all">All statuses</option>
                {Object.entries(STATUS_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
              {selected.length > 0 ? (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', position: 'relative' }}>
                  <span className="badge badge-blue">{selected.length} selected</span>
                  <button className="btn btn-sm btn-secondary" onClick={() => doBulk('remind')}><Icon name="mail" size={12} /> Remind</button>
                  <button className="btn btn-sm btn-secondary" onClick={() => doBulk('reassign')}><Icon name="users" size={12} /> Reassign</button>
                  <button className="btn btn-sm btn-accent" onClick={() => doBulk('approve')}><Icon name="check" size={12} /> Bulk approve</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => setSelected([])}><Icon name="x" size={12} /></button>
                </div>
              ) : (
                <>
                  <button className="btn btn-ghost btn-sm"><Icon name="filter" size={13} /> Filter</button>
                  <button className="btn btn-secondary btn-sm"><Icon name="upload" size={13} /> Import CSV</button>
                  <button className="btn btn-accent btn-sm"><Icon name="plus" size={13} /> Assign</button>
                </>
              )}
            </div>

            <div className="card" style={{ overflow: 'hidden' }}>
              <table className="tbl">
                <thead>
                  <tr>
                    <th style={{ width: 36 }}>
                      <Checkbox checked={selected.length === filtered.length && filtered.length > 0} indeterminate={selected.length > 0 && selected.length < filtered.length} onChange={toggleAll} />
                    </th>
                    <th>Property</th>
                    <th>Assignee</th>
                    <th onClick={() => sortBy('status')} style={{ cursor: 'pointer' }}>Status</th>
                    <th onClick={() => sortBy('tiv')} style={{ cursor: 'pointer', textAlign: 'right' }}>TIV</th>
                    <th onClick={() => sortBy('dueDate')} style={{ cursor: 'pointer' }}>Due {sort.col === 'dueDate' && <Icon name={sort.dir === 'asc' ? 'chevronUp' : 'chevronDown'} size={10} />}</th>
                    <th>Last activity</th>
                    <th style={{ width: 40 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(a => (
                    <tr key={a.id} className={selected.includes(a.id) ? 'selected' : ''}
                      onClick={() => ['submitted', 'under_review'].includes(a.status) ? onOpenReview(a.id) : onOpenAssignment(a.id)}
                      style={{ cursor: 'pointer' }}>
                      <td onClick={(e) => e.stopPropagation()}><Checkbox checked={selected.includes(a.id)} onChange={() => toggleOne(a.id)} /></td>
                      <td>
                        <div style={{ fontWeight: 500, color: 'var(--ink-1)', fontSize: 13 }}>{a.property.address}</div>
                        <div style={{ fontSize: 11, color: 'var(--ink-4)' }}>{a.property.city}, {a.property.state} · {a.property.type}</div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Avatar name={a.assignee} size={22} />
                          <div>
                            <div style={{ fontSize: 12 }}>{a.assignee}</div>
                            {a.assigneeType === 'external' && <div style={{ fontSize: 10, color: 'var(--ink-4)' }}><Icon name="link" size={9} style={{ verticalAlign: -1 }} /> external link</div>}
                          </div>
                        </div>
                      </td>
                      <td><StatusBadge status={a.status} /></td>
                      <td className="mono num" style={{ textAlign: 'right' }}>{formatCurrency(a.property.tiv)}</td>
                      <td>
                        <div style={{ fontSize: 12 }} className="mono num">{new Date(a.dueDate).toLocaleDateString('en', { month: 'short', day: 'numeric' })}</div>
                        <div style={{ fontSize: 10, color: a.daysRemaining < 0 ? 'var(--danger)' : 'var(--ink-4)' }}>
                          {a.daysRemaining < 0 ? `${-a.daysRemaining}d late` : `${a.daysRemaining}d left`}
                        </div>
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--ink-4)' }}>{a.lastActivity}</td>
                      <td onClick={(e) => e.stopPropagation()}><button className="btn btn-ghost btn-icon btn-sm"><Icon name="more" size={14} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {tab === 'progress' && <ProgressPanel campaign={c} />}
        {tab === 'reminders' && <RemindersPanel campaign={c} />}
        {tab === 'audit' && <AuditPanel assignments={assignments} />}
      </div>
    </div>
  );
};

const ProgressPanel = ({ campaign: c }) => {
  const t = totalsFor(c);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 16 }}>
      <div className="card" style={{ padding: 20 }}>
        <h3 style={{ marginBottom: 14 }}>Completion funnel</h3>
        {[
          ['not_started', 'Not started', 'var(--status-not-started)'],
          ['in_progress', 'In progress', 'var(--accent)'],
          ['submitted', 'Submitted', '#7B3FE4'],
          ['under_review', 'Under review', 'var(--warning)'],
          ['approved', 'Approved', 'var(--positive)'],
          ['rejected', 'Rejected', 'var(--danger)'],
        ].map(([k, label, color]) => {
          const v = c.progress[k] || 0;
          const pct = (v / t.total) * 100;
          return (
            <div key={k} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13 }}>
                <span style={{ color: 'var(--ink-2)', fontWeight: 500 }}>{label}</span>
                <span className="num" style={{ color: 'var(--ink-4)' }}>{v} <span style={{ color: 'var(--ink-5)' }}>·</span> {pct.toFixed(0)}%</span>
              </div>
              <div style={{ height: 6, background: 'var(--surface-3)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 3 }} />
              </div>
            </div>
          );
        })}
      </div>
      <div className="card" style={{ padding: 20 }}>
        <h3 style={{ marginBottom: 16 }}>Values submitted vs prior year</h3>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: 'var(--ink-4)', marginBottom: 2 }}>Total TIV reported (approved)</div>
          <div className="num" style={{ fontSize: 30, fontWeight: 600, color: 'var(--ink-1)', letterSpacing: '-0.02em' }}>$2.14B</div>
          <div style={{ fontSize: 12, color: 'var(--positive)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Icon name="trendUp" size={12} /> +4.8% vs 2025
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 100, paddingTop: 12, borderTop: '1px solid var(--divider)' }}>
          {[62, 70, 58, 74, 82, 89, 92, 85, 91, 95, 88, 94].map((h, i) => (
            <div key={i} style={{ flex: 1, height: h + '%', background: i === 10 ? 'var(--accent)' : 'var(--surface-3)', borderRadius: '3px 3px 0 0' }} />
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--ink-4)', marginTop: 6 }}>
          <span>May 1</span><span>May 15</span><span>May 30</span>
        </div>
      </div>
    </div>
  );
};

const RemindersPanel = ({ campaign: c }) => (
  <div className="card" style={{ padding: 20, maxWidth: 640 }}>
    <h3 style={{ marginBottom: 12 }}>Reminder schedule</h3>
    <div style={{ fontSize: 13, color: 'var(--ink-3)', marginBottom: 16 }}>
      SLA due date: <span className="mono">{new Date(c.dueDate).toLocaleDateString('en', { dateStyle: 'medium' })}</span> · T+{c.slaDays} days from activation
    </div>
    {[
      { label: 'Initial invite', offset: 'Day 0', template: 'Welcome — Value collection request', sent: 142 },
      { label: 'Reminder 1', offset: 'T−7 days', template: 'Default reminder', sent: 78 },
      { label: 'Reminder 2', offset: 'T−2 days', template: 'Urgent reminder', sent: 34 },
      { label: 'Escalation', offset: 'T+1 days', template: 'Escalate to manager', sent: 3 },
      { label: 'Final notice', offset: 'T+5 days', template: 'Final notice before expiry', sent: 0 },
    ].map((r, i) => (
      <div key={i} style={{ display: 'flex', gap: 14, padding: '14px 0', borderBottom: i < 4 ? '1px solid var(--divider)' : 'none', alignItems: 'center' }}>
        <div style={{ width: 32, height: 32, borderRadius: 16, background: 'var(--accent-soft)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="mail" size={14} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-1)' }}>{r.label} · <span style={{ color: 'var(--ink-4)', fontWeight: 400 }}>{r.offset}</span></div>
          <div style={{ fontSize: 12, color: 'var(--ink-4)', marginTop: 2 }}>Template: <span className="mono">{r.template}</span></div>
        </div>
        <div style={{ fontSize: 12, color: 'var(--ink-4)' }}><span className="num" style={{ color: 'var(--ink-2)', fontWeight: 500 }}>{r.sent}</span> sent</div>
        <button className="btn btn-ghost btn-sm"><Icon name="edit" size={12} /></button>
      </div>
    ))}
    <button className="btn btn-secondary" style={{ marginTop: 14 }}><Icon name="plus" size={13} /> Add reminder</button>
  </div>
);

const AuditPanel = ({ assignments }) => (
  <div className="card" style={{ overflow: 'hidden' }}>
    <table className="tbl">
      <thead><tr><th>When</th><th>Actor</th><th>Event</th><th>Entity</th><th>IP</th></tr></thead>
      <tbody>
        {[
          ['15:42:08', 'Priya Shah', 'submission.approved', 'a-101 · 1200 Commerce Way', '10.14.22.8'],
          ['15:28:41', 'Ben Torres', 'submission.submitted', 'a-103 · 77 Harbor Blvd', '73.202.8.14 (ext)'],
          ['14:59:02', 'Marcus Hale', 'field.changed · tiv', 'a-108 · 50 Riverside', '10.14.22.14'],
          ['14:02:19', 'System', 'reminder.sent', '12 assignments', '—'],
          ['13:47:55', 'Alex Morgan', 'link.issued', 'a-104 · 3301 Midland Dr', '10.14.22.1'],
          ['12:15:03', 'Linda Rossi', 'draft.saved', 'a-102 · 450 Industrial', '93.128.12.4 (ext)'],
          ['11:58:20', 'Priya Shah', 'submission.rejected', 'a-107 · 1100 Seaport', '10.14.22.8'],
        ].map((r, i) => (
          <tr key={i}>
            <td className="mono" style={{ fontSize: 12 }}>Apr 20 · {r[0]}</td>
            <td>{r[1]}</td>
            <td><span className="mono" style={{ fontSize: 12, color: 'var(--accent-ink)', background: 'var(--accent-soft)', padding: '2px 6px', borderRadius: 4 }}>{r[2]}</span></td>
            <td className="mono" style={{ fontSize: 12 }}>{r[3]}</td>
            <td className="mono" style={{ fontSize: 11, color: 'var(--ink-4)' }}>{r[4]}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

Object.assign(window, { ScreenCampaigns, ScreenCampaignDetail });
