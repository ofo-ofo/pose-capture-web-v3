import Capture from './pages/Capture';
import Settings from './pages/Settings';
import TestFeed from './pages/TestFeed';

export const routes = [
  { path: '/', element: <Capture /> },
  { path: '/settings', element: <Settings /> },
  { path: '/test', element: <TestFeed /> }
];