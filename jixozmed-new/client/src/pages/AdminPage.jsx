import { useNavigate } from 'react-router-dom';
import './AdminPage.css';

const cards = [
  { icon: 'fa-users-cog',      color: 'users',    title: 'Управление пользователями', desc: 'Добавление, редактирование и блокировка пользователей', path: '/users' },
  { icon: 'fa-building',       color: 'org',      title: 'Организации',               desc: 'Справочник организаций и районов',                     path: '/organizations' },
  { icon: 'fa-map-marked-alt', color: 'map',      title: 'Карта организаций',         desc: 'Расположение на карте и ваше местоположение',          path: '/map' },
  { icon: 'fa-tags',           color: 'class',    title: 'Классификатор',             desc: 'Разделы, пункты и категории оборудования',              path: '/classifier' },
  { icon: 'fa-file-word',      color: 'tpl',      title: 'Шаблоны документов',        desc: 'Акты ремонта, списания и перемещения оборудования',     path: '/templates' },
  { icon: 'fa-history',        color: 'log',      title: 'Журнал действий',           desc: 'История изменений и действий пользователей',            path: '/log' },
  { icon: 'fa-cog',            color: 'settings', title: 'Настройки системы',         desc: 'Основные параметры приложения',                        path: '/settings' },
];

export default function AdminPage() {
  const navigate = useNavigate();

  return (
    <main className="admin-content">
      <header className="admin-header">
        <h1>Админ-панель</h1>
        <p>Управление системой и настройками</p>
      </header>

      <div className="admin-grid">
        {cards.map((c) => (
          <button
            key={c.path}
            className="admin-card"
            onClick={() => navigate(c.path)}
          >
            <div className={`admin-card-icon admin-icon-${c.color}`}>
              <i className={`fas ${c.icon}`}></i>
            </div>
            <div className="admin-card-body">
              <h3>{c.title}</h3>
              <p>{c.desc}</p>
            </div>
            <i className="fas fa-chevron-right admin-card-arrow"></i>
          </button>
        ))}
      </div>
    </main>
  );
}
