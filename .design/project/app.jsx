// app.jsx — main React entry: shows the SELECTED variation per section.
// (Previously this canvas hosted 3 variations per section; the user picked
//  one of each. Other variants stay in the screens-*.jsx files in case we
//  want to revive them, but only the chosen ones are mounted.)

function ArtboardWrap({ tweaks, children }) {
  const cls = [
    'wf-root',
    tweaks.style === 'sketch' ? 'sketch' : '',
    tweaks.annos ? '' : 'no-anno',
  ].filter(Boolean).join(' ');
  return (
    <div className={cls} style={{ width: '100%', height: '100%', position: 'relative', background: 'var(--paper-2)' }}>
      {children}
    </div>
  );
}

const ART_W = 1200;
const ART_H = 720;

function App() {
  const [tweaks, setTweak] = useTweaks(/*EDITMODE-BEGIN*/{
    "style": "mid",
    "view": "both",
    "annos": true
  }/*EDITMODE-END*/);

  const show = (kind) => tweaks.view === 'both' || tweaks.view === kind;

  return (
    <React.Fragment>
      <DesignCanvas>
        {show('employee') && (
          <DCSection id="emp-dash" title="Employee · Dashboard"
            subtitle="Hero punch + today's summary + recent history">
            <DCArtboard id="A" label="Selected · Hero punch" width={ART_W} height={ART_H}>
              <ArtboardWrap tweaks={tweaks}><EmpDashA/></ArtboardWrap>
            </DCArtboard>
          </DCSection>
        )}

        {show('employee') && (
          <DCSection id="emp-hist" title="Employee · History"
            subtitle="Calendar grid + day-detail panel">
            <DCArtboard id="C" label="Selected · Calendar + day detail" width={ART_W} height={ART_H}>
              <ArtboardWrap tweaks={tweaks}><EmpHistC/></ArtboardWrap>
            </DCArtboard>
          </DCSection>
        )}

        {show('admin') && (
          <DCSection id="adm-dash" title="Admin · Dashboard"
            subtitle="Stats grid + live attendance table">
            <DCArtboard id="A" label="Selected · Stats grid + attendance" width={ART_W} height={ART_H}>
              <ArtboardWrap tweaks={tweaks}><AdminDashA/></ArtboardWrap>
            </DCArtboard>
          </DCSection>
        )}

        {show('admin') && (
          <DCSection id="adm-people" title="Admin · People tab (selected · roster + drawer)"
            subtitle="Locked in · B">
            <DCArtboard id="B" label="Selected · Roster + profile drawer" width={ART_W} height={ART_H}>
              <ArtboardWrap tweaks={tweaks}><PeopleTabB/></ArtboardWrap>
            </DCArtboard>
          </DCSection>
        )}

        {show('admin') && (
          <DCSection id="adm-att" title="Admin · Attendance tab (selected · two-pane)"
            subtitle="Locked in · B">
            <DCArtboard id="B" label="Selected · Two-pane list + detail" width={ART_W} height={ART_H}>
              <ArtboardWrap tweaks={tweaks}><AttListB/></ArtboardWrap>
            </DCArtboard>
          </DCSection>
        )}

        {show('admin') && (
          <DCSection id="adm-rep-tab" title="Admin · Reports tab (selected · daily + weekly)"
            subtitle="Locked in · B">
            <DCArtboard id="B" label="Selected · Daily &amp; Weekly side-by-side" width={ART_W} height={ART_H}>
              <ArtboardWrap tweaks={tweaks}><RptDWB/></ArtboardWrap>
            </DCArtboard>
          </DCSection>
        )}

        {show('admin') && (
          <DCSection id="adm-mod" title="Admin · Edit Punch Modal"
            subtitle="Centered dialog with audit trail">
            <DCArtboard id="A" label="Selected · Classic centered modal" width={ART_W} height={ART_H}>
              <ArtboardWrap tweaks={tweaks}><EditPunchA/></ArtboardWrap>
            </DCArtboard>
          </DCSection>
        )}
      </DesignCanvas>

      <TweaksPanel title="Tweaks">
        <TweakSection label="Style">
          <TweakRadio label="Fidelity" value={tweaks.style} onChange={(v) => setTweak('style', v)}
            options={[
              { label: 'Mid-fi', value: 'mid' },
              { label: 'Sketch', value: 'sketch' },
            ]}/>
        </TweakSection>
        <TweakSection label="Persona">
          <TweakRadio label="View" value={tweaks.view} onChange={(v) => setTweak('view', v)}
            options={[
              { label: 'Both', value: 'both' },
              { label: 'Emp', value: 'employee' },
              { label: 'Admin', value: 'admin' },
            ]}/>
        </TweakSection>
        <TweakSection label="Annotations">
          <TweakToggle label="Notes & arrows" value={tweaks.annos} onChange={(v) => setTweak('annos', v)}/>
        </TweakSection>
      </TweaksPanel>
    </React.Fragment>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
