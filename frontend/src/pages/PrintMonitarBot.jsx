import React from 'react';

export default function PrintMonitarBot() {
  return (
    <div className="screen">
      <div className="card" style={{ padding: '22px' }}>
        <div className="card-title">Print Monitar Bot</div>
        <div style={{ fontSize: '24px', color: 'var(--text)', fontWeight: 700, marginTop: '8px' }}>
          This Section Is Currently Under Development
        </div>
        <div className="tb-meta" style={{ marginTop: '8px', maxWidth: '920px', lineHeight: 1.7 }}>
          In this module we monitor Honeywell PX940 label quality, and the bot will try to correct label quality issues virtually.
        </div>
        <div className="tb-meta" style={{ marginTop: '6px', maxWidth: '920px', lineHeight: 1.7 }}>
          For Zebra printers, correction is handled manually by command, and we will also try to compare the Honeywell printer verifier image with the Loftware log.
        </div>
      </div>

      <div className="fgrid fg2">
        <div className="card" style={{ padding: '18px' }}>
          <div className="sec">Honeywell PX940</div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
            <span className="badge b-online">Verifier Image</span>
            <span className="badge b-ok">Virtual Correction</span>
          </div>
          <div style={{ color: 'var(--text2)', fontSize: '13px', lineHeight: 1.7 }}>
            Track Honeywell PX940 label quality, review verifier output, and let the bot attempt virtual correction before operator intervention.
          </div>
        </div>

        <div className="card" style={{ padding: '18px' }}>
          <div className="sec">Zebra + Comparison</div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
            <span className="badge b-warn">Manual Command</span>
            <span className="badge b-user">Loftware Log Match</span>
          </div>
          <div style={{ color: 'var(--text2)', fontSize: '13px', lineHeight: 1.7 }}>
            Zebra printer quality handling remains manual by command, while this bot page is planned to compare Honeywell verifier images with Loftware logs for validation.
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: '18px' }}>
        <div className="sec">Planned Workflow</div>
        <div style={{ display: 'grid', gap: '10px' }}>
          <div style={{ color: 'var(--text2)', fontSize: '13px' }}>1. Capture Honeywell PX940 verifier image and print quality result.</div>
          <div style={{ color: 'var(--text2)', fontSize: '13px' }}>2. Compare verifier output with expected Loftware print log.</div>
          <div style={{ color: 'var(--text2)', fontSize: '13px' }}>3. Suggest or apply virtual correction logic for Honeywell labels.</div>
          <div style={{ color: 'var(--text2)', fontSize: '13px' }}>4. Keep Zebra correction flow manual through printer commands.</div>
        </div>
      </div>
    </div>
  );
}
