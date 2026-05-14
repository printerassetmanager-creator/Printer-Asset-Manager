import React from 'react';

export default function LoadingFallback({ variant = 'screen' }) {
  return (
    <div className={`ui-loading ui-loading-${variant}`} aria-live="polite" aria-label="Preparing content">
      <div className="ui-loading-panel">
        <div className="ui-loading-mark">
          <span></span>
        </div>
        <div className="ui-loading-copy">
          <div className="ui-loading-line ui-loading-line-lg"></div>
          <div className="ui-loading-line"></div>
        </div>
      </div>
      <div className="ui-loading-grid">
        <div></div>
        <div></div>
        <div></div>
      </div>
    </div>
  );
}
