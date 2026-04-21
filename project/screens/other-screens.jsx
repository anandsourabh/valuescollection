// Reviewer: approve/reject console + form builder + signed-link flow + settings
// ------------------------------------------------------------------

// ---------- Reviewer console ----------
const ScreenReviewer = ({ assignmentId, onBack, onDecision }) => {
  const store = useStore();
  const toast = useToast();
  const a = store.assignments.find(x => x.id === assignmentId) || store.assignments.find(x => ['submitted', 'under_review'].includes(x.status));
  const [comment, setComment] = React.useState('');
  const [activeField, setActiveField] = React.useState(null);
  const [showRejectModal, setShowRejectModal] = React.useState(false);

  const act = (status) => {
    store.updateAssignment(a.id, { status });
    toast.push(status === 'approved' ? 'Submission approved' : 'Submission sent back for revision', 'success');
    onDecision && onDecision(status);
  };

  const fields = [
    { id: 'addr', label: 'Address', prior: '1200 Commerce Way, Atlanta GA', current: '1200 Commerce Way, Atlanta GA', changed: false },
    { id: 'occupancy', label: 'Occupancy', prior: 'Warehouse', current: 'Warehouse · Cold storage bays (new)', changed: true },
    { id: 'area', label: 'Floor area', prior: '248,000 sq ft', current: '266,500 sq ft', changed: true, material: true },
    { id: 'construction', label: 'Construction', prior: 'Class 2 Non-combustible', current: 'Class 2 Non-combustible', changed: false },
    { id: 'year', label: 'Year built', prior: '1998', current: '1998', changed: false },
    { id: 'tiv_bldg', label: 'Building TIV', prior: '$14,200,000', current: '$16,100,000', changed: true },
    { id: 'tiv_contents', label: 'Contents TIV', prior: '$3,800,000', current: '$4,220,000', changed: true },
    { id: 'tiv_bi', label: 'BI (12mo)', prior: '$2,100,000', current: '$2,280,000', changed: true },
    { id: 'tiv_total', label: 'Total TIV', prior: '$20,100,000', current: '$22,600,000', changed: true, material: true, highlight: true },
    { id: 'sprinkler', label: 'Sprinkler', prior: 'Full coverage', current: 'Full coverage', changed: false },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Topbar
        breadcrumb={['Review queue', a.property.address]}
        title="Review submission"
        subtitle={<span className="badge badge-amber"><span className="badge-dot" style={{ background: 'var(--warning)' }} />Under review</span>}
        actions={<>
          <button className="btn btn-ghost btn-sm" onClick={onBack}><Icon name="chevronLeft" size={13} /> Queue</button>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowRejectModal(true)}><Icon name="refresh" size={13} /> Reject & reopen</button>
          <button className="btn btn-accent btn-sm" onClick={() => act('approved')}><Icon name="check" size={13} /> Approve</button>
        </>}
      />
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div style={{ flex: 1, overflow: 'auto', padding: 28, background: 'var(--bg)' }}>
          {/* Submission header */}
          <div className="card" style={{ padding: 20, marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 12, color: 'var(--ink-4)', marginBottom: 4 }} className="mono">{a.id} · Campaign NA Renewal 2026</div>
                <h2 style={{ marginBottom: 8 }}>{a.property.address}</h2>
                <div style={{ display: 'flex', gap: 16, fontSize: 13, color: 'var(--ink-3)', flexWrap: 'wrap' }}>
                  <span><Icon name="mapPin" size={12} style={{ verticalAlign: -1, marginRight: 3, color: 'var(--ink-4)' }} /> {a.property.city}, {a.property.state}</span>
                  <span><Icon name="building" size={12} style={{ verticalAlign: -1, marginRight: 3, color: 'var(--ink-4)' }} /> {a.property.type}</span>
                  <span><Icon name="user" size={12} style={{ verticalAlign: -1, marginRight: 3, color: 'var(--ink-4)' }} /> {a.assignee}</span>
                  <span><Icon name="clock" size={12} style={{ verticalAlign: -1, marginRight: 3, color: 'var(--ink-4)' }} /> Submitted 2h ago</span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: 'var(--ink-4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total TIV</div>
                <div className="num" style={{ fontSize: 28, fontWeight: 600, color: 'var(--ink-1)', letterSpacing: '-0.02em' }}>{formatCurrencyFull(22600000)}</div>
                <div style={{ fontSize: 12, color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end', marginTop: 2 }}>
                  <Icon name="trendUp" size={11} /> +12.4% vs prior
                </div>
              </div>
            </div>
          </div>

          {/* Diff table */}
          <div className="card" style={{ overflow: 'hidden', marginBottom: 16 }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--divider)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>Field changes · prior vs submitted</h3>
              <span className="badge badge-amber">{fields.filter(f => f.changed).length} changed</span>
            </div>
            <table className="tbl">
              <thead><tr><th>Field</th><th>Prior year</th><th>Submitted</th><th style={{ width: 80 }}></th></tr></thead>
              <tbody>
                {fields.map(f => (
                  <tr key={f.id} onClick={() => setActiveField(f.id)} style={{ cursor: 'pointer', background: activeField === f.id ? 'var(--accent-soft)' : f.highlight ? 'var(--surface-2)' : 'transparent' }}>
                    <td style={{ fontWeight: f.highlight ? 600 : 400 }}>{f.label}</td>
                    <td className="mono" style={{ color: 'var(--ink-4)', fontSize: 12 }}>{f.prior}</td>
                    <td className="mono" style={{ fontSize: 12, fontWeight: f.changed ? 600 : 400, color: f.changed ? 'var(--ink-1)' : 'var(--ink-3)' }}>
                      {f.current}
                    </td>
                    <td>
                      {f.material && <span className="badge badge-amber" style={{ fontSize: 10 }}>material</span>}
                      {!f.material && f.changed && <span className="badge badge-blue" style={{ fontSize: 10 }}>changed</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Attachments */}
          <div className="card" style={{ padding: 18 }}>
            <h3 style={{ marginBottom: 14 }}>Attachments</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
              {[
                { name: 'valuation-2025', type: 'file' },
                { name: 'aerial-north', type: 'image' },
                { name: 'sprinkler-cert', type: 'file' },
                { name: 'site-plan-rev3', type: 'file' },
              ].map((f, i) => (
                <div key={i} style={{ padding: 14, border: '1px solid var(--border)', borderRadius: 8, display: 'flex', flexDirection: 'column', gap: 8, cursor: 'pointer' }}>
                  <div style={{ height: 60, background: 'var(--surface-2)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-4)' }}>
                    <Icon name={f.type} size={24} />
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 500 }} className="mono">{f.name}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right panel: reviewer activity + comment box */}
        <div style={{ width: 340, borderLeft: '1px solid var(--border)', background: 'var(--surface)', padding: 24, overflow: 'auto', flexShrink: 0 }}>
          <h3 style={{ marginBottom: 12 }}>Review activity</h3>
          <div style={{ marginBottom: 20 }}>
            {[
              { who: 'System', text: 'Outlier detected on Building TIV (+13%)', time: '2h ago', icon: 'alert', color: 'var(--warning)' },
              { who: 'Marcus Hale', text: 'Submitted values for review', time: '2h ago', icon: 'send', color: 'var(--accent)' },
              { who: 'System', text: 'AV scan passed · 3 attachments', time: '2h ago', icon: 'shield', color: 'var(--positive)' },
            ].map((e, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                <div style={{ width: 22, height: 22, borderRadius: 11, background: 'var(--surface-2)', color: e.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon name={e.icon} size={11} />
                </div>
                <div style={{ flex: 1, fontSize: 12 }}>
                  <div style={{ color: 'var(--ink-2)' }}>{e.text}</div>
                  <div style={{ color: 'var(--ink-4)', fontSize: 11 }}>{e.who} · {e.time}</div>
                </div>
              </div>
            ))}
          </div>
          <hr className="hr" />
          <h3 style={{ marginBottom: 8 }}>Your review</h3>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, fontSize: 12 }}>
            <Checkbox /> Requires secondary approval (analyst → manager)
          </label>
          <textarea className="textarea" placeholder="Comments (will be shared with contributor on rejection)…" value={comment} onChange={e => setComment(e.target.value)} rows={5} style={{ fontSize: 13 }} />
          <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowRejectModal(true)}>Reject</button>
            <button className="btn btn-accent" style={{ flex: 1 }} onClick={() => act('approved')}><Icon name="check" size={13} /> Approve</button>
          </div>
          <div style={{ marginTop: 10, fontSize: 11, color: 'var(--ink-4)', padding: 10, background: 'var(--surface-2)', borderRadius: 6, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <Icon name="info" size={12} style={{ marginTop: 2, flexShrink: 0 }} />
            <div>Approvals are logged with your user, IP, and timestamp. Lineage events publish to Blue[i]'s exposure system.</div>
          </div>
        </div>
      </div>

      {showRejectModal && (
        <div className="modal-backdrop" onClick={() => setShowRejectModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ padding: 24 }}>
              <h2 style={{ marginBottom: 4 }}>Reject & reopen</h2>
              <div style={{ color: 'var(--ink-4)', fontSize: 13, marginBottom: 16 }}>Contributor will receive this comment and can resubmit.</div>
              <div className="input-group">
                <label className="input-label">Reason</label>
                <select className="select"><option>Missing evidence for material change</option><option>Data entry error</option><option>Requires clarification</option></select>
              </div>
              <div className="input-group">
                <label className="input-label">Comment</label>
                <textarea className="textarea" rows={4} placeholder="Please attach valuation documentation supporting the 12.6% TIV change…" />
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button className="btn btn-ghost" onClick={() => setShowRejectModal(false)}>Cancel</button>
                <button className="btn btn-danger" onClick={() => { setShowRejectModal(false); act('rejected'); }}>Reject & reopen</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Reviewer queue
const ScreenReviewQueue = ({ onOpen }) => {
  const store = useStore();
  const queue = store.assignments.filter(a => ['submitted', 'under_review'].includes(a.status));
  const [tab, setTab] = React.useState('pending');
  return (
    <PagePad>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h1>Review queue</h1>
          <div style={{ color: 'var(--ink-4)', fontSize: 13 }}>{queue.length} submissions awaiting your decision</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary btn-sm"><Icon name="filter" size={13} /> Filter</button>
        </div>
      </div>
      <Tabs active={tab} onChange={setTab} tabs={[
        { id: 'pending', label: 'Pending', count: queue.length },
        { id: 'approved', label: 'Approved today', count: 8 },
        { id: 'rejected', label: 'Rejected', count: 2 },
      ]} />
      <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {queue.map(a => (
          <div key={a.id} className="card" style={{ padding: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16 }}
            onClick={() => onOpen(a.id)}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-strong)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
            <div style={{ width: 40, height: 40, borderRadius: 8, background: 'var(--accent-soft)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon name="building" size={18} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-1)' }}>{a.property.address}</div>
              <div style={{ fontSize: 12, color: 'var(--ink-4)', marginTop: 2 }}>
                {a.property.city}, {a.property.state} · {a.property.type} · by {a.assignee}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="num mono" style={{ fontSize: 14, fontWeight: 600 }}>{formatCurrency(a.submittedTiv || a.property.tiv)}</div>
              <div style={{ fontSize: 11, color: 'var(--warning)', marginTop: 2 }}>+{(5 + (a.id.charCodeAt(2) % 15))}% vs prior</div>
            </div>
            <StatusBadge status={a.status} />
            <div style={{ fontSize: 11, color: 'var(--ink-4)', width: 70, textAlign: 'right' }}>{a.lastActivity}</div>
            <Icon name="chevronRight" size={14} color="var(--ink-4)" />
          </div>
        ))}
      </div>
    </PagePad>
  );
};

// ---------- Form Builder ----------
const ScreenFormBuilder = () => {
  const [selected, setSelected] = React.useState('f-tiv-bldg');
  const [sections, setSections] = React.useState([
    { id: 's1', label: 'Property identity', expanded: true, fields: [
      { id: 'f-addr', label: 'Street address', type: 'address', required: true },
      { id: 'f-occ', label: 'Primary occupancy', type: 'select', required: true, options: ['Warehouse', 'Manufacturing', 'Office', 'Retail'] },
    ]},
    { id: 's2', label: 'COPE attributes', expanded: true, fields: [
      { id: 'f-year', label: 'Year built', type: 'number', required: true },
      { id: 'f-cons', label: 'Construction class', type: 'select', required: true },
      { id: 'f-spr', label: 'Sprinkler coverage', type: 'select' },
    ]},
    { id: 's3', label: 'Values (per building)', expanded: true, repeating: true, fields: [
      { id: 'f-tiv-bldg', label: 'Building replacement', type: 'currency', required: true, validation: '> 0' },
      { id: 'f-tiv-cont', label: 'Contents', type: 'currency', required: true },
      { id: 'f-tiv-bi', label: 'BI (12mo)', type: 'currency' },
      { id: 'f-tiv-tot', label: 'Total TIV', type: 'calculated', formula: 'bldg + contents + bi' },
    ]},
    { id: 's4', label: 'Attachments', expanded: false, fields: [
      { id: 'f-val', label: 'Valuation letter', type: 'file' },
      { id: 'f-photos', label: 'Property photos', type: 'files' },
    ]},
  ]);

  const widgets = [
    { id: 'text', label: 'Text', icon: 'forms' },
    { id: 'number', label: 'Number', icon: 'forms' },
    { id: 'currency', label: 'Currency', icon: 'dollar' },
    { id: 'select', label: 'Select', icon: 'forms' },
    { id: 'multi', label: 'Multi-select', icon: 'forms' },
    { id: 'date', label: 'Date', icon: 'calendar' },
    { id: 'address', label: 'Address + geo', icon: 'mapPin' },
    { id: 'file', label: 'File upload', icon: 'upload' },
    { id: 'repeat', label: 'Repeating group', icon: 'copy' },
    { id: 'calc', label: 'Calculated', icon: 'bolt' },
    { id: 'cond', label: 'Conditional', icon: 'filter' },
  ];

  const allFields = sections.flatMap(s => s.fields);
  const selectedField = allFields.find(f => f.id === selected);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Topbar
        breadcrumb={['Form builder', 'Property / COPE / Exposure']}
        title="Property / COPE / Exposure v3"
        subtitle={<span className="badge badge-blue">Draft</span>}
        actions={<>
          <button className="btn btn-ghost btn-sm"><Icon name="eye" size={13} /> Preview</button>
          <button className="btn btn-secondary btn-sm">Discard</button>
          <button className="btn btn-accent btn-sm">Publish v3</button>
        </>}
      />
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Widget palette */}
        <div style={{ width: 200, background: 'var(--surface-2)', borderRight: '1px solid var(--border)', padding: '18px 14px', overflow: 'auto', flexShrink: 0 }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-4)', marginBottom: 10 }}>Widgets</div>
          {widgets.map(w => (
            <div key={w.id} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px',
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 6, marginBottom: 6, cursor: 'grab', fontSize: 12,
            }}>
              <Icon name={w.icon} size={13} color="var(--ink-4)" /> {w.label}
            </div>
          ))}
        </div>

        {/* Canvas */}
        <div style={{ flex: 1, overflow: 'auto', padding: 24, background: 'var(--bg)' }}>
          <div style={{ maxWidth: 560, margin: '0 auto' }}>
            {sections.map((s, i) => (
              <div key={s.id} className="card" style={{ marginBottom: 12, overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: 'var(--surface-2)', borderBottom: s.expanded ? '1px solid var(--divider)' : 'none' }}>
                  <Icon name="grip" size={14} color="var(--ink-4)" />
                  <div style={{ fontSize: 13, fontWeight: 600, flex: 1 }}>{s.label}</div>
                  {s.repeating && <span className="badge badge-purple" style={{ fontSize: 10 }}>Repeating</span>}
                  <span style={{ fontSize: 11, color: 'var(--ink-4)' }}>{s.fields.length} fields</span>
                  <button className="btn btn-ghost btn-icon btn-sm"><Icon name={s.expanded ? 'chevronDown' : 'chevronRight'} size={12} /></button>
                </div>
                {s.expanded && (
                  <div style={{ padding: 12 }}>
                    {s.fields.map(f => (
                      <div key={f.id} onClick={() => setSelected(f.id)} style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '10px 12px',
                        border: '1px solid ' + (selected === f.id ? 'var(--accent)' : 'var(--border)'),
                        background: selected === f.id ? 'var(--accent-soft)' : 'var(--surface)',
                        borderRadius: 6, marginBottom: 6, cursor: 'pointer',
                      }}>
                        <Icon name="grip" size={12} color="var(--ink-4)" />
                        <div style={{ width: 20, height: 20, borderRadius: 4, background: 'var(--surface-3)', color: 'var(--ink-4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Icon name={f.type === 'currency' ? 'dollar' : f.type === 'calculated' ? 'bolt' : f.type === 'file' ? 'upload' : f.type === 'address' ? 'mapPin' : 'forms'} size={11} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 500 }}>{f.label} {f.required && <span style={{ color: 'var(--danger)' }}>*</span>}</div>
                          <div style={{ fontSize: 11, color: 'var(--ink-4)' }} className="mono">{f.type}{f.formula ? ` · ${f.formula}` : ''}</div>
                        </div>
                      </div>
                    ))}
                    <button className="btn btn-ghost btn-sm" style={{ width: '100%', justifyContent: 'flex-start' }}>
                      <Icon name="plus" size={12} /> Add field or drop a widget
                    </button>
                  </div>
                )}
              </div>
            ))}
            <button className="btn btn-secondary" style={{ width: '100%' }}><Icon name="plus" size={13} /> Add section</button>
          </div>
        </div>

        {/* Inspector */}
        <div style={{ width: 300, background: 'var(--surface)', borderLeft: '1px solid var(--border)', padding: 20, flexShrink: 0, overflow: 'auto' }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-4)', marginBottom: 12 }}>Field settings</div>
          {selectedField ? (
            <>
              <div className="input-group">
                <label className="input-label">Label</label>
                <input className="input" value={selectedField.label} readOnly />
              </div>
              <div className="input-group">
                <label className="input-label">Type</label>
                <select className="select" value={selectedField.type}>
                  {widgets.map(w => <option key={w.id}>{w.id}</option>)}
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">Key (data path)</label>
                <input className="input mono" value={`values.buildings[].${selectedField.id}`} readOnly />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, padding: '6px 0' }}>
                <Checkbox checked={selectedField.required} /> Required
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, padding: '6px 0' }}>
                <Checkbox /> Show in summary
              </label>
              <hr className="hr" />
              <div className="input-group">
                <label className="input-label">Validation</label>
                <input className="input mono" defaultValue={selectedField.validation || ''} placeholder="e.g. > 0" />
              </div>
              <div className="input-group">
                <label className="input-label">Conditional (show if)</label>
                <input className="input mono" placeholder='occupancy == "Warehouse"' />
              </div>
              <div className="input-group">
                <label className="input-label">Help text</label>
                <textarea className="textarea" rows={2} placeholder="Shown below the field" />
              </div>
            </>
          ) : (
            <div style={{ color: 'var(--ink-4)', fontSize: 13 }}>Select a field to edit its settings.</div>
          )}
        </div>
      </div>
    </div>
  );
};

