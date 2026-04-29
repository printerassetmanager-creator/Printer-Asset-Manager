import React from 'react';
import UnderDevelopmentNotice from '../components/UnderDevelopmentNotice';

export default function VlanActivity() {
  return (
    <div className="screen under-dev-screen">
      <UnderDevelopmentNotice
        title="This section is under development."
        description="VLAN activity is being rebuilt and is temporarily unavailable."
      />
    </div>
  );
}
