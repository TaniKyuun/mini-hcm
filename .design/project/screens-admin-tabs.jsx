// screens-admin-tabs.jsx — Attendance & Reports tab variations.
// These are full-page designs (sidebar item = Attendance / Reports),
// NOT the dashboard cards. Each tab gets 3 distinct layouts.

// Shared expanded attendance roster — used by the page-level Attendance tab.
const ATT_FULL = [
  { name: 'Aaron Choi',     dept: 'Sales', shift: '09:00–17:00', in: '08:54', out: '—',     reg: '5h 30m', ot: '0:00', nd: '0:00', late: '0m',  status: <Chip tone="good">on shift</Chip> },
  { name: 'Briana Patel',   dept: 'Eng',   shift: '09:00–17:00', in: '09:02', out: '—',     reg: '5h 22m', ot: '0:00', nd: '0:00', late: '2m',  status: <Chip tone="good">on shift</Chip> },
  { name: 'Carlos Reyes',   dept: 'Ops',   shift: '09:00–17:00', in: '09:23', out: '—',     reg: '5h 01m', ot: '0:00', nd: '0:00', late: '23m', status: <Chip tone="warn">late</Chip>, _hl: true },
  { name: 'Dana Fitzgerald',dept: 'Eng',   shift: '09:00–13:00', in: '08:58', out: '13:01', reg: '4h 03m', ot: '0:00', nd: '0:00', late: '0m',  status: <Chip tone="neutral">half-day</Chip> },
  { name: 'Eli Nakamura',   dept: 'Ops',   shift: '09:00–17:00', in: '—',     out: '—',     reg: '—',      ot: '—',    nd: '—',    late: '—',   status: <Chip tone="bad">absent</Chip>, _hl: true },
  { name: 'Faye Olsen',     dept: 'Sales', shift: '09:00–17:00', in: '09:01', out: '—',     reg: '5h 23m', ot: '0:00', nd: '0:00', late: '1m',  status: <Chip tone="good">on shift</Chip> },
  { name: 'Gus Pham',       dept: 'HR',    shift: 'PTO',         in: '—',     out: '—',     reg: '—',      ot: '—',    nd: '—',    late: '—',   status: <Chip tone="neutral">PTO</Chip> },
  { name: 'Hana Liu',       dept: 'Eng',   shift: '09:00–17:00', in: '09:00', out: '—',     reg: '5h 24m', ot: '0:00', nd: '0:00', late: '0m',  status: <Chip tone="good">on shift</Chip> },
  { name: 'Ivan Bates',     dept: 'Ops',   shift: '22:00–06:00', in: '21:58', out: '06:04', reg: '8h 06m', ot: '0:06', nd: '6h 00m', late: '0m',status: <Chip tone="accent">night shift</Chip> },
  { name: 'June Park',      dept: 'Sales', shift: '09:00–17:00', in: '09:00', out: '15:30', reg: '6h 00m', ot: '0:00', nd: '0:00', late: '0m',  status: <Chip tone="warn">undertime</Chip>, _hl: true },
];

