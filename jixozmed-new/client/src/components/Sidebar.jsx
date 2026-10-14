import { useNavigate, useLocation } from 'react-router-dom';
import { logout } from '../api/auth';

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('jixozmed_user') || '{}');

  const initials = (user.name || '?')
    .split(' ')
    .map((s) => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const isActive = (path) => location.pathname === path;

  return (
    <aside className="sidebar">
      <div className="sidebar-panel">
        <button
          className="sidebar-user"
          title="Личный кабинет"
          onClick={() => navigate('/profile')}
        >
          <span>{initials}</span>
        </button>

        <button className="sidebar-toggle" title="Свернуть">
          <i className="fas fa-chevron-right"></i>
        </button>

        <div className="sidebar-divider"></div>

        <nav className="sidebar-nav">
          <button
            className={`sidebar-btn ${isActive('/dashboard') ? 'active' : ''}`}
            title="Главная"
            onClick={() => navigate('/dashboard')}
          >
            <i className="fas fa-th-large"></i>
          </button>
          <button
            className={`sidebar-btn ${isActive('/create') ? 'active' : ''}`}
            title="Форма создания"
            onClick={() => navigate('/create')}
          >
            <i className="fas fa-list"></i>
          </button>
          <button
            className={`sidebar-btn ${isActive('/users') ? 'active' : ''}`}
            title="Пользователи"
            onClick={() => navigate('/users')}
          >
            <i className="fas fa-users"></i>
          </button>
          <button
            className={`sidebar-btn ${isActive('/map') ? 'active' : ''}`}
            title="Карта"
            onClick={() => navigate('/map')}
          >
            <i className="fas fa-map-marked-alt"></i>
          </button>
        </nav>

        <button
          className={`sidebar-admin ${isActive('/admin') ? 'active' : ''}`}
          title="Админ-панель"
          onClick={() => navigate('/admin')}
        >
          <i className="fas fa-user-shield"></i>
        </button>

        <button className="sidebar-logout" title="Выход" onClick={handleLogout}>
          <i className="fas fa-sign-out-alt"></i>
        </button>
      </div>
    </aside>
  );
}
