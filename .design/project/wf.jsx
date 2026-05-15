// wf.jsx — wireframe primitives shared by all screens.
// Keep these dumb: structure + sketchy details only, no real data.

const WF_ACCENT_HEX = '#2b59ff';

// Box: a generic outlined rectangle, optional fill, optional dashed.
function Box({ children, w, h, p = 0, dashed, fill, style = {}, className = '', ...rest }) {
  return (
    <div className={'wf-box ' + className} style={{
      width: w, height: h, padding: p, boxSizing: 'border-box',
      border: '1px solid var(--line)',
      borderStyle: dashed ? 'dashed' : 'solid',
      background: fill || 'transparent',
      ...style,
    }} {...rest}>{children}</div>
  );
}

// Card: white-fill panel with thinner border, for grouped content.
function Card({ children, p = 16, style = {}, accent, ...rest }) {
  return (
    <div className="wf-card" style={{
      background: 'var(--paper)',
      border: '1px solid ' + (accent ? 'var(--accent)' : 'var(--line)'),
      padding: p, boxSizing: 'border-box',
      ...style,
    }} {...rest}>{children}</div>
  );
}

// Btn: outline button by default; variant 'primary' = filled, 'ghost' = no border.
function Btn({ children, variant = 'outline', w, h = 36, style = {}, ...rest }) {
  const v = {
    outline: { background: 'var(--paper)', color: 'var(--ink)', border: '1px solid var(--line)' },
    primary: { background: 'var(--ink)', color: 'var(--paper)', border: '1px solid var(--ink)' },
    accent:  { background: 'var(--accent)', color: '#fff', border: '1px solid var(--accent)' },
    ghost:   { background: 'transparent', color: 'var(--ink)', border: '1px solid transparent' },
    danger:  { background: 'var(--paper)', color: 'var(--bad)', border: '1px solid var(--bad)' },
  }[variant] || {};
  return (
    <div className="wf-btn" style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
      padding: '0 14px', height: h, width: w,
      fontSize: 13, fontWeight: 500, lineHeight: 1,
      ...v, ...style,
    }} {...rest}>{children}</div>
  );
}

// Input — labelled when label provided.
function Input({ label, placeholder, w = '100%', h = 36, value, type = 'text', style = {}, ...rest }) {
  return (
    <label style={{ display: 'block', width: w, ...style }} {...rest}>
      {label && <div className="wf-label" style={{ fontSize: 12, color: 'var(--ink-soft)', marginBottom: 6, letterSpacing: 0.2, textTransform: 'uppercase' }}>{label}</div>}
      <div className="wf-input" style={{
        height: h, padding: '0 12px', display: 'flex', alignItems: 'center',
        border: '1px solid var(--line)', background: 'var(--paper)',
        color: value ? 'var(--ink)' : 'var(--ink-mute)', fontSize: 14,
      }}>{value || placeholder}</div>
    </label>
  );
}

// Chip — pill or square tag with a tone.
function Chip({ children, tone = 'neutral', style = {} }) {
  const tones = {
    neutral: { background: 'var(--paper-2)', color: 'var(--ink)', border: '1px solid var(--line-soft)' },
    accent:  { background: 'var(--accent-soft)', color: 'var(--accent)', border: '1px solid var(--accent)' },
    good:    { background: '#e7f3ec', color: 'var(--good)', border: '1px solid var(--good)' },
    warn:    { background: '#fbeee6', color: 'var(--warn)', border: '1px solid var(--warn)' },
    bad:     { background: '#f7e2de', color: 'var(--bad)', border: '1px solid var(--bad)' },
    solid:   { background: 'var(--ink)', color: 'var(--paper)', border: '1px solid var(--ink)' },
  };
  return (
    <span className="wf-chip" style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 8px', fontSize: 11, fontWeight: 500, lineHeight: 1.4,
      ...(tones[tone] || tones.neutral), ...style,
    }}>{children}</span>
  );
}

// Stat card — label, big number, optional sub.
function Stat({ label, value, sub, accent, w, style = {} }) {
  return (
    <Card p={16} accent={accent} style={{ width: w, flex: w ? '0 0 auto' : '1 1 0', ...style }}>
      <div style={{ fontSize: 11, color: 'var(--ink-soft)', letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 10 }}>{label}</div>
      <div className="wf-num" style={{ fontSize: 30, fontWeight: 600, letterSpacing: -0.8, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 8 }}>{sub}</div>}
    </Card>
  );
}

