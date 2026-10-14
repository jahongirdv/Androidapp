import { useState, useEffect } from 'react';
import { fetchEquipmentByOrg } from '../api/equipment';

const EQ_LABELS = {
  name: 'Наименование',
  model: 'Модель',
  inventory_number: 'Инвентарный №',
  factory_number: 'Заводской №',
  year_manufactured: 'Год выпуска',
  condition: 'Состояние',
  classification: 'Классификация',
  classification_section: 'Раздел',
  classification_point: 'Пункт',
  created_date: 'Дата постановки',
  uzasbo_number: 'УЗАСБО №',
  price: 'Стоимость',
  region: 'Регион',
  district: 'Район',
  responsible_person: 'Ответственное лицо',
};

const EQ_SKIP = new Set(['id', 'organization_id', 'organization_name', 'created_at', 'updated_at', 'name']);

export default function EquipmentModal({ open, organization, onClose }) {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!open || !organization) return;
    setLoading(true);
    setError('');
    setQuery('');
    fetchEquipmentByOrg(organization.id)
      .then((data) => setList(data))
      .catch((err) => setError(err.response?.data?.error || err.message))
      .finally(() => setLoading(false));
  }, [open, organization]);

  if (!open || !organization) return null;

  const q = query.trim().toLowerCase();
  const filtered = q
    ? list.filter((item) =>
        Object.values(item)
          .filter((v) => v != null)
          .join(' ')
          .toLowerCase()
          .includes(q)
      )
    : list;

  return (
    <div className="marker-modal show" onClick={(e) => e.target.className === 'marker-modal show' && onClose()}>
      <div className="marker-modal-box" style={{ maxWidth: '560px' }}>
        <h3>{organization.name}</h3>
        <p className="marker-modal-coords">
          {organization.district || '—'} · {organization.type || '—'} · всего: {list.length} шт.
        </p>

        <div className="map-search" style={{ marginBottom: '12px' }}>
          <i className="fas fa-search"></i>
          <input
            type="text"
            placeholder="Поиск по оборудованию..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="list-content" style={{ maxHeight: '440px', overflowY: 'auto', marginBottom: '16px' }}>
          {loading && (
            <div className="list-empty">
              <i className="fas fa-spinner fa-spin"></i>
              Загрузка...
            </div>
          )}

          {!loading && error && (
            <div className="list-empty">
              <i className="fas fa-exclamation-triangle"></i>
              Ошибка: {error}
            </div>
          )}

          {!loading && !error && filtered.length === 0 && (
            <div className="list-empty">
              <i className="fas fa-box-open"></i>
              {list.length ? 'Ничего не найдено' : 'Оборудование не найдено'}
            </div>
          )}

          {!loading && !error && filtered.map((item, idx) => {
            const rows = Object.entries(item)
              .filter(([k, v]) => !EQ_SKIP.has(k) && v != null && String(v).trim() !== '')
              .map(([k, v]) => (
                <div key={k} style={{ display: 'contents' }}>
                  <span className="eq-key">{EQ_LABELS[k] || k}</span>
                  <span className={`eq-val${/number|_no|serial|inv/.test(k) ? ' mono' : ''}`}>
                    {String(v)}
                  </span>
                </div>
              ));

            return (
              <div key={item.id || idx} className="list-item" style={{ cursor: 'default', alignItems: 'flex-start' }}>
                <i className="fas fa-tools"></i>
                <div className="list-item-body">
                  <div className="list-item-title">{item.name || `Оборудование #${idx + 1}`}</div>
                  {rows.length > 0 && <div className="eq-grid">{rows}</div>}
                </div>
              </div>
            );
          })}
        </div>

        <div className="marker-modal-actions">
          <button className="map-btn" onClick={onClose}>Закрыть</button>
        </div>
      </div>
    </div>
  );
}
