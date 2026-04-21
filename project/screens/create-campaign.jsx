// Admin: Create Campaign — multi-step wizard
// ------------------------------------------------------------------
const ScreenCreateCampaign = ({ onCancel, onFinish }) => {
  const store = useStore();
  const toast = useToast();
  const [step, setStep] = React.useState(0);
  const [data, setData] = React.useState({
    name: 'NA Renewal 2026 — Q3',
    owner: 'Alex Morgan',
    description: '',
    portfolios: ['pf-na'],
    regions: ['US West', 'US Central'],
    slaDays: 21,
    dueDate: '2026-08-15',
    timezone: 'America/New_York',
    formSchema: 'property-cope-v3',
    assignMode: 'rule',
    reminderPreset: 'standard',
  });
  const update = (k, v) => setData(d => ({ ...d, [k]: v }));
  const steps = ['Details', 'Scope', 'Form & schedule', 'Assignments', 'Review'];

  const next = () => {
    if (step < steps.length - 1) setStep(step + 1);
    else {
      const newC = {
        id: 'c-' + Math.random().toString(36).slice(2, 7),
        name: data.name,
        owner: data.owner,
        portfolios: data.portfolios,
        properties: 142,
        assignments: 142,
        status: 'draft',
        dueDate: data.dueDate,
        slaDays: data.slaDays,
        progress: { not_started: 142, in_progress: 0, submitted: 0, under_review: 0, approved: 0, rejected: 0 },
        createdAt: '2026-04-20',
        slaBreaches: 0,
      };
      store.addCampaign(newC);
      toast.push('Campaign created as draft', 'success');
      onFinish(newC.id);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Topbar
        breadcrumb={['Campaigns', 'New']}
        title="Create campaign"
        actions={<>
          <button className="btn btn-ghost btn-sm" onClick={onCancel}>Cancel</button>
          <button className="btn btn-secondary btn-sm">Save draft</button>
        </>}
      />
      <div style={{ padding: '24px 28px', borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
        <div style={{ display: 'flex', gap: 4, maxWidth: 720 }}>
          {steps.map((s, i) => (
            <div key={i} style={{ flex: 1, cursor: i <= step ? 'pointer' : 'default' }} onClick={() => i <= step && setStep(i)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <div style={{
                  width: 22, height: 22, borderRadius: 11,
                  background: i < step ? 'var(--positive)' : i === step ? 'var(--ink-1)' : 'var(--surface-3)',
                  color: i <= step ? '#fff' : 'var(--ink-4)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 600,
                }}>{i < step ? <Icon name="check" size={12} /> : i + 1}</div>
                <div style={{ fontSize: 12, fontWeight: i === step ? 600 : 500, color: i === step ? 'var(--ink-1)' : 'var(--ink-4)' }}>{s}</div>
              </div>
              <div style={{ height: 3, background: i <= step ? 'var(--ink-1)' : 'var(--surface-3)', borderRadius: 2 }} />
            </div>
          ))}
        </div>
      </div>
      <div style={{ flex: 1, overflow: 'auto', background: 'var(--bg)' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '28px 20px' }}>
          {step === 0 && <StepDetails data={data} update={update} />}
          {step === 1 && <StepScope data={data} update={update} />}
          {step === 2 && <StepFormSchedule data={data} update={update} />}
          {step === 3 && <StepAssignments data={data} update={update} />}
          {step === 4 && <StepReview data={data} />}
        </div>
      </div>
      <div style={{ padding: '14px 28px', borderTop: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', justifyContent: 'space-between' }}>
        <button className="btn btn-ghost" onClick={() => step > 0 ? setStep(step - 1) : onCancel()}>
          <Icon name="chevronLeft" size={13} /> {step > 0 ? 'Back' : 'Cancel'}
        </button>
        <button className="btn btn-accent" onClick={next}>
          {step < steps.length - 1 ? 'Continue' : 'Create campaign'} <Icon name="chevronRight" size={13} />
        </button>
      </div>
    </div>
  );
};

const WizardCard = ({ title, subtitle, children }) => (
  <div className="card" style={{ padding: 28, marginBottom: 16 }}>
    <h2 style={{ marginBottom: 4 }}>{title}</h2>
    {subtitle && <div style={{ color: 'var(--ink-4)', fontSize: 13, marginBottom: 20 }}>{subtitle}</div>}
    {children}
  </div>
);

const StepDetails = ({ data, update }) => (
  <WizardCard title="Campaign details" subtitle="Identity and ownership">
    <div className="input-group">
      <label className="input-label">Campaign name</label>
      <input className="input" value={data.name} onChange={e => update('name', e.target.value)} />
    </div>
    <div className="input-group">
      <label className="input-label">Description</label>
      <textarea className="textarea" placeholder="Short summary for assignees…" value={data.description} onChange={e => update('description', e.target.value)} />
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
      <div className="input-group">
        <label className="input-label">Owner</label>
        <select className="select" value={data.owner} onChange={e => update('owner', e.target.value)}>
          <option>Alex Morgan</option><option>Jing Chen</option><option>Marcus Hale</option>
        </select>
      </div>
      <div className="input-group">
        <label className="input-label">Business unit</label>
        <select className="select"><option>Global Risk Operations</option><option>EMEA Desk</option></select>
      </div>
    </div>
  </WizardCard>
);

const StepScope = ({ data, update }) => (
  <WizardCard title="Portfolio scope" subtitle="Which properties are in scope">
    <div className="input-group">
      <label className="input-label">Portfolios</label>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {PORTFOLIOS.map(p => {
          const on = data.portfolios.includes(p.id);
          return (
            <label key={p.id} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
              border: '1px solid ' + (on ? 'var(--accent)' : 'var(--border)'),
              background: on ? 'var(--accent-soft)' : 'var(--surface)',
              borderRadius: 8, cursor: 'pointer',
            }}>
              <Checkbox checked={on} onChange={() => update('portfolios', on ? data.portfolios.filter(x => x !== p.id) : [...data.portfolios, p.id])} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-1)' }}>{p.name}</div>
                <div style={{ fontSize: 12, color: 'var(--ink-4)' }}>{p.count} properties</div>
              </div>
              <span className="badge badge-gray">{p.count}</span>
            </label>
          );
        })}
      </div>
    </div>
    <div className="input-group">
      <label className="input-label">Region filter (optional)</label>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {['US West', 'US Central', 'US East', 'Canada', 'LATAM'].map(r => {
          const on = data.regions.includes(r);
          return (
            <button key={r} onClick={() => update('regions', on ? data.regions.filter(x => x !== r) : [...data.regions, r])}
              style={{
                padding: '6px 12px', fontSize: 12, borderRadius: 16,
                border: '1px solid ' + (on ? 'var(--accent)' : 'var(--border-strong)'),
                background: on ? 'var(--accent-soft)' : 'var(--surface)',
                color: on ? 'var(--accent-ink)' : 'var(--ink-2)',
                cursor: 'pointer', fontFamily: 'inherit',
              }}>
              {on && <Icon name="check" size={11} style={{ verticalAlign: -1, marginRight: 4 }} />}{r}
            </button>
          );
        })}
      </div>
    </div>
    <div style={{ padding: 14, background: 'var(--accent-soft)', borderRadius: 8, display: 'flex', gap: 12, alignItems: 'center' }}>
      <Icon name="info" size={16} color="var(--accent)" />
      <div style={{ fontSize: 13, color: 'var(--accent-ink)' }}>
        <b>142 properties</b> matched — 1 portfolio, 2 regions, active status
      </div>
    </div>
  </WizardCard>
);

const StepFormSchedule = ({ data, update }) => (
  <>
    <WizardCard title="Form schema" subtitle="Which form do contributors fill out">
      {[
        { id: 'property-cope-v3', name: 'Property / COPE / Exposure v3', desc: '48 fields · includes TIV, BI, contents, construction, occupancy', active: true },
        { id: 'oed-aligned-v1', name: 'OED-aligned schema v1', desc: '62 fields · Open Exposure Data standard fields', active: false },
        { id: 'lite-v2', name: 'Lite renewal v2', desc: '24 fields · for low-TIV properties only', active: false },
      ].map(f => {
        const on = data.formSchema === f.id;
        return (
          <label key={f.id} style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
            border: '1px solid ' + (on ? 'var(--accent)' : 'var(--border)'),
            background: on ? 'var(--accent-soft)' : 'var(--surface)',
            borderRadius: 8, marginBottom: 8, cursor: 'pointer',
          }}>
            <input type="radio" checked={on} onChange={() => update('formSchema', f.id)} style={{ accentColor: 'var(--accent)' }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-1)' }}>{f.name}</div>
              <div style={{ fontSize: 12, color: 'var(--ink-4)' }}>{f.desc}</div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={e => e.preventDefault()}><Icon name="eye" size={12} /> Preview</button>
          </label>
        );
      })}
    </WizardCard>
    <WizardCard title="Schedule" subtitle="When the campaign runs">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        <div className="input-group">
          <label className="input-label">Start date</label>
          <input className="input" type="date" defaultValue="2026-04-25" />
        </div>
        <div className="input-group">
          <label className="input-label">Due date</label>
          <input className="input" type="date" value={data.dueDate} onChange={e => update('dueDate', e.target.value)} />
        </div>
        <div className="input-group">
          <label className="input-label">SLA (days)</label>
          <input className="input" type="number" value={data.slaDays} onChange={e => update('slaDays', +e.target.value)} />
        </div>
      </div>
      <div className="input-group">
        <label className="input-label">Reminder preset</label>
        <select className="select" value={data.reminderPreset} onChange={e => update('reminderPreset', e.target.value)}>
          <option value="standard">Standard (Invite → T−7 → T−2 → T+1 escalation)</option>
          <option value="aggressive">Aggressive (Invite → T−14 → T−7 → T−3 → T−1 → Daily after)</option>
          <option value="minimal">Minimal (Invite → T−2 only)</option>
          <option value="custom">Custom…</option>
        </select>
      </div>
    </WizardCard>
  </>
);

const StepAssignments = ({ data, update }) => (
  <WizardCard title="Assignments" subtitle="How properties get assigned to contributors">
    <div className="input-group">
      <label className="input-label">Assignment mode</label>
      {[
        { id: 'rule', label: 'Rule-based', desc: 'Auto-assign based on property attributes (region, occupancy, business unit)' },
        { id: 'manual', label: 'Manual', desc: 'Pick assignees per property in a spreadsheet view' },
        { id: 'csv', label: 'Import CSV', desc: 'Upload property → assignee mapping' },
      ].map(m => {
        const on = data.assignMode === m.id;
        return (
          <label key={m.id} style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
            border: '1px solid ' + (on ? 'var(--accent)' : 'var(--border)'),
            background: on ? 'var(--accent-soft)' : 'var(--surface)',
            borderRadius: 8, marginBottom: 6, cursor: 'pointer',
          }}>
            <input type="radio" checked={on} onChange={() => update('assignMode', m.id)} style={{ accentColor: 'var(--accent)' }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-1)' }}>{m.label}</div>
              <div style={{ fontSize: 12, color: 'var(--ink-4)' }}>{m.desc}</div>
            </div>
          </label>
        );
      })}
    </div>

    {/* Link model — NEW */}
    <div className="input-group" style={{ marginTop: 20 }}>
      <label className="input-label">External link model</label>
      <div style={{ fontSize: 11, color: 'var(--ink-4)', marginBottom: 8 }}>How a contributor accesses multiple assigned locations</div>
      {[
        { id: 'bundled', label: 'One link per contributor (recommended)', desc: 'Contributor gets a single signed link → portfolio of their locations. Each location still submits + reviews independently.', badge: 'Fewer emails' },
        { id: 'perloc', label: 'One link per location', desc: 'Every assignment gets its own link and passcode. Tighter blast radius; N emails per contributor.', badge: 'Max isolation' },
      ].map(m => {
        const on = (data.linkModel || 'bundled') === m.id;
        return (
          <label key={m.id} style={{
            display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 14px',
            border: '1px solid ' + (on ? 'var(--accent)' : 'var(--border)'),
            background: on ? 'var(--accent-soft)' : 'var(--surface)',
            borderRadius: 8, marginBottom: 6, cursor: 'pointer',
          }}>
            <input type="radio" checked={on} onChange={() => update('linkModel', m.id)} style={{ marginTop: 3, accentColor: 'var(--accent)' }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-1)', display: 'flex', alignItems: 'center', gap: 8 }}>
                {m.label}
                <span className="badge badge-blue" style={{ fontSize: 10 }}>{m.badge}</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--ink-4)', marginTop: 2 }}>{m.desc}</div>
            </div>
          </label>
        );
      })}
      <div style={{ marginTop: 10, padding: '10px 12px', background: 'var(--surface-2)', borderRadius: 8, fontSize: 12, color: 'var(--ink-3)', display: 'flex', gap: 10, alignItems: 'center' }}>
        <Icon name="info" size={13} color="var(--accent)" />
        {(data.linkModel || 'bundled') === 'bundled'
          ? <>Will send <b className="mono">~24</b> links (unique contributors) covering <b className="mono">142</b> locations.</>
          : <>Will send <b className="mono">142</b> individual links — one per location.</>}
      </div>
    </div>

    {data.assignMode === 'rule' && (
      <div style={{ marginTop: 12, padding: 16, border: '1px dashed var(--border-strong)', borderRadius: 8 }}>
        <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 10, color: 'var(--ink-3)' }}>Rules</div>
        {[
          { cond: 'Region = US West', to: 'Marcus Hale (internal)' },
          { cond: 'Occupancy = Cold storage', to: 'Sam Okafor (external broker)' },
          { cond: 'TIV > $50M', to: 'Jing Chen + reviewer routing' },
        ].map((r, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
            <span className="badge badge-gray" style={{ minWidth: 'auto' }}>IF</span>
            <input className="input" value={r.cond} readOnly style={{ flex: 1, fontSize: 12 }} />
            <span className="badge badge-blue">ASSIGN</span>
            <input className="input" value={r.to} readOnly style={{ flex: 1, fontSize: 12 }} />
            <button className="btn btn-ghost btn-sm btn-icon"><Icon name="x" size={13} /></button>
          </div>
        ))}
        <button className="btn btn-secondary btn-sm"><Icon name="plus" size={12} /> Add rule</button>
      </div>
    )}
  </WizardCard>
);

