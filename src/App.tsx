import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AppShell from './app/layout/AppShell';
import Capture from './app/pages/Capture';
import Settings from './app/pages/Settings';
import TestFeed from './app/pages/TestFeed';

/**
 * Top level application component.
 * Defines the route structure and wraps pages in the AppShell layout.
 */
const App: React.FC = () => {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Capture />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/test" element={<TestFeed />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
};

export default App;