// ─────────────────────────────────────────────────────────────────────
// ATTENDANCE · A — Master list + bulk actions
// ─────────────────────────────────────────────────────────────────────
function AttListA() {
  return (
    <div className="wf-root" style={{ width: '100%', height: '100%', position: 'relative' }}>
      <AppShell persona="admin" active="attendance"
        title="Attendance"
        subtitle="All punches today · 480 scheduled · auto-refresh 30s"
        actions={<><Btn variant="outline"><Icon kind="cal" size={13}/> Tue Oct 14</Btn><Btn variant="outline"><Icon kind="download" size={13}/> Export</Btn><Btn variant="primary"><Icon kind="plus" size={13}/> Add punch</Btn></>}
      >
        {/* Filter strip */}
        <Card p={14}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <Input label="Department" value="All depts" w={150}/>
            <Input label="Location" value="HQ · 3 sites" w={170}/>
            <Input label="Status" value="All" w={130}/>
            <Input label="Shift" value="All shifts" w={140}/>
            <div style={{ flex: 1 }}/>
            <Btn variant="ghost"><Icon kind="filter" size={13}/> Saved views ▾</Btn>
            <Btn variant="primary">Apply</Btn>
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
            <Chip tone="accent">480 scheduled</Chip>
            <Chip tone="good">412 on shift</Chip>
            <Chip tone="warn">23 late</Chip>
            <Chip tone="bad">19 absent</Chip>
            <Chip>8 clocked out</Chip>
            <Chip tone="neutral">26 PTO</Chip>
          </div>
        </Card>

        {/* Bulk action bar (selected state shown) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 14px', background: 'var(--ink)', color: '#fff' }}>
          <span style={{ width: 16, height: 16, border: '1px solid #fff', background: '#fff', color: 'var(--ink)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11 }}>✓</span>
          <span style={{ fontSize: 13 }}>3 selected</span>
          <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,.3)' }}/>
          <Btn variant="ghost" h={28} style={{ color: '#fff', fontSize: 12 }}><Icon kind="check" size={12} color="#fff"/> Approve</Btn>
          <Btn variant="ghost" h={28} style={{ color: '#fff', fontSize: 12 }}><Icon kind="edit" size={12} color="#fff"/> Edit punches</Btn>
          <Btn variant="ghost" h={28} style={{ color: '#fff', fontSize: 12 }}><Icon kind="bell" size={12} color="#fff"/> Notify</Btn>
          <div style={{ flex: 1 }}/>
          <Btn variant="ghost" h={28} style={{ color: '#fff', fontSize: 12 }}>Clear</Btn>
        </div>

        {/* Main table */}
        <Card p={0} style={{ flex: 1, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '32px 1.4fr 0.7fr 0.95fr 0.55fr 0.55fr 0.7fr 0.55fr 0.55fr 0.7fr 0.5fr', padding: '10px 14px', borderBottom: '1px solid var(--line)', background: 'var(--paper-2)', fontSize: 11, color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: 0.4 }}>
            <div><span style={{ display: 'inline-block', width: 14, height: 14, border: '1px solid var(--line)' }}/></div>
            <div>Employee</div><div>Dept</div><div>Shift</div>
            <div>In</div><div>Out</div>
            <div>Reg</div><div>OT</div><div>ND</div><div>Late</div>
            <div style={{ textAlign: 'right' }}/>
          </div>
          {ATT_FULL.map((r, i) => (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '32px 1.4fr 0.7fr 0.95fr 0.55fr 0.55fr 0.7fr 0.55fr 0.55fr 0.7fr 0.5fr',
              padding: '10px 14px', borderBottom: i < ATT_FULL.length - 1 ? '1px solid var(--line-mute)' : 'none',
              fontSize: 12.5, alignItems: 'center',
              background: r._hl ? 'var(--accent-soft)' : 'transparent',
            }}>
              <div><span style={{ display: 'inline-block', width: 14, height: 14, border: '1px solid var(--line)', background: r._hl ? 'var(--ink)' : 'transparent', color: '#fff', textAlign: 'center', fontSize: 11, lineHeight: '12px' }}>{r._hl ? '✓' : ''}</span></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Avatar initials={r.name.split(' ').map(s=>s[0]).join('')} size={22}/>{r.name}</div>
              <div>{r.dept}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, color: 'var(--ink-soft)' }}>{r.shift}</div>
              <div style={{ fontFamily: 'var(--font-mono)' }}>{r.in}</div>
              <div style={{ fontFamily: 'var(--font-mono)' }}>{r.out}</div>
              <div style={{ fontFamily: 'var(--font-mono)' }}>{r.reg}</div>
              <div style={{ fontFamily: 'var(--font-mono)' }}>{r.ot}</div>
              <div style={{ fontFamily: 'var(--font-mono)' }}>{r.nd}</div>
              <div style={{ fontFamily: 'var(--font-mono)', color: r.late !== '0m' && r.late !== '—' ? 'var(--warn)' : 'inherit' }}>{r.late}</div>
              <div style={{ textAlign: 'right' }}>{r.status}</div>
            </div>
          ))}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderTop: '1px solid var(--line-mute)', fontSize: 12, color: 'var(--ink-soft)', background: 'var(--paper)' }}>
            <span>10 of 480 rows</span>
            <div style={{ display: 'flex', gap: 4 }}>
              <Btn h={26} style={{ fontSize: 12 }}>‹</Btn>
              <Btn h={26} style={{ fontSize: 12, background: 'var(--ink)', color: '#fff' }}>1</Btn>
              <Btn h={26} style={{ fontSize: 12 }}>2</Btn><Btn h={26} style={{ fontSize: 12 }}>3</Btn>
              <span style={{ padding: '0 6px', fontSize: 12, color: 'var(--ink-mute)' }}>…</span>
              <Btn h={26} style={{ fontSize: 12 }}>48</Btn><Btn h={26} style={{ fontSize: 12 }}>›</Btn>
            </div>
          </div>
        </Card>
      </AppShell>

      <Anno x={246} y={210} w={160}>
        Chip row doubles as quick-filter — click to slice the table below.
      </Anno>
      <Anno x={246} y={385} w={150}>
        Bulk bar appears when rows selected · approve / edit many at once.
        <svg style={{ position: 'absolute', left: 130, top: 18, overflow: 'visible' }} width="40" height="20"><path className="wf-arrow" d="M2 10 L 36 10"/><path className="wf-arrow" d="M30 4 L 36 10 L 30 16"/></svg>
      </Anno>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// ATTENDANCE · B — Two-pane: list left, detail right
