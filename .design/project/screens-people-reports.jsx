// screens-people-reports.jsx — People tab + new Reports tab variations
// focused on Daily / Weekly per-employee attendance metrics.

// ─── Shared sample data ────────────────────────────────────────────────
const PEOPLE = [
  { name: 'Aaron Choi',      role: 'Account Exec',        dept: 'Sales', mgr: 'D. Vega',    loc: 'HQ · F2', hire: '2022-04-11', status: 'active',     emp: 'FT', shift: '09–17' },
  { name: 'Briana Patel',    role: 'Senior Engineer',     dept: 'Eng',   mgr: 'D. Fitzgerald', loc: 'HQ · F3', hire: '2021-08-30', status: 'active',  emp: 'FT', shift: '09–17' },
  { name: 'Carlos Reyes',    role: 'Operations Lead',     dept: 'Ops',   mgr: 'P. Khan',    loc: 'HQ · F2', hire: '2019-11-04', status: 'active',     emp: 'FT', shift: '09–17' },
  { name: 'Dana Fitzgerald', role: 'Engineering Manager', dept: 'Eng',   mgr: 'M. Jensen',  loc: 'Remote',  hire: '2020-02-18', status: 'active',     emp: 'FT', shift: '09–13' },
  { name: 'Eli Nakamura',    role: 'Warehouse Tech',      dept: 'Ops',   mgr: 'P. Khan',    loc: 'HQ · F1', hire: '2023-06-22', status: 'leave',      emp: 'FT', shift: '09–17' },
  { name: 'Faye Olsen',      role: 'Account Manager',     dept: 'Sales', mgr: 'D. Vega',    loc: 'Remote',  hire: '2022-10-03', status: 'active',     emp: 'FT', shift: '09–17' },
  { name: 'Gus Pham',        role: 'People Specialist',   dept: 'HR',    mgr: 'M. Jensen',  loc: 'HQ · F3', hire: '2024-01-15', status: 'active',     emp: 'FT', shift: '09–17' },
  { name: 'Hana Liu',        role: 'Frontend Engineer',   dept: 'Eng',   mgr: 'D. Fitzgerald', loc: 'HQ · F3', hire: '2024-03-01', status: 'onboarding', emp: 'FT', shift: '09–17' },
  { name: 'Ivan Bates',      role: 'Logistics Operator',  dept: 'Ops',   mgr: 'P. Khan',    loc: 'HQ · F1', hire: '2021-07-09', status: 'active',     emp: 'FT', shift: '22–06' },
  { name: 'June Park',       role: 'Sales Coordinator',   dept: 'Sales', mgr: 'D. Vega',    loc: 'HQ · F2', hire: '2023-02-27', status: 'active',     emp: 'PT', shift: '09–13' },
];

const statusTone = { active: 'good', leave: 'neutral', onboarding: 'accent' };
const statusLabel = { active: '● active', leave: 'on leave', onboarding: 'onboarding' };
const deptColor = { Sales: 'var(--accent)', Eng: 'var(--good)', Ops: 'var(--warn)', HR: 'var(--ink-mute)' };

// Daily metrics by employee (today)
const DAILY = [
  { name: 'Aaron Choi',      dept: 'Sales', in: '08:54', out: '17:02', reg: '7h 38m', ot: '0h 00m', nd: '0h 00m', late: '0m',  ut: '0m'  },
  { name: 'Briana Patel',    dept: 'Eng',   in: '09:02', out: '17:34', reg: '8h 02m', ot: '0h 32m', nd: '0h 00m', late: '2m',  ut: '0m'  },
  { name: 'Carlos Reyes',    dept: 'Ops',   in: '09:23', out: '17:00', reg: '7h 07m', ot: '0h 00m', nd: '0h 00m', late: '23m', ut: '53m', hl: true },
  { name: 'Dana Fitzgerald', dept: 'Eng',   in: '08:58', out: '13:01', reg: '4h 03m', ot: '0h 00m', nd: '0h 00m', late: '0m',  ut: '0m'  },
  { name: 'Eli Nakamura',    dept: 'Ops',   in: '—',     out: '—',     reg: '—',      ot: '—',      nd: '—',      late: '—',   ut: '—',   absent: true },
  { name: 'Faye Olsen',      dept: 'Sales', in: '09:01', out: '17:04', reg: '7h 33m', ot: '0h 00m', nd: '0h 00m', late: '1m',  ut: '0m'  },
  { name: 'Hana Liu',        dept: 'Eng',   in: '09:00', out: '18:10', reg: '8h 00m', ot: '1h 10m', nd: '0h 00m', late: '0m',  ut: '0m'  },
  { name: 'Ivan Bates',      dept: 'Ops',   in: '21:58', out: '06:04', reg: '7h 26m', ot: '0h 06m', nd: '6h 00m', late: '0m',  ut: '0m'  },
  { name: 'June Park',       dept: 'Sales', in: '09:00', out: '15:30', reg: '6h 00m', ot: '0h 00m', nd: '0h 00m', late: '0m',  ut: '30m' },
];