// ---------- Signed-link external flow ----------
const ScreenSignedLink = ({ phase = 'landing', onContinue, onSubmitted }) => {
  const [passcode, setPasscode] = React.useState('');
  const [showForm, setShowForm] = React.useState(phase === 'form');

  if (phase === 'form' || showForm) {
    return <ScreenContributorForm assignmentId="a-102" embedded={false} onSubmitted={onSubmitted} />;
  }

  return (
    <div style={{ height: '100%', background: 'linear-gradient(180deg, #FAFAF7 0%, #F0EFEA 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ maxWidth: 440, width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}><BrandMark size={28} /></div>
        <div className="card" style={{ padding: 32, boxShadow: 'var(--shadow-lg)' }}>
          <div style={{ display: 'inline-flex', padding: '4px 10px', background: 'var(--accent-soft)', color: 'var(--accent-ink)', borderRadius: 12, fontSize: 11, fontWeight: 600, marginBottom: 14, alignItems: 'center', gap: 5 }}>
            <Icon name="lock" size={11} /> SECURE VALUE COLLECTION
          </div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 30, fontWeight: 400, letterSpacing: '-0.01em', marginBottom: 6 }}>
            You've been invited to submit property values
          </h1>
          <div style={{ color: 'var(--ink-3)', fontSize: 14, marginBottom: 20, lineHeight: 1.55 }}>
            <b>Hartwell Global</b> is requesting renewal values for <b className="mono">450 Industrial Pkwy, Columbus OH</b>. Your signed link is valid until <span className="mono">May 14, 2026</span>.
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 20 }}>
            {[
              { icon: 'clock', label: 'Takes ~15 min' },
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
          <button className="btn btn-accent btn-lg" style={{ width: '100%' }} onClick={() => onContinue ? onContinue() : setShowForm(true)}>
            Continue to form <Icon name="arrowRight" size={14} />
          </button>
          <div style={{ marginTop: 20, padding: '12px 14px', background: 'var(--surface-2)', borderRadius: 8, display: 'flex', gap: 10, alignItems: 'center', fontSize: 12, color: 'var(--ink-4)' }}>
            <Icon name="info" size={13} />
            Questions? Contact campaign owner <span className="mono" style={{ color: 'var(--ink-2)' }}>alex.morgan@hartwell.com</span>
          </div>
        </div>
        <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--ink-4)', marginTop: 18 }}>
          Powered by Blue[i] Property · Your data is encrypted in transit and at rest (AES-256)
        </div>
      </div>
    </div>
  );
};

