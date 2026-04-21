// AdminApp — wraps admin screens with sidebar and navigation state
// ------------------------------------------------------------------
const AdminApp = ({ initialNav = 'dashboard', initialCampaignId }) => {
  const [nav, setNav] = React.useState(initialNav);
  const [campaignId, setCampaignId] = React.useState(initialCampaignId || 'c-2026-na');
  const [createFlow, setCreateFlow] = React.useState(initialNav === 'create-campaign');
  const [assignmentId, setAssignmentId] = React.useState(null);

  const gotoNav = (n, extra) => {
    if (n === 'create-campaign') { setCreateFlow(true); return; }
    setNav(n);
    setCreateFlow(false);
    if (extra && extra.campaignId) setCampaignId(extra.campaignId);
  };

  const openCampaign = (id) => {
    setCampaignId(id);
    setNav('campaign-detail');
  };

  return (
    <div className="app-root" style={{ display: 'flex', height: '100%' }}>
      <Sidebar active={nav === 'campaign-detail' ? 'campaigns' : nav} onNav={gotoNav} role="admin" />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        {createFlow ? (
          <ScreenCreateCampaign onCancel={() => { setCreateFlow(false); setNav('campaigns'); }} onFinish={(id) => { setCreateFlow(false); openCampaign(id); }} />
        ) : nav === 'dashboard' ? (
          <>
            <Topbar title="Overview" actions={<>
              <button className="btn btn-ghost btn-icon btn-sm"><Icon name="search" size={14} /></button>
              <button className="btn btn-ghost btn-icon btn-sm"><Icon name="bell" size={14} /></button>
            </>} />
            <div style={{ flex: 1, overflow: 'auto' }}>
              <ScreenDashboard onOpenCampaign={openCampaign} onNav={gotoNav} />
            </div>
          </>
        ) : nav === 'campaigns' ? (
          <>
            <Topbar title="Campaigns" />
            <div style={{ flex: 1, overflow: 'auto' }}>
              <ScreenCampaigns onOpenCampaign={openCampaign} onNav={gotoNav} />
            </div>
          </>
        ) : nav === 'campaign-detail' ? (
          <ScreenCampaignDetail campaignId={campaignId} onBack={() => setNav('campaigns')}
            onOpenAssignment={(id) => { setAssignmentId(id); setNav('assignment-form'); }}
            onOpenReview={(id) => { setAssignmentId(id); setNav('reviewer'); }} />
        ) : nav === 'reviewer' ? (
          <ScreenReviewer assignmentId={assignmentId} onBack={() => setNav('campaign-detail')} onDecision={() => setNav('campaign-detail')} />
        ) : nav === 'assignment-form' ? (
          <ScreenContributorForm assignmentId={assignmentId} embedded onExit={() => setNav('campaign-detail')} onSubmitted={() => setNav('campaign-detail')} />
        ) : nav === 'forms' ? (
          <ScreenFormBuilder />
        ) : nav === 'assignments' ? (
          <>
            <Topbar title="Assignments" subtitle="All assignments across campaigns" />
            <div style={{ flex: 1, overflow: 'auto' }}>
              <ScreenCampaignDetailAssignmentsOnly />
            </div>
          </>
        ) : nav === 'review' ? (
          <>
            <Topbar title="Reviews" />
            <div style={{ flex: 1, overflow: 'auto' }}>
              <ScreenReviewQueue onOpen={(id) => { setAssignmentId(id); setNav('reviewer'); }} />
            </div>
          </>
        ) : nav === 'settings' ? (
          <>
            <Topbar title="Settings" />
            <div style={{ flex: 1, overflow: 'auto' }}><ScreenSettings /></div>
          </>
        ) : null}
      </div>
    </div>
  );
};

// Reviewer app
const ReviewerApp = ({ initial = 'queue' }) => {
  const [nav, setNav] = React.useState(initial === 'detail' ? 'review-detail' : 'review');
  const [assignmentId, setAssignmentId] = React.useState('a-102');
  return (
    <div className="app-root" style={{ display: 'flex', height: '100%' }}>
      <Sidebar active="review" onNav={() => {}} role="reviewer" />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        {nav === 'review' ? (
          <>
            <Topbar title="Review queue" actions={<button className="btn btn-ghost btn-icon btn-sm"><Icon name="bell" size={14} /></button>} />
            <div style={{ flex: 1, overflow: 'auto' }}><ScreenReviewQueue onOpen={(id) => { setAssignmentId(id); setNav('review-detail'); }} /></div>
          </>
        ) : (
          <ScreenReviewer assignmentId={assignmentId} onBack={() => setNav('review')} onDecision={() => setNav('review')} />
        )}
      </div>
    </div>
  );
};

// Small simplification for assignments screen
const ScreenCampaignDetailAssignmentsOnly = () => {
  const store = useStore();
  const [selected, setSelected] = React.useState([]);
  const toast = useToast();
  const filtered = store.assignments;
  const toggleAll = () => setSelected(selected.length === filtered.length ? [] : filtered.map(a => a.id));
  const toggleOne = (id) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  return (
    <PagePad>
      <div style={{ display: 'flex', gap: 12, marginBottom: 12, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 280 }}>
          <Icon name="search" size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-4)' }} />
          <input className="input" placeholder="Search…" style={{ paddingLeft: 34, height: 32, fontSize: 12 }} />
        </div>
        {selected.length > 0 && (
          <>
            <span className="badge badge-blue">{selected.length} selected</span>
            <button className="btn btn-secondary btn-sm" onClick={() => { toast.push(`Reminder sent to ${selected.length}`, 'success'); setSelected([]); }}><Icon name="mail" size={12} /> Remind</button>
            <button className="btn btn-secondary btn-sm"><Icon name="users" size={12} /> Reassign</button>
          </>
        )}
      </div>
      <div className="card" style={{ overflow: 'hidden' }}>
        <table className="tbl">
          <thead><tr>
            <th style={{ width: 36 }}><Checkbox checked={selected.length === filtered.length} indeterminate={selected.length > 0 && selected.length < filtered.length} onChange={toggleAll} /></th>
            <th>Property</th><th>Campaign</th><th>Assignee</th><th>Status</th><th>TIV</th><th>Due</th>
          </tr></thead>
          <tbody>
            {filtered.map(a => (
              <tr key={a.id} className={selected.includes(a.id) ? 'selected' : ''}>
                <td onClick={e => e.stopPropagation()}><Checkbox checked={selected.includes(a.id)} onChange={() => toggleOne(a.id)} /></td>
                <td><div style={{ fontWeight: 500 }}>{a.property.address}</div><div style={{ fontSize: 11, color: 'var(--ink-4)' }}>{a.property.city}, {a.property.state}</div></td>
                <td style={{ fontSize: 12 }}>NA Renewal 2026</td>
                <td><div style={{ display: 'flex', gap: 8, alignItems: 'center' }}><Avatar name={a.assignee} size={20} /><span style={{ fontSize: 12 }}>{a.assignee}</span></div></td>
                <td><StatusBadge status={a.status} /></td>
                <td className="mono num">{formatCurrency(a.property.tiv)}</td>
                <td className="mono num" style={{ fontSize: 12 }}>{new Date(a.dueDate).toLocaleDateString('en', { month: 'short', day: 'numeric' })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PagePad>
  );
};

Object.assign(window, { AdminApp, ReviewerApp });
