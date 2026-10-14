import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import {
  fetchOrganizations,
  createOrganization,
  deleteOrganization,
} from '../api/organizations';
import { fetchEquipmentCounts } from '../api/equipment';
import OrganizationsListModal from '../components/OrganizationsListModal';
import EquipmentModal from '../components/EquipmentModal';
import './MapPage.css';

const orgIcon = L.divIcon({
  className: '',
  html: '<div class="marker-pin"><i class="fas fa-hospital"></i></div>',
  iconSize: [34, 34],
  iconAnchor: [17, 34],
  popupAnchor: [0, -34],
});

const userIcon = L.divIcon({
  className: 'user-location-marker',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

function MapClickHandler({ enabled, onPick }) {
  useMapEvents({
    click: (e) => { if (enabled) onPick(e.latlng.lat, e.latlng.lng); },
  });
  return null;
}

function MapController({ flyTo }) {
  const map = useMap();
  useEffect(() => {
    if (flyTo) map.flyTo(flyTo, 15, { duration: 1.2 });
  }, [flyTo, map]);
  return null;
}

export default function MapPage() {
  const [organizations, setOrganizations] = useState([]);
  const [equipmentCounts, setEquipmentCounts] = useState({});
  const [addMode, setAddMode] = useState(false);
  const [pending, setPending] = useState(null);
  const [formData, setFormData] = useState({ name: '', district: '', region: '', type: '' });
  const [userPos, setUserPos] = useState(null);
  const [flyTo, setFlyTo] = useState(null);
  const [status, setStatus] = useState({ text: 'Загрузка...', type: '' });
  const [loading, setLoading] = useState(false);

  // Модалки
  const [listOpen, setListOpen] = useState(false);
  const [equipmentModal, setEquipmentModal] = useState({ open: false, organization: null });

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    try {
      const [orgs, counts] = await Promise.all([
        fetchOrganizations(),
        fetchEquipmentCounts(),
      ]);
      setOrganizations(orgs);
      setEquipmentCounts(counts);
      setStatus({ text: `Организаций: ${orgs.length}`, type: 'active' });
    } catch (err) {
      console.error(err);
      setStatus({ text: 'Ошибка загрузки', type: 'error' });
    }
  }

  function handleMapPick(lat, lng) {
    setPending({ lat, lng });
    setFormData({ name: '', district: '', region: '', type: '' });
    setAddMode(false);
  }

  async function handleSave() {
    if (!formData.name.trim()) return;
    setLoading(true);
    try {
      const res = await createOrganization({
        name: formData.name.trim(),
        district: formData.district.trim() || null,
        region: formData.region.trim() || null,
        type: formData.type.trim() || null,
        latitude: pending.lat,
        longitude: pending.lng,
      });
      if (res.success) {
        setOrganizations((prev) => [...prev, res.organization]);
        setPending(null);
        setStatus({ text: `Организация «${res.organization.name}» добавлена`, type: 'active' });
      } else {
        alert('Ошибка: ' + (res.error || 'не удалось'));
      }
    } catch (err) {
      alert('Ошибка: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id, name) {
    if (!confirm(`Удалить «${name}»?`)) return;
    try {
      await deleteOrganization(id);
      setOrganizations((prev) => prev.filter((o) => String(o.id) !== String(id)));
      setStatus({ text: 'Организация удалена', type: 'active' });
    } catch (err) {
      alert('Ошибка: ' + (err.response?.data?.error || err.message));
    }
  }

  function handleLocate() {
    if (!navigator.geolocation) {
      setStatus({ text: 'Геолокация не поддерживается', type: 'error' });
      return;
    }
    setStatus({ text: 'Определение местоположения...', type: '' });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserPos([latitude, longitude]);
        setFlyTo([latitude, longitude]);
        setStatus({ text: `Вы здесь: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`, type: 'active' });
      },
      (err) => setStatus({ text: 'Ошибка: ' + err.message, type: 'error' }),
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }

  function toggleAddMode() {
    setAddMode((v) => !v);
    setStatus({
      text: addMode
        ? `Организаций: ${organizations.length}`
        : 'Кликните по карте, где находится организация',
      type: 'active',
    });
  }

  function handlePickFromList(org) {
    if (!org.latitude || !org.longitude) return;
    setFlyTo([Number(org.latitude), Number(org.longitude)]);
    setStatus({
      text: `${org.name} · ${org.district || '—'}`,
      type: 'active',
    });
  }

  function openEquipment(org) {
    setEquipmentModal({ open: true, organization: org });
  }

  return (
    <main>
      <header style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, margin: '0 0 6px', color: '#e6edf5' }}>
          Карта организаций
        </h1>
        <p style={{ fontSize: '14px', color: '#7d92ab', margin: 0 }}>
          Расположение медицинских объединений и ваше местоположение
        </p>
      </header>

      <div className="map-toolbar">
        <button className={`map-btn ${addMode ? 'active' : ''}`} onClick={toggleAddMode}>
          <i className="fas fa-plus"></i> {addMode ? 'Отменить' : 'Добавить организацию'}
        </button>

        <button className="map-btn" onClick={() => setListOpen(true)}>
          <i className="fas fa-list"></i> Список организаций
        </button>

        <button className="map-btn" onClick={handleLocate}>
          <i className="fas fa-crosshairs"></i> Моё местоположение
        </button>

        <button className="map-btn" onClick={loadAll}>
          <i className="fas fa-sync-alt"></i>
        </button>
      </div>

      <div className={`map-info ${status.type}`}>
        <i className={`fas ${
          status.type === 'active' ? 'fa-check-circle'
          : status.type === 'error' ? 'fa-exclamation-triangle'
          : 'fa-info-circle'
        }`}></i>
        <div className="map-info-content">{status.text}</div>
      </div>

      <div className={`map-container ${addMode ? 'add-mode' : ''}`}>
        <MapContainer center={[42.45, 59.60]} zoom={8} style={{ width: '100%', height: '100%' }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="© OpenStreetMap"
            maxZoom={19}
            minZoom={3}
          />
          <MapClickHandler enabled={addMode} onPick={handleMapPick} />
          <MapController flyTo={flyTo} />

          {organizations.map((org) => {
            const cnt = equipmentCounts[org.id] || 0;
            return (
              <Marker
                key={org.id}
                position={[Number(org.latitude), Number(org.longitude)]}
                icon={orgIcon}
              >
                <Popup>
                  <b>{org.name}</b>
                  <span style={{ color: '#7d92ab' }}>Район:</span> {org.district || '—'}<br />
                  <span style={{ color: '#7d92ab' }}>Регион:</span> {org.region || '—'}<br />
                  <span style={{ color: '#7d92ab' }}>Тип:</span> {org.type || '—'}<br />
                  <span style={{ color: '#b97bd1', fontWeight: 600 }}>
                    🔧 Оборудование: {cnt} шт.
                  </span>
                  <button
                    className="popup-equipment"
                    onClick={() => openEquipment(org)}
                  >
                    <i className="fas fa-tools"></i> Показать оборудование
                  </button>
                  <button
                    className="popup-delete"
                    onClick={() => handleDelete(org.id, org.name)}
                  >
                    <i className="fas fa-trash"></i> Удалить
                  </button>
                </Popup>
              </Marker>
            );
          })}

          {userPos && (
            <Marker position={userPos} icon={userIcon}>
              <Popup>Вы здесь</Popup>
            </Marker>
          )}
        </MapContainer>
      </div>

      {/* Модалка: Новая организация */}
      <div className={`marker-modal ${pending ? 'show' : ''}`}>
        <div className="marker-modal-box">
          <h3>Новая организация</h3>
          <p className="marker-modal-coords">
            {pending ? `${pending.lat.toFixed(6)}, ${pending.lng.toFixed(6)}` : ''}
          </p>

          <label className="marker-modal-label">Название</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Например: Amudaryo tuman tibbiyot birlashmasi"
            autoFocus
          />

          <label className="marker-modal-label">Район</label>
          <input
            type="text"
            value={formData.district}
            onChange={(e) => setFormData({ ...formData, district: e.target.value })}
            placeholder="Например: Amudaryo"
          />

          <label className="marker-modal-label">Регион</label>
          <input
            type="text"
            value={formData.region}
            onChange={(e) => setFormData({ ...formData, region: e.target.value })}
            placeholder="Например: Qoraqalpog'iston"
          />

          <label className="marker-modal-label">Тип</label>
          <input
            type="text"
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            placeholder="Например: Tibbiyot birlashmasi"
          />

          <div className="marker-modal-actions">
            <button className="map-btn" onClick={() => setPending(null)} disabled={loading}>
              Отмена
            </button>
            <button className="map-btn primary" onClick={handleSave} disabled={loading}>
              <i className="fas fa-check"></i> {loading ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </div>
      </div>

      {/* Модалка: Список организаций */}
      <OrganizationsListModal
        open={listOpen}
        organizations={organizations}
        onClose={() => setListOpen(false)}
        onPick={handlePickFromList}
      />

      {/* Модалка: Оборудование */}
      <EquipmentModal
        open={equipmentModal.open}
        organization={equipmentModal.organization}
        onClose={() => setEquipmentModal({ open: false, organization: null })}
      />
    </main>
  );
}
