// screens-modal.jsx — Edit Punch Modal wireframes (admin context)

// Backdrop helper — renders a faint "page underneath" so the modal feels in context.
function BackdropPage({ children, blur = true }) {
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, filter: blur ? 'blur(2.5px)' : 'none', opacity: 0.55, pointerEvents: 'none' }}>
        <AppShell persona="admin" active="attendance"
          title="Attendance · Tue Oct 14"
          subtitle="Live punch feed"
          actions={<><Btn variant="outline"><Icon kind="download" size={13}/> Export</Btn></>}
          dense>
          <Card p={0} style={{ flex: 1 }}>
            <Table
              cols={[
                { k: 'name', label: 'Employee', w: '1.4fr' },
                { k: 'dept', label: 'Dept', w: '0.7fr' },
                { k: 'in', label: 'In', w: '0.6fr', mono: true },
                { k: 'out', label: 'Out', w: '0.6fr', mono: true },
                { k: 'hrs', label: 'Hours', w: '0.7fr', mono: true },
                { k: 'status', label: 'Status', w: '0.9fr' },
              ]}
              rows={ATT_ROWS.map(r => ({ ...r, name: r.name }))}
              dense
            />
          </Card>
        </AppShell>
      </div>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(20,18,14,0.45)' }}/>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// EDIT PUNCH · Variation A — Classic centered modal
