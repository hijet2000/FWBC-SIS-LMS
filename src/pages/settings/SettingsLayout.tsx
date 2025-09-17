import React from 'react';
import { Outlet } from 'react-router-dom';

const SettingsLayout: React.FC = () => {
  return (
    <div>
      <h1>Settings</h1>
      <Outlet />
    </div>
  );
};

export default SettingsLayout;
