// Contributor: COPE / TIV form with repeating buildings
// ------------------------------------------------------------------
const ScreenContributorForm = ({ assignmentId, embedded, onExit, onSubmitted }) => {
  const store = useStore();
  const toast = useToast();
  const a = store.assignments.find(x => x.id === assignmentId) || store.assignments[1];
  const [section, setSection] = React.useState('identity');
  const [saved, setSaved] = React.useState('Saved 12s ago');
  const [buildings, setBuildings] = React.useState([
    { id: 'b1', name: 'Main warehouse', area: 248000, stories: 1, yearBuilt: 1998, construction: 'Steel frame',
      tivBldg: 14200000, tivContents: 3800000, tivBi: 2100000, sprinklered: true, photos: 2 },
    { id: 'b2', name: 'Admin office', area: 18500, stories: 2, yearBuilt: 2004, construction: 'Masonry',
      tivBldg: 1900000, tivContents: 420000, tivBi: 180000, sprinklered: true, photos: 0 },
  ]);
  const [propertyInfo, setPropertyInfo] = React.useState({
    address: a.property.address, city: a.property.city, state: a.property.state,
    country: a.property.country, occupancy: a.property.type, totalArea: 266500,
  });
  const [showUpload, setShowUpload] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);

  React.useEffect(() => {
    const t = setInterval(() => setSaved('Saved just now'), 5000);
    return () => clearInterval(t);
  }, []);

  const tivTotal = buildings.reduce((s, b) => s + b.tivBldg + b.tivContents + b.tivBi, 0);
  const tivBldgTotal = buildings.reduce((s, b) => s + b.tivBldg, 0);
  const tivContentsTotal = buildings.reduce((s, b) => s + b.tivContents, 0);
  const tivBiTotal = buildings.reduce((s, b) => s + b.tivBi, 0);

  const addBuilding = () => setBuildings(bs => [...bs, {
    id: 'b' + (bs.length + 1), name: `Building ${bs.length + 1}`, area: 0, stories: 1, yearBuilt: 2000,
    construction: 'Steel frame', tivBldg: 0, tivContents: 0, tivBi: 0, sprinklered: false, photos: 0,
  }]);
  const removeBuilding = (id) => setBuildings(bs => bs.filter(b => b.id !== id));
  const updateBldg = (id, patch) => setBuildings(bs => bs.map(b => b.id === id ? { ...b, ...patch } : b));

  const doSubmit = () => {
    store.updateAssignment(a.id, { status: 'submitted', submittedTiv: tivTotal });
    setSubmitted(true);
    toast.push('Submitted for review', 'success');
    setTimeout(() => onSubmitted && onSubmitted(), 1800);
  };

  if (submitted) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, background: 'var(--bg)' }}>
        <div style={{ width: 64, height: 64, borderRadius: 32, background: 'var(--positive-soft)', color: 'var(--positive)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="check" size={28} />
        </div>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 28, fontWeight: 400 }}>Submitted for review</h2>
        <div style={{ color: 'var(--ink-4)', fontSize: 14, textAlign: 'center', maxWidth: 380 }}>
          Thank you. Priya Shah will review your submission. You'll be notified by email when there's an update.
        </div>
        <div className="mono" style={{ fontSize: 12, color: 'var(--ink-4)', marginTop: 8 }}>Submission #{a.id}</div>
      </div>
    );
  }

  const sections = [
    { id: 'identity', label: 'Property identity', done: true },
    { id: 'cope', label: 'COPE attributes', done: true },
    { id: 'values', label: 'Values (TIV/BI)', done: buildings.every(b => b.tivBldg > 0), required: true },
    { id: 'exposure', label: 'Exposure & hazards', done: false },
    { id: 'attachments', label: 'Attachments', done: buildings.some(b => b.photos > 0) },
    { id: 'review', label: 'Review & submit', done: false },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg)' }}>
      {embedded ? (
        <Topbar
          breadcrumb={['Assignments', a.property.address]}
          title={a.property.address}
          subtitle={<span className="badge badge-blue"><span className="badge-dot" style={{ background: 'var(--accent)' }} />Draft</span>}
          actions={<>
            <span style={{ fontSize: 12, color: 'var(--ink-4)', display: 'flex', alignItems: 'center', gap: 5 }}>
              <Icon name="check" size={12} color="var(--positive)" /> {saved}
            </span>
            <button className="btn btn-ghost btn-sm" onClick={onExit}>Close</button>
            <button className="btn btn-secondary btn-sm"><Icon name="save" size={13} /> Save draft</button>
            <button className="btn btn-accent btn-sm" onClick={doSubmit}><Icon name="send" size={13} /> Submit for review</button>
          </>}
        />
      ) : (
        <div style={{ padding: '14px 28px', background: 'var(--surface)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <BrandMark />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 12, color: 'var(--ink-4)', display: 'flex', alignItems: 'center', gap: 5 }}>
              <Icon name="check" size={12} color="var(--positive)" /> {saved}
            </span>
            <button className="btn btn-secondary btn-sm"><Icon name="save" size={13} /> Save draft</button>
            <button className="btn btn-accent btn-sm" onClick={doSubmit}><Icon name="send" size={13} /> Submit</button>
          </div>
        </div>
      )}

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Form nav */}
        <div style={{ width: 240, borderRight: '1px solid var(--border)', background: 'var(--surface)', padding: '20px 12px', flexShrink: 0, overflow: 'auto' }}>
          <div style={{ padding: '0 12px 12px', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ink-4)', fontWeight: 600 }}>Form progress</div>
          {sections.map(s => (
            <div key={s.id} onClick={() => setSection(s.id)} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', margin: '1px 0',
              background: section === s.id ? 'var(--surface-2)' : 'transparent',
              borderLeft: '2px solid ' + (section === s.id ? 'var(--accent)' : 'transparent'),
              color: 'var(--ink-2)', fontSize: 13, cursor: 'pointer',
            }}>
              <div style={{
                width: 16, height: 16, borderRadius: 8,
                background: s.done ? 'var(--positive)' : 'var(--surface-3)',
                color: s.done ? '#fff' : 'var(--ink-4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10,
              }}>{s.done ? <Icon name="check" size={10} /> : ''}</div>
              <span style={{ flex: 1, fontWeight: section === s.id ? 600 : 400 }}>{s.label}</span>
              {s.required && !s.done && <span style={{ color: 'var(--danger)', fontSize: 14 }}>•</span>}
            </div>
          ))}
          <hr className="hr" />
          <div style={{ padding: '8px 12px' }}>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ink-4)', fontWeight: 600, marginBottom: 6 }}>Running totals</div>
            <div style={{ fontSize: 12, color: 'var(--ink-4)', marginBottom: 4 }}>Total TIV</div>
            <div className="num" style={{ fontSize: 20, fontWeight: 600, color: 'var(--ink-1)', letterSpacing: '-0.01em' }}>{formatCurrencyFull(tivTotal)}</div>
            <div style={{ fontSize: 11, color: 'var(--ink-4)', marginTop: 8, lineHeight: 1.6 }}>
              <div>Building · <span className="mono num">{formatCurrency(tivBldgTotal)}</span></div>
              <div>Contents · <span className="mono num">{formatCurrency(tivContentsTotal)}</span></div>
              <div>BI · <span className="mono num">{formatCurrency(tivBiTotal)}</span></div>
            </div>
          </div>
        </div>

        {/* Form body */}
        <div style={{ flex: 1, overflow: 'auto', padding: '28px 40px' }}>
          <div style={{ maxWidth: 720, margin: '0 auto' }}>
            {section === 'identity' && (
              <>
                <h2 style={{ marginBottom: 4 }}>Property identity</h2>
                <div style={{ color: 'var(--ink-4)', fontSize: 13, marginBottom: 20 }}>Confirm or update the property's basic information.</div>
                <div className="card" style={{ padding: 24 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 12 }}>
                    <div className="input-group"><label className="input-label">Street address</label>
                      <input className="input" value={propertyInfo.address} onChange={e => setPropertyInfo(p => ({ ...p, address: e.target.value }))} /></div>
                    <div className="input-group"><label className="input-label">City</label>
                      <input className="input" value={propertyInfo.city} onChange={e => setPropertyInfo(p => ({ ...p, city: e.target.value }))} /></div>
                    <div className="input-group"><label className="input-label">State</label>
                      <input className="input" value={propertyInfo.state} onChange={e => setPropertyInfo(p => ({ ...p, state: e.target.value }))} /></div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                    <div className="input-group"><label className="input-label">Country</label>
                      <select className="select" value={propertyInfo.country}><option>US</option><option>CA</option><option>MX</option></select></div>
                    <div className="input-group"><label className="input-label">Primary occupancy</label>
                      <select className="select" value={propertyInfo.occupancy}>
                        <option>Warehouse</option><option>Manufacturing</option><option>Office tower</option><option>Cold storage</option><option>Retail</option>
                      </select></div>
                    <div className="input-group"><label className="input-label">Total area (sq ft)</label>
                      <input className="input mono" type="number" value={propertyInfo.totalArea} /></div>
                  </div>
                  <div style={{ padding: 12, background: 'var(--surface-2)', borderRadius: 8, display: 'flex', gap: 10, alignItems: 'center' }}>
                    <Icon name="mapPin" size={16} color="var(--accent)" />
                    <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>
                      Geocoded to <span className="mono">33.749°N, 84.388°W</span> · Cook County, GA
                    </div>
                    <button className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto' }}>View on map</button>
                  </div>
                </div>
              </>
            )}

            {section === 'cope' && (
              <>
                <h2 style={{ marginBottom: 4 }}>COPE attributes</h2>
                <div style={{ color: 'var(--ink-4)', fontSize: 13, marginBottom: 20 }}>Construction, Occupancy, Protection, Exposure.</div>
                <div className="card" style={{ padding: 24 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Construction</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                    <div className="input-group"><label className="input-label">Construction class</label>
                      <select className="select"><option>Class 2 — Non-combustible</option></select></div>
                    <div className="input-group"><label className="input-label">Year built</label>
                      <input className="input num" type="number" defaultValue="1998" /></div>
                    <div className="input-group"><label className="input-label">Roof type</label>
                      <select className="select"><option>Metal deck</option><option>BUR</option><option>SPF</option></select></div>
                  </div>
                  <hr className="hr" />
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Protection</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div className="input-group"><label className="input-label">Sprinkler coverage</label>
                      <select className="select"><option>Full (100%)</option><option>Partial</option><option>None</option></select></div>
                    <div className="input-group"><label className="input-label">Public protection class</label>
                      <input className="input num" defaultValue="3" /></div>
                  </div>
                  <div style={{ display: 'flex', gap: 18, padding: '8px 0' }}>
                    {['Fire alarm', 'Burglar alarm', 'Gas detection', 'On-site fire brigade'].map((l, i) => (
                      <label key={i} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13 }}>
                        <Checkbox checked={i < 3} onChange={() => {}} /> {l}
                      </label>
                    ))}
                  </div>
                </div>
              </>
            )}

            {section === 'values' && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <h2>Values (TIV / Contents / BI)</h2>
                  <button className="btn btn-secondary btn-sm" onClick={addBuilding}><Icon name="plus" size={13} /> Add building</button>
                </div>
                <div style={{ color: 'var(--ink-4)', fontSize: 13, marginBottom: 20 }}>Report one row per building. Totals recalculate automatically.</div>

                {buildings.map((b, i) => (
                  <BuildingRow key={b.id} b={b} idx={i} onUpdate={patch => updateBldg(b.id, patch)} onRemove={() => removeBuilding(b.id)} canRemove={buildings.length > 1} onUpload={() => setShowUpload(true)} />
                ))}

                {/* Totals card */}
                <div className="card" style={{ padding: 20, background: 'var(--ink-1)', color: '#fff', border: 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.6, fontWeight: 600 }}>Property total</div>
                    <span style={{ fontSize: 11, background: 'rgba(255,255,255,.12)', color: '#fff', padding: '2px 8px', borderRadius: 4 }} className="mono">Calculated</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                    {[
                      ['Buildings', formatCurrencyFull(tivBldgTotal)],
                      ['Contents', formatCurrencyFull(tivContentsTotal)],
                      ['BI (12mo)', formatCurrencyFull(tivBiTotal)],
                      ['Total TIV', formatCurrencyFull(tivTotal)],
                    ].map(([k, v], i) => (
                      <div key={k} style={{ padding: i === 3 ? '0 0 0 16px' : 0, borderLeft: i === 3 ? '1px solid rgba(255,255,255,.15)' : 'none' }}>
                        <div style={{ fontSize: 11, opacity: 0.6, marginBottom: 2 }}>{k}</div>
                        <div className="num" style={{ fontSize: i === 3 ? 22 : 17, fontWeight: 600, letterSpacing: '-0.01em' }}>{v}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ marginTop: 12, padding: 12, background: 'var(--warning-soft)', borderRadius: 8, display: 'flex', gap: 10, alignItems: 'center', fontSize: 13 }}>
                  <Icon name="info" size={14} color="var(--warning)" />
                  <div style={{ color: 'var(--warning)', fontSize: 12 }}>
                    Total TIV is <b>+12.6% vs prior year</b> ($18.5M → $22.6M). Required evidence: attach a valuation letter or construction documents.
                  </div>
                </div>
              </>
            )}

            {section === 'exposure' && <ExposureSection />}
            {section === 'attachments' && <AttachmentsSection onUpload={() => setShowUpload(true)} />}
            {section === 'review' && <FormReviewSection buildings={buildings} tivTotal={tivTotal} onSubmit={doSubmit} />}
          </div>
        </div>
      </div>

      {showUpload && <UploadModal onClose={() => setShowUpload(false)} onDone={() => { setShowUpload(false); toast.push('3 files uploaded', 'success'); }} />}
    </div>
  );
};

