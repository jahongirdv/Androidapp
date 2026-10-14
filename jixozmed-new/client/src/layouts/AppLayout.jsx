import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import './AppLayout.css';

export default function AppLayout() {
  return (
    <>
      <Sidebar />
      <div className="app-content">
        <Outlet />
      </div>
    </>
  );
}