// Avatar — round / square initial.
function Avatar({ initials = '··', size = 28, tone = 'neutral' }) {
  const tones = {
    neutral: { background: 'var(--paper-2)', color: 'var(--ink)' },
    dark:    { background: 'var(--ink)', color: 'var(--paper)' },
    accent:  { background: 'var(--accent-soft)', color: 'var(--accent)' },
  };
  return (
    <div className="wf-thumb" style={{
      width: size, height: size, borderRadius: '50%',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.36, fontWeight: 600,
      border: '1px solid var(--line-soft)',
      ...(tones[tone] || tones.neutral),
    }}>{initials}</div>
  );
}

// Icon — abstract glyph placeholder. We deliberately keep icons simple/sketchy.
function Icon({ kind, size = 16, color = 'currentColor' }) {
  const s = size;
  const stroke = { stroke: color, strokeWidth: 1.5, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' };
  const paths = {
    clock:    <g {...stroke}><circle cx="8" cy="8" r="6.2"/><path d="M8 4.4V8l2.6 1.6"/></g>,
    user:     <g {...stroke}><circle cx="8" cy="6" r="2.4"/><path d="M3 13.5c1-2.4 3-3.5 5-3.5s4 1.1 5 3.5"/></g>,
    users:    <g {...stroke}><circle cx="6" cy="6" r="2"/><circle cx="11.5" cy="7" r="1.6"/><path d="M2.5 13c.8-2 2.2-3 3.5-3s2.7 1 3.5 3M9.5 13c.6-1.5 1.6-2.3 2.6-2.3s1.9.8 2.4 2"/></g>,
    bell:     <g {...stroke}><path d="M4 11.5h8l-1-1.5V7a3 3 0 1 0-6 0v3l-1 1.5z"/><path d="M7 13a1 1 0 0 0 2 0"/></g>,
    search:   <g {...stroke}><circle cx="7" cy="7" r="3.6"/><path d="M9.7 9.7l3 3"/></g>,
    cal:      <g {...stroke}><rect x="2" y="3.5" width="12" height="10.5"/><path d="M2 6.5h12M5 2.5v2M11 2.5v2"/></g>,
    chart:    <g {...stroke}><path d="M2 13.5h12M4 11.5v-4M7 11.5v-7M10 11.5v-5M13 11.5v-2"/></g>,
    file:     <g {...stroke}><path d="M4 2.5h5.5L13 6v7.5H4z"/><path d="M9.5 2.5V6H13"/></g>,
    gear:     <g {...stroke}><circle cx="8" cy="8" r="2"/><path d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3.4 3.4l1.4 1.4M11.2 11.2l1.4 1.4M3.4 12.6l1.4-1.4M11.2 4.8l1.4-1.4"/></g>,
    logout:   <g {...stroke}><path d="M9.5 3.5h-6v9h6M12 8H6M10 5.5L12.5 8 10 10.5"/></g>,
    play:     <g {...stroke}><path d="M5 3.5l7 4.5-7 4.5z" fill={color}/></g>,
    stop:     <g {...stroke}><rect x="4" y="4" width="8" height="8" fill={color}/></g>,
    coffee:   <g {...stroke}><path d="M3 5h8v4a2.5 2.5 0 0 1-2.5 2.5H5.5A2.5 2.5 0 0 1 3 9z"/><path d="M11 6h1.5a1.5 1.5 0 1 1 0 3H11M5 3v1M8 3v1"/></g>,
    edit:     <g {...stroke}><path d="M10 3l3 3-7 7H3v-3z"/></g>,
    plus:     <g {...stroke}><path d="M8 3v10M3 8h10"/></g>,
    arrow:    <g {...stroke}><path d="M3 8h10M9 4l4 4-4 4"/></g>,
    download: <g {...stroke}><path d="M8 2v8M4.5 7.5L8 11l3.5-3.5M3 13h10"/></g>,
    filter:   <g {...stroke}><path d="M2 3h12l-4.5 5v5l-3-1.5V8z"/></g>,
    home:     <g {...stroke}><path d="M2.5 8L8 3l5.5 5v5.5h-4V10h-3v3.5h-4z"/></g>,
    money:    <g {...stroke}><rect x="2" y="4" width="12" height="8"/><circle cx="8" cy="8" r="1.6"/><circle cx="4.5" cy="8" r=".5"/><circle cx="11.5" cy="8" r=".5"/></g>,
    list:     <g {...stroke}><path d="M3 4h10M3 8h10M3 12h10"/><circle cx="2" cy="4" r=".5" fill={color}/><circle cx="2" cy="8" r=".5" fill={color}/><circle cx="2" cy="12" r=".5" fill={color}/></g>,
    close:    <g {...stroke}><path d="M4 4l8 8M12 4l-8 8"/></g>,
    check:    <g {...stroke}><path d="M3 8.5L6.5 12l7-7"/></g>,
    info:     <g {...stroke}><circle cx="8" cy="8" r="6"/><path d="M8 7v4M8 5v.01"/></g>,
    warn:     <g {...stroke}><path d="M8 2l6 11H2z"/><path d="M8 7v3M8 12v.01"/></g>,
    coin:     <g {...stroke}><circle cx="8" cy="8" r="5.5"/><path d="M8 5v6M6 9.5c.5.8 1.3 1 2 1s2-.3 2-1.2c0-.8-.7-1-2-1.3-1.3-.3-2-.5-2-1.3 0-.9 1.2-1.2 2-1.2.7 0 1.5.2 2 1"/></g>,
    grid:     <g {...stroke}><rect x="2.5" y="2.5" width="4" height="4"/><rect x="9.5" y="2.5" width="4" height="4"/><rect x="2.5" y="9.5" width="4" height="4"/><rect x="9.5" y="9.5" width="4" height="4"/></g>,
  };
  return (
    <svg width={s} height={s} viewBox="0 0 16 16" aria-hidden="true">{paths[kind] || paths.grid}</svg>
  );
}

// Section header within a panel.
function H2({ children, action }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
      <div className="wf-h2" style={{ fontSize: 14, fontWeight: 600, letterSpacing: -0.1 }}>{children}</div>
      {action && <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{action}</div>}
    </div>
  );
}

