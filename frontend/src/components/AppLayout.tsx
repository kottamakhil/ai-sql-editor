import { Outlet } from 'react-router-dom';
import { TopBar } from './TopBar/TopBar';
import { Sidebar } from './Sidebar/Sidebar';

export function AppLayout() {
  return (
    <div className="flex flex-col h-screen">
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-white">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