// Weekly metrics by employee (Mon-Sun rollup)
const WEEKLY = [
  { name: 'Aaron Choi',      dept: 'Sales', shifts: 5, reg: '38h 00m', ot: '2h 24m', nd: '0h 00m', late: '0m',   ut: '0m'   },
  { name: 'Briana Patel',    dept: 'Eng',   shifts: 5, reg: '39h 20m', ot: '2h 12m', nd: '0h 00m', late: '12m',  ut: '0m'   },
  { name: 'Carlos Reyes',    dept: 'Ops',   shifts: 5, reg: '37h 48m', ot: '4h 06m', nd: '2h 00m', late: '46m',  ut: '53m', hl: true },
  { name: 'Dana Fitzgerald', dept: 'Eng',   shifts: 3, reg: '12h 09m', ot: '0h 00m', nd: '0h 00m', late: '0m',   ut: '0m'   },
  { name: 'Eli Nakamura',    dept: 'Ops',   shifts: 3, reg: '22h 24m', ot: '0h 00m', nd: '0h 00m', late: '0m',   ut: '90m', hl: true },
  { name: 'Faye Olsen',      dept: 'Sales', shifts: 5, reg: '39h 12m', ot: '0h 00m', nd: '0h 00m', late: '4m',   ut: '0m'   },
  { name: 'Hana Liu',        dept: 'Eng',   shifts: 5, reg: '40h 00m', ot: '3h 50m', nd: '0h 00m', late: '0m',   ut: '0m'   },
  { name: 'Ivan Bates',      dept: 'Ops',   shifts: 5, reg: '37h 10m', ot: '0h 30m', nd: '30h 00m', late: '0m',  ut: '0m'   },
  { name: 'June Park',       dept: 'Sales', shifts: 5, reg: '30h 00m', ot: '0h 00m', nd: '0h 00m', late: '0m',   ut: '90m'  },
];