// ---------- Reminder/SLA settings ----------
const ScreenSettings = () => (
  <PagePad>
    <div style={{ marginBottom: 16 }}>
      <h1>Settings</h1>
      <div style={{ color: 'var(--ink-4)', fontSize: 13 }}>Configure reminders, SLA policies, and integrations</div>
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 20 }}>
      <div>
        {[
          { label: 'Reminders & SLA', active: true, icon: 'clock' },
          { label: 'Notification templates', icon: 'mail' },
          { label: 'Roles & permissions', icon: 'users' },
          { label: 'Integrations', icon: 'globe' },
          { label: 'Audit export', icon: 'shield' },
        ].map((s, i) => (
          <div key={i} style={{
            padding: '8px 12px', fontSize: 13, borderRadius: 6, marginBottom: 2,
            background: s.active ? 'var(--ink-1)' : 'transparent',
            color: s.active ? '#fff' : 'var(--ink-3)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
            fontWeight: s.active ? 500 : 400,
          }}>
            <Icon name={s.icon} size={13} /> {s.label}
          </div>
        ))}
      </div>
      <div className="card" style={{ padding: 24 }}>
        <h2 style={{ marginBottom: 4 }}>Reminders & SLA</h2>
        <div style={{ color: 'var(--ink-4)', fontSize: 13, marginBottom: 20 }}>Default schedule applied to new campaigns. Individual campaigns can override.</div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 24 }}>
          <div className="input-group"><label className="input-label">Default SLA (days)</label><input className="input num" defaultValue="21" /></div>
          <div className="input-group"><label className="input-label">Escalate to</label>
            <select className="select"><option>Assignee's manager</option><option>Campaign owner</option></select></div>
          <div className="input-group"><label className="input-label">Timezone</label>
            <select className="select"><option>Campaign's default</option><option>UTC</option></select></div>
        </div>

        <h3 style={{ marginBottom: 12 }}>Default reminder schedule</h3>
        {[
          ['Initial invite', 'Day 0', 'On activation', 'Welcome — value collection'],
          ['First reminder', 'T−7 days', 'before due', 'Default reminder'],
          ['Second reminder', 'T−2 days', 'before due', 'Urgent reminder'],
          ['Escalation', 'T+1 days', 'after breach', 'Escalate to manager'],
          ['Final notice', 'T+5 days', 'after breach', 'Final notice'],
        ].map((r, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '140px 100px 100px 1fr 80px 28px', gap: 10, padding: '12px 14px', background: 'var(--surface-2)', borderRadius: 8, marginBottom: 6, alignItems: 'center' }}>
            <div style={{ fontSize: 13, fontWeight: 500 }}>{r[0]}</div>
            <div className="mono num" style={{ fontSize: 13, color: 'var(--accent)' }}>{r[1]}</div>
            <div style={{ fontSize: 11, color: 'var(--ink-4)' }}>{r[2]}</div>
            <div className="mono" style={{ fontSize: 12, color: 'var(--ink-3)' }}>{r[3]}</div>
            <label style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 5 }}><Checkbox checked /> On</label>
            <button className="btn btn-ghost btn-icon btn-sm"><Icon name="more" size={13} /></button>
          </div>
        ))}
        <button className="btn btn-secondary" style={{ marginTop: 12 }}><Icon name="plus" size={12} /> Add reminder step</button>

        <hr className="hr" />
        <h3 style={{ marginBottom: 10 }}>Breach policy</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <label style={{ display: 'flex', gap: 10, padding: 14, border: '1px solid var(--accent)', background: 'var(--accent-soft)', borderRadius: 8, cursor: 'pointer', alignItems: 'flex-start' }}>
            <input type="radio" checked readOnly style={{ marginTop: 2, accentColor: 'var(--accent)' }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>Escalate & continue</div>
              <div style={{ fontSize: 11, color: 'var(--ink-4)' }}>Notify manager, keep collecting</div>
            </div>
          </label>
          <label style={{ display: 'flex', gap: 10, padding: 14, border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', alignItems: 'flex-start' }}>
            <input type="radio" readOnly style={{ marginTop: 2 }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>Expire & lock</div>
              <div style={{ fontSize: 11, color: 'var(--ink-4)' }}>Freeze assignment at breach</div>
            </div>
          </label>
        </div>
      </div>
    </div>
  </PagePad>
);

Object.assign(window, { ScreenReviewer, ScreenReviewQueue, ScreenFormBuilder, ScreenSignedLink, ScreenSettings });
