// screens-admin.jsx — Admin Dashboard + Reports wireframes

// shared attendance rows
const ATT_ROWS = [
  { name: 'Aaron Choi', dept: 'Sales', in: '08:54', out: '—', hrs: '5h 30m', status: <Chip tone="good">on shift</Chip> },
  { name: 'Briana Patel', dept: 'Eng', in: '09:02', out: '—', hrs: '5h 22m', status: <Chip tone="good">on shift</Chip> },
  { name: 'Carlos Reyes', dept: 'Ops', in: '09:23', out: '—', hrs: '5h 01m', status: <Chip tone="warn">late 23m</Chip>, _hl: true },
  { name: 'Dana Fitzgerald', dept: 'Eng', in: '08:58', out: '13:01', hrs: '4h 03m', status: <Chip tone="neutral">half-day</Chip> },
  { name: 'Eli Nakamura', dept: 'Ops', in: '—', out: '—', hrs: '—', status: <Chip tone="bad">absent</Chip>, _hl: true },
  { name: 'Faye Olsen', dept: 'Sales', in: '09:01', out: '—', hrs: '5h 23m', status: <Chip tone="good">on shift</Chip> },
  { name: 'Gus Pham', dept: 'HR', in: '—', out: '—', hrs: '—', status: <Chip tone="neutral">PTO</Chip> },
  { name: 'Hana Liu', dept: 'Eng', in: '09:00', out: '—', hrs: '5h 24m', status: <Chip tone="good">on shift</Chip> },
];

