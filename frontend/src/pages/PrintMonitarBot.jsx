import React from 'react';

export default function PrintMonitarBot() {
  const bodyText = {
    color: 'var(--text)',
    fontSize: '15px',
    fontWeight: 600,
    lineHeight: 1.8,
    maxWidth: '920px',
  };

  const cardText = {
    color: 'var(--text)',
    fontSize: '14px',
    fontWeight: 600,
    lineHeight: 1.8,
  };

  const workflowItem = {
    color: 'var(--text)',
    fontSize: '14px',
    fontWeight: 700,
    lineHeight: 1.7,
    padding: '10px 12px',
    background: 'rgba(255,255,255,.03)',
    border: '1px solid var(--border)',
    borderRadius: '10px',
  };

  return (
    <div className="screen">
      <div className="card" style={{ padding: '22px' }}>
        <div style={{ fontSize: '12px', color: '#8fb3ff', fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase' }}>
          Print Monitar Bot
        </div>
        <div style={{ fontSize: '28px', color: '#ffffff', fontWeight: 800, marginTop: '10px', lineHeight: 1.25 }}>
          This Section Is Currently Under Development
        </div>
        <div style={{ ...bodyText, marginTop: '12px' }}>
          In this module we monitor Honeywell PX940 label quality, and the bot will try to correct label quality issues virtually.
        </div>
        <div style={{ ...bodyText, marginTop: '8px', color: '#eaf0ff' }}>
          For Zebra printers, correction is handled manually by command, and we will also try to compare the Honeywell printer verifier image with the Loftware log.
        </div>
      </div>

      <div className="fgrid fg2">
        <div className="card" style={{ padding: '18px' }}>
          <div style={{ fontSize: '13px', color: '#7ee2a8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '12px' }}>Honeywell PX940</div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
            <span className="badge b-online">Verifier Image</span>
            <span className="badge b-ok">Virtual Correction</span>
          </div>
          <div style={cardText}>
            Track Honeywell PX940 label quality, review verifier output, and let the bot attempt virtual correction before operator intervention.
          </div>
        </div>

        <div className="card" style={{ padding: '18px' }}>
          <div style={{ fontSize: '13px', color: '#ffb370', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '12px' }}>Zebra + Comparison</div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
            <span className="badge b-warn">Manual Command</span>
            <span className="badge b-user">Loftware Log Match</span>
          </div>
          <div style={cardText}>
            Zebra printer quality handling remains manual by command, while this bot page is planned to compare Honeywell verifier images with Loftware logs for validation.
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: '18px' }}>
        <div style={{ fontSize: '13px', color: '#72c8ff', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '12px' }}>Planned Workflow</div>
        <div style={{ display: 'grid', gap: '10px' }}>
          <div style={workflowItem}>1. Capture Honeywell PX940 verifier image and print quality result.</div>
          <div style={workflowItem}>2. Compare verifier output with expected Loftware print log.</div>
          <div style={workflowItem}>3. Suggest or apply virtual correction logic for Honeywell labels.</div>
          <div style={workflowItem}>4. Keep Zebra correction flow manual through printer commands.</div>
        </div>
      </div>
    </div>
  );
}
