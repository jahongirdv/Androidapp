import { useState, useMemo } from 'react';

// Транслитерация RU → LAT (для умного поиска)
const RU_TO_LAT = {
  'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'yo','ж':'zh','з':'z',
  'и':'i','й':'y','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r',
  'с':'s','т':'t','у':'u','ф':'f','х':'kh','ц':'ts','ч':'ch','ш':'sh','щ':'shch',
  'ъ':'','ы':'y','ь':'','э':'e','ю':'yu','я':'ya','ў':"o'",'қ':'q','ғ':"g'",'ҳ':'h',
};

function hasCyrillic(str) {
  return /[а-яёўқғҳ]/i.test(str || '');
}

function cyrillicToLatin(str) {
  if (!str) return '';
  const s = str.toLowerCase();
  let out = '';
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    out += (RU_TO_LAT[ch] !== undefined) ? RU_TO_LAT[ch] : ch;
  }
  return out;
}

function matchesOrg(org, query) {
  const q = (query || '').trim().toLowerCase();
  if (!q) return true;

  const combined = `${org.name || ''} ${org.district || ''} ${org.region || ''} ${org.type || ''}`.toLowerCase();
  if (combined.includes(q)) return true;
  if (hasCyrillic(q)) {
    const latin = cyrillicToLatin(q);
    if (latin && combined.includes(latin)) return true;
  }
  const combinedLatin = cyrillicToLatin(combined);
  if (combinedLatin.includes(q)) return true;
  return false;
}

export default function OrganizationsListModal({ open, organizations, onClose, onPick }) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(
    () => organizations.filter((o) => matchesOrg(o, query)),
    [organizations, query]
  );

  if (!open) return null;

  const wordForm = (() => {
    const n = filtered.length;
    const m10 = n % 10, m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return 'организация';
    if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return 'организации';
    return 'организаций';
  })();

  return (
    <div className="marker-modal show" onClick={(e) => e.target.className === 'marker-modal show' && onClose()}>
      <div className="marker-modal-box">
        <h3>Организации</h3>
        <p className="marker-modal-coords">
          {query ? `Найдено: ${filtered.length} ${wordForm}` : `${organizations.length} ${wordForm}`}
        </p>

        <div className="map-search" style={{ marginBottom: '12px' }}>
          <i className="fas fa-search"></i>
          <input
            type="text"
            placeholder="Поиск по названию, району..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
        </div>

        <div className="list-content" style={{ maxHeight: '380px', overflowY: 'auto', marginBottom: '16px' }}>
          {filtered.length === 0 ? (
            <div className="list-empty">
              <i className="fas fa-search"></i>
              Ничего не найдено
            </div>
          ) : (
            filtered.map((org) => (
              <div
                key={org.id}
                className="list-item"
                onClick={() => { onPick(org); onClose(); }}
                style={{ cursor: 'pointer' }}
              >
                <i className="fas fa-hospital"></i>
                <div className="list-item-body">
                  <div className="list-item-title">{org.name}</div>
                  <div className="list-item-meta">
                    {org.district || '—'} · {org.type || '—'}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="marker-modal-actions">
          <button className="map-btn" onClick={onClose}>Закрыть</button>
        </div>
      </div>
    </div>
  );
}