// ─────────────────────────────────────────────────────────────────────
function AttListB() {
  const sel = ATT_FULL[2]; // Carlos Reyes
  return (
    <div className="wf-root" style={{ width: '100%', height: '100%', position: 'relative' }}>
      <AppShell persona="admin" active="attendance"
        title="Attendance · Tue Oct 14"
        subtitle="Browse left · inspect &amp; edit right"
        actions={<><Btn variant="outline"><Icon kind="cal" size={13}/> Today</Btn><Btn variant="primary"><Icon kind="plus" size={13}/> Add punch</Btn></>}
        dense>
        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 14, flex: 1, minHeight: 0 }}>
          {/* LEFT — list */}
          <Card p={0} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--line-mute)', display: 'flex', gap: 8, alignItems: 'center' }}>
              <div className="wf-input" style={{ flex: 1, height: 30, padding: '0 10px', display: 'flex', alignItems: 'center', gap: 6, border: '1px solid var(--line-soft)' }}>
                <Icon kind="search" size={12} color="var(--ink-mute)"/>
                <span style={{ fontSize: 12, color: 'var(--ink-mute)' }}>Search · 480 people</span>
              </div>
              <Btn variant="outline" h={30} style={{ fontSize: 12 }}><Icon kind="filter" size={12}/></Btn>
            </div>
            <div style={{ padding: '8px 12px', display: 'flex', gap: 4, borderBottom: '1px solid var(--line-mute)', background: 'var(--paper-2)' }}>
              {['All', 'Late', 'Absent', 'PTO', 'OT', 'ND'].map((c, i) => (
                <div key={c} style={{ padding: '4px 10px', fontSize: 11, border: '1px solid var(--line-soft)', background: i === 1 ? 'var(--ink)' : 'var(--paper)', color: i === 1 ? '#fff' : 'var(--ink)' }}>{c}</div>
              ))}
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              {ATT_FULL.map((r, i) => {
                const isSel = r.name === sel.name;
                return (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 12px', borderBottom: '1px solid var(--line-mute)',
                    background: isSel ? 'var(--accent-soft)' : 'transparent',
                    borderLeft: '3px solid ' + (isSel ? 'var(--accent)' : 'transparent'),
                  }}>
                    <Avatar initials={r.name.split(' ').map(s=>s[0]).join('')} size={28} tone={isSel ? 'accent' : 'neutral'}/>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: isSel ? 600 : 500 }}>{r.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--ink-soft)' }}>{r.dept} · {r.shift}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--ink-soft)' }}>{r.in} → {r.out}</div>
                      <div style={{ marginTop: 4 }}>{r.status}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* RIGHT — detail */}
          <Card p={0} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: 18, borderBottom: '1px solid var(--line-mute)', display: 'flex', alignItems: 'center', gap: 14 }}>
              <Avatar initials="CR" size={48} tone="dark"/>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: -0.3 }}>Carlos Reyes</div>
                <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>Ops · Shift 09:00–17:00 · HQ floor 2 · ID 04812</div>
              </div>
              <Chip tone="warn">late 23m</Chip>
            </div>

            {/* Day timeline */}
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line-mute)' }}>
              <div style={{ fontSize: 11, color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Today's timeline</div>
              <div style={{ position: 'relative', height: 30, background: 'var(--paper-2)', border: '1px solid var(--line-mute)' }}>
                {/* shift expectation */}
                <div style={{ position: 'absolute', left: '36%', top: 0, bottom: 0, width: '32%', background: 'repeating-linear-gradient(45deg, transparent 0 4px, rgba(0,0,0,.04) 4px 8px)' }}/>
                {/* actual */}
                <div style={{ position: 'absolute', left: '42%', top: 0, bottom: 0, width: '26%', background: 'var(--good)', opacity: 0.55 }}/>
                <div style={{ position: 'absolute', left: '42%', top: -3, bottom: -3, width: 2, background: 'var(--warn)' }}/>
                <div style={{ position: 'absolute', left: '68%', top: -3, bottom: -3, width: 2, background: 'var(--accent)' }}/>
                <div style={{ position: 'absolute', left: '36%', bottom: -14, fontSize: 9, color: 'var(--ink-soft)', fontFamily: 'var(--font-mono)' }}>09:00 shift</div>
                <div style={{ position: 'absolute', left: '42%', top: -14, fontSize: 9, color: 'var(--warn)', fontFamily: 'var(--font-mono)' }}>09:23 in</div>
                <div style={{ position: 'absolute', left: '68%', top: -14, fontSize: 9, color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>now</div>
              </div>
            </div>

            {/* Punches */}
            <div style={{ padding: '14px 18px', flex: 1, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ fontSize: 11, color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Punches</div>
                <Btn variant="ghost" h={26} style={{ fontSize: 12 }}><Icon kind="plus" size={12}/> Add</Btn>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[
                  { t: '09:23', l: 'Clock in', tone: 'warn', meta: 'mobile · 10.0.4.21' },
                  { t: '12:45', l: 'Break start', tone: 'neutral', meta: 'tap' },
                  { t: '13:03', l: 'Break end', tone: 'neutral', meta: 'tap' },
                  { t: '14:24', l: 'Live · on the clock', tone: 'accent', meta: '5h 01m so far' },
                ].map((p, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '60px 1fr 110px 60px', alignItems: 'center', gap: 8, padding: 8, border: '1px solid var(--line-mute)' }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600 }}>{p.t}</div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 500 }}>{p.l}</div>
                      <div style={{ fontSize: 10, color: 'var(--ink-soft)', fontFamily: 'var(--font-mono)' }}>{p.meta}</div>
                    </div>
                    <Chip tone={p.tone}>{p.tone === 'accent' ? 'live' : p.tone === 'warn' ? 'late' : 'ok'}</Chip>
                    <div style={{ textAlign: 'right', color: 'var(--ink-soft)' }}><Icon kind="edit" size={13}/></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary strip */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', borderTop: '1px solid var(--line-mute)' }}>
              {[
                { l: 'Reg', v: '5h 01m' }, { l: 'OT', v: '0:00' }, { l: 'ND', v: '0:00' }, { l: 'Late', v: '23m', hl: 'warn' }, { l: 'UT', v: '0:00' },
              ].map((s, i) => (
                <div key={i} style={{ padding: 12, textAlign: 'center', borderRight: i < 4 ? '1px solid var(--line-mute)' : 'none' }}>
                  <div style={{ fontSize: 10, color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.l}</div>
                  <div className="wf-num" style={{ fontFamily: 'var(--font-mono)', fontSize: 15, fontWeight: 600, marginTop: 2, color: s.hl ? 'var(--' + s.hl + ')' : 'inherit' }}>{s.v}</div>
                </div>
              ))}
            </div>

            {/* Footer actions */}
            <div style={{ padding: 14, borderTop: '1px solid var(--line-mute)', display: 'flex', gap: 8 }}>
              <Btn variant="outline" style={{ flex: 1 }}><Icon kind="edit" size={13}/> Edit punch</Btn>
              <Btn variant="outline" style={{ flex: 1 }}><Icon kind="check" size={13}/> Approve OT</Btn>
              <Btn variant="primary" style={{ flex: 1 }}><Icon kind="bell" size={13}/> Notify</Btn>
            </div>
          </Card>
        </div>
      </AppShell>

      <Anno x={538} y={240} w={150} align="center">
        Select left → detail loads right. j/k keys walk the list.
        <svg style={{ position: 'absolute', left: 38, top: 36, overflow: 'visible' }} width="60" height="20"><path className="wf-arrow" d="M2 10 L 54 10"/><path className="wf-arrow" d="M48 4 L 54 10 L 48 16"/></svg>
      </Anno>
      <Anno x={970} y={460} w={140} align="right" tight>
        Punch row click → inline edit · keeps detail view in sight.
      </Anno>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// ATTENDANCE · C — Schedule grid (shifts vs actuals heatmap)
// ─────────────────────────────────────────────────────────────────────
function AttListC() {
  // 7 days × 8 employees. Each cell encodes status.
  const days = ['Mon 06', 'Tue 07', 'Wed 08', 'Thu 09', 'Fri 10', 'Sat 11', 'Sun 12'];
  const cellLib = {
    ok:   { bg: '#e7f3ec', col: 'var(--good)', text: 'on-time' },
    late: { bg: '#fbeee6', col: 'var(--warn)', text: 'late' },
    abs:  { bg: '#f7e2de', col: 'var(--bad)',  text: 'absent' },
    pto:  { bg: 'var(--paper-2)', col: 'var(--ink-mute)', text: 'PTO' },
    off:  { bg: 'transparent', col: 'var(--line-soft)', text: 'off' },
    ot:   { bg: 'var(--accent-soft)', col: 'var(--accent)', text: '+OT' },
    nd:   { bg: '#241f1a', col: '#fff', text: 'ND' },
    ut:   { bg: '#f7eede', col: '#9a6b1d', text: 'UT' },
  };
  const grid = [
    ['Aaron Choi', 'Sales', ['ok','ok','late','ok','ok','off','off']],
    ['Briana Patel', 'Eng', ['ok','ok','ok','ot','ok','off','off']],
    ['Carlos Reyes', 'Ops', ['ok','late','ok','late','late','off','off']],
    ['Dana Fitzgerald', 'Eng', ['ok','ok','ok','pto','pto','off','off']],
    ['Eli Nakamura', 'Ops', ['ok','abs','abs','ok','ok','off','off']],
    ['Faye Olsen', 'Sales', ['ok','ok','ok','ok','ut','off','off']],
    ['Hana Liu', 'Eng', ['ok','ok','ok','ok','ok','off','off']],
    ['Ivan Bates', 'Ops · night', ['nd','nd','nd','nd','nd','off','off']],
  ];

  return (
    <div className="wf-root" style={{ width: '100%', height: '100%', position: 'relative' }}>
      <AppShell persona="admin" active="attendance"
        title="Attendance grid · Week 42"
        subtitle="Shift expectation vs actuals — heatmap of the team's week"
        actions={<><Btn variant="ghost">‹ Wk 41</Btn><Btn variant="outline">Wk 42 · Oct 06–12</Btn><Btn variant="ghost">Wk 43 ›</Btn></>}
        dense>
        {/* legend strip */}
        <div style={{ display: 'flex', gap: 14, alignItems: 'center', padding: '8px 12px', background: 'var(--paper)', border: '1px solid var(--line-mute)', fontSize: 11, color: 'var(--ink-soft)' }}>
          <span style={{ textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>Legend</span>
          {[
            ['ok', 'On-time'], ['late', 'Late'], ['ut', 'Undertime'], ['ot', '+OT'], ['nd', 'Night diff.'], ['abs', 'Absent'], ['pto', 'PTO'], ['off', 'Rest day'],
          ].map(([k, label]) => (
            <span key={k} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 14, height: 14, background: cellLib[k].bg, border: '1px solid ' + (k === 'off' ? 'var(--line-soft)' : cellLib[k].col), color: cellLib[k].col, fontSize: 9, lineHeight: '12px', textAlign: 'center', fontWeight: 600 }}>{k === 'nd' ? 'N' : ''}</span>
              {label}
            </span>
          ))}
          <div style={{ flex: 1 }}/>
          <Btn variant="outline" h={26} style={{ fontSize: 11 }}><Icon kind="download" size={11}/> Export</Btn>
        </div>

        {/* Grid table */}
        <Card p={0} style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {/* header */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.7fr repeat(7, 1fr) 0.9fr', padding: '10px 12px', borderBottom: '1px solid var(--line)', background: 'var(--paper-2)', fontSize: 11, color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: 0.4 }}>
            <div>Employee · Dept</div>
            {days.map(d => <div key={d} style={{ textAlign: 'center' }}>{d}</div>)}
            <div style={{ textAlign: 'right' }}>Wk totals</div>
          </div>
          {grid.map((row, i) => {
            const [name, dept, cells] = row;
            // tot regular hours mock
            const reg = (cells.filter(c => ['ok','late','ut','nd'].includes(c)).length * 8).toFixed(0);
            return (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.7fr repeat(7, 1fr) 0.9fr', padding: '8px 12px', borderBottom: i < grid.length - 1 ? '1px solid var(--line-mute)' : 'none', alignItems: 'center', fontSize: 12.5 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Avatar initials={name.split(' ').map(s=>s[0]).join('')} size={22}/>
                  <div>
                    <div style={{ fontWeight: 500 }}>{name}</div>
                    <div style={{ fontSize: 10, color: 'var(--ink-soft)' }}>{dept}</div>
                  </div>
                </div>
                {cells.map((c, j) => {
                  const lib = cellLib[c];
                  return (
                    <div key={j} style={{ padding: '0 4px' }}>
                      <div style={{
                        height: 38, background: lib.bg,
                        border: '1px solid ' + (c === 'off' ? 'var(--line-mute)' : lib.col),
                        color: lib.col,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600,
                      }}>
                        {c === 'off' ? '—' : lib.text}
                      </div>
                    </div>
                  );
                })}
                <div style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                  <div>{reg}h reg</div>
                  <div style={{ fontSize: 10, color: 'var(--ink-soft)' }}>
                    {cells.includes('ot') ? '+OT' : ''} {cells.includes('nd') ? '· ND' : ''} {cells.filter(c => c === 'late').length ? `· ${cells.filter(c => c === 'late').length} late` : ''}
                  </div>
                </div>
              </div>
            );
          })}
        </Card>
      </AppShell>

      <Anno x={350} y={310} w={170}>
        Each cell = one shift · color encodes status, glyph confirms label.
        <svg style={{ position: 'absolute', left: 80, top: 36, overflow: 'visible' }} width="40" height="30"><path className="wf-arrow" d="M2 4 Q 18 16 26 26"/><path className="wf-arrow" d="M20 24 L 26 26 L 26 18"/></svg>
      </Anno>
      <Anno x={968} y={490} w={140} align="right" tight>
        Right column rolls up the week — total Reg + flags.
      </Anno>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// REPORTS TAB · A — Templates gallery (launch pad)
// ─────────────────────────────────────────────────────────────────────
function RptTabA() {
  const tpl = [
    { t: 'Daily attendance',   d: 'Headcount, late, absent, PTO for one day', tag: 'daily',   chart: 'bar',   last: 'today · 06:00' },
    { t: 'Weekly summary',     d: 'Regular / OT / ND / Late / Undertime by employee', tag: 'weekly', chart: 'line', last: 'Mon · 08:00' },
    { t: 'Late & Undertime',   d: 'Who was late, by how much, how often', tag: 'flags',  chart: 'bar',   last: 'Mon · 08:00' },
    { t: 'Overtime',           d: 'OT hours by dept · cap-watch & approvals', tag: 'flags', chart: 'line', last: 'today · 06:00' },
    { t: 'Night differential', d: 'ND hours per employee · 22:00–06:00 window', tag: 'flags', chart: 'bar', last: 'today · 06:00' },
    { t: 'Department roll-up', d: 'Hours, headcount & flags grouped by dept', tag: 'weekly', chart: 'donut', last: 'Mon · 08:00' },
    { t: 'Custom report',      d: 'Pick filters, metrics & group-bys yourself', tag: 'custom', chart: 'plus', last: '—' },
  ];

  const miniChart = (kind) => {
    if (kind === 'bar') return <BarChart w={180} h={50} data={[{k:'',v:6},{k:'',v:8,hl:true},{k:'',v:7},{k:'',v:9},{k:'',v:4},{k:'',v:5}]}/>;
    if (kind === 'line') return <LineChart w={180} h={50} data={[{k:'',v:3210},{k:'',v:3340},{k:'',v:3290},{k:'',v:3380},{k:'',v:2980}]}/>;
    if (kind === 'donut') return <Donut size={56} data={[{v:48,k:''},{v:30,k:''},{v:18,k:''},{v:6,k:''}]}/>;
    return <div style={{ width: 180, height: 50, border: '1px dashed var(--line-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-mute)' }}><Icon kind="plus" size={20} color="var(--ink-mute)"/></div>;
  };
  const tagTone = { daily: 'good', weekly: 'accent', flags: 'warn', custom: 'neutral' };

  return (
    <div className="wf-root" style={{ width: '100%', height: '100%', position: 'relative' }}>
      <AppShell persona="admin" active="reports"
        title="Reports"
        subtitle="Pick a template to run · or build a custom report"
        actions={<><Btn variant="outline"><Icon kind="cal" size={13}/> Scheduled</Btn><Btn variant="primary"><Icon kind="plus" size={13}/> Custom report</Btn></>}
      >
        {/* Top filter */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Tabs items={['All', 'Daily', 'Weekly', 'Flags', 'Custom']} active="All"/>
          <div style={{ flex: 1 }}/>
          <div className="wf-input" style={{ width: 220, height: 30, padding: '0 10px', display: 'flex', alignItems: 'center', gap: 6, border: '1px solid var(--line-soft)' }}>
            <Icon kind="search" size={12} color="var(--ink-mute)"/>
            <span style={{ fontSize: 12, color: 'var(--ink-mute)' }}>Search reports…</span>
          </div>
        </div>

        {/* Grid of template cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, flex: 1, minHeight: 0, alignContent: 'start', overflow: 'hidden' }}>
          {tpl.map((r, i) => (
            <Card key={i} p={0} style={{ display: 'flex', flexDirection: 'column' }} accent={i === 0}>
              <div style={{ padding: '14px 16px 10px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: -0.2 }}>{r.t}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--ink-soft)', marginTop: 4, lineHeight: 1.35 }}>{r.d}</div>
                </div>
                <Chip tone={tagTone[r.tag]}>{r.tag}</Chip>
              </div>
              <div style={{ padding: '6px 16px 12px', display: 'flex', justifyContent: 'center' }}>
                {miniChart(r.chart)}
              </div>
              <div style={{ marginTop: 'auto', padding: '10px 16px', borderTop: '1px solid var(--line-mute)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, color: 'var(--ink-soft)' }}>
                <span>last run · {r.last}</span>
                <Btn variant="primary" h={28} style={{ fontSize: 12 }}><Icon kind="play" size={11} color="#fff"/> Run</Btn>
              </div>
            </Card>
          ))}
        </div>
      </AppShell>

      <Anno x={246} y={235} w={150} tight>
        Filter chips narrow the gallery without leaving the page.
      </Anno>
      <Anno x={500} y={300} w={170} align="center">
        Each card = a parameterised template · 1-click to run with defaults.
        <svg style={{ position: 'absolute', left: 60, top: 36, overflow: 'visible' }} width="40" height="20"><path className="wf-arrow" d="M20 2 L 20 16"/><path className="wf-arrow" d="M14 10 L 20 16 L 26 10"/></svg>
      </Anno>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// REPORTS TAB · B — KPI dashboard (overview)
// ─────────────────────────────────────────────────────────────────────
function RptTabB() {
  return (
    <div className="wf-root" style={{ width: '100%', height: '100%', position: 'relative' }}>
      <AppShell persona="admin" active="reports"
        title="Attendance overview"
        subtitle="Week 42 · Oct 06 → Oct 12 · 480 employees"
        actions={<><Btn variant="outline">‹ Wk 41</Btn><Btn variant="outline">Wk 42</Btn><Btn variant="outline">Wk 43 ›</Btn><Btn variant="primary"><Icon kind="download" size={13}/> Export</Btn></>}
      >
        {/* KPI tiles */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
          <Stat label="Regular hrs" value="17,030" sub="↑ 2.1% vs Wk 41"/>
          <Stat label="Overtime" value="148h" accent sub="↑ 12h vs Wk 41"/>
          <Stat label="Night diff." value="412h" sub="22:00–06:00"/>
          <Stat label="Late incidents" value="83" sub="↑ 9 vs Wk 41"/>
          <Stat label="Undertime" value="46h" sub="↓ 4h vs Wk 41"/>
        </div>

        {/* Charts row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 14 }}>
          <Card>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 }}>
              <H2>Hours per day · Wk 42</H2>
              <div style={{ fontSize: 11, color: 'var(--ink-soft)' }}>
                <span style={{ display: 'inline-block', width: 8, height: 8, background: 'var(--accent)', marginRight: 4 }}/>Regular
                <span style={{ marginLeft: 10, display: 'inline-block', width: 8, height: 8, background: 'var(--warn)', marginRight: 4 }}/>OT
              </div>
            </div>
            <LineChart w={520} h={160} data={[
              { k: 'Mon', v: 3210 }, { k: 'Tue', v: 3340 }, { k: 'Wed', v: 3290 }, { k: 'Thu', v: 3380 }, { k: 'Fri', v: 2980 }, { k: 'Sat', v: 410 }, { k: 'Sun', v: 280 },
            ]}/>
          </Card>
          <Card>
            <H2 action={<Chip tone="neutral">% of total</Chip>}>By category</H2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <Donut size={140} data={[{v:17030,k:'Reg'},{v:412,k:'ND'},{v:148,k:'OT'},{v:46,k:'UT'}]}/>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12, flex: 1 }}>
                {[
                  { l: 'Regular', v: '96.5%', c: 'var(--accent)' },
                  { l: 'Night diff.', v: '2.3%', c: 'var(--ink)' },
                  { l: 'Overtime', v: '0.8%', c: 'var(--ink-mute)' },
                  { l: 'Undertime', v: '0.4%', c: 'var(--line-soft)' },
                ].map(r => (
                  <div key={r.l} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 10, height: 10, background: r.c }}/>
                    <span style={{ flex: 1 }}>{r.l}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{r.v}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Bottom: dept bars + top-late table */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 14, flex: 1, minHeight: 0 }}>
          <Card>
            <H2>Department roll-up</H2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { d: 'Operations', reg: 19200, ot: 88.6, nd: 320, late: 9 },
                { d: 'Engineering', reg: 12840, ot: 32.4, nd: 42, late: 6 },
                { d: 'Sales', reg: 8180, ot: 12.0, nd: 0, late: 11 },
                { d: 'HR', reg: 1520, ot: 4.0, nd: 0, late: 2 },
              ].map(r => (
                <div key={r.d}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                    <span style={{ fontWeight: 500 }}>{r.d}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--ink-soft)' }}>{r.reg.toLocaleString()}h reg · {r.ot}h OT · {r.late} late</span>
                  </div>
                  <div style={{ height: 8, background: 'var(--paper-2)', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: (r.reg / 19200 * 100) + '%', background: 'var(--accent)' }}/>
                    <div style={{ position: 'absolute', left: (r.reg / 19200 * 100) + '%', top: 0, bottom: 0, width: (r.ot / 19200 * 100 * 8) + '%', background: 'var(--warn)' }}/>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card p={0} style={{ overflow: 'hidden' }}>
            <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--line-mute)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Top late offenders</div>
              <Chip tone="warn">flag</Chip>
            </div>
            <Table
              dense
              cols={[
                { k: 'name', label: 'Employee', w: '1.4fr' },
                { k: 'late', label: 'Late mins', w: '0.7fr', mono: true, align: 'right' },
                { k: 'inc', label: 'Incidents', w: '0.7fr', mono: true, align: 'right' },
                { k: 'ut', label: 'UT', w: '0.6fr', mono: true, align: 'right' },
              ]}
              rows={[
                { name: 'Carlos Reyes', late: '46m', inc: '3', ut: '0m', _hl: true },
                { name: 'Maddie Ortega', late: '24m', inc: '2', ut: '0m' },
                { name: 'June Park', late: '18m', inc: '1', ut: '90m' },
                { name: 'Briana Patel', late: '12m', inc: '2', ut: '0m' },
                { name: 'Faye Olsen', late: '6m', inc: '1', ut: '0m' },
              ]}
            />
          </Card>
        </div>
      </AppShell>

      <Anno x={246} y={210} w={150}>
        KPI tiles answer "is this week unusual?" at a glance.
      </Anno>
      <Anno x={970} y={400} w={140} align="right" tight>
        Donut & line tell shape · the table tells "who".
      </Anno>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// REPORTS TAB · C — Scheduled / saved reports manager
// ─────────────────────────────────────────────────────────────────────
function RptTabC() {
  return (
    <div className="wf-root" style={{ width: '100%', height: '100%', position: 'relative' }}>
      <AppShell persona="admin" active="reports"
        title="Saved &amp; scheduled reports"
        subtitle="Automated delivery · Slack, email, CSV drop"
        actions={<><Btn variant="outline">Run history</Btn><Btn variant="primary"><Icon kind="plus" size={13}/> New schedule</Btn></>}
      >
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <Tabs items={['Schedules · 8', 'Saved views · 14', 'Run history']} active="Schedules · 8"/>
          <div style={{ flex: 1 }}/>
          <Chip tone="good">7 active</Chip>
          <Chip tone="warn">1 paused</Chip>
          <Chip tone="bad">1 failed</Chip>
        </div>

        <Card p={0} style={{ flex: 1, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.1fr 1fr 1.1fr 1.2fr 0.6fr 0.4fr', padding: '10px 14px', borderBottom: '1px solid var(--line)', background: 'var(--paper-2)', fontSize: 11, color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: 0.4 }}>
            <div>Report &amp; schedule</div>
            <div>Frequency</div>
            <div>Next run</div>
            <div>Recipients</div>
            <div>Last run</div>
            <div>Status</div>
            <div style={{ textAlign: 'right' }}/>
          </div>

          {[
            { name: 'Daily attendance digest', desc: 'All departments · headcount, late, absent', freq: 'Daily · 08:00', next: 'Tomorrow 08:00', recip: '#ops-attendance · 4 ppl', last: 'Today 08:00 · 412 rows', status: 'good' },
            { name: 'Weekly attendance — Ops', desc: 'Regular · OT · ND · Late · UT by employee', freq: 'Weekly · Mon 09:00', next: 'Mon Oct 20', recip: 'mira@ · alex@', last: 'Mon Oct 13', status: 'good' },
            { name: 'Late & Undertime watch', desc: 'Flags employees > 30m late or > 30m UT', freq: 'Mon · Wed · Fri', next: 'Wed Oct 15', recip: 'people-ops@', last: 'Mon Oct 13 · 17 flagged', status: 'good', _hl: true },
            { name: 'OT cap warning', desc: 'Employees approaching 40h regular this week', freq: 'Daily · 18:00', next: 'Today 18:00', recip: 'Slack #managers', last: 'Yesterday 18:00 · 2 alerts', status: 'good' },
            { name: 'ND timecard summary', desc: 'Night-shift hours by employee', freq: 'Weekly · Sun 22:00', next: 'Sun Oct 19', recip: 'payroll@ · finance@', last: 'Sun Oct 12 · 412h', status: 'good' },
            { name: 'Monthly attendance audit', desc: 'Full month roll-up with anomalies highlighted', freq: 'Monthly · 1st 06:00', next: 'Nov 01', recip: 'ceo@ · audit-trail.csv', last: 'Oct 01', status: 'paused' },
            { name: 'Manager dashboard CSV', desc: 'Per-manager team breakdown', freq: 'Weekly · Mon 09:00', next: 'Mon Oct 20', recip: '24 managers (auto-list)', last: 'Mon Oct 13 · failed', status: 'fail' },
          ].map((r, i) => {
            const tones = { good: 'good', paused: 'warn', fail: 'bad' };
            const labels = { good: '● active', paused: '⏸ paused', fail: '● failed' };
            return (
              <div key={i} style={{
                display: 'grid', gridTemplateColumns: '2fr 1.1fr 1fr 1.1fr 1.2fr 0.6fr 0.4fr',
                padding: '12px 14px', borderBottom: '1px solid var(--line-mute)',
                fontSize: 12.5, alignItems: 'center',
                background: r._hl ? 'var(--accent-soft)' : 'transparent',
              }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{r.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--ink-soft)', marginTop: 2 }}>{r.desc}</div>
                </div>
                <div>{r.freq}</div>
                <div style={{ fontFamily: 'var(--font-mono)' }}>{r.next}</div>
                <div style={{ fontSize: 11.5 }}>{r.recip}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, color: r.status === 'fail' ? 'var(--bad)' : 'var(--ink-soft)' }}>{r.last}</div>
                <div><Chip tone={tones[r.status]}>{labels[r.status]}</Chip></div>
                <div style={{ textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                  <Icon kind="play" size={13} color="var(--ink-soft)"/>
                  <Icon kind="edit" size={13} color="var(--ink-soft)"/>
                </div>
              </div>
            );
          })}
        </Card>
      </AppShell>

      <Anno x={246} y={210} w={150}>
        Tabs split scheduled · saved · run history.
      </Anno>
      <Anno x={970} y={440} w={140} align="right" tight>
        Failed run flagged in red — admin can re-run from the row.
        <svg style={{ position: 'absolute', right: -38, top: 14, overflow: 'visible' }} width="44" height="20"><path className="wf-arrow" d="M2 10 L 38 10"/><path className="wf-arrow" d="M32 4 L 38 10 L 32 16"/></svg>
      </Anno>
    </div>
  );
}

Object.assign(window, { AttListA, AttListB, AttListC, RptTabA, RptTabB, RptTabC });