// ─────────────────────────────────────────────────────────────────────
// ADMIN DASHBOARD · Variation A — Stats grid + attendance table
// ─────────────────────────────────────────────────────────────────────
function AdminDashA() {
  return (
    <div className="wf-root" style={{ width: '100%', height: '100%', position: 'relative' }}>
      <AppShell persona="admin" active="dash"
        title="Admin Dashboard"
        subtitle="Overview of workforce activity for today · Tuesday, Oct 14"
        actions={<><Btn variant="outline"><Icon kind="download" size={13}/> Export</Btn><Btn variant="primary"><Icon kind="plus" size={13}/> Add employee</Btn></>}
      >
        {/* stats grid (4 cards) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          <Stat label="Total workforce" value="1,248" sub="↑ +12 this month"/>
          <Stat label="Clocked in" value="412" sub="of 480 scheduled"/>
          <Stat label="Pending approvals" value="38" sub="punch + leave" accent/>
          <Stat label="Late today" value="23" sub="↑ 4 vs avg"/>
        </div>

        {/* attendance table */}
        <Card p={0} style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: '1px solid var(--line-mute)' }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Today's attendance</div>
            <Tabs items={['All 480', 'On shift 412', 'Late 23', 'Absent 19', 'PTO 26']} active="All 480"/>
            <div style={{ flex: 1 }}/>
            <div className="wf-input" style={{ height: 30, padding: '0 10px', display: 'flex', alignItems: 'center', gap: 6, border: '1px solid var(--line-soft)' }}>
              <Icon kind="search" size={12} color="var(--ink-mute)"/>
              <span style={{ fontSize: 12, color: 'var(--ink-mute)' }}>Search name…</span>
            </div>
            <Btn variant="outline" h={30} style={{ fontSize: 12 }}><Icon kind="filter" size={12}/> Filter</Btn>
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <Table
              cols={[
                { k: 'name', label: 'Employee', w: '1.4fr' },
                { k: 'dept', label: 'Dept', w: '0.7fr' },
                { k: 'in', label: 'Clock in', w: '0.7fr', mono: true },
                { k: 'out', label: 'Clock out', w: '0.7fr', mono: true },
                { k: 'hrs', label: 'Hours', w: '0.7fr', mono: true },
                { k: 'status', label: 'Status', w: '0.9fr' },
                { k: 'act', label: '', w: '0.5fr', align: 'right' },
              ]}
              rows={ATT_ROWS.map(r => ({
                ...r,
                name: <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Avatar initials={r.name.split(' ').map(s=>s[0]).join('')} size={22}/><span>{r.name}</span></div>,
                act: <Btn h={24} style={{ fontSize: 11, padding: '0 8px' }}><Icon kind="edit" size={11}/> Edit</Btn>,
              }))}
              dense
            />
          </div>
        </Card>
      </AppShell>

      <Anno x={650} y={158} w={150}>
        Click stat → filters attendance table below.
        <svg style={{ position: 'absolute', left: 30, top: 32, overflow: 'visible' }} width="40" height="50"><path className="wf-arrow" d="M4 4 Q 10 30 4 46"/><path className="wf-arrow" d="M0 40 L 4 46 L 8 40"/></svg>
      </Anno>
      <Anno x={968} y={420} w={150} align="right" tight>
        Inline Edit → opens punch modal for that row.
        <svg style={{ position: 'absolute', right: -38, top: 14, overflow: 'visible' }} width="44" height="20"><path className="wf-arrow" d="M2 10 L 38 10"/><path className="wf-arrow" d="M32 4 L 38 10 L 32 16"/></svg>
      </Anno>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// ADMIN DASHBOARD · Variation B — Stats sidebar (right rail) + table
// ─────────────────────────────────────────────────────────────────────
function AdminDashB() {
  return (
    <div className="wf-root" style={{ width: '100%', height: '100%', position: 'relative' }}>
      <AppShell persona="admin" active="dash"
        title="Today across the company"
        subtitle="Live attendance feed · auto-refresh 30s"
        actions={<><Btn variant="outline"><Icon kind="cal" size={13}/> Tue, Oct 14</Btn><Btn variant="primary"><Icon kind="plus" size={13}/> Add employee</Btn></>}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 14, flex: 1, minHeight: 0 }}>
          <Card p={0} style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--line-mute)', display: 'flex', gap: 8, alignItems: 'center' }}>
              <Tabs items={['Everyone', 'My team', 'By location']} active="Everyone"/>
              <div style={{ flex: 1 }}/>
              <Chip tone="accent">23 late</Chip>
              <Chip tone="bad">19 absent</Chip>
              <Chip tone="warn">7 unusual</Chip>
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <Table
                cols={[
                  { k: 'name', label: 'Employee', w: '1.4fr' },
                  { k: 'dept', label: 'Dept', w: '0.6fr' },
                  { k: 'in', label: 'In', w: '0.55fr', mono: true },
                  { k: 'out', label: 'Out', w: '0.55fr', mono: true },
                  { k: 'hrs', label: 'So-far', w: '0.7fr', mono: true },
                  { k: 'status', label: '', w: '0.9fr' },
                ]}
                rows={ATT_ROWS.concat(ATT_ROWS.slice(0, 2)).map(r => ({
                  ...r,
                  name: <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Avatar initials={r.name.split(' ').map(s=>s[0]).join('')} size={22}/><span>{r.name}</span></div>,
                }))}
                dense
              />
            </div>
          </Card>

          {/* Right rail */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minHeight: 0, overflow: 'hidden' }}>
            <Card>
              <H2>Right now</H2>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 12 }}>
                <div className="wf-num" style={{ fontSize: 40, fontWeight: 600, letterSpacing: -1, lineHeight: 1 }}>412</div>
                <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>of 480 clocked in</div>
              </div>
              <div style={{ height: 8, background: 'var(--paper-2)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ width: '86%', height: '100%', background: 'var(--accent)' }}/>
              </div>
              <div style={{ marginTop: 6, fontSize: 11, color: 'var(--ink-soft)', display: 'flex', justifyContent: 'space-between' }}>
                <span>86% present</span><span>+12 vs avg</span>
              </div>
            </Card>

            <Card>
              <H2>Stats today</H2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { l: 'Total workforce', v: '1,248', s: '+12 mo.' },
                  { l: 'Pending approvals', v: '38', s: 'punch + leave', hl: true },
                  { l: 'Late today', v: '23', s: '↑ 4 vs avg' },
                  { l: 'Overtime hrs', v: '14.2', s: 'this week' },
                ].map((s, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', paddingBottom: 10, borderBottom: i < 3 ? '1px dashed var(--line-mute)' : 'none' }}>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.l}</div>
                      <div style={{ fontSize: 11, color: 'var(--ink-soft)', marginTop: 2 }}>{s.s}</div>
                    </div>
                    <div className="wf-num" style={{ fontSize: 22, fontWeight: 600, color: s.hl ? 'var(--accent)' : 'var(--ink)' }}>{s.v}</div>
                  </div>
                ))}
              </div>
            </Card>

            <Card style={{ flex: 1, minHeight: 0 }}>
              <H2 action="all →">Alerts</H2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { tone: 'bad', t: '3 missed clock-outs', s: 'last night · auto-suggested 17:30' },
                  { tone: 'warn', t: '2 overtime caps near', s: 'C. Reyes · 39.2h' },
                  { tone: 'accent', t: '5 amendment requests', s: 'review queue' },
                ].map((a, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: 8, border: '1px solid var(--line-mute)' }}>
                    <span style={{ marginTop: 2 }}><Chip tone={a.tone}>!</Chip></span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>{a.t}</div>
                      <div style={{ fontSize: 11, color: 'var(--ink-soft)' }}>{a.s}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </AppShell>

      <Anno x={835} y={235} w={140} align="right">
        Right rail = at-a-glance status. Scrolls independently of table.
        <svg style={{ position: 'absolute', right: -16, top: 10, overflow: 'visible' }} width="30" height="20"><path className="wf-arrow" d="M2 10 L 26 10"/><path className="wf-arrow" d="M20 4 L 26 10 L 20 16"/></svg>
      </Anno>
      <Anno x={246} y={210} w={170}>
        Highlight chips = clickable filters on the table.
      </Anno>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// ADMIN DASHBOARD · Variation C — Compact stats strip + Kanban-style status cols