// Annotation note + optional arrow (relative to the wrapping artboard).
function Anno({ x, y, w = 160, children, arrow, tight, align = 'left' }) {
  return (
    <div className={'wf-anno' + (tight ? ' tight' : '')} style={{ left: x, top: y, width: w, textAlign: align }}>
      {children}
      {arrow && (
        <svg style={{ position: 'absolute', left: arrow.fx ?? 0, top: arrow.fy ?? 0, overflow: 'visible' }} width={arrow.w || 80} height={arrow.h || 40}>
          <path className="wf-arrow" d={arrow.d}/>
        </svg>
      )}
    </div>
  );
}

// Sketchy line (used to indicate placeholder text bars or thin separators).
function Line({ w = '100%', h = 6, color = 'var(--line-mute)', style = {} }) {
  return <div style={{ width: w, height: h, background: color, borderRadius: 2, ...style }} />;
}

// Skeleton text rows
function TextLines({ rows = 3, w = 200, gap = 6, color = 'var(--line-mute)' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap }}>
      {Array.from({ length: rows }).map((_, i) => (
        <Line key={i} w={typeof w === 'function' ? w(i) : (i === rows - 1 ? '60%' : w)} h={6} color={color} />
      ))}
    </div>
  );
}

// Tiny bar chart for stats
function BarChart({ data, w = 240, h = 100, max, color = 'var(--ink)', accent = 'var(--accent)' }) {
  const M = max || Math.max(...data.map(d => d.v));
  const bw = (w - (data.length - 1) * 8) / data.length;
  return (
    <svg width={w} height={h + 20} viewBox={`0 0 ${w} ${h + 20}`}>
      {data.map((d, i) => {
        const bh = (d.v / M) * (h - 10);
        const fill = d.hl ? accent : color;
        return (
          <g key={i}>
            <rect x={i * (bw + 8)} y={h - bh} width={bw} height={bh} fill={fill} opacity={d.hl ? 1 : 0.85}/>
            <text x={i * (bw + 8) + bw / 2} y={h + 14} textAnchor="middle" fontSize="10" fill="var(--ink-soft)" fontFamily="var(--font-mono)">{d.k}</text>
          </g>
        );
      })}
    </svg>
  );
}