const BuildingRow = ({ b, idx, onUpdate, onRemove, canRemove, onUpload }) => {
  const [expanded, setExpanded] = React.useState(idx === 0);
  const total = b.tivBldg + b.tivContents + b.tivBi;
  return (
    <div className="card" style={{ marginBottom: 10, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', background: 'var(--surface-2)', borderBottom: expanded ? '1px solid var(--divider)' : 'none', gap: 10 }}>
        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setExpanded(!expanded)} style={{ flexShrink: 0 }}>
          <Icon name={expanded ? 'chevronDown' : 'chevronRight'} size={13} />
        </button>
        <div style={{ width: 26, height: 26, borderRadius: 6, background: 'var(--accent-soft)', color: 'var(--accent-ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600 }}>
          {idx + 1}
        </div>
        <input className="input" value={b.name} onChange={e => onUpdate({ name: e.target.value })} style={{ flex: 1, border: 'none', background: 'transparent', fontWeight: 600, fontSize: 14 }} />
        <span className="num" style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-1)' }}>{formatCurrencyFull(total)}</span>
        {canRemove && <button className="btn btn-ghost btn-icon btn-sm" onClick={onRemove}><Icon name="trash" size={13} /></button>}
      </div>
      {expanded && (
        <div style={{ padding: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12 }}>
            <div className="input-group"><label className="input-label">Floor area (sq ft)</label>
              <input className="input num" type="number" value={b.area} onChange={e => onUpdate({ area: +e.target.value })} /></div>
            <div className="input-group"><label className="input-label">Stories</label>
              <input className="input num" type="number" value={b.stories} onChange={e => onUpdate({ stories: +e.target.value })} /></div>
            <div className="input-group"><label className="input-label">Year built</label>
              <input className="input num" type="number" value={b.yearBuilt} onChange={e => onUpdate({ yearBuilt: +e.target.value })} /></div>
            <div className="input-group"><label className="input-label">Construction</label>
              <select className="select" value={b.construction} onChange={e => onUpdate({ construction: e.target.value })}>
                <option>Steel frame</option><option>Masonry</option><option>Wood frame</option><option>Concrete</option>
              </select></div>
          </div>
          <div style={{ padding: 14, background: 'var(--accent-soft)', borderRadius: 8, marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: 'var(--accent-ink)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Values</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <div className="input-group" style={{ margin: 0 }}><label className="input-label">Building replacement</label>
                <CurrencyInput value={b.tivBldg} onChange={v => onUpdate({ tivBldg: v })} /></div>
              <div className="input-group" style={{ margin: 0 }}><label className="input-label">Contents</label>
                <CurrencyInput value={b.tivContents} onChange={v => onUpdate({ tivContents: v })} /></div>
              <div className="input-group" style={{ margin: 0 }}><label className="input-label">BI (12 months)</label>
                <CurrencyInput value={b.tivBi} onChange={v => onUpdate({ tivBi: v })} /></div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 14, paddingTop: 4 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
              <Checkbox checked={b.sprinklered} onChange={v => onUpdate({ sprinklered: v })} /> Sprinklered
            </label>
            <button className="btn btn-ghost btn-sm" onClick={onUpload}>
              <Icon name="camera" size={13} /> {b.photos > 0 ? `${b.photos} photos attached` : 'Add photos'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const CurrencyInput = ({ value, onChange }) => (
  <div style={{ position: 'relative' }}>
    <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-4)', fontSize: 13 }}>$</span>
    <input className="input mono num" type="number" value={value} onChange={e => onChange(+e.target.value)} style={{ paddingLeft: 22 }} />
  </div>
);

const ExposureSection = () => (
  <>
    <h2 style={{ marginBottom: 4 }}>Exposure & hazards</h2>
    <div style={{ color: 'var(--ink-4)', fontSize: 13, marginBottom: 20 }}>Natural catastrophe exposures and adjacent hazards.</div>
    <div className="card" style={{ padding: 24 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div className="input-group"><label className="input-label">Flood zone (FEMA)</label>
          <select className="select"><option>X — minimal</option><option>AE</option><option>VE</option></select></div>
        <div className="input-group"><label className="input-label">Distance to coast (mi)</label>
          <input className="input num" defaultValue="284" /></div>
        <div className="input-group"><label className="input-label">Seismic zone</label>
          <select className="select"><option>Zone 1</option><option>Zone 2</option><option>Zone 3</option><option>Zone 4</option></select></div>
        <div className="input-group"><label className="input-label">Wildfire risk (1–5)</label>
          <select className="select"><option>2 — Low</option></select></div>
      </div>
      <hr className="hr" />
      <div className="input-group">
        <label className="input-label">Adjacent hazards</label>
        <textarea className="textarea" placeholder="e.g. chemical plant 0.8mi NW; rail line 200ft E…" />
      </div>
    </div>
  </>
);

const AttachmentsSection = ({ onUpload }) => (
  <>
    <h2 style={{ marginBottom: 4 }}>Attachments</h2>
    <div style={{ color: 'var(--ink-4)', fontSize: 13, marginBottom: 20 }}>Photos, site plans, valuation letters, inspection reports.</div>
    <div className="card" style={{ padding: 24 }}>
      <div onClick={onUpload} style={{
        border: '2px dashed var(--border-strong)', borderRadius: 12, padding: '32px 20px',
        textAlign: 'center', cursor: 'pointer', background: 'var(--surface-2)',
        transition: 'border-color .15s, background .15s',
      }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.background = 'var(--accent-soft)'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.background = 'var(--surface-2)'; }}>
        <Icon name="upload" size={24} color="var(--ink-4)" />
        <div style={{ fontSize: 14, fontWeight: 500, marginTop: 10, color: 'var(--ink-1)' }}>Drop files or click to upload</div>
        <div style={{ fontSize: 12, color: 'var(--ink-4)', marginTop: 4 }}>PDF, JPG, PNG, DWG up to 25MB</div>
      </div>
      <div style={{ marginTop: 16 }}>
        {[
          { name: 'valuation-letter-2025.pdf', type: 'file', size: '284 KB', icon: 'file' },
          { name: 'aerial-north-elevation.jpg', type: 'image', size: '1.2 MB', icon: 'image' },
          { name: 'sprinkler-certificate.pdf', type: 'file', size: '92 KB', icon: 'file' },
        ].map((f, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < 2 ? '1px solid var(--divider)' : 'none' }}>
            <div style={{ width: 36, height: 36, borderRadius: 6, background: 'var(--surface-2)', color: 'var(--ink-3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name={f.icon} size={16} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-1)' }} className="mono">{f.name}</div>
              <div style={{ fontSize: 11, color: 'var(--ink-4)' }}>{f.size} · Uploaded Apr 18 · <span style={{ color: 'var(--positive)' }}>✓ AV scanned</span></div>
            </div>
            <button className="btn btn-ghost btn-icon btn-sm"><Icon name="eye" size={13} /></button>
            <button className="btn btn-ghost btn-icon btn-sm"><Icon name="trash" size={13} /></button>
          </div>
        ))}
      </div>
    </div>
  </>
);

const FormReviewSection = ({ buildings, tivTotal, onSubmit }) => (
  <>
    <h2 style={{ marginBottom: 4 }}>Review & submit</h2>
    <div style={{ color: 'var(--ink-4)', fontSize: 13, marginBottom: 20 }}>Confirm your submission. You'll be able to edit again if the reviewer rejects.</div>
    <div className="card" style={{ padding: 24, marginBottom: 14 }}>
      <h3 style={{ marginBottom: 14 }}>Summary</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {[
          ['Buildings', buildings.length], ['Total TIV', formatCurrencyFull(tivTotal)],
          ['Attachments', '3 files'], ['Fields completed', '46 / 48'],
          ['Change vs prior year', '+12.6%'], ['Required evidence', '✓ Attached'],
        ].map(([k, v]) => (
          <div key={k} style={{ padding: 12, background: 'var(--surface-2)', borderRadius: 8 }}>
            <div style={{ fontSize: 11, color: 'var(--ink-4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{k}</div>
            <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink-1)' }}>{v}</div>
          </div>
        ))}
      </div>
    </div>
    <div className="card" style={{ padding: 24 }}>
      <div className="input-group">
        <label className="input-label">Comments for reviewer (optional)</label>
        <textarea className="textarea" placeholder="Context on material changes, assumptions…" />
      </div>
      <label style={{ display: 'flex', gap: 10, fontSize: 13, color: 'var(--ink-2)', marginTop: 8 }}>
        <Checkbox checked={true} onChange={() => {}} />
        <span>I confirm that the information provided is accurate to the best of my knowledge.</span>
      </label>
      <button className="btn btn-accent btn-lg" style={{ marginTop: 18 }} onClick={onSubmit}>
        <Icon name="send" size={14} /> Submit for review
      </button>
    </div>
  </>
);

const UploadModal = ({ onClose, onDone }) => {
  const [progress, setProgress] = React.useState(0);
  React.useEffect(() => {
    let v = 0;
    const t = setInterval(() => { v = Math.min(100, v + 12); setProgress(v); if (v >= 100) { clearInterval(t); setTimeout(onDone, 400); } }, 120);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div style={{ padding: 24 }}>
          <h2 style={{ marginBottom: 14 }}>Uploading photos</h2>
          {[
            { name: 'north-elevation-4k.jpg', size: '3.2 MB' },
            { name: 'interior-storage-bay.jpg', size: '2.1 MB' },
            { name: 'sprinkler-riser.jpg', size: '1.8 MB' },
          ].map((f, i) => (
            <div key={i} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                <span style={{ color: 'var(--ink-2)' }} className="mono">{f.name}</span>
                <span style={{ color: 'var(--ink-4)' }} className="num">{f.size}</span>
              </div>
              <ProgressBar value={progress} color={progress === 100 ? 'green' : ''} />
            </div>
          ))}
          <div style={{ fontSize: 12, color: 'var(--ink-4)', display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}>
            <Icon name="shield" size={13} color="var(--positive)" />
            Files are virus-scanned and encrypted at rest.
          </div>
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { ScreenContributorForm });