// ─────────────────────────────────────────────────────────────────────
function AdminDashC() {
  const cols = [
    { title: 'Clocked in', count: 412, tone: 'good', rows: ATT_ROWS.filter(r => r.in !== '—' && r.out === '—').slice(0, 5) },
    { title: 'Late', count: 23, tone: 'warn', rows: [ATT_ROWS[2]] },
    { title: 'Absent / PTO', count: 45, tone: 'bad', rows: [ATT_ROWS[4], ATT_ROWS[6]] },
    { title: 'Clocked out', count: 8, tone: 'neutral', rows: [ATT_ROWS[3]] },
  ];
  return (
    <div className="wf-root" style={{ width: '100%', height: '100%', position: 'relative' }}>
      <AppShell persona="admin" active="dash"
        title="Workforce status · today"
        subtitle="Buckets by current state — drag to reassign"
        actions={<><Btn variant="ghost"><Icon kind="grid" size={13}/> Table</Btn><Btn variant="primary"><Icon kind="plus" size={13}/> Add employee</Btn></>}
        dense>
        {/* compact strip */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'stretch' }}>
          {[
            { l: 'Workforce', v: '1,248' },
            { l: 'Scheduled', v: '480' },
            { l: 'Clocked in', v: '412', hl: 'good' },
            { l: 'Late', v: '23', hl: 'warn' },
            { l: 'Pending', v: '38', hl: 'accent' },
            { l: 'OT hrs / wk', v: '14.2' },
          ].map((s, i) => (
            <div key={i} style={{
              flex: 1, padding: '10px 14px', border: '1px solid var(--line-soft)', background: 'var(--paper)',
              display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
              borderLeft: s.hl ? '3px solid var(--' + s.hl + ')' : '1px solid var(--line-soft)',
            }}>
              <div style={{ fontSize: 10, color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.l}</div>
              <div className="wf-num" style={{ fontSize: 22, fontWeight: 600, letterSpacing: -0.5 }}>{s.v}</div>
            </div>
          ))}
        </div>

        {/* status columns */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, flex: 1, minHeight: 0 }}>
          {cols.map((c, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', border: '1px solid var(--line)', borderBottom: 'none', background: 'var(--paper)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 8, height: 8, background: 'var(--' + c.tone + ')' }}/>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{c.title}</div>
                </div>
                <span className="wf-num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-soft)' }}>{c.count}</span>
              </div>
              <div style={{ flex: 1, border: '1px solid var(--line)', background: 'var(--paper-2)', padding: 8, display: 'flex', flexDirection: 'column', gap: 6, overflow: 'hidden' }}>
                {c.rows.map((r, j) => (
                  <Card key={j} p={8} style={{ background: 'var(--paper)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <Avatar initials={r.name.split(' ').map(s=>s[0]).join('')} size={20}/>
                      <span style={{ fontSize: 12, fontWeight: 600 }}>{r.name}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, color: 'var(--ink-soft)', fontFamily: 'var(--font-mono)' }}>
                      <span>{r.dept}</span>
                      <span>{r.in === '—' ? '—' : `${r.in} → ${r.out || 'live'}`}</span>
                    </div>
                  </Card>
                ))}
                {c.rows.length === 0 && <div style={{ padding: 16, textAlign: 'center', fontSize: 11, color: 'var(--ink-mute)' }}>empty</div>}
                <Btn variant="ghost" h={26} style={{ fontSize: 11, marginTop: 'auto' }}>+ show all {c.count}</Btn>
              </div>
            </div>
          ))}
        </div>
      </AppShell>

      <Anno x={246} y={210} w={150}>
        Compact strip — color-bar = trend / threshold.
      </Anno>
      <Anno x={500} y={344} w={170} align="center">
        Drag a card to reassign · admin can correct a misclassified state.
        <svg style={{ position: 'absolute', left: 60, top: 36, overflow: 'visible' }} width="40" height="30"><path className="wf-arrow" d="M2 4 Q 18 16 38 22"/><path className="wf-arrow" d="M30 22 L 38 22 L 36 14"/></svg>
      </Anno>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// REPORTS · Variation A — Daily + Weekly side-by-side