// Line chart (sketchy single series)
function LineChart({ data, w = 320, h = 120, color = 'var(--accent)' }) {
  const M = Math.max(...data.map(d => d.v));
  const m = Math.min(...data.map(d => d.v));
  const sx = (i) => 10 + i * ((w - 20) / (data.length - 1));
  const sy = (v) => h - 18 - ((v - m) / (M - m || 1)) * (h - 30);
  const path = data.map((d, i) => `${i ? 'L' : 'M'} ${sx(i).toFixed(1)} ${sy(d.v).toFixed(1)}`).join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <path d={`M 10 ${h - 18} H ${w - 10}`} stroke="var(--line-mute)" strokeWidth="1"/>
      <path d={path} stroke={color} strokeWidth="1.8" fill="none"/>
      {data.map((d, i) => (
        <g key={i}>
          <circle cx={sx(i)} cy={sy(d.v)} r="2.4" fill={color}/>
          <text x={sx(i)} y={h - 4} textAnchor="middle" fontSize="9.5" fill="var(--ink-soft)" fontFamily="var(--font-mono)">{d.k}</text>
        </g>
      ))}
    </svg>
  );
}

// Donut for distribution
function Donut({ data, size = 110, color = 'var(--accent)' }) {
  const total = data.reduce((s, d) => s + d.v, 0);
  const R = size / 2 - 12;
  const C = 2 * Math.PI * R;
  let acc = 0;
  const palette = ['var(--accent)', 'var(--ink)', 'var(--ink-mute)', 'var(--line-soft)'];
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={R} fill="none" stroke="var(--line-mute)" strokeWidth="14"/>
      {data.map((d, i) => {
        const len = (d.v / total) * C;
        const off = (acc / total) * C;
        acc += d.v;
        return <circle key={i} cx={size / 2} cy={size / 2} r={R} fill="none"
          stroke={palette[i % palette.length]} strokeWidth="14"
          strokeDasharray={`${len} ${C - len}`} strokeDashoffset={-off}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}/>;
      })}
    </svg>
  );
}

// AppShell — sidebar + topbar wrapper for full dashboards.
// Supports an "employee" or "admin" persona for the sidebar items.
function AppShell({ persona = 'employee', active, title, subtitle, actions, children, dense, search }) {
  const items = persona === 'admin'
    ? [
        { id: 'dash', icon: 'grid', label: 'Dashboard' },
        { id: 'people', icon: 'users', label: 'People' },
        { id: 'attendance', icon: 'clock', label: 'Attendance' },
        { id: 'reports', icon: 'chart', label: 'Reports' },
        { id: 'settings', icon: 'gear', label: 'Settings' },
      ]
    : [
        { id: 'dash', icon: 'home', label: 'Today' },
        { id: 'history', icon: 'list', label: 'History' },
        { id: 'schedule', icon: 'cal', label: 'Schedule' },
        { id: 'leave', icon: 'file', label: 'Leave' },
        { id: 'profile', icon: 'user', label: 'Profile' },
      ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', height: '100%', background: 'var(--paper-2)' }}>
      {/* sidebar */}
      <div style={{ borderRight: '1px solid var(--line)', background: 'var(--paper)', padding: '18px 12px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 8px', marginBottom: 22 }}>
          <div className="wf-thumb" style={{ width: 26, height: 26, border: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>◐</div>
          <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: -0.2 }}>Mini HCM</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
          {items.map(it => (
            <div key={it.id} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px',
              background: active === it.id ? 'var(--paper-2)' : 'transparent',
              border: '1px solid ' + (active === it.id ? 'var(--line)' : 'transparent'),
              fontSize: 13, fontWeight: active === it.id ? 600 : 400,
            }}>
              <Icon kind={it.icon} size={15} color={active === it.id ? 'var(--accent)' : 'var(--ink-soft)'}/>
              <span>{it.label}</span>
            </div>
          ))}
        </div>
        <div style={{ borderTop: '1px solid var(--line-mute)', paddingTop: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar initials="MJ" size={28} tone="dark"/>
          <div style={{ fontSize: 12, lineHeight: 1.3 }}>
            <div style={{ fontWeight: 600 }}>{persona === 'admin' ? 'Mira J. (Admin)' : 'Mira Jensen'}</div>
            <div style={{ color: 'var(--ink-soft)' }}>{persona === 'admin' ? 'People Ops' : 'Design · Eng'}</div>
          </div>
        </div>
      </div>

      {/* main */}
      <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* topbar */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 14,
          height: 52, padding: '0 22px',
          borderBottom: '1px solid var(--line)',
          background: 'var(--paper)',
        }}>
          {search !== false ? (
            <div className="wf-input" style={{ flex: 1, maxWidth: 360, height: 32, padding: '0 10px', display: 'flex', alignItems: 'center', gap: 8, border: '1px solid var(--line-soft)', background: 'var(--paper-2)' }}>
              <Icon kind="search" size={13} color="var(--ink-mute)"/>
              <span style={{ fontSize: 12, color: 'var(--ink-mute)' }}>{persona === 'admin' ? 'Search employees, shifts…' : 'Search…'}</span>
            </div>
          ) : <div style={{ flex: 1 }}/>}
          <Icon kind="bell" size={16} color="var(--ink-soft)"/>
          <Icon kind="info" size={16} color="var(--ink-soft)"/>
          <div style={{ width: 1, height: 18, background: 'var(--line-mute)' }}/>
          <span style={{ fontSize: 12, color: 'var(--ink-soft)' }}>Tue, Oct 14 · 2:14 PM</span>
        </div>

        {/* page */}
        <div style={{ flex: 1, overflow: 'hidden', padding: dense ? '18px 22px' : '24px 28px', display: 'flex', flexDirection: 'column', gap: 18, position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16 }}>
            <div>
              <div className="wf-h1" style={{ fontSize: 26, fontWeight: 600, letterSpacing: -0.6, lineHeight: 1.1 }}>{title}</div>
              {subtitle && <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 4 }}>{subtitle}</div>}
            </div>
            {actions && <div style={{ display: 'flex', gap: 8 }}>{actions}</div>}
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