// ────────────────────────────────────────────────────────────────────────
// PEOPLE · A — Directory grid (cards)
// ────────────────────────────────────────────────────────────────────────
function PeopleTabA() {
  return (
    <div className="wf-root" style={{ width: '100%', height: '100%', position: 'relative' }}>
      <AppShell persona="admin" active="people"
        title="People"
        subtitle="1,248 employees · 4 departments · 3 locations"
        actions={<><Btn variant="outline"><Icon kind="download" size={13}/> Export</Btn><Btn variant="primary"><Icon kind="plus" size={13}/> Add employee</Btn></>}
      >
        {/* Filter row + summary */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <Tabs items={['All 1,248', 'Active 1,202', 'On leave 32', 'Onboarding 14']} active="All 1,248"/>
          <div style={{ flex: 1 }}/>
          <div className="wf-input" style={{ width: 240, height: 30, padding: '0 10px', display: 'flex', alignItems: 'center', gap: 6, border: '1px solid var(--line-soft)' }}>
            <Icon kind="search" size={12} color="var(--ink-mute)"/>
            <span style={{ fontSize: 12, color: 'var(--ink-mute)' }}>Search name, role, manager…</span>
          </div>
          <Btn variant="outline" h={30} style={{ fontSize: 12 }}><Icon kind="filter" size={12}/> Filters</Btn>
        </div>

        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Sort</span>
          <Chip tone="solid">Name ↑</Chip><Chip>Dept</Chip><Chip>Hire date</Chip><Chip>Manager</Chip>
          <div style={{ flex: 1 }}/>
          <Btn variant="ghost" h={28} style={{ fontSize: 12 }}><Icon kind="grid" size={12}/> Grid</Btn>
          <Btn variant="ghost" h={28} style={{ fontSize: 12, color: 'var(--ink-soft)' }}><Icon kind="list" size={12}/> List</Btn>
        </div>

        {/* Card grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, flex: 1, minHeight: 0, alignContent: 'start', overflow: 'hidden' }}>
          {PEOPLE.slice(0, 8).map((p, i) => (
            <Card key={i} p={0} style={{ display: 'flex', flexDirection: 'column' }}>
              {/* dept bar */}
              <div style={{ height: 4, background: deptColor[p.dept] || 'var(--line-soft)' }}/>
              <div style={{ padding: '14px 14px 10px', display: 'flex', gap: 10 }}>
                <Avatar initials={p.name.split(' ').map(s=>s[0]).join('')} size={44} tone={p.status === 'onboarding' ? 'accent' : 'dark'}/>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, letterSpacing: -0.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--ink-soft)', marginTop: 2 }}>{p.role}</div>
                </div>
              </div>
              <div style={{ padding: '0 14px 12px', display: 'flex', flexDirection: 'column', gap: 6, fontSize: 11.5 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--ink-soft)' }}>
                  <span>Dept</span><span style={{ color: 'var(--ink)' }}>{p.dept}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--ink-soft)' }}>
                  <span>Manager</span><span style={{ color: 'var(--ink)' }}>{p.mgr}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--ink-soft)' }}>
                  <span>Location</span><span style={{ color: 'var(--ink)' }}>{p.loc}</span>
                </div>
              </div>
              <div style={{ marginTop: 'auto', padding: '8px 14px', borderTop: '1px solid var(--line-mute)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Chip tone={statusTone[p.status]}>{statusLabel[p.status]}</Chip>
                <div style={{ display: 'flex', gap: 6, color: 'var(--ink-soft)' }}>
                  <Icon kind="clock" size={13}/><Icon kind="edit" size={13}/>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </AppShell>

      <Anno x={246} y={210} w={170} tight>
        Persona tabs · onboarding pinned visibly so HR doesn't lose them.
      </Anno>
      <Anno x={500} y={360} w={170} align="center">
        Dept colour bar = instant grouping cue.
        <svg style={{ position: 'absolute', left: 60, top: 30, overflow: 'visible' }} width="40" height="20"><path className="wf-arrow" d="M20 2 L 20 16"/><path className="wf-arrow" d="M14 10 L 20 16 L 26 10"/></svg>
      </Anno>
      <Anno x={970} y={520} w={140} align="right" tight>
        Card foot · status pill + jump to attendance / edit.
      </Anno>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────
// PEOPLE · B — Roster table + side profile drawer
// ────────────────────────────────────────────────────────────────────────
function PeopleTabB() {
  const sel = PEOPLE[2]; // Carlos
  return (
    <div className="wf-root" style={{ width: '100%', height: '100%', position: 'relative' }}>
      <AppShell persona="admin" active="people"
        title="People · Roster"
        subtitle="Power view · select a row to inspect"
        actions={<><Btn variant="outline"><Icon kind="download" size={13}/> Export</Btn><Btn variant="primary"><Icon kind="plus" size={13}/> Add employee</Btn></>}
        dense>
        <div style={{ display: 'grid', gridTemplateColumns: '1.45fr 1fr', gap: 14, flex: 1, minHeight: 0 }}>
          {/* LEFT — table */}
          <Card p={0} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--line-mute)', display: 'flex', gap: 8, alignItems: 'center' }}>
              <div className="wf-input" style={{ flex: 1, height: 30, padding: '0 10px', display: 'flex', alignItems: 'center', gap: 6, border: '1px solid var(--line-soft)' }}>
                <Icon kind="search" size={12} color="var(--ink-mute)"/>
                <span style={{ fontSize: 12, color: 'var(--ink-mute)' }}>Search · 1,248</span>
              </div>
              <Btn variant="outline" h={30} style={{ fontSize: 12 }}><Icon kind="filter" size={12}/></Btn>
            </div>
            <div style={{ padding: '8px 12px', display: 'flex', gap: 4, borderBottom: '1px solid var(--line-mute)', background: 'var(--paper-2)' }}>
              {['All', 'Sales', 'Eng', 'Ops', 'HR'].map((c, i) => (
                <div key={c} style={{ padding: '4px 10px', fontSize: 11, border: '1px solid var(--line-soft)', background: i === 0 ? 'var(--ink)' : 'var(--paper)', color: i === 0 ? '#fff' : 'var(--ink)' }}>{c}</div>
              ))}
              <div style={{ flex: 1 }}/>
              <span style={{ fontSize: 11, color: 'var(--ink-soft)', alignSelf: 'center' }}>10 of 1,248</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 0.8fr 0.9fr 0.7fr', padding: '8px 12px', borderBottom: '1px solid var(--line)', background: 'var(--paper)', fontSize: 10.5, color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: 0.4 }}>
              <div>Employee · Role</div><div>Dept</div><div>Manager</div><div style={{ textAlign: 'right' }}>Status</div>
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              {PEOPLE.map((p, i) => {
                const isSel = p.name === sel.name;
                return (
                  <div key={i} style={{
                    display: 'grid', gridTemplateColumns: '1.8fr 0.8fr 0.9fr 0.7fr',
                    padding: '9px 12px', borderBottom: '1px solid var(--line-mute)',
                    alignItems: 'center', fontSize: 12.5,
                    background: isSel ? 'var(--accent-soft)' : 'transparent',
                    borderLeft: '3px solid ' + (isSel ? 'var(--accent)' : 'transparent'),
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Avatar initials={p.name.split(' ').map(s=>s[0]).join('')} size={26} tone={isSel ? 'accent' : 'neutral'}/>
                      <div>
                        <div style={{ fontWeight: isSel ? 600 : 500 }}>{p.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--ink-soft)' }}>{p.role}</div>
                      </div>
                    </div>
                    <div>{p.dept}</div>
                    <div>{p.mgr}</div>
                    <div style={{ textAlign: 'right' }}><Chip tone={statusTone[p.status]}>{statusLabel[p.status]}</Chip></div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* RIGHT — profile drawer */}
          <Card p={0} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--line-mute)', display: 'flex', alignItems: 'center', gap: 14 }}>
              <Avatar initials="CR" size={52} tone="dark"/>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: -0.3 }}>Carlos Reyes</div>
                <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>Operations Lead · Ops · Mgr: P. Khan</div>
              </div>
              <Chip tone="good">{statusLabel.active}</Chip>
            </div>

            {/* Meta grid */}
            <div style={{ padding: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, borderBottom: '1px solid var(--line-mute)' }}>
              {[
                { l: 'Employee ID', v: '04812' },
                { l: 'Email', v: 'carlos@minihcm.io' },
                { l: 'Location', v: 'HQ · Floor 2' },
                { l: 'Hire date', v: 'Nov 04, 2019 · 5y' },
                { l: 'Employment', v: 'Full-time' },
                { l: 'Shift', v: '09:00–17:00' },
              ].map((m, i) => (
                <div key={i}>
                  <div style={{ fontSize: 10, color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{m.l}</div>
                  <div style={{ fontSize: 13, marginTop: 2 }}>{m.v}</div>
                </div>
              ))}
            </div>

            {/* This week attendance summary */}
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line-mute)' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ fontSize: 11, color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: 0.5 }}>This week · attendance</div>
                <span style={{ fontSize: 11, color: 'var(--ink-soft)' }}>Wk 42</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 6 }}>
                {[
                  { l: 'Reg', v: '37h 48m' },
                  { l: 'OT',  v: '4h 06m', tone: 'accent' },
                  { l: 'ND',  v: '2h 00m' },
                  { l: 'Late',v: '46m',    tone: 'warn' },
                  { l: 'UT',  v: '53m',    tone: 'warn' },
                ].map((s, i) => (
                  <div key={i} style={{ border: '1px solid var(--line-mute)', padding: '8px 10px', textAlign: 'center', background: s.tone === 'warn' ? '#fbeee6' : s.tone === 'accent' ? 'var(--accent-soft)' : 'var(--paper)' }}>
                    <div style={{ fontSize: 10, color: 'var(--ink-soft)', textTransform: 'uppercase' }}>{s.l}</div>
                    <div className="wf-num" style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 13, marginTop: 2 }}>{s.v}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tabs strip */}
            <div style={{ padding: '10px 18px', display: 'flex', gap: 16, borderBottom: '1px solid var(--line-mute)', fontSize: 12, color: 'var(--ink-soft)' }}>
              {['Profile', 'Attendance', 'Leave', 'Documents', 'Audit'].map((t, i) => (
                <span key={t} style={{ paddingBottom: 6, borderBottom: i === 0 ? '2px solid var(--ink)' : 'none', color: i === 0 ? 'var(--ink)' : 'inherit', fontWeight: i === 0 ? 600 : 400 }}>{t}</span>
              ))}
            </div>

            {/* Footer actions */}
            <div style={{ marginTop: 'auto', padding: 14, display: 'flex', gap: 8 }}>
              <Btn variant="outline" style={{ flex: 1 }}><Icon kind="clock" size={13}/> Open attendance</Btn>
              <Btn variant="outline" style={{ flex: 1 }}><Icon kind="edit" size={13}/> Edit profile</Btn>
              <Btn variant="danger"><Icon kind="logout" size={13}/> Off-board</Btn>
            </div>
          </Card>
        </div>
      </AppShell>

      <Anno x={518} y={245} w={150} align="center" tight>
        Select left → inspect right. j/k navigates.
        <svg style={{ position: 'absolute', left: 40, top: 30, overflow: 'visible' }} width="60" height="20"><path className="wf-arrow" d="M2 10 L 54 10"/><path className="wf-arrow" d="M48 4 L 54 10 L 48 16"/></svg>
      </Anno>
      <Anno x={970} y={440} w={140} align="right" tight>
        Week metrics live in the profile — single click to attendance for detail.
      </Anno>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────
// PEOPLE · C — Org tree (dept rail) + people pane
// ────────────────────────────────────────────────────────────────────────
function PeopleTabC() {
  const tree = [
    { id: 'all', label: 'All people', count: 1248, depth: 0 },
    { id: 'sales', label: 'Sales', count: 210, depth: 1, color: 'Sales' },
    { id: 'sales-em', label: 'Enterprise', count: 84, depth: 2 },
    { id: 'sales-mm', label: 'Mid-market', count: 126, depth: 2, sel: false },
    { id: 'eng', label: 'Engineering', count: 328, depth: 1, color: 'Eng', sel: true },
    { id: 'eng-fe', label: 'Frontend', count: 64, depth: 2 },
    { id: 'eng-be', label: 'Backend', count: 112, depth: 2 },
    { id: 'eng-pl', label: 'Platform', count: 84, depth: 2 },
    { id: 'eng-qa', label: 'QA · SRE', count: 68, depth: 2 },
    { id: 'ops', label: 'Operations', count: 492, depth: 1, color: 'Ops' },
    { id: 'ops-wh', label: 'Warehouse', count: 256, depth: 2 },
    { id: 'ops-lg', label: 'Logistics', count: 178, depth: 2 },
    { id: 'ops-sf', label: 'Storefront', count: 58, depth: 2 },
    { id: 'hr', label: 'HR', count: 38, depth: 1, color: 'HR' },
  ];
  const engPeople = PEOPLE.filter(p => p.dept === 'Eng');

  return (
    <div className="wf-root" style={{ width: '100%', height: '100%', position: 'relative' }}>
      <AppShell persona="admin" active="people"
        title="People · Org explorer"
        subtitle="Browse departments → teams → people"
        actions={<><Btn variant="outline"><Icon kind="download" size={13}/> Export</Btn><Btn variant="primary"><Icon kind="plus" size={13}/> Add employee</Btn></>}
        dense>
        <div style={{ display: 'grid', gridTemplateColumns: '230px 1fr', gap: 14, flex: 1, minHeight: 0 }}>
          {/* tree rail */}
          <Card p={0} style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--line-mute)', fontSize: 11, color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Departments</div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              {tree.map(t => (
                <div key={t.id} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '7px 14px', paddingLeft: 14 + t.depth * 14,
                  fontSize: 12.5,
                  background: t.sel ? 'var(--accent-soft)' : 'transparent',
                  fontWeight: t.sel ? 600 : 400,
                  borderLeft: '3px solid ' + (t.sel ? 'var(--accent)' : 'transparent'),
                }}>
                  {t.depth === 1 && <span style={{ width: 8, height: 8, background: deptColor[t.color] || 'var(--line-soft)' }}/>}
                  {t.depth > 1 && <span style={{ width: 8, color: 'var(--ink-mute)', fontSize: 10 }}>└</span>}
                  <span style={{ flex: 1 }}>{t.label}</span>
                  <span style={{ fontSize: 11, color: 'var(--ink-soft)', fontFamily: 'var(--font-mono)' }}>{t.count}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Right: breadcrumb + people */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minHeight: 0 }}>
            {/* Breadcrumb + dept summary */}
            <Card p={14}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--ink-soft)', marginBottom: 10 }}>
                <span>All people</span>
                <span>›</span>
                <span style={{ color: 'var(--ink)', fontWeight: 600 }}>Engineering</span>
                <span style={{ marginLeft: 'auto' }}>Manager · D. Fitzgerald</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
                <Stat label="Headcount" value="328"/>
                <Stat label="Active" value="316" sub="96%"/>
                <Stat label="Onboarding" value="6" accent/>
                <Stat label="On leave" value="6"/>
                <Stat label="Avg tenure" value="2.4y"/>
              </div>
            </Card>

            {/* People table for Eng */}
            <Card p={0} style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--line-mute)', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>Engineering · 4 people shown</div>
                <Tabs items={['All', 'Frontend', 'Backend', 'Platform', 'QA·SRE']} active="All"/>
                <div style={{ flex: 1 }}/>
                <Btn variant="ghost" h={28} style={{ fontSize: 12 }}><Icon kind="grid" size={12}/> Org chart</Btn>
              </div>
              <Table
                cols={[
                  { k: 'name', label: 'Employee', w: '1.6fr' },
                  { k: 'role', label: 'Role', w: '1.2fr' },
                  { k: 'mgr', label: 'Manager', w: '0.9fr' },
                  { k: 'loc', label: 'Location', w: '0.9fr' },
                  { k: 'hire', label: 'Hired', w: '0.9fr', mono: true },
                  { k: 'status', label: 'Status', w: '0.7fr' },
                ]}
                rows={engPeople.map(p => ({
                  name: <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Avatar initials={p.name.split(' ').map(s=>s[0]).join('')} size={22}/>{p.name}</div>,
                  role: p.role, mgr: p.mgr, loc: p.loc, hire: p.hire,
                  status: <Chip tone={statusTone[p.status]}>{statusLabel[p.status]}</Chip>,
                }))}
                dense
              />
            </Card>
          </div>
        </div>
      </AppShell>

      <Anno x={244} y={232} w={170}>
        Departments collapse / expand · selected branch drives the right pane.
        <svg style={{ position: 'absolute', left: -12, top: 30, overflow: 'visible' }} width="14" height="20"><path className="wf-arrow" d="M12 10 L 2 10"/><path className="wf-arrow" d="M6 4 L 2 10 L 6 16"/></svg>
      </Anno>
      <Anno x={968} y={310} w={140} align="right" tight>
        Dept stats roll up · onboarding flagged in accent.
      </Anno>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────
