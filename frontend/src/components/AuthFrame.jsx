import React from 'react';

const iconProps = {
  width: 22,
  height: 22,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
};

export function UserPlusIcon() {
  return (
    <svg {...iconProps}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M19 8v6" />
      <path d="M22 11h-6" />
    </svg>
  );
}

export function LoginIcon() {
  return (
    <svg {...iconProps}>
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
      <path d="M10 17l5-5-5-5" />
      <path d="M15 12H3" />
    </svg>
  );
}

export function KeyIcon() {
  return (
    <svg {...iconProps}>
      <circle cx="7.5" cy="14.5" r="4.5" />
      <path d="M11 11l9-9" />
      <path d="M16 6l2 2" />
      <path d="M18 4l2 2" />
    </svg>
  );
}

export function UserIcon() {
  return (
    <svg {...iconProps}>
      <path d="M20 21a8 8 0 0 0-16 0" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

export function MailIcon() {
  return (
    <svg {...iconProps}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}

export function LockIcon() {
  return (
    <svg {...iconProps}>
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

export function EyeIcon() {
  return (
    <svg {...iconProps}>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function EyeOffIcon() {
  return (
    <svg {...iconProps}>
      <path d="m3 3 18 18" />
      <path d="M10.6 10.6A3 3 0 0 0 13.4 13.4" />
      <path d="M9.9 4.2A9.6 9.6 0 0 1 12 4c6.5 0 10 8 10 8a18 18 0 0 1-3.1 4.4" />
      <path d="M6.6 6.7C3.6 8.7 2 12 2 12a18 18 0 0 0 7.8 7.6" />
    </svg>
  );
}

export function SendIcon() {
  return (
    <svg {...iconProps}>
      <path d="m22 2-7 20-4-9-9-4Z" />
      <path d="M22 2 11 13" />
    </svg>
  );
}

export function ArrowLeftIcon() {
  return (
    <svg {...iconProps}>
      <path d="m12 19-7-7 7-7" />
      <path d="M19 12H5" />
    </svg>
  );
}

export function ShieldIcon() {
  return (
    <svg {...iconProps}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
      <path d="m9 12 2 2 4-5" />
    </svg>
  );
}

export function HeadsetIcon() {
  return (
    <svg {...iconProps}>
      <path d="M4 14v-2a8 8 0 0 1 16 0v2" />
      <path d="M18 19c0 1-2 2-6 2" />
      <rect x="3" y="13" width="4" height="6" rx="2" />
      <rect x="17" y="13" width="4" height="6" rx="2" />
      <path d="M12 21h-2" />
    </svg>
  );
}

export function BriefcaseIcon() {
  return (
    <svg {...iconProps}>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M3 13h18" />
      <path d="M12 12v3" />
    </svg>
  );
}

export function UsersIcon() {
  return (
    <svg {...iconProps}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

export function HashIcon() {
  return (
    <svg {...iconProps}>
      <path d="M5 9h14" />
      <path d="M5 15h14" />
      <path d="M11 4 7 20" />
      <path d="m17 4-4 16" />
    </svg>
  );
}

export function AuthFrame({ title, subtitle, icon, accent = 'plus', children }) {
  return (
    <div className="main-container">
      <div className="login-wrapper">
        <aside className="left-panel">
          <div>
            <div className="logo">
              J<span>A</span>BIL
            </div>

            <div className="small-heading">
              SMART SUPPORT. STRONGER SYSTEMS.
            </div>

            <div className="left-title">
              Powering Support.<br />
              Driving Performance.<br />
              Delivering <span className="gradient-text">Excellence.</span>
            </div>

            <div className="line"></div>

            <div className="description">
              Manage application support terminals and servers with real-time insights and seamless control.
            </div>
          </div>
        </aside>

        <div className="right-panel">
          <div className="login-card">
            <div className="lock-circle">{icon}</div>
            <div className="login-title">{title}</div>
            <div className="login-sub">{subtitle}</div>
            <div className="card-line"></div>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

export function AuthNotice({ icon, children }) {
  return (
    <div className="sec-note">
      <span className="sec-ic">{icon}</span>
      <p className="sec-tx">{children}</p>
    </div>
  );
}

export function AuthDivider() {
  return (
    <div className="or-row" aria-hidden="true">
      <span className="or-ln" />
      <span className="or-tx">OR</span>
      <span className="or-ln" />
    </div>
  );
}