// Tab bar (segmented)
function Tabs({ items, active }) {
  return (
    <div style={{ display: 'inline-flex', border: '1px solid var(--line)', background: 'var(--paper)' }}>
      {items.map((it, i) => (
        <div key={it} style={{
          padding: '6px 14px', fontSize: 12, fontWeight: 500,
          borderRight: i < items.length - 1 ? '1px solid var(--line)' : 'none',
          background: it === active ? 'var(--ink)' : 'transparent',
          color: it === active ? 'var(--paper)' : 'var(--ink)',
        }}>{it}</div>
      ))}
    </div>
  );
}

// Table — simple, sketch-mode-friendly. cols: [{k, label, w}], rows: array of objects.
function Table({ cols, rows, dense, accentCol }) {
  return (
    <div style={{ border: '1px solid var(--line)', background: 'var(--paper)' }}>
      <div style={{
        display: 'grid', gridTemplateColumns: cols.map(c => c.w || '1fr').join(' '),
        padding: dense ? '8px 12px' : '10px 14px', borderBottom: '1px solid var(--line)',
        background: 'var(--paper-2)', fontSize: 11, color: 'var(--ink-soft)',
        letterSpacing: 0.4, textTransform: 'uppercase',
      }}>
        {cols.map(c => <div key={c.k} style={{ textAlign: c.align || 'left' }}>{c.label}</div>)}
      </div>
      {rows.map((r, i) => (
        <div key={i} className="wf-cell" style={{
          display: 'grid', gridTemplateColumns: cols.map(c => c.w || '1fr').join(' '),
          padding: dense ? '8px 12px' : '12px 14px',
          borderBottom: i < rows.length - 1 ? '1px solid var(--line-mute)' : 'none',
          fontSize: 12.5, alignItems: 'center',
          background: r._hl ? 'var(--accent-soft)' : 'transparent',
        }}>
          {cols.map(c => (
            <div key={c.k} style={{
              textAlign: c.align || 'left',
              fontFamily: c.mono ? 'var(--font-mono)' : 'inherit',
              fontWeight: c.k === accentCol ? 600 : 400,
              color: c.muted ? 'var(--ink-soft)' : 'inherit',
            }}>{r[c.k]}</div>
          ))}
        </div>
      ))}
    </div>
  );
}

Object.assign(window, { Box, Card, Btn, Input, Chip, Stat, Avatar, Icon, H2, Anno, Line, TextLines, BarChart, LineChart, Donut, AppShell, Tabs, Table });