// ─────────────────────────────────────────────────────────────────────
function ReportsA() {
  return (
    <div className="wf-root" style={{ width: '100%', height: '100%', position: 'relative' }}>
      <AppShell persona="admin" active="reports"
        title="Reports"
        subtitle="Daily & weekly attendance · Oct 14, 2026 · Week 42"
        actions={<><Btn variant="outline"><Icon kind="cal" size={13}/> This week</Btn><Btn variant="outline"><Icon kind="download" size={13}/> Export</Btn><Btn variant="primary"><Icon kind="file" size={13}/> Schedule send</Btn></>}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {/* DAILY */}
          <Card>
            <H2 action="Oct 14 ▾">Daily summary</H2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
              <Stat label="Clocked in" value="412"/>
              <Stat label="Late" value="23" sub="↑ 4"/>
              <Stat label="Absent" value="19" accent/>
              <Stat label="Avg hrs" value="7.8"/>
            </div>
            <div style={{ fontSize: 11, color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 4 }}>Punch-in distribution</div>
            <BarChart w={400} h={88} data={[
              { k: '8a', v: 28 }, { k: '8:30', v: 92 }, { k: '9a', v: 220, hl: true }, { k: '9:30', v: 56 }, { k: '10a', v: 12 }, { k: '11a', v: 4 },
            ]}/>
          </Card>

          {/* WEEKLY */}
          <Card>
            <H2 action="Wk 42 ▾">Weekly trends</H2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
              <Stat label="Avg present" value="438"/>
              <Stat label="On-time %" value="91.4%" sub="↑ 1.2 wk"/>
              <Stat label="Tot. OT" value="148h"/>
              <Stat label="Labor cost" value="$1.21M"/>
            </div>
            <div style={{ fontSize: 11, color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 4 }}>Hours per day · Wk 42</div>
            <LineChart w={400} h={88} data={[
              { k: 'Mon', v: 3210 }, { k: 'Tue', v: 3340 }, { k: 'Wed', v: 3290 }, { k: 'Thu', v: 3380 }, { k: 'Fri', v: 2980 }, { k: 'Sat', v: 410 }, { k: 'Sun', v: 280 },
            ]}/>
          </Card>
        </div>

        {/* TABLE */}
        <Card p={0} style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--line-mute)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>By department</div>
            <Tabs items={['Daily', 'Weekly', 'Monthly']} active="Weekly"/>
            <div style={{ flex: 1 }}/>
            <Chip tone="accent">total · 4 depts</Chip>
          </div>
          <Table
            cols={[
              { k: 'dept', label: 'Department', w: '1.2fr' },
              { k: 'people', label: 'Headcount', w: '0.7fr', mono: true, align: 'right' },
              { k: 'hrs', label: 'Hours', w: '0.7fr', mono: true, align: 'right' },
              { k: 'ot', label: 'Overtime', w: '0.7fr', mono: true, align: 'right' },
              { k: 'late', label: 'Late incidents', w: '0.8fr', mono: true, align: 'right' },
              { k: 'cost', label: 'Cost', w: '0.8fr', mono: true, align: 'right' },
              { k: 'trend', label: '7-day trend', w: '1.4fr' },
            ]}
            rows={[
              { dept: 'Engineering', people: '328', hrs: '12,840', ot: '32.4', late: '6', cost: '$412.0k', trend: <BarChart w={180} h={28} data={[1,1.1,.9,1.2,1.05,.4,.2].map((v,i)=>({k:'',v}))} color="var(--ink)"/> },
              { dept: 'Sales', people: '210', hrs: '8,180', ot: '12.0', late: '11', cost: '$232.4k', trend: <BarChart w={180} h={28} data={[1,.9,1,1,.95,.3,.2].map((v,i)=>({k:'',v}))} color="var(--ink)"/> },
              { dept: 'Operations', people: '492', hrs: '19,200', ot: '88.6', late: '9', cost: '$486.2k', trend: <BarChart w={180} h={28} data={[1.1,1,1.1,1,.95,.7,.5].map((v,i)=>({k:'',v}))} color="var(--accent)"/> },
              { dept: 'HR', people: '38', hrs: '1,520', ot: '4.0', late: '2', cost: '$58.6k', trend: <BarChart w={180} h={28} data={[1,1,1,1,.9,.1,0].map((v,i)=>({k:'',v}))} color="var(--ink)"/> },
            ]}
            dense
            accentCol="hrs"
          />
        </Card>
      </AppShell>

      <Anno x={246} y={210} w={160}>
        Daily &amp; weekly sit side-by-side so admin can compare today vs trend.
      </Anno>
      <Anno x={970} y={470} w={140} align="right">
        Inline sparklines avoid heavy dashboards.
      </Anno>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// REPORTS · Variation B — Tabs + big chart on top, table below
// ─────────────────────────────────────────────────────────────────────
function ReportsB() {
  return (
    <div className="wf-root" style={{ width: '100%', height: '100%', position: 'relative' }}>
      <AppShell persona="admin" active="reports"
        title="Attendance report"
        subtitle="Drill from period → department → person"
        actions={<><Btn variant="outline">Compare ▾</Btn><Btn variant="primary"><Icon kind="download" size={13}/> Export PDF</Btn></>}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Tabs items={['Daily', 'Weekly', 'Monthly', 'Custom']} active="Weekly"/>
          <Btn variant="outline" h={30} style={{ fontSize: 12 }}><Icon kind="cal" size={12}/> Oct 06 – Oct 12</Btn>
          <div style={{ flex: 1 }}/>
          <div style={{ display: 'flex', gap: 6, fontSize: 11, color: 'var(--ink-soft)' }}>
            <span><span style={{ display: 'inline-block', width: 10, height: 10, background: 'var(--accent)', marginRight: 4 }}/>Hours</span>
            <span style={{ marginLeft: 8 }}><span style={{ display: 'inline-block', width: 10, height: 10, background: 'var(--ink)', marginRight: 4 }}/>Headcount</span>
          </div>
        </div>

        <Card style={{ display: 'flex', gap: 18 }}>
          {/* big chart */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <H2>Hours worked this week</H2>
            <LineChart w={520} h={200} data={[
              { k: 'Mon', v: 3210 }, { k: 'Tue', v: 3340 }, { k: 'Wed', v: 3290 }, { k: 'Thu', v: 3380 }, { k: 'Fri', v: 2980 }, { k: 'Sat', v: 410 }, { k: 'Sun', v: 280 },
            ]}/>
            <div style={{ fontSize: 11, color: 'var(--ink-soft)', marginTop: 6 }}>Total 17,030h · ↑ 2.1% vs Wk 41</div>
          </div>

          {/* legend / breakdown panel */}
          <div style={{ width: 220, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <H2>Breakdown</H2>
            <Donut size={130} data={[{v:328,k:'Eng'},{v:492,k:'Ops'},{v:210,k:'Sales'},{v:38,k:'HR'}]}/>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 }}>
              {[
                { l: 'Operations', v: '19,200h', c: 'var(--accent)' },
                { l: 'Engineering', v: '12,840h', c: 'var(--ink)' },
                { l: 'Sales', v: '8,180h', c: 'var(--ink-mute)' },
                { l: 'HR', v: '1,520h', c: 'var(--line-soft)' },
              ].map(r => (
                <div key={r.l} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 8, height: 8, background: r.c }}/>
                  <span style={{ flex: 1 }}>{r.l}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--ink-soft)' }}>{r.v}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Day breakdown table */}
        <Card p={0} style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
          <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--line-mute)', fontSize: 14, fontWeight: 600 }}>Day-by-day</div>
          <Table
            cols={[
              { k: 'd', label: 'Day', w: '1fr' },
              { k: 'hc', label: 'Headcount', w: '0.8fr', mono: true, align: 'right' },
              { k: 'hrs', label: 'Hours', w: '0.8fr', mono: true, align: 'right' },
              { k: 'late', label: 'Late', w: '0.6fr', mono: true, align: 'right' },
              { k: 'abs', label: 'Absent', w: '0.6fr', mono: true, align: 'right' },
              { k: 'ot', label: 'OT hours', w: '0.7fr', mono: true, align: 'right' },
              { k: 'cost', label: 'Cost', w: '0.8fr', mono: true, align: 'right' },
            ]}
            rows={[
              { d: 'Mon Oct 06', hc: '448', hrs: '3,210', late: '17', abs: '12', ot: '22.4', cost: '$72.4k' },
              { d: 'Tue Oct 07', hc: '462', hrs: '3,340', late: '24', abs: '18', ot: '28.8', cost: '$76.1k' },
              { d: 'Wed Oct 08', hc: '459', hrs: '3,290', late: '12', abs: '19', ot: '21.0', cost: '$74.2k' },
              { d: 'Thu Oct 09', hc: '472', hrs: '3,380', late: '15', abs: '8', ot: '34.2', cost: '$78.0k' },
              { d: 'Fri Oct 10', hc: '410', hrs: '2,980', late: '32', abs: '24', ot: '12.6', cost: '$66.8k', _hl: true },
            ]}
            dense
          />
        </Card>
      </AppShell>

      <Anno x={246} y={240} w={150}>
        Period chooser stays sticky · drives every panel below.
      </Anno>
      <Anno x={968} y={358} w={140} align="right">
        Donut answers "where do my hours come from?"
      </Anno>
      <Anno x={968} y={602} w={140} align="right" tight>
        Friday row flagged — abnormal late+absent spike.
      </Anno>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// REPORTS · Variation C — Builder layout: filters left · chart top right · table bottom
// ─────────────────────────────────────────────────────────────────────
function ReportsC() {
  return (
    <div className="wf-root" style={{ width: '100%', height: '100%', position: 'relative' }}>
      <AppShell persona="admin" active="reports"
        title="Report builder"
        subtitle="Mix filters & metrics · saved as 'Weekly attendance · Ops'"
        actions={<><Btn variant="outline">Save as…</Btn><Btn variant="primary"><Icon kind="download" size={13}/> Run report</Btn></>}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 14, flex: 1, minHeight: 0 }}>
          {/* filter rail */}
          <Card>
            <H2>Filters</H2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Input label="Period" value="Wk 42 · Oct 06–12"/>
              <Input label="Department" value="Operations"/>
              <Input label="Location" value="All locations"/>
              <Input label="Employment" value="Full-time"/>
              <div>
                <div className="wf-label" style={{ fontSize: 12, color: 'var(--ink-soft)', marginBottom: 6, letterSpacing: 0.2, textTransform: 'uppercase' }}>Metrics</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {[
                    { l: 'Regular hours', on: true },
                    { l: 'Overtime (OT)', on: true },
                    { l: 'Night diff. (ND)', on: true },
                    { l: 'Late', on: true },
                    { l: 'Undertime', on: true },
                    { l: 'Absences', on: false },
                  ].map((m, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                      <span style={{ width: 14, height: 14, border: '1px solid var(--line)', background: m.on ? 'var(--ink)' : 'var(--paper)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>{m.on ? '✓' : ''}</span>
                      <span style={{ color: m.on ? 'var(--ink)' : 'var(--ink-soft)' }}>{m.l}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ marginTop: 8, borderTop: '1px dashed var(--line-mute)', paddingTop: 12 }}>
                <Btn variant="ghost" h={28} style={{ fontSize: 12, padding: '0 4px' }}><Icon kind="plus" size={12}/> Add filter</Btn>
              </div>
            </div>
          </Card>

          {/* right column: chart + table */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minHeight: 0 }}>
            <Card>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <H2>Operations · Wk 42</H2>
                <Tabs items={['Line', 'Bar', 'Donut']} active="Bar"/>
              </div>
              <BarChart w={640} h={150} data={[
                { k: 'Mon', v: 1340 },
                { k: 'Tue', v: 1390 },
                { k: 'Wed', v: 1360 },
                { k: 'Thu', v: 1410, hl: true },
                { k: 'Fri', v: 1180 },
                { k: 'Sat', v: 320 },
                { k: 'Sun', v: 200 },
              ]}/>
              <div style={{ marginTop: 8, fontSize: 11, color: 'var(--ink-soft)' }}>Highlight · Thu 1,410h · highest in pay period</div>
            </Card>

            <Card p={0} style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
              <div style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--line-mute)' }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>Detail rows · 218 people</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <Chip tone="accent">Ops</Chip><Chip>Full-time</Chip><Chip>Wk 42</Chip>
                </div>
              </div>
              <Table
                cols={[
                  { k: 'name', label: 'Employee', w: '1.5fr' },
                  { k: 'shifts', label: 'Shifts', w: '0.5fr', mono: true, align: 'right' },
                  { k: 'reg', label: 'Regular', w: '0.7fr', mono: true, align: 'right' },
                  { k: 'ot', label: 'OT', w: '0.55fr', mono: true, align: 'right' },
                  { k: 'nd', label: 'ND', w: '0.55fr', mono: true, align: 'right' },
                  { k: 'late', label: 'Late', w: '0.55fr', mono: true, align: 'right' },
                  { k: 'under', label: 'Undertime', w: '0.7fr', mono: true, align: 'right' },
                ]}
                rows={[
                  { name: 'Aaron Choi',     shifts: '5', reg: '38.0h', ot: '2.4h', nd: '0.0h', late: '0m',  under: '0m' },
                  { name: 'Carlos Reyes',   shifts: '5', reg: '37.8h', ot: '4.1h', nd: '2.0h', late: '46m', under: '0m', _hl: true },
                  { name: 'Eli Nakamura',   shifts: '3', reg: '22.4h', ot: '0.0h', late: '0m', nd: '0.0h', under: '90m' },
                  { name: 'Faye Olsen',     shifts: '5', reg: '39.2h', ot: '0.0h', nd: '0.0h', late: '0m',  under: '0m' },
                  { name: 'Maddie Ortega',  shifts: '5', reg: '38.8h', ot: '1.2h', nd: '4.0h', late: '12m', under: '0m' },
                ]}
                dense
              />
            </Card>
          </div>
        </div>
      </AppShell>

      <Anno x={246} y={244} w={150}>
        Filters &amp; metrics live here — output updates live.
        <svg style={{ position: 'absolute', left: -20, top: 14, overflow: 'visible' }} width="20" height="20"><path className="wf-arrow" d="M2 10 L 16 10"/><path className="wf-arrow" d="M10 4 L 16 10 L 10 16"/></svg>
      </Anno>
      <Anno x={970} y={500} w={140} align="right" tight>
        Saved configurations become shareable URLs.
      </Anno>
    </div>
  );
}

Object.assign(window, { AdminDashA, AdminDashB, AdminDashC, ReportsA, ReportsB, ReportsC, ATT_ROWS });