const StepReview = ({ data }) => (
  <WizardCard title="Review & launch" subtitle="Confirm details before creating the campaign">
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
      {[
        ['Name', data.name], ['Owner', data.owner],
        ['Portfolios', data.portfolios.length + ' selected (142 properties)'],
        ['Regions', data.regions.join(', ')],
        ['Form schema', data.formSchema],
        ['Due date', data.dueDate], ['SLA', 'T+' + data.slaDays + ' days'],
        ['Reminders', data.reminderPreset],
        ['Assignment', data.assignMode], ['Timezone', data.timezone],
      ].map(([k, v]) => (
        <div key={k} style={{ padding: '12px 14px', background: 'var(--surface-2)', borderRadius: 8 }}>
          <div style={{ fontSize: 11, color: 'var(--ink-4)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>{k}</div>
          <div style={{ fontSize: 13, color: 'var(--ink-1)', fontWeight: 500 }}>{v}</div>
        </div>
      ))}
    </div>
    <div style={{ marginTop: 16, padding: 14, background: 'var(--warning-soft)', borderRadius: 8, display: 'flex', gap: 12, alignItems: 'center' }}>
      <Icon name="info" size={16} color="var(--warning)" />
      <div style={{ fontSize: 13, color: 'var(--warning)' }}>
        Campaign will be created in <b>Draft</b> state. Activate to send initial invites to 142 assignees.
      </div>
    </div>
  </WizardCard>
);

Object.assign(window, { ScreenCreateCampaign });