// REPORTS · A — Tabbed (Daily / Weekly) employee metrics table
// ────────────────────────────────────────────────────────────────────────
function RptDWA({ defaultPeriod = 'weekly' } = {}) {
  const isDaily = defaultPeriod === 'daily';
  const rows = isDaily ? DAILY : WEEKLY;

  // Totals
  const tot = rows.reduce((a, r) => {
    if (r.absent) return a;
    return a;
  }, {});

  return (
    <div className="wf-root" style={{ width: '100%', height: '100%', position: 'relative' }}>
      <AppShell persona="admin" active="reports"
        title="Attendance reports"
        subtitle="Per-employee · Regular · OT · ND · Late · Undertime"
        actions={<><Btn variant="outline"><Icon kind="filter" size={13}/> Filter</Btn><Btn variant="outline"><Icon kind="download" size={13}/> Export</Btn><Btn variant="primary"><Icon kind="file" size={13}/> Print</Btn></>}
      >
        {/* Period switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Tabs items={['Daily', 'Weekly']} active={isDaily ? 'Daily' : 'Weekly'}/>
          {!isDaily && (
            <>
              <Btn variant="ghost" h={30} style={{ fontSize: 12 }}>‹ Wk 41</Btn>
              <Btn variant="outline" h={30} style={{ fontSize: 12 }}><Icon kind="cal" size={12}/> Wk 42 · Oct 06 – Oct 12, 2026</Btn>
              <Btn variant="ghost" h={30} style={{ fontSize: 12 }}>Wk 43 ›</Btn>
            </>
          )}
          {isDaily && (
            <>
              <Btn variant="ghost" h={30} style={{ fontSize: 12 }}>‹ Mon</Btn>
              <Btn variant="outline" h={30} style={{ fontSize: 12 }}><Icon kind="cal" size={12}/> Tue · Oct 14, 2026</Btn>
              <Btn variant="ghost" h={30} style={{ fontSize: 12 }}>Wed ›</Btn>
            </>
          )}
          <div style={{ flex: 1 }}/>
          <Input label={null} value="All departments" w={180} h={30}/>
          <Input label={null} value="All employment" w={150} h={30}/>
        </div>

        {/* Period totals strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
          <Stat label="Regular" value={isDaily ? '63h 49m' : '296h 03m'} sub={isDaily ? '8 employees · today' : '5-day total'}/>
          <Stat label="Overtime" value={isDaily ? '1h 48m' : '13h 08m'} accent sub={isDaily ? '2 employees' : 'Wk 42'}/>
          <Stat label="Night diff." value={isDaily ? '6h 00m' : '32h 00m'} sub="22:00–06:00"/>
          <Stat label="Late" value={isDaily ? '26m' : '1h 02m'} sub={isDaily ? '3 incidents' : '7 incidents'}/>
          <Stat label="Undertime" value={isDaily ? '1h 23m' : '3h 53m'} sub={isDaily ? '2 employees' : '3 employees'}/>
        </div>

        {/* Main employee table */}
        <Card p={0} style={{ flex: 1, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 0.65fr ' + (isDaily ? '0.55fr 0.55fr ' : '0.45fr ') + '0.75fr 0.65fr 0.65fr 0.6fr 0.65fr', padding: '10px 14px', borderBottom: '1px solid var(--line)', background: 'var(--paper-2)', fontSize: 11, color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: 0.4 }}>
            <div>Employee</div>
            <div>Dept</div>
            {isDaily ? <><div>In</div><div>Out</div></> : <div style={{ textAlign: 'right' }}>Shifts</div>}
            <div style={{ textAlign: 'right' }}>Regular</div>
            <div style={{ textAlign: 'right' }}>OT</div>
            <div style={{ textAlign: 'right' }}>ND</div>
            <div style={{ textAlign: 'right' }}>Late</div>
            <div style={{ textAlign: 'right' }}>UT</div>
          </div>

          {rows.map((r, i) => (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '1.6fr 0.65fr ' + (isDaily ? '0.55fr 0.55fr ' : '0.45fr ') + '0.75fr 0.65fr 0.65fr 0.6fr 0.65fr',
              padding: '11px 14px', borderBottom: i < rows.length - 1 ? '1px solid var(--line-mute)' : 'none',
              fontSize: 12.5, alignItems: 'center',
              background: r.hl ? 'var(--accent-soft)' : (r.absent ? 'rgba(0,0,0,.02)' : 'transparent'),
              opacity: r.absent ? 0.6 : 1,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Avatar initials={r.name.split(' ').map(s=>s[0]).join('')} size={22}/>
                <span>{r.name}</span>
                {r.absent && <Chip tone="bad">absent</Chip>}
              </div>
              <div>{r.dept}</div>
              {isDaily ? <><div style={{ fontFamily: 'var(--font-mono)' }}>{r.in}</div><div style={{ fontFamily: 'var(--font-mono)' }}>{r.out}</div></> : <div style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{r.shifts}</div>}
              <div style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{r.reg}</div>
              <div style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', color: r.ot && r.ot !== '0h 00m' && r.ot !== '0:00' ? 'var(--accent)' : 'var(--ink-soft)' }}>{r.ot}</div>
              <div style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', color: r.nd && r.nd !== '0h 00m' && r.nd !== '0:00' ? 'var(--ink)' : 'var(--ink-soft)' }}>{r.nd}</div>
              <div style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', color: r.late && r.late !== '0m' && r.late !== '—' ? 'var(--warn)' : 'var(--ink-soft)' }}>{r.late}</div>
              <div style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', color: r.ut && r.ut !== '0m' && r.ut !== '—' ? 'var(--warn)' : 'var(--ink-soft)' }}>{r.ut}</div>
            </div>
          ))}

          {/* Totals row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 0.65fr ' + (isDaily ? '0.55fr 0.55fr ' : '0.45fr ') + '0.75fr 0.65fr 0.65fr 0.6fr 0.65fr',
            padding: '12px 14px', background: 'var(--ink)', color: '#fff', fontSize: 12.5, alignItems: 'center', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
            <div style={{ fontFamily: 'var(--font-sans)' }}>TOTALS · {isDaily ? '8 active' : '9 employees'}</div>
            <div/>
            {isDaily ? <><div/><div/></> : <div style={{ textAlign: 'right' }}>43</div>}
            <div style={{ textAlign: 'right' }}>{isDaily ? '63h 49m' : '296h 03m'}</div>
            <div style={{ textAlign: 'right' }}>{isDaily ? '1h 48m' : '13h 08m'}</div>
            <div style={{ textAlign: 'right' }}>{isDaily ? '6h 00m' : '32h 00m'}</div>
            <div style={{ textAlign: 'right' }}>{isDaily ? '26m' : '1h 02m'}</div>
            <div style={{ textAlign: 'right' }}>{isDaily ? '1h 23m' : '3h 53m'}</div>
          </div>
        </Card>
      </AppShell>

      <Anno x={246} y={210} w={170} tight>
        Single switch flips between Daily &amp; Weekly · everything below recomputes.
        <svg style={{ position: 'absolute', left: 130, top: 14, overflow: 'visible' }} width="40" height="20"><path className="wf-arrow" d="M2 10 L 36 10"/><path className="wf-arrow" d="M30 4 L 36 10 L 30 16"/></svg>
      </Anno>
      <Anno x={968} y={420} w={140} align="right" tight>
        OT in blue · Late &amp; UT in amber so they pop in a long roster.
      </Anno>
      <Anno x={246} y={560} w={170} tight>
        Sticky totals row — useful when scrolling 100s of employees.
      </Anno>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────
// REPORTS · B — Daily + Weekly side-by-side (no toggle)
// ────────────────────────────────────────────────────────────────────────
function RptDWB() {
  const cell = (val, kind) => {
    const isZero = val === '0h 00m' || val === '0m' || val === '0:00' || val === '0h 00m';
    let color = 'var(--ink)';
    if (kind === 'ot' && !isZero) color = 'var(--accent)';
    if ((kind === 'late' || kind === 'ut') && !isZero && val !== '—') color = 'var(--warn)';
    if (isZero) color = 'var(--ink-mute)';
    return <span style={{ fontFamily: 'var(--font-mono)', color }}>{val}</span>;
  };

  const miniRow = (rows, isDaily) => (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 0.65fr 0.65fr 0.55fr 0.5fr 0.5fr', padding: '8px 10px', borderBottom: '1px solid var(--line)', background: 'var(--paper-2)', fontSize: 10, color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: 0.4 }}>
        <div>Employee</div>
        <div style={{ textAlign: 'right' }}>Regular</div>
        <div style={{ textAlign: 'right' }}>OT</div>
        <div style={{ textAlign: 'right' }}>ND</div>
        <div style={{ textAlign: 'right' }}>Late</div>
        <div style={{ textAlign: 'right' }}>UT</div>
      </div>
      {rows.slice(0, 8).map((r, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.6fr 0.65fr 0.65fr 0.55fr 0.5fr 0.5fr', padding: '8px 10px', borderBottom: '1px solid var(--line-mute)', fontSize: 12, alignItems: 'center', background: r.hl ? 'var(--accent-soft)' : 'transparent', opacity: r.absent ? 0.55 : 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Avatar initials={r.name.split(' ').map(s=>s[0]).join('')} size={18}/>{r.name}</div>
          <div style={{ textAlign: 'right' }}>{cell(r.reg, 'reg')}</div>
          <div style={{ textAlign: 'right' }}>{cell(r.ot, 'ot')}</div>
          <div style={{ textAlign: 'right' }}>{cell(r.nd, 'nd')}</div>
          <div style={{ textAlign: 'right' }}>{cell(r.late, 'late')}</div>
          <div style={{ textAlign: 'right' }}>{cell(r.ut, 'ut')}</div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="wf-root" style={{ width: '100%', height: '100%', position: 'relative' }}>
      <AppShell persona="admin" active="reports"
        title="Attendance reports"
        subtitle="Today's snapshot &amp; this week's roll-up, side-by-side"
        actions={<><Btn variant="outline"><Icon kind="filter" size={13}/> Filter</Btn><Btn variant="outline"><Icon kind="download" size={13}/> Export</Btn><Btn variant="primary"><Icon kind="file" size={13}/> Print both</Btn></>}
        dense
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, flex: 1, minHeight: 0 }}>
          {/* DAILY */}
          <Card p={0} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--line-mute)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Chip tone="solid">Daily</Chip>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Tue · Oct 14, 2026</div>
              <div style={{ flex: 1 }}/>
              <Btn variant="ghost" h={26} style={{ fontSize: 11 }}>‹</Btn>
              <Btn variant="ghost" h={26} style={{ fontSize: 11 }}>›</Btn>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', borderBottom: '1px solid var(--line-mute)' }}>
              {[
                { l: 'Reg', v: '63h 49m' },
                { l: 'OT',  v: '1h 48m', tone: 'accent' },
                { l: 'ND',  v: '6h 00m' },
                { l: 'Late',v: '26m', tone: 'warn' },
                { l: 'UT',  v: '1h 23m', tone: 'warn' },
              ].map((s, i) => (
                <div key={i} style={{ padding: '10px 8px', textAlign: 'center', borderRight: i < 4 ? '1px solid var(--line-mute)' : 'none', background: s.tone === 'accent' ? 'var(--accent-soft)' : s.tone === 'warn' ? '#fbeee6' : 'transparent' }}>
                  <div style={{ fontSize: 9, color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.l}</div>
                  <div className="wf-num" style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 14, marginTop: 2 }}>{s.v}</div>
                </div>
              ))}
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>{miniRow(DAILY, true)}</div>
            <div style={{ padding: '8px 12px', borderTop: '1px solid var(--line-mute)', background: 'var(--paper-2)', fontSize: 11, color: 'var(--ink-soft)', display: 'flex', justifyContent: 'space-between' }}>
              <span>8 active · 1 absent · 0 PTO</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>9 / 9 expected</span>
            </div>
          </Card>

          {/* WEEKLY */}
          <Card p={0} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--line-mute)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Chip tone="solid">Weekly</Chip>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Wk 42 · Oct 06 – Oct 12</div>
              <div style={{ flex: 1 }}/>
              <Btn variant="ghost" h={26} style={{ fontSize: 11 }}>‹</Btn>
              <Btn variant="ghost" h={26} style={{ fontSize: 11 }}>›</Btn>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', borderBottom: '1px solid var(--line-mute)' }}>
              {[
                { l: 'Reg', v: '296h 03m' },
                { l: 'OT',  v: '13h 08m', tone: 'accent' },
                { l: 'ND',  v: '32h 00m' },
                { l: 'Late',v: '1h 02m', tone: 'warn' },
                { l: 'UT',  v: '3h 53m', tone: 'warn' },
              ].map((s, i) => (
                <div key={i} style={{ padding: '10px 8px', textAlign: 'center', borderRight: i < 4 ? '1px solid var(--line-mute)' : 'none', background: s.tone === 'accent' ? 'var(--accent-soft)' : s.tone === 'warn' ? '#fbeee6' : 'transparent' }}>
                  <div style={{ fontSize: 9, color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.l}</div>
                  <div className="wf-num" style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 14, marginTop: 2 }}>{s.v}</div>
                </div>
              ))}
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>{miniRow(WEEKLY, false)}</div>
            <div style={{ padding: '8px 12px', borderTop: '1px solid var(--line-mute)', background: 'var(--paper-2)', fontSize: 11, color: 'var(--ink-soft)', display: 'flex', justifyContent: 'space-between' }}>
              <span>9 employees · 43 shifts</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>↑ 2.1% vs Wk 41</span>
            </div>
          </Card>
        </div>
      </AppShell>

      <Anno x={500} y={210} w={170} align="center" tight>
        Both reports visible at once · scan today vs this week without switching.
      </Anno>
      <Anno x={246} y={295} w={150} tight>
        Each panel has its own period stepper.
      </Anno>
      <Anno x={970} y={520} w={140} align="right" tight>
        Foot strip rolls up count/totals for the period.
      </Anno>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────