// ─────────────────────────────────────────────────────────────────────
function EditPunchA() {
  return (
    <div className="wf-root" style={{ width: '100%', height: '100%', position: 'relative' }}>
      <BackdropPage>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 28 }}>
          <Card p={0} className="wf-modal" style={{ width: 540, maxHeight: '100%', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 80px rgba(0,0,0,.25)' }}>
            {/* header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', borderBottom: '1px solid var(--line-mute)' }}>
              <Avatar initials="CR" size={36} tone="dark"/>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 600 }}>Edit punch — Carlos Reyes</div>
                <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>Operations · Tue Oct 14</div>
              </div>
              <Icon kind="close" size={14} color="var(--ink-soft)"/>
            </div>

            {/* body */}
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* reason chip */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 10, background: 'var(--accent-soft)', border: '1px solid var(--accent)' }}>
                <Icon kind="info" size={14} color="var(--accent)"/>
                <div style={{ fontSize: 12, color: 'var(--accent)' }}><b>Late by 23m</b> — original punch 09:23. Adjust below if needed.</div>
              </div>

              {/* time fields */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Input label="Clock in" value="09:00" h={42}/>
                <Input label="Clock out" value="—" placeholder="not yet" h={42}/>
                <Input label="Break (mm)" value="0:30" h={42}/>
                <Input label="Hours" value="auto · 5h 24m" h={42} style={{ opacity: 0.7 }}/>
              </div>

              {/* reason */}
              <Input label="Reason for change" value="Train delay (approved by manager)"/>

              {/* metadata */}
              <div style={{ background: 'var(--paper-2)', border: '1px dashed var(--line-soft)', padding: 12 }}>
                <div style={{ fontSize: 11, color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Audit</div>
                <div style={{ fontSize: 12, color: 'var(--ink-soft)', fontFamily: 'var(--font-mono)', lineHeight: 1.6 }}>
                  Created · 09:23:14 · device: mobile · ip 10.0.4.21<br/>
                  Edited by · Mira J. (admin) · Today 14:08<br/>
                  Previous · 09:23 → 09:00
                </div>
              </div>

              {/* notify */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--ink-soft)' }}>
                <span style={{ width: 14, height: 14, border: '1px solid var(--line)', background: 'var(--ink)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>✓</span>
                Notify employee of this edit
              </div>
            </div>

            {/* footer */}
            <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', padding: '14px 20px', borderTop: '1px solid var(--line-mute)' }}>
              <Btn variant="danger" h={36}><Icon kind="close" size={13}/> Delete punch</Btn>
              <div style={{ flex: 1 }}/>
              <Btn variant="ghost" h={36}>Cancel</Btn>
              <Btn variant="primary" h={36} style={{ marginLeft: 8 }}>Save changes</Btn>
            </div>
          </Card>
        </div>
      </BackdropPage>

      <Anno x={870} y={155} w={140} align="right" tight>
        Centered classic dialog · keeps page context blurred behind.
      </Anno>
      <Anno x={140} y={420} w={140}>
        Audit trail is part of the modal — admins see who changed what before saving.
        <svg style={{ position: 'absolute', left: 130, top: 18, overflow: 'visible' }} width="40" height="20"><path className="wf-arrow" d="M2 10 L 36 10"/><path className="wf-arrow" d="M30 4 L 36 10 L 30 16"/></svg>
      </Anno>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// EDIT PUNCH · Variation B — Right-side drawer
// ─────────────────────────────────────────────────────────────────────
function EditPunchB() {
  return (
    <div className="wf-root" style={{ width: '100%', height: '100%', position: 'relative' }}>
      <BackdropPage blur={false}>
        <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: 480, background: 'var(--paper)', borderLeft: '1px solid var(--line)', display: 'flex', flexDirection: 'column', boxShadow: '-20px 0 80px rgba(0,0,0,.18)' }} className="wf-modal">
          {/* header */}
          <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--line-mute)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>Editing punch</div>
              <div style={{ fontSize: 16, fontWeight: 600, marginTop: 2 }}>Carlos Reyes · Tue Oct 14</div>
            </div>
            <Btn variant="ghost" h={28} style={{ fontSize: 12 }}>‹ Prev</Btn>
            <Btn variant="ghost" h={28} style={{ fontSize: 12 }}>Next ›</Btn>
            <Icon kind="close" size={16} color="var(--ink-soft)"/>
          </div>

          {/* timeline preview */}
          <div style={{ padding: '16px 22px', borderBottom: '1px solid var(--line-mute)' }}>
            <div style={{ fontSize: 11, color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Day so far</div>
            <div style={{ position: 'relative', height: 36, background: 'var(--paper-2)', border: '1px solid var(--line-mute)' }}>
              {/* segments along the bar */}
              <div style={{ position: 'absolute', left: '36%', top: 0, bottom: 0, width: '32%', background: 'var(--good)', opacity: 0.55 }}/>
              <div style={{ position: 'absolute', left: '52%', top: 0, bottom: 0, width: '4%', background: 'var(--warn)' }}/>
              <div style={{ position: 'absolute', left: '36%', top: -4, bottom: -4, width: 2, background: 'var(--ink)' }}/>
              <div style={{ position: 'absolute', left: '68%', top: -4, bottom: -4, width: 2, background: 'var(--accent)' }}/>
              <div style={{ position: 'absolute', left: -10, bottom: -18, fontSize: 9, color: 'var(--ink-soft)', fontFamily: 'var(--font-mono)' }}>06:00</div>
              <div style={{ position: 'absolute', left: '36%', bottom: -18, fontSize: 9, color: 'var(--ink-soft)', fontFamily: 'var(--font-mono)' }}>09:00</div>
              <div style={{ position: 'absolute', left: '68%', bottom: -18, fontSize: 9, color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>now 14:24</div>
              <div style={{ position: 'absolute', right: -12, bottom: -18, fontSize: 9, color: 'var(--ink-soft)', fontFamily: 'var(--font-mono)' }}>20:00</div>
            </div>
          </div>

          {/* form */}
          <div style={{ flex: 1, padding: 22, overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <H2>Punch times</H2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { l: 'Clock in', v: '09:00', orig: '09:23', changed: true },
                  { l: 'Break start', v: '12:45', orig: '12:45' },
                  { l: 'Break end', v: '13:03', orig: '13:03' },
                  { l: 'Clock out', v: '—', orig: '—', empty: true },
                ].map((p, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '90px 1fr 90px', gap: 10, alignItems: 'center' }}>
                    <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{p.l}</div>
                    <div className="wf-input" style={{ height: 36, padding: '0 12px', display: 'flex', alignItems: 'center', border: '1px solid ' + (p.changed ? 'var(--accent)' : 'var(--line)'), background: p.changed ? 'var(--accent-soft)' : 'var(--paper)', color: p.empty ? 'var(--ink-mute)' : 'var(--ink)', fontFamily: 'var(--font-mono)', fontSize: 14 }}>{p.v}</div>
                    <div style={{ fontSize: 11, color: 'var(--ink-soft)', fontFamily: 'var(--font-mono)' }}>{p.changed ? <s>{p.orig}</s> : p.orig}</div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <H2 action={<Chip tone="accent">required</Chip>}>Reason</H2>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                {['Train delay', 'Forgot to punch', 'Manager approved', 'System issue', 'Other'].map((r, i) => (
                  <Chip key={r} tone={i === 0 ? 'solid' : 'neutral'}>{r}</Chip>
                ))}
              </div>
              <div className="wf-input" style={{ minHeight: 60, padding: 10, border: '1px solid var(--line)', fontSize: 13, color: 'var(--ink-soft)' }}>
                Train was delayed 22 min from Mission &amp; 16th. Manager (D. Fitzgerald) confirmed via Slack.
              </div>
            </div>

            <div style={{ background: 'var(--paper-2)', border: '1px dashed var(--line-soft)', padding: 10, fontSize: 11, color: 'var(--ink-soft)', fontFamily: 'var(--font-mono)' }}>
              audit · created mobile · ip 10.0.4.21 · edits 0
            </div>
          </div>

          {/* footer */}
          <div style={{ padding: '14px 22px', borderTop: '1px solid var(--line-mute)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Btn variant="danger" h={36}>Delete</Btn>
            <div style={{ flex: 1 }}/>
            <Btn variant="ghost" h={36}>Cancel</Btn>
            <Btn variant="primary" h={36}>Save &amp; next ›</Btn>
          </div>
        </div>
      </BackdropPage>

      <Anno x={220} y={210} w={170}>
        Drawer keeps the attendance list visible — admin can scan next row to fix.
        <svg style={{ position: 'absolute', left: 170, top: 28, overflow: 'visible' }} width="40" height="20"><path className="wf-arrow" d="M2 10 L 36 10"/><path className="wf-arrow" d="M30 4 L 36 10 L 30 16"/></svg>
      </Anno>
      <Anno x={250} y={460} w={180}>
        "Save &amp; next" steps through the queue without closing.
      </Anno>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// EDIT PUNCH · Variation C — Inline row expansion (no overlay)
// ─────────────────────────────────────────────────────────────────────
function EditPunchC() {
  return (
    <div className="wf-root" style={{ width: '100%', height: '100%', position: 'relative' }}>
      <AppShell persona="admin" active="attendance"
        title="Attendance · Tue Oct 14"
        subtitle="Click any row to edit in place"
        actions={<><Btn variant="outline"><Icon kind="download" size={13}/> Export</Btn></>}>
        <Card p={0} style={{ flex: 1, overflow: 'hidden' }}>
          {/* header row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.7fr 0.6fr 0.6fr 0.7fr 0.9fr 0.5fr', padding: '10px 14px', borderBottom: '1px solid var(--line)', background: 'var(--paper-2)', fontSize: 11, color: 'var(--ink-soft)', letterSpacing: 0.4, textTransform: 'uppercase' }}>
            <div>Employee</div><div>Dept</div><div>In</div><div>Out</div><div>Hours</div><div>Status</div><div style={{ textAlign: 'right' }}/>
          </div>

          {ATT_ROWS.slice(0, 2).map((r, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.7fr 0.6fr 0.6fr 0.7fr 0.9fr 0.5fr', padding: '10px 14px', borderBottom: '1px solid var(--line-mute)', fontSize: 12.5, alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Avatar initials={r.name.split(' ').map(s=>s[0]).join('')} size={22}/>{r.name}</div>
              <div>{r.dept}</div>
              <div style={{ fontFamily: 'var(--font-mono)' }}>{r.in}</div>
              <div style={{ fontFamily: 'var(--font-mono)' }}>{r.out}</div>
              <div style={{ fontFamily: 'var(--font-mono)' }}>{r.hrs}</div>
              <div>{r.status}</div>
              <div style={{ textAlign: 'right' }}><Icon kind="edit" size={13} color="var(--ink-soft)"/></div>
            </div>
          ))}

          {/* EXPANDED ROW (Carlos) */}
          <div style={{ background: 'var(--accent-soft)', borderLeft: '3px solid var(--accent)', borderBottom: '1px solid var(--accent)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.7fr 0.6fr 0.6fr 0.7fr 0.9fr 0.5fr', padding: '10px 14px', fontSize: 12.5, alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}><Avatar initials="CR" size={22} tone="dark"/>Carlos Reyes · editing</div>
              <div>Ops</div>
              <div style={{ fontFamily: 'var(--font-mono)' }}>09:23</div>
              <div style={{ fontFamily: 'var(--font-mono)' }}>—</div>
              <div style={{ fontFamily: 'var(--font-mono)' }}>5h 01m</div>
              <div><Chip tone="warn">late 23m</Chip></div>
              <div style={{ textAlign: 'right' }}><Icon kind="close" size={13} color="var(--ink-soft)"/></div>
            </div>

            <div style={{ padding: '8px 18px 18px', display: 'grid', gridTemplateColumns: '1.3fr 1.3fr 1fr', gap: 16 }}>
              <div>
                <div className="wf-label" style={{ fontSize: 11, color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8 }}>Punch times</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    { l: 'Clock in', v: '09:00', orig: '09:23' },
                    { l: 'Break', v: '12:45 → 13:03' },
                    { l: 'Clock out', v: '—', empty: true },
                  ].map((p, j) => (
                    <div key={j} style={{ display: 'grid', gridTemplateColumns: '80px 1fr 70px', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{p.l}</span>
                      <div className="wf-input" style={{ height: 32, padding: '0 10px', display: 'flex', alignItems: 'center', background: '#fff', border: '1px solid ' + (p.orig ? 'var(--accent)' : 'var(--line)'), fontFamily: 'var(--font-mono)', fontSize: 13, color: p.empty ? 'var(--ink-mute)' : 'var(--ink)' }}>{p.v}</div>
                      <span style={{ fontSize: 10, color: 'var(--ink-soft)', fontFamily: 'var(--font-mono)' }}>{p.orig ? <s>{p.orig}</s> : ''}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="wf-label" style={{ fontSize: 11, color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8 }}>Reason</div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
                  {['Train delay', 'Forgot', 'Mgr approved', 'System', 'Other'].map((r, k) => (
                    <Chip key={r} tone={k === 0 ? 'solid' : 'neutral'}>{r}</Chip>
                  ))}
                </div>
                <div className="wf-input" style={{ minHeight: 60, padding: 8, background: '#fff', border: '1px solid var(--line)', fontSize: 12 }}>
                  Train delay confirmed via Slack.
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div className="wf-label" style={{ fontSize: 11, color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: 0.4 }}>Actions</div>
                <Btn variant="primary" h={32} style={{ fontSize: 12 }}><Icon kind="check" size={12} color="#fff"/> Save changes</Btn>
                <Btn variant="outline" h={32} style={{ fontSize: 12 }}><Icon kind="check" size={12}/> Save &amp; approve OT</Btn>
                <Btn variant="ghost" h={32} style={{ fontSize: 12 }}>Cancel</Btn>
                <div style={{ borderTop: '1px dashed var(--line-soft)', paddingTop: 6, fontSize: 10, color: 'var(--ink-soft)', fontFamily: 'var(--font-mono)' }}>
                  audit · created 09:23 · mobile · ip 10.0.4.21
                </div>
              </div>
            </div>
          </div>

          {/* remaining rows */}
          {ATT_ROWS.slice(3).map((r, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.7fr 0.6fr 0.6fr 0.7fr 0.9fr 0.5fr', padding: '10px 14px', borderBottom: i < ATT_ROWS.length - 4 ? '1px solid var(--line-mute)' : 'none', fontSize: 12.5, alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Avatar initials={r.name.split(' ').map(s=>s[0]).join('')} size={22}/>{r.name}</div>
              <div>{r.dept}</div>
              <div style={{ fontFamily: 'var(--font-mono)' }}>{r.in}</div>
              <div style={{ fontFamily: 'var(--font-mono)' }}>{r.out}</div>
              <div style={{ fontFamily: 'var(--font-mono)' }}>{r.hrs}</div>
              <div>{r.status}</div>
              <div style={{ textAlign: 'right' }}><Icon kind="edit" size={13} color="var(--ink-soft)"/></div>
            </div>
          ))}
        </Card>
      </AppShell>

      <Anno x={400} y={355} w={170} align="center">
        Inline expansion — no modal pop; admin keeps spatial context.
        <svg style={{ position: 'absolute', left: 50, top: 36, overflow: 'visible' }} width="40" height="20"><path className="wf-arrow" d="M20 2 L 20 16"/><path className="wf-arrow" d="M14 10 L 20 16 L 26 10"/></svg>
      </Anno>
      <Anno x={970} y={420} w={140} align="right" tight>
        Power-user combo · "Save &amp; approve OT" in one click.
      </Anno>
    </div>
  );
}

Object.assign(window, { EditPunchA, EditPunchB, EditPunchC });
