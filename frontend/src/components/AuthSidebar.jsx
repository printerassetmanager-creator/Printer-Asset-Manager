import React from 'react';

export default function AuthSidebar() {
  return (
    <div className="left">
      <div className="left-inner">
        <div className="logo">
          <img src="/jabil-logo-auth.svg" alt="JABIL" className="jabil-logo-img" />
          <span className="logo-text">JABIL</span>
        </div>

        <h1 className="headline">
          Designed for <span className="blue">Stability.</span>
          <br />
          Trusted for <span className="blue">Performance.</span>
        </h1>
        <div className="hl-bar"></div>
        <p className="sub">
          Create your account and get seamless access to the tools and applications you need.
        </p>

        <div className="features">
          <div className="feat">
            <div className="feat-ico ico-shield">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4da3ff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V7z"/>
                <polyline points="9 12 11 14 15 10"/>
              </svg>
            </div>
            <div className="feat-body">
              <h4>Secure &amp; Reliable</h4>
              <p>Enterprise-grade security to protect your data.</p>
            </div>
          </div>
          <div className="feat">
            <div className="feat-ico ico-bolt">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
              </svg>
            </div>
            <div className="feat-body">
              <h4>Fast &amp; Efficient</h4>
              <p>Streamline your workflow in one place.</p>
            </div>
          </div>
          <div className="feat">
            <div className="feat-ico ico-chart">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="4" y="13" width="4" height="8" rx="1"/>
                <rect x="10" y="9" width="4" height="12" rx="1"/>
                <rect x="16" y="5" width="4" height="16" rx="1"/>
              </svg>
            </div>
            <div className="feat-body">
              <h4>Smart &amp; Insightful</h4>
              <p>Track, analyze and improve performance.</p>
            </div>
          </div>
          <div className="feat">
            <div className="feat-ico ico-heart">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </div>
            <div className="feat-body">
              <h4>Better Support for <span className="blue">0 Downtime</span></h4>
              <p>Unified support across every experience.</p>
            </div>
          </div>
        </div>

        {/* Hero */}
        <div className="hero">
          {/* Laptop */}
          <div className="laptop-wrap">
            <div className="laptop-lid">
              <span className="laptop-brand">JABIL</span>
            </div>
            <div className="laptop-bottom"></div>
            <div className="laptop-hinge"></div>
            <div className="laptop-table"></div>
          </div>

          {/* Trophy */}
          <div className="trophy-wrap">
            <div className="clock-glow">
              <div className="orbit-outer"></div>
              <div className="orbit-inner"></div>
              {/* Robotic arm */}
              <div className="robot-arm">
                <div className="arm-fin"></div>
                <div className="arm-body">
                  <div className="arm-detail"></div>
                  <div className="arm-tip"></div>
                </div>
              </div>
              {/* Ring glow */}
              <div className="ring-glow"></div>
              {/* Clock face */}
              <div className="clock-face">
                <div className="ticks-container">
                  {Array.from({ length: 12 }, (_, i) => (
                    <div key={i} className="tick" style={{ transform: `rotate(${i * 30}deg)` }}></div>
                  ))}
                </div>
                <div className="clock-zero">0</div>
                <div className="clock-sub">DOWNTIME</div>
              </div>
            </div>
            <div className="ped-stem"></div>
            <div className="pedestal">
              <div className="ped-label">BETTER SUPPORT<br />FOR 0 DOWNTIME</div>
            </div>
            <div className="ped-base"></div>
            <div className="ped-glow"></div>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="stats">
        <div className="stat">
          <div className="stat-ic">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V7z"/>
              <polyline points="9 12 11 14 15 10"/>
            </svg>
          </div>
          <span className="stat-lbl">Security<br />You Can Trust</span>
        </div>
        <div className="stat">
          <div className="stat-ic">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 8v4l3 3"/>
            </svg>
          </div>
          <span className="stat-lbl">Performance<br />You Can Count On</span>
        </div>
        <div className="stat">
          <div className="stat-ic">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <span className="stat-lbl">Support<br />You Can Rely On</span>
        </div>
        <div className="stat">
          <div className="stat-ic">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 6v6l4 2"/>
            </svg>
          </div>
          <span className="stat-lbl">Zero Downtime<br />Our Promise</span>
        </div>
      </div>
    </div>
  );
}