// REPORTS · C — Weekly grid: employee × day with metric breakdown footer
// ────────────────────────────────────────────────────────────────────────
function RptDWC() {
  // Per employee, 7 daily mini cells
  const days = ['Mon 06','Tue 07','Wed 08','Thu 09','Fri 10','Sat 11','Sun 12'];
  // Each cell: { reg, ot, nd, flag } where flag = late|ut|abs|null
  const cells = [
    ['Aaron Choi','Sales',[{r:'8h'},{r:'8h'},{r:'8h',flag:'late'},{r:'8h'},{r:'6h'},{off:1},{off:1}]],
    ['Briana Patel','Eng',[{r:'8h'},{r:'8h'},{r:'8h'},{r:'8h',ot:'1h'},{r:'7h',flag:'late'},{off:1},{off:1}]],
    ['Carlos Reyes','Ops',[{r:'8h'},{r:'7.5h',flag:'late'},{r:'8h',ot:'1h'},{r:'7h',flag:'late'},{r:'7.5h',flag:'ut'},{off:1},{off:1}]],
    ['Faye Olsen','Sales',[{r:'8h'},{r:'8h'},{r:'8h'},{r:'8h'},{r:'7h',flag:'ut'},{off:1},{off:1}]],
    ['Hana Liu','Eng',[{r:'8h'},{r:'8h'},{r:'8h',ot:'1h'},{r:'8h',ot:'1h'},{r:'8h',ot:'1.5h'},{off:1},{off:1}]],
    ['Ivan Bates','Ops · night',[{r:'8h',nd:1},{r:'8h',nd:1},{r:'8h',nd:1},{r:'8h',nd:1},{r:'5h',nd:1},{off:1},{off:1}]],
    ['June Park','Sales',[{r:'6h'},{r:'6h'},{r:'6h'},{r:'6h'},{r:'6h'},{off:1},{off:1}]],
  ];
  const flagTone = { late: { c: 'var(--warn)', l: 'L' }, ut: { c: 'var(--warn)', l: 'U' }, abs: { c: 'var(--bad)', l: '·' } };

  return (
    <div className="wf-root" style={{ width: '100%', height: '100%', position: 'relative' }}>
      <AppShell persona="admin" active="reports"
        title="Weekly attendance report"
        subtitle="Each cell = one shift · totals + breakdowns on the right"
        actions={<><Btn variant="outline">Daily view</Btn><Btn variant="outline"><Icon kind="download" size={13}/> CSV</Btn><Btn variant="primary"><Icon kind="file" size={13}/> Print</Btn></>}
        dense
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Btn variant="ghost" h={28} style={{ fontSize: 12 }}>‹ Wk 41</Btn>
          <Btn variant="outline" h={28} style={{ fontSize: 12 }}><Icon kind="cal" size={12}/> Wk 42 · Oct 06 – Oct 12</Btn>
          <Btn variant="ghost" h={28} style={{ fontSize: 12 }}>Wk 43 ›</Btn>
          <div style={{ flex: 1 }}/>
          <Input label={null} value="All departments" w={170} h={28}/>
          <div style={{ display: 'flex', gap: 8, fontSize: 11, color: 'var(--ink-soft)' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><span style={{ width: 12, height: 12, background: 'var(--accent-soft)', color: 'var(--accent)', fontFamily: 'var(--font-mono)', fontSize: 9, textAlign: 'center', lineHeight: '12px' }}>+</span> OT</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><span style={{ width: 12, height: 12, background: '#241f1a', color: '#fff', fontFamily: 'var(--font-mono)', fontSize: 9, textAlign: 'center', lineHeight: '12px' }}>N</span> ND</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><span style={{ width: 12, height: 12, background: '#fbeee6', color: 'var(--warn)', fontFamily: 'var(--font-mono)', fontSize: 9, textAlign: 'center', lineHeight: '12px' }}>L</span> Late · UT</span>
          </div>
        </div>

        <Card p={0} style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {/* header */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr repeat(7, 0.75fr) 1.6fr', padding: '10px 12px', borderBottom: '1px solid var(--line)', background: 'var(--paper-2)', fontSize: 11, color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: 0.4 }}>
            <div>Employee</div>
            {days.map(d => <div key={d} style={{ textAlign: 'center' }}>{d}</div>)}
            <div style={{ textAlign: 'right' }}>Weekly totals</div>
          </div>

          {cells.map((row, i) => {
            const [name, dept, ds] = row;
            const reg = ds.filter(d => !d.off).reduce((a, d) => a + parseFloat(d.r), 0);
            const ot = ds.reduce((a, d) => a + (d.ot ? parseFloat(d.ot) : 0), 0);
            const nd = ds.filter(d => d.nd).length * 6;
            const late = ds.filter(d => d.flag === 'late').length;
            const ut = ds.filter(d => d.flag === 'ut').length;
            return (
              <div key={i} style={{
                display: 'grid', gridTemplateColumns: '1.5fr repeat(7, 0.75fr) 1.6fr',
                padding: '10px 12px',
                borderBottom: i < cells.length - 1 ? '1px solid var(--line-mute)' : 'none',
                alignItems: 'center', fontSize: 12,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Avatar initials={name.split(' ').map(s=>s[0]).join('')} size={22}/>
                  <div>
                    <div style={{ fontWeight: 500 }}>{name}</div>
                    <div style={{ fontSize: 10, color: 'var(--ink-soft)' }}>{dept}</div>
                  </div>
                </div>
                {ds.map((d, j) => {
                  if (d.off) return <div key={j} style={{ padding: '0 3px' }}><div style={{ height: 42, border: '1px dashed var(--line-mute)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-mute)', fontSize: 10 }}>—</div></div>;
                  return (
                    <div key={j} style={{ padding: '0 3px' }}>
                      <div style={{
                        height: 42, position: 'relative',
                        background: d.nd ? '#241f1a' : (d.flag ? '#fbeee6' : 'var(--paper)'),
                        border: '1px solid ' + (d.nd ? '#241f1a' : d.flag ? flagTone[d.flag].c : 'var(--line-mute)'),
                        color: d.nd ? '#fff' : 'inherit',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: 'var(--font-mono)', fontSize: 11.5, fontWeight: 600,
                      }}>
                        {d.r}
                        {d.ot && <span style={{ position: 'absolute', top: 2, right: 3, fontSize: 9, color: 'var(--accent)', fontWeight: 700 }}>+{d.ot}</span>}
                        {d.flag && <span style={{ position: 'absolute', bottom: 2, right: 3, fontSize: 9, color: flagTone[d.flag].c, fontWeight: 700 }}>{flagTone[d.flag].l}</span>}
                        {d.nd && <span style={{ position: 'absolute', top: 2, left: 3, fontSize: 9, color: '#fff', fontWeight: 700 }}>N</span>}
                      </div>
                    </div>
                  );
                })}
                <div style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 11.5 }}>
                  <div style={{ fontWeight: 600 }}>
                    {reg}h reg
                    {ot > 0 && <span style={{ color: 'var(--accent)' }}> · +{ot}h OT</span>}
                  </div>
                  <div style={{ color: 'var(--ink-soft)', fontSize: 10.5, marginTop: 2 }}>
                    {nd > 0 && <span>{nd}h ND · </span>}
                    {late > 0 && <span style={{ color: 'var(--warn)' }}>{late}× late </span>}
                    {ut > 0 && <span style={{ color: 'var(--warn)' }}>{ut}× UT</span>}
                    {!late && !ut && !nd && <span>clean</span>}
                  </div>
                </div>
              </div>
            );
          })}

          {/* footer totals */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr repeat(7, 0.75fr) 1.6fr', padding: '12px', background: 'var(--ink)', color: '#fff', fontSize: 12, alignItems: 'center', fontFamily: 'var(--font-mono)' }}>
            <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 600 }}>DAY TOTALS</div>
            {[50,49.5,50,49,45,0,0].map((v, j) => (
              <div key={j} style={{ textAlign: 'center', fontWeight: 600 }}>{v ? v + 'h' : '—'}</div>
            ))}
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 600 }}>243.5h reg</span>
              <span style={{ color: 'var(--accent-soft)', marginLeft: 8 }}>· +5.5h OT</span>
            </div>
          </div>
        </Card>
      </AppShell>

      <Anno x={500} y={230} w={170} align="center" tight>
        Each row = one employee · 7 cells = the work-week at a glance.
      </Anno>
      <Anno x={246} y={350} w={150} tight>
        Glyphs encode +OT, ND, Late/UT inside each cell.
        <svg style={{ position: 'absolute', left: 130, top: 18, overflow: 'visible' }} width="40" height="20"><path className="wf-arrow" d="M2 10 L 36 10"/><path className="wf-arrow" d="M30 4 L 36 10 L 30 16"/></svg>
      </Anno>
      <Anno x={968} y={420} w={140} align="right" tight>
        Right column rolls up the week · "clean" when no flags.
      </Anno>
    </div>
  );
}

Object.assign(window, { PeopleTabA, PeopleTabB, PeopleTabC, RptDWA, RptDWB, RptDWC });
