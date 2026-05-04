import React, { useEffect, useMemo, useState } from 'react';
import { applicationSupportAPI } from '../../utils/api';

const terminalOptions = ['M01', 'P01', 'VAO01', 'D01', 'E01'];
const pcPrefix = 'INRJNM';

export default function TerminalManagement({ canManage = false, dashboard = null }) {
  const [pcSuffix, setPcSuffix] = useState('');
  const [selectedTerminals, setSelectedTerminals] = useState([]);
  const [targetUsername, setTargetUsername] = useState('');
  const [targetPassword, setTargetPassword] = useState('');
  const [fastMode, setFastMode] = useState(true);
  const [rollbackHistory, setRollbackHistory] = useState([]);
  const [failedDevices, setFailedDevices] = useState([]);
  const [selectedRollbackPcs, setSelectedRollbackPcs] = useState([]);
  const [deploying, setDeploying] = useState(false);
  const [rollingBack, setRollingBack] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [failedPcs, setFailedPcs] = useState([]);
  const [failedAction, setFailedAction] = useState('deploy');
  const [output, setOutput] = useState('');

  const pcNames = useMemo(() => {
    return pcSuffix
      .split(/[\n, ]+/)
      .map((value) => value.trim().toUpperCase())
      .filter(Boolean)
      .map((value) => value.startsWith(pcPrefix) ? value : `${pcPrefix}${value}`);
  }, [pcSuffix]);

  const recommendedTerminals = useMemo(() => {
    if (!dashboard?.terminals) return [];
    const terminalsWithUsers = dashboard.terminals.map(t => ({ code: t.code, users: t.active_users || 0 }));
    const minUsers = Math.min(...terminalsWithUsers.map(t => t.users));
    return terminalsWithUsers.filter(t => t.users === minUsers).map(t => t.code);
  }, [dashboard]);

  const loadRollbackHistory = async () => {
    if (!canManage) return;
    try {
      const { data } = await applicationSupportAPI.getTerminalHistory();
      setRollbackHistory(Array.isArray(data) ? data : []);
      setSelectedRollbackPcs((prev) => prev.filter((pcName) => (data || []).some((item) => item.pc_name === pcName)));
    } catch (err) {
      console.warn('Unable to load terminal rollback history', err);
    }
  };

  const loadFailedDevices = async () => {
    if (!canManage) return;
    try {
      const { data } = await applicationSupportAPI.getTerminalFailedDevices();
      setFailedDevices(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Unable to load terminal failed devices', err);
    }
  };

  useEffect(() => {
    loadRollbackHistory();
    loadFailedDevices();
  }, [canManage]);

  const toggleTerminal = (terminal) => {
    setSelectedTerminals((prev) => {
      const next = prev.includes(terminal)
        ? prev.filter((item) => item !== terminal)
        : [...prev, terminal];

      if (terminal === 'M01' && !prev.includes('M01') && !next.includes('VAO01')) {
        next.push('VAO01');
      }

      if (terminal === 'VAO01' && prev.includes('VAO01') && prev.includes('M01')) {
        return prev;
      }

      return next;
    });
  };

  const handleDeploy = async (event) => {
    event.preventDefault();
    setDeploying(true);
    setError('');
    setSuccess('');
    setFailedPcs([]);
    setOutput('');

    try {
      const { data } = await applicationSupportAPI.deployTerminal({
        pcNames,
        terminals: selectedTerminals,
        targetUsername,
        targetPassword,
        fastMode,
      });

      const failures = (data.results || []).filter((result) => result.status === 'failed');
      setFailedAction('deploy');
      setFailedPcs(failures.map((result) => result.pcName));
      setSuccess(data.message || 'Terminal deployment completed');
      setOutput((data.results || []).map((result) => {
        if (result.status === 'success') {
          return `=== ${result.pcName} SUCCESS ===\n${result.output || ''}${result.warning ? `\n${result.warning}` : ''}`;
        }
        return `=== ${result.pcName} FAILED ===\n${result.error || 'Unknown error'}`;
      }).join('\n\n'));
      setTargetPassword('');
      await loadRollbackHistory();
      await loadFailedDevices();
    } catch (err) {
      setError(err.response?.data?.details || err.response?.data?.error || 'Terminal deployment failed');
    } finally {
      setDeploying(false);
    }
  };

  const handleRollback = async () => {
    setRollingBack(true);
    setError('');
    setSuccess('');
    setFailedPcs([]);
    setOutput('');

    try {
      const { data } = await applicationSupportAPI.rollbackTerminal({
        pcNames: selectedRollbackPcs,
        targetUsername,
        targetPassword,
        fastMode,
      });

      const failures = (data.results || []).filter((result) => result.status === 'failed');
      setFailedAction('rollback');
      setFailedPcs(failures.map((result) => result.pcName));
      setSuccess(data.message || 'Rollback completed');
      setOutput((data.results || []).map((result) => {
        if (result.status === 'success') {
          const previous = (result.previousTerminals || []).join(', ') || 'none';
          const removed = (result.removedTerminals || []).join(', ') || 'none';
          return `=== ${result.pcName} ROLLBACK SUCCESS ===\nRestored: ${previous}\nRemoved: ${removed}\n${result.output || ''}${result.warning ? `\n${result.warning}` : ''}`;
        }
        return `=== ${result.pcName} ROLLBACK FAILED ===\n${result.error || 'Unknown error'}`;
      }).join('\n\n'));
      setTargetPassword('');
      await loadRollbackHistory();
      await loadFailedDevices();
    } catch (err) {
      setError(err.response?.data?.details || err.response?.data?.error || 'Terminal rollback failed');
    } finally {
      setRollingBack(false);
    }
  };

  const toggleRollbackPc = (pcName) => {
    setSelectedRollbackPcs((prev) => (
      prev.includes(pcName)
        ? prev.filter((item) => item !== pcName)
        : [...prev, pcName]
    ));
  };

  const busy = deploying || rollingBack;

  return (
    <div className="terminal-management">
      <div className="terminals-header">
        <div>
          <h2>Terminal Management</h2>
          <p>Deploy terminal shortcuts and cleanup target PC desktop/session files</p>
        </div>
      </div>

      {!canManage && (
        <div className="alert alert-error">Application support access is required for terminal deployment.</div>
      )}
      {error && <div className="alert alert-error">{error}</div>}
      {failedPcs.length > 0 && (
        <div className="alert alert-error">
          Unable to {failedAction === 'rollback' ? 'rollback terminal on' : 'deploy new terminal on'}: <strong>{failedPcs.join(', ')}</strong>
        </div>
      )}
      {success && <div className="alert alert-success">{success}</div>}

      <form className="terminal-management-panel" onSubmit={handleDeploy}>
        <div className="terminal-management-grid">
          <div className="terminal-management-section">
            <label className="terminal-management-label">Target PC Name</label>
            <div className="pc-name-field pc-name-field-multi">
              <span>{pcPrefix}</span>
              <textarea
                value={pcSuffix}
                onChange={(event) => setPcSuffix(event.target.value.toUpperCase())}
                placeholder="0IT012&#10;0IT013&#10;INRJNM0IT014"
                disabled={!canManage || busy}
              />
            </div>
            <div className="terminal-management-hint">
              {pcNames.length ? `${pcNames.length} target PC(s): ${pcNames.join(', ')}` : 'Enter one or more PC names, separated by line, comma, or space.'}
            </div>
          </div>

          <div className="terminal-management-section">
            <label className="terminal-management-label">Admin ID and Password</label>
            <input
              value={targetUsername}
              onChange={(event) => setTargetUsername(event.target.value)}
              placeholder="Admin ID"
              disabled={!canManage || busy}
            />
            <input
              type="password"
              value={targetPassword}
              onChange={(event) => setTargetPassword(event.target.value)}
              placeholder="Admin Password"
              disabled={!canManage || busy}
            />
          </div>
        </div>

        <div className="terminal-management-section">
          <div className="terminal-management-label">Terminal Selection</div>
          <div className="terminal-choice-grid">
            {terminalOptions.map((terminal) => {
              const checked = selectedTerminals.includes(terminal);
              const locked = terminal === 'VAO01' && selectedTerminals.includes('M01');

              return (
                <label key={terminal} className={`terminal-choice ${checked ? 'active' : ''} ${locked ? 'locked' : ''} ${recommendedTerminals.includes(terminal) ? 'recommended' : ''}`}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleTerminal(terminal)}
                    disabled={!canManage || busy || locked}
                  />
                  <span>{terminal}{recommendedTerminals.includes(terminal) ? ' (Recommended)' : ''}</span>
                </label>
              );
            })}
          </div>
          <div className="terminal-management-hint">When M01 is selected, VAO01 is required and selected automatically.</div>
        </div>

        <label className="terminal-fast-mode">
          <input
            type="checkbox"
            checked={fastMode}
            onChange={(event) => setFastMode(event.target.checked)}
            disabled={!canManage || busy}
          />
          <span>
            Fast deploy
            <small>Skips full TEMP cleanup for minimum deployment time</small>
          </span>
        </label>

        <div className="terminal-management-section terminal-rollback-section">
          <div className="terminal-management-label">Rollback Previous</div>
          {rollbackHistory.length === 0 ? (
            <div className="terminal-management-hint">No successful terminal deployments available for rollback.</div>
          ) : (
            <>
              <div className="rollback-pc-grid">
                {rollbackHistory.map((item) => {
                  const checked = selectedRollbackPcs.includes(item.pc_name);
                  return (
                    <label key={item.id} className={`rollback-pc-choice ${checked ? 'active' : ''}`}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleRollbackPc(item.pc_name)}
                        disabled={!canManage || busy}
                      />
                      <span>
                        <strong>{item.pc_name}</strong>
                        <small>
                          Current: {(item.deployed_terminals || []).join(', ') || 'none'} | Previous: {(item.previous_terminals || []).join(', ') || 'none'}
                        </small>
                      </span>
                    </label>
                  );
                })}
              </div>
              <div className="terminal-management-hint">Select only the PCs you want to roll back.</div>
            </>
          )}
        </div>

        <div className="terminal-management-actions">
          <button type="button" className="btn btn-secondary" disabled={!canManage || busy || selectedRollbackPcs.length === 0} onClick={handleRollback}>
            {rollingBack ? 'Rolling Back...' : 'Rollback Previous'}
          </button>
          <button type="submit" className="btn btn-primary" disabled={!canManage || busy}>
            {deploying ? 'Deploying...' : 'Deploy Terminal'}
          </button>
        </div>
      </form>

      {output && (
        <div className="terminal-output-panel">
          <div className="terminal-management-label">Deployment Output</div>
          <pre>{output}</pre>
        </div>
      )}

      {failedDevices.length > 0 && (
        <div className="terminal-output-panel">
          <div className="terminal-management-label">Failed Device List</div>
          <div className="failed-device-list">
            {failedDevices.map((device) => (
              <div key={device.id} className="failed-device-row">
                <div>
                  <strong>{device.pc_name}</strong>
                  <span>{device.action} failed at {device.failed_at ? new Date(device.failed_at).toLocaleString() : '-'}</span>
                </div>
                <em>{(device.terminals || []).join(', ') || '-'}</em>
                <p>{device.error || 'Unknown error'}</p>
              </div>
            ))}
          </div>
          <div className="terminal-management-hint">Failed device records are deleted automatically after 2 days.</div>
        </div>
      )}
    </div>
  );
}
