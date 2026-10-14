import { useNavigate } from 'react-router-dom';
import { logout } from '../api/auth';

export default function DashboardPage() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('jixozmed_user') || '{}');

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <main>
      <header style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, margin: '0 0 6px', color: '#e6edf5' }}>
          Главная
        </h1>
        <p style={{ fontSize: '14px', color: '#7d92ab', margin: 0 }}>
          Добро пожаловать, {user.name || 'пользователь'}
        </p>
      </header>

      <div style={{
        background: '#0f1e33',
        padding: '28px',
        borderRadius: '20px',
        border: '1px solid rgba(255,255,255,0.06)',
        maxWidth: '1200px',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
        }}>
          <InfoRow icon="fa-user" label="Логин" value={user.login} />
          <InfoRow icon="fa-shield-alt" label="Роль" value={user.role} />
          <InfoRow icon="fa-map-marker-alt" label="Регион" value={user.region} />
        </div>
      </div>
    </main>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <div style={{
      background: '#16273d', padding: '16px',
      borderRadius: '14px', border: '1px solid rgba(255,255,255,0.06)',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        color: '#7d92ab', fontSize: '12px', marginBottom: '6px',
      }}>
        <i className={`fas ${icon}`}></i> {label}
      </div>
      <div style={{ color: '#e6edf5', fontSize: '15px', fontWeight: 500 }}>
        {value || '—'}
      </div>
    </div>
  );
}
