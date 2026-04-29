import React from 'react';

export default function UnderDevelopmentNotice({
  title = 'This section is under development.',
  description = 'We are working on this feature right now.',
  compact = false,
  className = '',
}) {
  return (
    <div className={`under-dev${compact ? ' compact' : ''}${className ? ` ${className}` : ''}`}>
      <img
        src="/under-development.svg"
        alt="Work in progress"
        className="under-dev-image"
      />
      <div className="under-dev-copy">
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
    </div>
  );
}
