// screens-employee.jsx — Employee Dashboard + History wireframes
// Each screen is a function returning a full artboard. 3 variations each.

// ---------- shared sample data ----------
const HIST_ROWS = [
  { date: 'Mon Oct 13', in: '09:02', out: '17:34', brk: '0:42', hrs: '7:50', status: <Chip tone="good">on-time</Chip> },
  { date: 'Fri Oct 10', in: '09:14', out: '18:02', brk: '0:30', hrs: '8:18', status: <Chip tone="warn">late 14m</Chip> },
  { date: 'Thu Oct 09', in: '08:51', out: '17:15', brk: '0:45', hrs: '7:39', status: <Chip tone="good">on-time</Chip> },
  { date: 'Wed Oct 08', in: '09:00', out: '17:33', brk: '0:35', hrs: '7:58', status: <Chip tone="good">on-time</Chip> },
  { date: 'Tue Oct 07', in: '—', out: '—', brk: '—', hrs: '—', status: <Chip tone="neutral">PTO</Chip> },
  { date: 'Mon Oct 06', in: '09:05', out: '—', brk: '0:30', hrs: '—', status: <Chip tone="bad">missed out</Chip> },
];

// ─────────────────────────────────────────────────────────────────────
// EMPLOYEE DASHBOARD · Variation A
// "Sidebar + Hero punch + summary + recent history below"
// ─────────────────────────────────────────────────────────────────────
function EmpDashA() {
  return (
    <div className="wf-root" style={{ width: '100%', height: '100%', position: 'relative' }}>
      <AppShell persona="employee" active="dash"
        title="Good afternoon, Mira"
        subtitle="Tuesday · Oct 14 · clocked in since 9:02 AM"
        actions={<><Btn variant="ghost"><Icon kind="cal" size={13}/> Request leave</Btn><Btn><Icon kind="edit" size={13}/> Adjust punch</Btn></>}
      >
        {/* Hero punch + summary */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr .8fr', gap: 16 }}>
          {/* PUNCH HERO */}
          <Card p={0} style={{ overflow: 'hidden' }}>
            <div style={{ padding: '22px 24px 18px', borderBottom: '1px solid var(--line-mute)', display: 'flex', alignItems: 'flex-end', gap: 18 }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6 }}>Current shift · live</div>
                <div className="wf-num" style={{ fontFamily: 'var(--font-mono)', fontSize: 60, fontWeight: 500, letterSpacing: -2, lineHeight: 1 }}>14:24:08</div>
                <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 6 }}>Punched in @ 09:02 · 5h 22m elapsed</div>
              </div>
              <div style={{ marginLeft: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                <Chip tone="good">● Clocked in</Chip>
                <div style={{ fontSize: 11, color: 'var(--ink-soft)' }}>HQ · Office floor 3</div>
              </div>
            </div>
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <Btn variant="accent" h={56} style={{ flex: 1, fontSize: 18, fontWeight: 600 }}>
                  <Icon kind="stop" size={18} color="#fff"/> Clock out
                </Btn>
                <Btn variant="outline" h={56} style={{ flex: '0 0 auto', padding: '0 18px', fontSize: 14 }}>
                  <Icon kind="coffee" size={16}/> Start break
                </Btn>
              </div>
              <Btn variant="ghost" h={42} style={{ width: '100%', fontSize: 13, fontWeight: 500, border: '1px dashed var(--line-soft)', justifyContent: 'space-between', padding: '0 16px' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <Icon kind="cal" size={14}/> View today's daily summary
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--ink-soft)', fontSize: 12 }}>
                  Oct 14 <Icon kind="arrow" size={12}/>
                </span>
              </Btn>
            </div>
          </Card>

          {/* TODAY SUMMARY */}
          <Card>
            <H2>Today's summary</H2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Stat label="Regular" value="5h 04m" sub="of 8h goal"/>
              <Stat label="Breaks" value="0h 18m" sub="1 break"/>
              <Stat label="Overtime" value="0h 00m" sub="none today"/>
              <Stat label="Late · Undertime" value="0m · 0m" sub="on-time today"/>
            </div>
            <div style={{ marginTop: 14, padding: 10, background: 'var(--paper-2)', border: '1px dashed var(--line-soft)', fontSize: 12, color: 'var(--ink-soft)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon kind="info" size={14} color="var(--ink-soft)"/>
              Reminder · lunch break suggested at 13:00
            </div>
          </Card>
        </div>

        {/* RECENT HISTORY */}
        <Card>
          <H2 action="View full history →">Last 6 days</H2>
          <Table
            cols={[
              { k: 'date', label: 'Date', w: '1.2fr' },
              { k: 'in', label: 'In', w: '0.6fr', mono: true },
              { k: 'out', label: 'Out', w: '0.6fr', mono: true },
              { k: 'brk', label: 'Break', w: '0.6fr', mono: true },
              { k: 'hrs', label: 'Hours', w: '0.7fr', mono: true },
              { k: 'status', label: 'Status', w: '1fr' },
            ]}
            rows={HIST_ROWS}
            accentCol="hrs"
            dense
          />
        </Card>
      </AppShell>

      <Anno x={252} y={210} w={210}>
        Single one-tap action — verb flips to <b>Clock in</b> when off-shift.
        <svg style={{ position: 'absolute', left: -34, top: 36, overflow: 'visible' }} width="40" height="40">
          <path className="wf-arrow" d="M40 4 Q 18 16 6 30"/>
          <path className="wf-arrow" d="M10 24 L 6 30 L 14 32"/>
        </svg>
      </Anno>
      <Anno x={252} y={365} w={210}>
        Jumps to <b>History → today (Oct 14)</b> pre-selected in the calendar.
        <svg style={{ position: 'absolute', left: -34, top: 16, overflow: 'visible' }} width="40" height="30">
          <path className="wf-arrow" d="M40 14 Q 22 14 6 14"/>
          <path className="wf-arrow" d="M12 8 L 6 14 L 12 20"/>
        </svg>
      </Anno>
      <Anno x={760} y={150} w={170} align="right">
        Live ticker — updates every second client-side.
        <svg style={{ position: 'absolute', right: -36, top: 18, overflow: 'visible' }} width="40" height="40">
          <path className="wf-arrow" d="M2 28 Q 22 8 38 4"/>
          <path className="wf-arrow" d="M34 12 L 38 4 L 30 4"/>
        </svg>
      </Anno>
      <Anno x={918} y={500} w={170} align="right" tight>
        Quick scan of the week — links to full table.
      </Anno>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// EMPLOYEE DASHBOARD · Variation B
// "Full-bleed clock, no sidebar — kiosk-friendly"
// ─────────────────────────────────────────────────────────────────────
function EmpDashB() {
  return (
    <div className="wf-root" style={{ width: '100%', height: '100%', position: 'relative', background: 'var(--paper-2)', display: 'flex', flexDirection: 'column' }}>
      {/* slim topbar */}
      <div style={{ height: 48, padding: '0 28px', borderBottom: '1px solid var(--line)', background: 'var(--paper)', display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div className="wf-thumb" style={{ width: 24, height: 24, border: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>◐</div>
          <span style={{ fontSize: 14, fontWeight: 600 }}>Mini HCM</span>
        </div>
        <div style={{ display: 'flex', gap: 18, marginLeft: 24 }}>
          {['Today', 'History', 'Schedule', 'Leave'].map(t => (
            <div key={t} style={{ fontSize: 13, fontWeight: t === 'Today' ? 600 : 400, color: t === 'Today' ? 'var(--ink)' : 'var(--ink-soft)', borderBottom: t === 'Today' ? '2px solid var(--accent)' : 'none', padding: '14px 0' }}>{t}</div>
          ))}
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          <Icon kind="bell" size={15} color="var(--ink-soft)"/>
          <Avatar initials="MJ" size={26} tone="dark"/>
          <span style={{ fontSize: 12, fontWeight: 500 }}>Mira J.</span>
        </div>
      </div>

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr', padding: 28, gap: 18, overflow: 'hidden' }}>
        {/* Centered clock card */}
        <Card p={0} style={{ background: 'var(--ink)', color: '#fff', border: 'none', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '28px 32px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,.6)', textTransform: 'uppercase', letterSpacing: 0.8 }}>Tuesday, October 14</div>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,.8)', marginTop: 4 }}>Mira Jensen · Design · Eng</div>
            </div>
            <Chip tone="solid" style={{ background: 'var(--good)', color: '#fff', border: '1px solid var(--good)' }}>● Clocked in · 5h 22m</Chip>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            <div className="wf-num" style={{ fontFamily: 'var(--font-mono)', fontSize: 96, fontWeight: 500, letterSpacing: -3.5, lineHeight: 1 }}>
              2:24<span style={{ opacity: 0.5 }}>:08</span>
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,.7)' }}>punched in @ 09:02 · last break 12:45–13:03</div>
          </div>

          <div style={{ display: 'flex', gap: 12, padding: 24, borderTop: '1px solid rgba(255,255,255,.12)' }}>
            <div style={{ flex: 1, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14, background: 'var(--accent)', border: '1px solid var(--accent)' }}>
              <Icon kind="stop" size={20} color="#fff"/>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 18, fontWeight: 600 }}>Clock out</div>
                <div style={{ fontSize: 11, opacity: 0.85 }}>End shift · ~8h 02m projected</div>
              </div>
              <Icon kind="arrow" size={16} color="#fff"/>
            </div>
            <div style={{ width: 220, padding: '16px 18px', border: '1px solid rgba(255,255,255,.25)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <Icon kind="coffee" size={18} color="#fff"/>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>Start break</div>
                <div style={{ fontSize: 11, opacity: 0.7 }}>auto-resume in 30m</div>
              </div>
            </div>
          </div>
        </Card>

        {/* Below-fold strip: summary + last 3 punches */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr) 1.6fr', gap: 10 }}>
          <Stat label="Today" value="5h 22m" sub="elapsed"/>
          <Stat label="Week" value="32h 14m" sub="of 40h"/>
          <Stat label="Overtime" value="0h 00m" sub="ok"/>
          <Stat label="Pay-period" value="$1,408" sub="est."/>
          <Card p={14}>
            <div style={{ fontSize: 11, color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 }}>Recent punches</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontFamily: 'var(--font-mono)', fontSize: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Today · in</span><span>09:02</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--ink-soft)' }}><span>Mon · out</span><span>17:34</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--ink-soft)' }}><span>Mon · in</span><span>09:02</span></div>
            </div>
          </Card>
        </div>
      </div>

      <Anno x={520} y={310} w={200} align="center">
        Hero clock — primary visual.<br/>Scales with viewport.
      </Anno>
      <Anno x={188} y={510} w={220}>
        Punch CTA fills width &amp; sits at thumb-zone for kiosk / tablet docks.
        <svg style={{ position: 'absolute', left: 100, top: -22, overflow: 'visible' }} width="50" height="40">
          <path className="wf-arrow" d="M4 4 Q 30 16 40 36"/>
          <path className="wf-arrow" d="M32 32 L 40 36 L 40 28"/>
        </svg>
      </Anno>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// EMPLOYEE DASHBOARD · Variation C
// "Timeline-first — today as a vertical day strip with punch in context"
// ─────────────────────────────────────────────────────────────────────
function EmpDashC() {
  const segments = [
    { t: '09:02', label: 'Clock in', tone: 'good', kind: 'in' },
    { t: '12:45', label: 'Break start', tone: 'warn', kind: 'brk' },
    { t: '13:03', label: 'Break end', tone: 'warn', kind: 'brk' },
    { t: 'now', label: 'On the clock', tone: 'accent', kind: 'now' },
  ];
  return (
    <div className="wf-root" style={{ width: '100%', height: '100%', position: 'relative' }}>
      <AppShell persona="employee" active="dash" title="Your day" subtitle="Tuesday · Oct 14"
        actions={<><Btn variant="ghost"><Icon kind="cal" size={13}/> Schedule</Btn><Btn><Icon kind="edit" size={13}/> Fix punch</Btn></>}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.05fr 1fr', gap: 16, flex: 1, minHeight: 0 }}>
          {/* TIMELINE */}
          <Card p={0} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px', borderBottom: '1px solid var(--line-mute)' }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Today's timeline</div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12, color: 'var(--ink-soft)' }}>
                <Chip tone="good">● Clocked in</Chip>
                <span className="wf-num" style={{ fontFamily: 'var(--font-mono)' }}>14:24:08</span>
              </div>
            </div>
            <div style={{ flex: 1, padding: '14px 18px 18px 18px', position: 'relative', overflow: 'hidden' }}>
              {/* timeline rail */}
              <div style={{ position: 'absolute', left: 60, top: 14, bottom: 18, width: 2, background: 'var(--line-mute)' }}/>
              {segments.map((s, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '50px 1fr', alignItems: 'center', gap: 14, marginBottom: 14, position: 'relative' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-soft)', textAlign: 'right' }}>{s.t}</div>
                  <div style={{ position: 'relative', paddingLeft: 22 }}>
                    <div style={{
                      position: 'absolute', left: 4, top: '50%', transform: 'translate(-50%,-50%)',
                      width: 12, height: 12, borderRadius: '50%',
                      background: s.kind === 'now' ? 'var(--accent)' : 'var(--paper)',
                      border: '2px solid ' + (s.kind === 'now' ? 'var(--accent)' : s.tone === 'good' ? 'var(--good)' : 'var(--warn)'),
                      boxShadow: s.kind === 'now' ? '0 0 0 4px rgba(43,89,255,0.18)' : 'none',
                    }}/>
                    <Card p={10} style={{ background: s.kind === 'now' ? 'var(--accent-soft)' : 'var(--paper)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{s.label}</div>
                        {s.kind === 'now' ? <Chip tone="accent">live</Chip> : <Icon kind="edit" size={13} color="var(--ink-mute)"/>}
                      </div>
                      {s.kind === 'now' && <div style={{ fontSize: 11, color: 'var(--ink-soft)', marginTop: 4 }}>1h 21m since last break</div>}
                    </Card>
                  </div>
                </div>
              ))}
            </div>
            {/* punch dock */}
            <div style={{ padding: 16, borderTop: '1px solid var(--line-mute)', display: 'flex', gap: 10, background: 'var(--paper-2)' }}>
              <Btn variant="accent" h={48} style={{ flex: 1, fontSize: 15, fontWeight: 600 }}>
                <Icon kind="stop" size={16} color="#fff"/> Clock out
              </Btn>
              <Btn variant="outline" h={48} style={{ padding: '0 14px' }}><Icon kind="coffee" size={14}/> Break</Btn>
            </div>
          </Card>

          {/* RIGHT: summary + week scan */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minHeight: 0 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Stat label="Today" value="5h 22m" sub="of 8h"/>
              <Stat label="Week" value="32h 14m" sub="of 40h" accent/>
            </div>
            <Card style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
              <H2 action="See all →">This week</H2>
              <div style={{ marginBottom: 12 }}>
                <BarChart w={360} h={84} data={[
                  { k: 'M', v: 7.8 }, { k: 'T', v: 8.3, hl: true }, { k: 'W', v: 8 }, { k: 'T', v: 7.6 }, { k: 'F', v: 5.3 }, { k: 'S', v: 0 }, { k: 'S', v: 0 },
                ]}/>
              </div>
              <Table
                dense
                cols={[
                  { k: 'date', label: 'Day', w: '1fr' },
                  { k: 'hrs', label: 'Hours', w: '0.7fr', mono: true },
                  { k: 'status', label: '', w: '0.8fr' },
                ]}
                rows={HIST_ROWS.slice(0, 4)}
              />
            </Card>
          </div>
        </div>
      </AppShell>

      <Anno x={250} y={245} w={170}>
        Each event is editable → opens fix-punch modal.
        <svg style={{ position: 'absolute', left: -30, top: 14, overflow: 'visible' }} width="40" height="30"><path className="wf-arrow" d="M40 4 Q 18 8 4 22"/><path className="wf-arrow" d="M10 18 L 4 22 L 12 26"/></svg>
      </Anno>
      <Anno x={500} y={420} w={180}>
        "Now" marker pulses · gives a sense of presence.
        <svg style={{ position: 'absolute', left: -22, top: -10, overflow: 'visible' }} width="40" height="30"><path className="wf-arrow" d="M36 22 Q 16 18 6 4"/><path className="wf-arrow" d="M12 6 L 6 4 L 6 12"/></svg>
      </Anno>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// EMPLOYEE HISTORY · Variation A — Classic data table
// ─────────────────────────────────────────────────────────────────────
function EmpHistA() {
  const longRows = [...HIST_ROWS, ...HIST_ROWS.slice(0, 4).map(r => ({ ...r, date: r.date.replace('Oct', 'Sep') }))];
  return (
    <div className="wf-root" style={{ width: '100%', height: '100%', position: 'relative' }}>
      <AppShell persona="employee" active="history"
        title="History"
        subtitle="All recorded punches · filter by date or status"
        actions={<><Btn variant="outline"><Icon kind="download" size={13}/> Export CSV</Btn><Btn variant="primary"><Icon kind="edit" size={13}/> Request amendment</Btn></>}
      >
        {/* filter row */}
        <Card p={14}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <Input label="Range" value="Oct 01 – Oct 14, 2026" w={220}/>
            <Input label="Status" value="All" w={140}/>
            <Input label="Location" value="HQ · Office floor 3" w={200}/>
            <div style={{ flex: 1 }}/>
            <Btn variant="ghost"><Icon kind="filter" size={13}/> More filters</Btn>
            <Btn variant="primary">Apply</Btn>
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
            <Chip tone="accent">14 days</Chip><Chip>10 working</Chip><Chip tone="good">8 on-time</Chip><Chip tone="warn">2 late</Chip><Chip tone="bad">1 missed</Chip><Chip tone="neutral">1 PTO</Chip>
          </div>
        </Card>

        <Card p={0} style={{ overflow: 'hidden' }}>
          <Table
            cols={[
              { k: 'date', label: 'Date', w: '1.2fr' },
              { k: 'in', label: 'Clock in', w: '0.7fr', mono: true },
              { k: 'out', label: 'Clock out', w: '0.7fr', mono: true },
              { k: 'brk', label: 'Break', w: '0.6fr', mono: true },
              { k: 'hrs', label: 'Hours', w: '0.7fr', mono: true },
              { k: 'status', label: 'Status', w: '0.9fr' },
              { k: 'act', label: '', w: '0.45fr', align: 'right' },
            ]}
            rows={longRows.map((r, i) => ({ ...r, _hl: i === 5, act: <Icon kind="edit" size={13} color="var(--ink-soft)"/> }))}
            accentCol="hrs"
          />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderTop: '1px solid var(--line-mute)', fontSize: 12, color: 'var(--ink-soft)' }}>
            <span>10 of 23 rows</span>
            <div style={{ display: 'flex', gap: 4 }}><Btn h={26} style={{ fontSize: 12 }}>‹</Btn><Btn h={26} style={{ fontSize: 12 }}>1</Btn><Btn h={26} style={{ fontSize: 12, background: 'var(--ink)', color: '#fff' }}>2</Btn><Btn h={26} style={{ fontSize: 12 }}>3</Btn><Btn h={26} style={{ fontSize: 12 }}>›</Btn></div>
          </div>
        </Card>
      </AppShell>

      <Anno x={252} y={278} w={180}>
        Chips summarise filter state — also act as quick re-filter.
      </Anno>
      <Anno x={970} y={420} w={160} align="right">
        Row click → modal w/ edit history. Highlighted row = needs attention.
        <svg style={{ position: 'absolute', left: -38, top: 22, overflow: 'visible' }} width="40" height="30"><path className="wf-arrow" d="M2 18 Q 22 10 38 2"/><path className="wf-arrow" d="M30 2 L 38 2 L 38 10"/></svg>
      </Anno>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// EMPLOYEE HISTORY · Variation B — Table + stats strip + week selector
// ─────────────────────────────────────────────────────────────────────
function EmpHistB() {
  return (
    <div className="wf-root" style={{ width: '100%', height: '100%', position: 'relative' }}>
      <AppShell persona="employee" active="history"
        title="My time history"
        subtitle="Pay period · Oct 01 → Oct 14, 2026"
        actions={<><Btn variant="ghost">‹ Prev</Btn><Btn variant="outline">Period: Oct 01 – Oct 14</Btn><Btn variant="ghost">Next ›</Btn></>}
      >
        {/* stats strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
          <Stat label="Total hours" value="78.2h" sub="of 80h"/>
          <Stat label="Overtime" value="2.4h" accent sub="approved"/>
          <Stat label="On-time %" value="92%" sub="↑ 4 vs last"/>
          <Stat label="Avg start" value="09:04" sub="goal 09:00"/>
          <Stat label="Est. pay" value="$1,634" sub="@ $20.20"/>
        </div>

        {/* week selector */}
        <Card p={14}>
          <div style={{ display: 'flex', gap: 6, marginBottom: 12, alignItems: 'center' }}>
            {['Wk 40', 'Wk 41', 'Wk 42'].map((w, i) => (
              <div key={w} style={{
                padding: '6px 12px', fontSize: 12, fontWeight: 500,
                border: '1px solid var(--line)',
                background: i === 1 ? 'var(--ink)' : 'var(--paper)',
                color: i === 1 ? '#fff' : 'var(--ink)',
              }}>{w}</div>
            ))}
            <div style={{ flex: 1 }}/>
            <Btn variant="outline" h={30} style={{ fontSize: 12 }}><Icon kind="download" size={12}/> Export</Btn>
          </div>

          <Table
            cols={[
              { k: 'date', label: 'Date', w: '1.2fr' },
              { k: 'in', label: 'In', w: '0.6fr', mono: true },
              { k: 'out', label: 'Out', w: '0.6fr', mono: true },
              { k: 'brk', label: 'Break', w: '0.6fr', mono: true },
              { k: 'hrs', label: 'Hours', w: '0.6fr', mono: true },
              { k: 'status', label: 'Status', w: '1fr' },
              { k: 'note', label: 'Note', w: '1.2fr', muted: true },
            ]}
            rows={HIST_ROWS.map((r, i) => ({
              ...r, note: i === 1 ? 'Train delay — approved' : i === 5 ? 'Forgot to clock out' : '—',
            }))}
            accentCol="hrs"
            dense
          />
        </Card>
      </AppShell>

      <Anno x={246} y={210} w={150}>
        Personal stats answer "how am I doing this period?"
      </Anno>
      <Anno x={244} y={400} w={140}>
        Quick week-switcher — keyboard ←/→ moves period.
      </Anno>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// EMPLOYEE HISTORY · Variation C — Calendar + selected-day detail
// ─────────────────────────────────────────────────────────────────────
function EmpHistC() {
  const days = Array.from({ length: 35 }, (_, i) => {
    const day = i - 2; // start offset
    const inMonth = day >= 1 && day <= 31;
    let tone = null;
    if (inMonth) {
      if ([6, 7, 13, 14, 20, 21, 27, 28].includes(day)) tone = 'off';
      else if (day === 7) tone = 'pto';
      else if (day === 6) tone = 'miss';
      else if (day === 10) tone = 'late';
      else if (day <= 14) tone = 'ok';
    }
    return { day: inMonth ? day : '', tone, sel: day === 14 };
  });
  const dot = { off: '#e6e3da', pto: 'var(--ink-mute)', miss: 'var(--bad)', late: 'var(--warn)', ok: 'var(--good)' };
  return (
    <div className="wf-root" style={{ width: '100%', height: '100%', position: 'relative' }}>
      <AppShell persona="employee" active="history" title="My history" subtitle="October 2026"
        actions={<><Btn variant="outline">Table view</Btn><Btn variant="primary">Today</Btn></>}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16, flex: 1, minHeight: 0 }}>
          <Card p={14}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Btn h={28} style={{ fontSize: 12 }}>‹</Btn>
                <div style={{ fontSize: 16, fontWeight: 600 }}>October 2026</div>
                <Btn h={28} style={{ fontSize: 12 }}>›</Btn>
              </div>
              <div style={{ display: 'flex', gap: 8, fontSize: 11, color: 'var(--ink-soft)' }}>
                <span><span style={{ display: 'inline-block', width: 8, height: 8, background: dot.ok, marginRight: 4 }}/>On-time</span>
                <span><span style={{ display: 'inline-block', width: 8, height: 8, background: dot.late, marginRight: 4 }}/>Late</span>
                <span><span style={{ display: 'inline-block', width: 8, height: 8, background: dot.miss, marginRight: 4 }}/>Missed</span>
                <span><span style={{ display: 'inline-block', width: 8, height: 8, background: dot.pto, marginRight: 4 }}/>PTO</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', fontSize: 10, color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: 0.4, padding: '4px 0' }}>
              {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => <div key={d} style={{ padding: 4 }}>{d}</div>)}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4 }}>
              {days.map((d, i) => (
                <div key={i} style={{
                  aspectRatio: '1.1 / 1', border: '1px solid ' + (d.sel ? 'var(--accent)' : 'var(--line-mute)'),
                  background: d.sel ? 'var(--accent-soft)' : 'var(--paper)',
                  padding: 6, display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                  fontSize: 12, fontWeight: d.sel ? 600 : 400, color: d.day === '' ? 'var(--ink-mute)' : 'var(--ink)',
                  opacity: d.day === '' ? 0.4 : 1,
                }}>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>{d.day}</span>
                  {d.tone && <span style={{ width: 6, height: 6, background: dot[d.tone], alignSelf: 'flex-end' }}/>}
                </div>
              ))}
            </div>
          </Card>

          <Card style={{ display: 'flex', flexDirection: 'column' }}>
            <H2 action={<Chip tone="good">on-time</Chip>}>Tue · Oct 14</H2>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--ink-soft)', marginBottom: 14 }}>
              09:02 → currently clocked-in · 5h 22m so far
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
              {[
                { t: '09:02', l: 'Clock in', tone: 'good' },
                { t: '12:45', l: 'Break start', tone: 'warn' },
                { t: '13:03', l: 'Break end', tone: 'warn' },
                { t: '14:24', l: 'Live · still clocked in', tone: 'accent' },
              ].map((e, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 8, border: '1px solid var(--line-mute)' }}>
                  <span className="wf-num" style={{ fontFamily: 'var(--font-mono)', fontSize: 13, width: 52 }}>{e.t}</span>
                  <span style={{ fontSize: 12.5, flex: 1 }}>{e.l}</span>
                  <Chip tone={e.tone}>{e.tone}</Chip>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 'auto', paddingTop: 10, borderTop: '1px solid var(--line-mute)', display: 'flex', gap: 8 }}>
              <Btn variant="outline" style={{ flex: 1 }}><Icon kind="edit" size={13}/> Request fix</Btn>
              <Btn variant="primary" style={{ flex: 1 }}><Icon kind="file" size={13}/> Add note</Btn>
            </div>
          </Card>
        </div>
      </AppShell>

      <Anno x={760} y={235} w={150} align="right">
        Selected day drives the detail panel →
        <svg style={{ position: 'absolute', right: -34, top: 8, overflow: 'visible' }} width="44" height="20"><path className="wf-arrow" d="M2 10 L 38 10"/><path className="wf-arrow" d="M32 4 L 38 10 L 32 16"/></svg>
      </Anno>
      <Anno x={246} y={500} w={170}>
        Dots glance — colour = status per day.
      </Anno>
    </div>
  );
}

Object.assign(window, { EmpDashA, EmpDashB, EmpDashC, EmpHistA, EmpHistB, EmpHistC });
