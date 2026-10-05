console.log('🔥 map.js версия 2 — с кнопкой Списать — загружен');


// ============================================================
// СОСТОЯНИЕ
// ============================================================
let myMap = null;
let equipmentCounts = {};
let allOrganizations = [];
let orgsLayer = null;
let userMarker = null;
let addressSearchMarker = null;
let watchId = null;
let addMode = false;
let pendingCoords = null;
let lastUserLat = null;
let lastUserLon = null;
const orgMarkerRefs = {};

let lastGeocodedLat = 0;
let lastGeocodedLon = 0;
let hasAddress = false;
let lastAddress = '';

// Поиск адреса (Nominatim)
let addressSuggestList = [];
let addressSuggestIndex = -1;
let addressSearchTimer = null;

// Оборудование
let currentEquipmentOrg = null;
let currentEquipmentList = [];
let eqSearchTimer = null;


// ============================================================
// ТРАНСЛИТЕРАЦИЯ RU → LAT
// ============================================================
const RU_TO_LAT = {
    'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'yo','ж':'zh','з':'z',
    'и':'i','й':'y','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r',
    'с':'s','т':'t','у':'u','ф':'f','х':'kh','ц':'ts','ч':'ch','ш':'sh','щ':'shch',
    'ъ':'','ы':'y','ь':'','э':'e','ю':'yu','я':'ya',
    'ў':"o'",'қ':'q','ғ':"g'",'ҳ':'h'
};

const LAT_TO_RU = {
    'a':'а','b':'б','v':'в','g':'г','d':'д','e':'е','yo':'ё','zh':'ж','z':'з',
    'i':'и','y':'й','k':'к','l':'л','m':'м','n':'н','o':'о','p':'п','r':'р',
    's':'с','t':'т','u':'у','f':'ф','kh':'х','ts':'ц','ch':'ч','sh':'ш','shch':'щ',
    'yu':'ю','ya':'я'
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

function latinToCyrillic(str) {
    if (!str) return '';
    const s = str.toLowerCase();
    let out = '';
    let i = 0;
    const multi = ['shch','yo','zh','kh','ts','ch','sh','yu','ya'];
    while (i < s.length) {
        let matched = false;
        for (const m of multi) {
            if (s.substr(i, m.length) === m) {
                out += LAT_TO_RU[m] || m;
                i += m.length;
                matched = true;
                break;
            }
        }
        if (matched) continue;
        const ch = s[i];
        out += (LAT_TO_RU[ch] !== undefined) ? LAT_TO_RU[ch] : ch;
        i++;
    }
    return out;
}

// ============================================================
// ХЕЛПЕР — безопасное получение элемента
// ============================================================
function $(id) {
    const el = document.getElementById(id);
    if (!el) console.warn('⚠️ Нет элемента #' + id);
    return el;
}

function on(id, event, handler) {
    const el = document.getElementById(id);
    if (!el) {
        console.warn('⚠️ Нет элемента #' + id + ' — обработчик «' + event + '» не повешен');
        return;
    }
    el.addEventListener(event, handler);
}

// ============================================================
// SUPABASE
// ВАЖНО: publishable-ключ идёт ТОЛЬКО в apikey, без Authorization: Bearer
// ============================================================
async function fetchOrganizations() {
    try {
        const url = `${window.SUPABASE_URL}/rest/v1/organizations?select=*&order=district.asc`;
        const res = await fetch(url, {
            headers: {
                'apikey': window.SUPABASE_ANON_KEY,
                'Content-Type': 'application/json'
            }
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        console.log('✅ Загружено организаций:', data.length);
        if (data.length > 0) {
            console.log('📋 Пример первой записи:', JSON.stringify(data[0]));
        }
        return data;
    } catch (e) {
        console.warn('⚠️ Не удалось загрузить организации:', e.message);
        return [];
    }
}

async function saveOrganization(org) {
    const url = `${window.SUPABASE_URL}/rest/v1/organizations`;
    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'apikey': window.SUPABASE_ANON_KEY,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        },
        body: JSON.stringify(org)
    });
    if (!res.ok) {
        const t = await res.text();
        throw new Error(`HTTP ${res.status}: ${t}`);
    }
    const data = await res.json();
    return data[0];
}

async function deleteOrganization(id) {
    const url = `${window.SUPABASE_URL}/rest/v1/organizations?id=eq.${encodeURIComponent(id)}`;
    const res = await fetch(url, {
        method: 'DELETE',
        headers: {
            'apikey': window.SUPABASE_ANON_KEY
        }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

async function fetchEquipmentCounts() {
    try {
        const url = `${window.SUPABASE_URL}/rest/v1/rpc/equipment_count_by_org`;
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'apikey': window.SUPABASE_ANON_KEY,
                'Content-Type': 'application/json'
            },
            body: '{}'
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const rows = await res.json();
        equipmentCounts = {};
        rows.forEach(r => {
            equipmentCounts[r.organization_id] = Number(r.cnt);
        });
        console.log('📦 Счётчики загружены:', Object.keys(equipmentCounts).length);
    } catch (e) {
        console.warn('⚠️ Счётчики не загрузились:', e.message);
        equipmentCounts = {};
    }
}

async function fetchEquipmentByOrg(orgId) {
    const url = `${window.SUPABASE_URL}/rest/v1/equipment_items`
              + `?organization_id=eq.${encodeURIComponent(orgId)}&select=*&order=id.asc`;
    const res = await fetch(url, {
        headers: {
            'apikey': window.SUPABASE_ANON_KEY,
            'Content-Type': 'application/json'
        }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
}

// ============================================================
// КАРТА
// ============================================================
function initMap() {
    myMap = L.map('map', {
        center: [42.45, 59.60],
        zoom: 8,
        zoomControl: true
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 19,
        minZoom: 3
    }).addTo(myMap);

    orgsLayer = L.layerGroup().addTo(myMap);

    myMap.on('click', (e) => {
        if (!addMode) return;
        openOrgModal(e.latlng.lat, e.latlng.lng);
    });

    console.log('✅ Карта инициализирована');
}


const EQ_LABELS = {
    id: 'ID',
    name: 'Наименование',
    model: 'Модель',
    inventory_number: 'Инвентарный №',
    condition: 'Состояние',
    organization_name: 'Организация (из Excel)',
    organization_id: 'ID организации',
    classification: 'Классификация',
    classification_section: 'Раздел',
    classification_point: 'Пункт',
    created_date: 'Дата постановки',
    uzasbo_number: 'УЗАСБО №',
    price: 'Стоимость',
    region: 'Регион',
    district: 'Район',
    responsible_person: 'Ответственное лицо',
    created_at: 'Создано'
};

const EQ_SKIP = new Set(['id','organization_id','organization_name','created_at','name']);


// ============================================================
// МЕТКИ ОРГАНИЗАЦИЙ
// ============================================================
function renderOrgMarkers() {
    if (!orgsLayer) {
        console.warn('⚠️ orgsLayer не инициализирован');
        return;
    }
    orgsLayer.clearLayers();
    Object.keys(orgMarkerRefs).forEach(k => delete orgMarkerRefs[k]);

    let added = 0;

    allOrganizations.forEach(org => {
        if (!org.latitude || !org.longitude) return;

        const icon = L.divIcon({
            className: '',
            html: `<div class="marker-pin"><i class="fas fa-hospital"></i></div>`,
            iconSize: [34, 34],
            iconAnchor: [17, 34],
            popupAnchor: [0, -34]
        });

        const marker = L.marker([org.latitude, org.longitude], { icon });

        const eqCount = equipmentCounts[org.id] || equipmentCounts[String(org.id)] || 0;
        marker.bindPopup(`
            <b>${org.name}</b>
            <span style="color:#7d92ab;">Район:</span> ${org.district || '—'}<br>
            <span style="color:#7d92ab;">Регион:</span> ${org.region || '—'}<br>
            <span style="color:#7d92ab;">Тип:</span> ${org.type || '—'}<br>
            <span style="color:#b97bd1; font-weight:600;">🔧 Оборудование: ${eqCount} шт.</span>
            <button class="popup-equipment" onclick='openEquipmentModalById(${JSON.stringify(org.id)})'>
                <i class="fas fa-tools"></i> Показать оборудование
            </button>
            <button class="popup-delete" onclick='deleteOrgFromUI(${JSON.stringify(org.id)})'>
                <i class="fas fa-trash"></i> Удалить
            </button>
        `);

        marker.on('click', () => showOrgLocationInfo(org));

        marker.addTo(orgsLayer);
        orgMarkerRefs[org.id] = marker;
        added++;
    });

    console.log('✅ Метки организаций:', added);
}

async function deleteOrgFromUI(id) {
    const org = allOrganizations.find(o => String(o.id) === String(id));
    if (!org) return;
    if (!confirm(`Удалить «${org.name}»?`)) return;

    try {
        await deleteOrganization(id);
        allOrganizations = allOrganizations.filter(o => String(o.id) !== String(id));
        renderOrgMarkers();
        renderListContent(document.getElementById('listSearchInput')?.value || '');
        setStatus('Организация удалена', 'active');
    } catch (e) {
        console.error('❌ Ошибка удаления:', e);
        alert('Не удалось удалить: ' + e.message);
    }
}

// ============================================================
// ПОИСК АДРЕСА НА КАРТЕ (Nominatim)
// ============================================================
async function nominatimSearch(q) {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&accept-language=ru&limit=8&addressdetails=1`;
    const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
}

async function searchAddresses(query) {
    const q = (query || '').trim();
    if (q.length < 3) return [];

    const results = [];

    try {
        const direct = await nominatimSearch(q);
        results.push(...direct);
        console.log(`🌍 [1/2] "${q}" → найдено: ${direct.length}`);

        if (hasCyrillic(q)) {
            const latin = cyrillicToLatin(q);
            if (latin !== q.toLowerCase()) {
                await new Promise(r => setTimeout(r, 350));
                const second = await nominatimSearch(latin);
                results.push(...second);
                console.log(`🌍 [2/2] "${latin}" → найдено: ${second.length}`);
            }
        }

        const seen = new Set();
        const unique = results.filter(item => {
            const key = `${parseFloat(item.lat).toFixed(4)},${parseFloat(item.lon).toFixed(4)}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });

        unique.sort((a, b) => (a.place_rank || 30) - (b.place_rank || 30));

        const final = unique.slice(0, 8);
        console.log('🌍 Итого адресов:', final.length);
        return final;

    } catch (e) {
        console.warn('⚠️ Ошибка поиска адреса:', e.message);
        return results.slice(0, 8);
    }
}

function showAddressSuggestions() {
    const box = document.getElementById('suggestBox');
    if (!box) {
        console.warn('❌ suggestBox не найден в HTML');
        return;
    }

    if (!addressSuggestList.length) {
        box.classList.remove('show');
        return;
    }

    box.innerHTML = addressSuggestList.map((item, i) => `
        <div class="suggest-item" data-idx="${i}">
            <div class="suggest-item-title">
                <i class="fas fa-map-marker-alt" style="color:#4d94e8; margin-right:6px;"></i>
                ${item.display_name}
            </div>
        </div>
    `).join('');

    box.classList.add('show');
    addressSuggestIndex = -1;

    box.querySelectorAll('.suggest-item').forEach(el => {
        el.addEventListener('click', () => {
            const idx = Number(el.dataset.idx);
            selectAddressSuggestion(idx);
        });
    });

    console.log('📋 Показано подсказок:', addressSuggestList.length);
}

function selectAddressSuggestion(idx) {
    const item = addressSuggestList[idx];
    if (!item) return;

    const lat = parseFloat(item.lat);
    const lon = parseFloat(item.lon);

    const boxSuggest = document.getElementById('suggestBox');
    if (boxSuggest) boxSuggest.classList.remove('show');

    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.value = item.display_name;

    if (addressSearchMarker) {
        myMap.removeLayer(addressSearchMarker);
    }

    const icon = L.divIcon({
        className: '',
        html: `<div style="background:#4d94e8; width:30px; height:30px; border-radius:50%; border:3px solid #fff; box-shadow:0 4px 12px rgba(77,148,232,0.5); display:flex; align-items:center; justify-content:center; color:#fff; font-size:14px;"><i class="fas fa-search"></i></div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
        popupAnchor: [0, -15]
    });

    addressSearchMarker = L.marker([lat, lon], { icon }).addTo(myMap);
    addressSearchMarker.bindPopup(`<b>Найдено:</b><br>${item.display_name}`).openPopup();

    myMap.setView([lat, lon], 16, { animate: true });

    const box = document.getElementById('mapInfo');
    if (box) {
        box.className = 'map-info active';
        box.innerHTML = `
            <i class="fas fa-map-marker-alt"></i>
            <div class="map-info-content">
                <div class="map-info-addr">${item.display_name}</div>
                <div class="map-info-coords">
                    <span>Широта: <b>${lat.toFixed(6)}</b></span>
                    <span>Долгота: <b>${lon.toFixed(6)}</b></span>
                </div>
            </div>
        `;
    }

    lastUserLat = lat;
    lastUserLon = lon;

    console.log('📍 Адрес выбран:', lat, lon);
}

function hideAddressSuggestions() {
    setTimeout(() => {
        const box = document.getElementById('suggestBox');
        if (box) box.classList.remove('show');
    }, 150);
}

// ============================================================
// УМНЫЙ ПОИСК ПО ОРГАНИЗАЦИЯМ (RU + LAT)
// ============================================================
function matchesOrg(org, query) {
    const q = (query || '').trim().toLowerCase();
    if (!q) return true;

    const combined = `${org.name || ''} ${org.district || ''} ${org.region || ''} ${org.type || ''}`.toLowerCase();

    if (combined.includes(q)) return true;

    if (hasCyrillic(q)) {
        const latin = cyrillicToLatin(q);
        if (latin && combined.includes(latin)) return true;
    } else {
        const cyr = latinToCyrillic(q);
        if (cyr && combined.includes(cyr)) return true;
    }

    const combinedLatin = cyrillicToLatin(combined);
    if (combinedLatin.includes(q)) return true;

    return false;
}

// ============================================================
// СПИСОК ОРГАНИЗАЦИЙ
// ============================================================
function renderListContent(query) {
    const content = document.getElementById('listContent');
    const count = document.getElementById('listCount');
    if (!content) return;

    const q = (query || '').trim();

    let list = allOrganizations;
    if (q) {
        list = allOrganizations.filter(o => matchesOrg(o, q));
    }

    const n = list.length;
    const mod10 = n % 10, mod100 = n % 100;
    let word = 'организаций';
    if (mod10 === 1 && mod100 !== 11) word = 'организация';
    else if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) word = 'организации';

    if (count) count.textContent = q ? `Найдено: ${n} ${word}` : `${n} ${word}`;

    if (n === 0) {
        content.innerHTML = `
            <div class="list-empty">
                <i class="fas fa-search"></i>
                Ничего не найдено
            </div>`;
        return;
    }

    content.innerHTML = list.map(o => `
        <div class="list-item" onclick='focusOrgFromList(${JSON.stringify(o.id)})'>
            <i class="fas fa-hospital"></i>
            <div class="list-item-body">
                <div class="list-item-title">${o.name}</div>
                <div class="list-item-meta">${o.district || '—'} · ${o.type || '—'}</div>
            </div>
        </div>
    `).join('');
}

function openListModal() {
    const modal = document.getElementById('listModal');
    if (!modal) {
        console.warn('❌ Нет элемента #listModal в HTML');
        return;
    }

    const searchInput = document.getElementById('listSearchInput');
    const clearBtn = document.getElementById('listSearchClear');

    if (searchInput) searchInput.value = '';
    if (clearBtn) clearBtn.classList.remove('visible');

    renderListContent('');

    modal.classList.add('show');
    if (searchInput) setTimeout(() => searchInput.focus(), 200);
}

function closeListModal() {
    const modal = document.getElementById('listModal');
    if (modal) modal.classList.remove('show');
}

function focusOrgFromList(id) {
    const org = allOrganizations.find(x => String(x.id) === String(id));
    if (!org) return;

    closeListModal();
    showOrgLocationInfo(org);

    if (!myMap || !org.latitude || !org.longitude) return;

    myMap.setView([org.latitude, org.longitude], 15, { animate: true });
    setTimeout(() => {
        const marker = orgMarkerRefs[org.id];
        if (marker) marker.openPopup();
    }, 400);
}

// ============================================================
// ИНФО ОБ ОРГАНИЗАЦИИ ВНИЗУ
// ============================================================
function showOrgLocationInfo(org) {
    const box = document.getElementById('mapInfo');
    if (!box) return;
    const eqCount = equipmentCounts[org.id] || equipmentCounts[String(org.id)] || 0;

    box.className = 'map-info active';
    box.innerHTML = `
        <i class="fas fa-hospital"></i>
        <div class="map-info-content">
            <div class="map-info-addr">${org.name}</div>
            <div class="map-info-coords">
                ${org.district ? `<span>Район: <b>${org.district}</b></span>` : ''}
                ${org.type ? `<span>Тип: <b>${org.type}</b></span>` : ''}
                ${org.latitude && org.longitude
                    ? `<span>Широта: <b>${Number(org.latitude).toFixed(6)}</b></span>
                       <span>Долгота: <b>${Number(org.longitude).toFixed(6)}</b></span>`
                    : ''}
                <span>Оборудование: <b>${eqCount} шт.</b></span>
            </div>
        </div>
    `;
}

// ============================================================
// ОБОРУДОВАНИЕ ОРГАНИЗАЦИИ (модалка)
// ============================================================
function openEquipmentModalById(id) {
    const org = allOrganizations.find(o => String(o.id) === String(id));
    if (!org) return;
    openEquipmentModal(org);
}

async function openEquipmentModal(org) {
    const modal = document.getElementById('equipmentModal');
    if (!modal) {
        console.warn('❌ Нет #equipmentModal в HTML');
        return;
    }

    currentEquipmentOrg = org;
    currentEquipmentList = [];

    const titleEl = document.getElementById('eqTitle');
    const subEl = document.getElementById('eqSubtitle');
    const content = document.getElementById('eqListContent');
    const search = document.getElementById('eqSearchInput');
    const clear = document.getElementById('eqSearchClear');

    if (titleEl) titleEl.textContent = org.name;
    if (subEl) subEl.textContent = `${org.district || '—'} · ${org.type || '—'} · загрузка...`;
    if (search) search.value = '';
    if (clear) clear.classList.remove('visible');
    if (content) content.innerHTML =
        `<div class="list-empty"><i class="fas fa-spinner fa-spin"></i>Загрузка...</div>`;

    modal.classList.add('show');

    try {
        currentEquipmentList = await fetchEquipmentByOrg(org.id);
        console.log(`📦 Оборудование «${org.name}»: ${currentEquipmentList.length} шт.`);
        if (subEl) subEl.textContent =
            `${org.district || '—'} · ${org.type || '—'} · всего: ${currentEquipmentList.length} шт.`;
        renderEquipmentList('');
    } catch (e) {
        console.error('❌ Ошибка загрузки оборудования:', e);
        if (subEl) subEl.textContent = `${org.district || '—'} · ошибка загрузки`;
        if (content) content.innerHTML =
            `<div class="list-empty"><i class="fas fa-exclamation-triangle"></i>Ошибка: ${e.message}</div>`;
    }
}

function closeEquipmentModal() {
    const modal = document.getElementById('equipmentModal');
    if (modal) modal.classList.remove('show');
    currentEquipmentOrg = null;
    currentEquipmentList = [];
}

function renderEquipmentList(query) {
    const content = document.getElementById('eqListContent');
    if (!content) return;

    const q = (query || '').trim().toLowerCase();
    let list = currentEquipmentList;

    if (q) {
        list = currentEquipmentList.filter(item => {
            const combined = Object.values(item)
                .filter(v => v !== null && v !== undefined)
                .join(' ')
                .toLowerCase();
            return combined.includes(q);
        });
    }

    if (!list.length) {
        content.innerHTML = `
            <div class="list-empty">
                <i class="fas fa-box-open"></i>
                ${currentEquipmentList.length ? 'Ничего не найдено' : 'Оборудование не найдено'}
            </div>`;
        return;
    }

    let html = '';

    list.forEach((item, idx) => {
        const title = item.name || `Оборудование #${idx + 1}`;  //просмотреть нужно константы

        const rows = Object.entries(item)
            .filter(([k, v]) =>
                !EQ_SKIP.has(k) &&
                v !== null && v !== undefined && String(v).trim() !== ''
            )
            .map(([k, v]) => {
                const label = EQ_LABELS[k] || k;
                const isMono = /(_number|_no|serial|inv)/.test(k);
                return `
                    <span class="eq-key">${label}</span>
                    <span class="eq-val${isMono ? ' mono' : ''}">${String(v)}</span>
                `;
            })
            .join('');

        html += `
            <div class="list-item" style="cursor:default; align-items:flex-start;">
                <i class="fas fa-tools"></i>
                <div class="list-item-body">
                    <div class="list-item-title">${title}</div>
                    ${rows ? `<div class="eq-grid">${rows}</div>` : ''}
                    <button
                        type="button"
                        style="margin-top:12px; display:inline-block; padding:10px 20px;
                               background:#4d94e8; color:#ffffff; border:none; border-radius:8px;
                               cursor:pointer; font-family:inherit; font-size:14px;
                               font-weight:600;
                               user-select:none; -webkit-user-select:none;
                               -webkit-touch-callout:none; touch-action:manipulation;"
                        onclick="onWriteOffClick(${JSON.stringify(item.id)})">
                        Списать
                    </button>       
                </div>
            </div>
        `;
    });

    console.log('🎨 renderEquipmentList: элементов =', list.length,
                '| кнопка в HTML:', html.indexOf('onWriteOffClick') !== -1);

    content.innerHTML = html;
}
// ============================================================
// ДОБАВЛЕНИЕ ОРГАНИЗАЦИИ
// ============================================================
function toggleAddMode() {
    if (addressSearchMarker) {
        const ll = addressSearchMarker.getLatLng();
        openOrgModal(ll.lat, ll.lng);
        return;
    }

    addMode = !addMode;
    const btn = document.getElementById('addOrgBtn');
    const mapEl = document.getElementById('map');
    if (!btn || !mapEl) return;

    if (addMode) {
        btn.classList.add('active');
        mapEl.classList.add('add-mode');
        setStatus('Тапните по карте, где находится организация. Или найдите адрес через поиск.', 'active');
    } else {
        btn.classList.remove('active');
        mapEl.classList.remove('add-mode');
        setStatus(`Организаций: ${allOrganizations.length}`, 'active');
    }
}

function openOrgModal(lat, lon) {
    pendingCoords = { lat, lon };

    addMode = false;
    const addBtn = document.getElementById('addOrgBtn');
    const mapEl = document.getElementById('map');
    if (addBtn) addBtn.classList.remove('active');
    if (mapEl) mapEl.classList.remove('add-mode');

    const coordsEl = document.getElementById('orgCoords');
    if (coordsEl) coordsEl.textContent = `${lat.toFixed(6)}, ${lon.toFixed(6)}`;

    const nameEl = document.getElementById('orgName');
    const districtEl = document.getElementById('orgDistrict');
    const regionEl = document.getElementById('orgRegion');
    const typeEl = document.getElementById('orgType');

    if (nameEl) nameEl.value = '';
    if (districtEl) districtEl.value = '';
    if (regionEl) regionEl.value = '';
    if (typeEl) typeEl.value = '';

    const modal = document.getElementById('orgModal');
    if (modal) modal.classList.add('show');
    if (nameEl) setTimeout(() => nameEl.focus(), 100);
}

function closeOrgModal() {
    const modal = document.getElementById('orgModal');
    if (modal) modal.classList.remove('show');
    pendingCoords = null;
}

async function savePendingOrg() {
    if (!pendingCoords) return;

    const nameEl = document.getElementById('orgName');
    if (!nameEl) return;

    const name = nameEl.value.trim();
    if (!name) {
        alert('Введите название организации');
        nameEl.focus();
        return;
    }

    const newOrg = {
        name,
        district: document.getElementById('orgDistrict')?.value.trim() || null,
        region: document.getElementById('orgRegion')?.value.trim() || null,
        type: document.getElementById('orgType')?.value.trim() || null,
        latitude: pendingCoords.lat,
        longitude: pendingCoords.lon
    };

    const btn = document.getElementById('orgSave');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Сохранение...';
    }
    
    try {
        const saved = await saveOrganization(newOrg);
        allOrganizations.push(saved);
        renderOrgMarkers();
        renderListContent(document.getElementById('listSearchInput')?.value || '');
        closeOrgModal();
        setStatus(`Организация «${saved.name}» добавлена`, 'active');

        if (addressSearchMarker) {
            myMap.removeLayer(addressSearchMarker);
            addressSearchMarker = null;
        }
    } catch (e) {
        console.error('❌ Ошибка сохранения:', e);
        alert('Не удалось сохранить: ' + e.message);
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-check"></i> Сохранить';
        }
    }
}

// ============================================================
// СТАТУС
// ============================================================
function setStatus(text, type = '') {
    const box = document.getElementById('mapInfo');
    if (!box) return;
    const icons = {
        active: 'fa-check-circle',
        error: 'fa-exclamation-triangle',
        '': 'fa-info-circle'
    };
    box.className = 'map-info ' + type;
    box.innerHTML = `<i class="fas ${icons[type] || 'fa-info-circle'}"></i>
                     <div class="map-info-content">${text}</div>`;
}

// ============================================================
// ГЕОЛОКАЦИЯ
// ============================================================
function locateUser() {
    if (!navigator.geolocation) {
        setStatus('Геолокация не поддерживается', 'error');
        return;
    }

    setStatus('Определение местоположения...', '');

    navigator.geolocation.getCurrentPosition(
        (pos) => {
            const { latitude, longitude } = pos.coords;
            lastUserLat = latitude;
            lastUserLon = longitude;
            updateUserMarker(latitude, longitude);
            myMap.setView([latitude, longitude], 15, { animate: true });
            reverseGeocode(latitude, longitude);
            startWatching();
        },
        (err) => {
            let msg = err.message;
            if (err.code === 1) msg = 'Разрешение на геолокацию отклонено';
            if (err.code === 2) msg = 'Местоположение недоступно';
            if (err.code === 3) msg = 'Превышено время ожидания';
            setStatus(msg, 'error');
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
}

function updateUserMarker(lat, lon) {
    const icon = L.divIcon({
        className: 'user-location-marker',
        iconSize: [18, 18],
        iconAnchor: [9, 9]
    });

    if (userMarker) {
        userMarker.setLatLng([lat, lon]);
    } else {
        userMarker = L.marker([lat, lon], { icon, zIndexOffset: 1000 }).addTo(myMap);
        userMarker.bindPopup('<b>📍 Вы здесь</b>');
    }
}

function startWatching() {
    if (watchId !== null) return;

    watchId = navigator.geolocation.watchPosition(
        (pos) => {
            const { latitude, longitude } = pos.coords;
            lastUserLat = latitude;
            lastUserLon = longitude;
            updateUserMarker(latitude, longitude);

            const dLat = Math.abs(latitude - lastGeocodedLat);
            const dLon = Math.abs(longitude - lastGeocodedLon);
            if (!hasAddress || dLat > 0.0005 || dLon > 0.0005) {
                reverseGeocode(latitude, longitude);
            }
        },
        (err) => console.error('❌ Ошибка отслеживания:', err.message),
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
    );
}

async function reverseGeocode(lat, lon) {
    const dLat = Math.abs(lat - lastGeocodedLat);
    const dLon = Math.abs(lon - lastGeocodedLon);
    if (hasAddress && dLat < 0.0003 && dLon < 0.0003) {
        const box = document.getElementById('mapInfo');
        if (!box) return;
        box.className = 'map-info active';
        box.innerHTML = `
            <i class="fas fa-map-marker-alt"></i>
            <div class="map-info-content">
                <div class="map-info-addr">${lastAddress}</div>
                <div class="map-info-coords">
                    <span>Широта: <b>${lat.toFixed(6)}</b></span>
                    <span>Долгота: <b>${lon.toFixed(6)}</b></span>
                </div>
            </div>
        `;
        return;
    }

    try {
        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=ru&zoom=18`;
        const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        lastAddress = data.display_name || 'Адрес не определён';
        lastGeocodedLat = lat;
        lastGeocodedLon = lon;
        hasAddress = true;

        const box = document.getElementById('mapInfo');
        if (!box) return;
        box.className = 'map-info active';
        box.innerHTML = `
            <i class="fas fa-map-marker-alt"></i>
            <div class="map-info-content">
                <div class="map-info-addr">${lastAddress}</div>
                <div class="map-info-coords">
                    <span>Широта: <b>${lat.toFixed(6)}</b></span>
                    <span>Долгота: <b>${lon.toFixed(6)}</b></span>
                </div>
            </div>
        `;
    } catch (e) {
        setStatus('Адрес не определён', 'error');
    }
}

// ============================================================
// ОБНОВЛЕНИЕ
// ============================================================
async function refreshMap() {
    const btn = document.getElementById('refreshBtn');
    if (btn) btn.classList.add('loading');
    setStatus('Обновление...', '');

    allOrganizations = await fetchOrganizations();
    await fetchEquipmentCounts();
    try { renderOrgMarkers(); }
    catch (e) { console.error('❌ renderOrgMarkers упал:', e); }
    renderListContent(document.getElementById('listSearchInput')?.value || '');

    setStatus(`Организаций: ${allOrganizations.length}`, 'active');
    if (btn) btn.classList.remove('loading');
}

// ============================================================
// ИНИЦИАЛИЗАЦИЯ
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
    const name = localStorage.getItem('jixozmed_user_name') ||
                 localStorage.getItem('jixozmed_login') || '?';
    const initials = document.getElementById('sidebarUserInitials');
    if (initials) {
        const parts = name.trim().split(/\s+/);
        initials.textContent = parts.length >= 2
            ? parts[0][0].toUpperCase() + parts[1][0].toUpperCase()
            : name.substring(0, 2).toUpperCase();
    }

    initMap();

    allOrganizations = await fetchOrganizations();
    await fetchEquipmentCounts();
    try { renderOrgMarkers(); }
    catch (e) { console.error('❌ renderOrgMarkers упал:', e); }
    setStatus(`Организаций: ${allOrganizations.length}`, 'active');

    // ---------- Поиск адреса на карте ----------
    const searchInput = document.getElementById('searchInput');
    const searchClear = document.getElementById('searchClear');
    const suggestBox = document.getElementById('suggestBox');

    if (searchInput) {
        searchInput.addEventListener('input', function () {
            const val = this.value;
            if (searchClear) searchClear.classList.toggle('visible', val.length > 0);

            clearTimeout(addressSearchTimer);
            if (val.trim().length < 3) {
                addressSuggestList = [];
                if (suggestBox) suggestBox.classList.remove('show');
                return;
            }

            addressSearchTimer = setTimeout(async () => {
                addressSuggestList = await searchAddresses(val);
                showAddressSuggestions();
            }, 500);
        });

        searchInput.addEventListener('focus', function () {
            if (addressSuggestList.length && this.value.trim()) showAddressSuggestions();
        });

        searchInput.addEventListener('blur', hideAddressSuggestions);

        searchInput.addEventListener('keydown', function (e) {
            if (!suggestBox) return;
            const items = suggestBox.querySelectorAll('.suggest-item');
            if (!items.length) return;

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                addressSuggestIndex = Math.min(addressSuggestIndex + 1, items.length - 1);
                items.forEach((el, i) => el.classList.toggle('active', i === addressSuggestIndex));
                items[addressSuggestIndex]?.scrollIntoView({ block: 'nearest' });
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                addressSuggestIndex = Math.max(addressSuggestIndex - 1, -1);
                items.forEach((el, i) => el.classList.toggle('active', i === addressSuggestIndex));
            } else if (e.key === 'Enter' && addressSuggestIndex >= 0) {
                e.preventDefault();
                selectAddressSuggestion(addressSuggestIndex);
            } else if (e.key === 'Escape') {
                suggestBox.classList.remove('show');
            }
        });
    }

    if (searchClear && searchInput) {
        searchClear.addEventListener('mousedown', (e) => e.preventDefault());
        searchClear.addEventListener('click', function () {
            searchInput.value = '';
            searchClear.classList.remove('visible');
            addressSuggestList = [];
            if (suggestBox) suggestBox.classList.remove('show');
            if (addressSearchMarker) {
                myMap.removeLayer(addressSearchMarker);
                addressSearchMarker = null;
            }
            searchInput.focus();
            setStatus(`Организаций: ${allOrganizations.length}`, 'active');
        });
    }

    // ---------- Поиск в списке организаций ----------
    const listSearchInput = document.getElementById('listSearchInput');
    const listSearchClear = document.getElementById('listSearchClear');
    let listTimer;

    if (listSearchInput) {
        listSearchInput.addEventListener('input', function () {
            const val = this.value;
            if (listSearchClear) listSearchClear.classList.toggle('visible', val.length > 0);
            clearTimeout(listTimer);
            listTimer = setTimeout(() => renderListContent(val), 120);
        });
    }

    if (listSearchClear && listSearchInput) {
        listSearchClear.addEventListener('mousedown', (e) => e.preventDefault());
        listSearchClear.addEventListener('click', function () {
            listSearchInput.value = '';
            listSearchClear.classList.remove('visible');
            renderListContent('');
            listSearchInput.focus();
        });
    }

    // ---------- Кнопки ----------
    on('addOrgBtn', 'click', toggleAddMode);
    on('listBtn',    'click', openListModal);
    on('locateBtn',  'click', locateUser);
    on('refreshBtn', 'click', refreshMap);

    // Модалка добавления
    on('orgCancel', 'click', closeOrgModal);
    on('orgSave',   'click', savePendingOrg);
    on('orgModal',  'click', (e) => { if (e.target.id === 'orgModal') closeOrgModal(); });
    on('orgName',   'keydown', (e) => { if (e.key === 'Enter') savePendingOrg(); });

    // Модалка списка
    on('listClose', 'click', closeListModal);
    on('listModal', 'click', (e) => { if (e.target.id === 'listModal') closeListModal(); });

    // Модалка оборудования
    on('eqClose', 'click', closeEquipmentModal);
    on('equipmentModal', 'click', (e) => {
        if (e.target.id === 'equipmentModal') closeEquipmentModal();
    });

    const eqSearchInput = document.getElementById('eqSearchInput');
    const eqSearchClear = document.getElementById('eqSearchClear');

    if (eqSearchInput) {
        eqSearchInput.addEventListener('input', function () {
            const val = this.value;
            if (eqSearchClear) eqSearchClear.classList.toggle('visible', val.length > 0);
            clearTimeout(eqSearchTimer);
            eqSearchTimer = setTimeout(() => renderEquipmentList(val), 120);
        });
    }
    if (eqSearchClear && eqSearchInput) {
        eqSearchClear.addEventListener('mousedown', (e) => e.preventDefault());
        eqSearchClear.addEventListener('click', function () {
            eqSearchInput.value = '';
            eqSearchClear.classList.remove('visible');
            renderEquipmentList('');
            eqSearchInput.focus();
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeOrgModal();
            closeListModal();
            closeEquipmentModal();
            if (suggestBox) suggestBox.classList.remove('show');
        }
    });
});

window.addEventListener('beforeunload', () => {
    if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
    }
});



// ============================================================
// АКТ СПИСАНИЯ — МОДАЛКА
// ============================================================


window.onWriteOffClick = function(id) {
    console.log('🖱 CLICK write-off, id =', id);
    try {
        openWriteOffForm(id);
        console.log('✅ openWriteOffForm отработала без исключений');
    } catch (e) {
        console.error('❌ openWriteOffForm упала:', e && e.message, e && e.stack);
    }
};


function openWriteOffForm(equipmentId) {
    console.log('📝 openWriteOffForm: id =', equipmentId,
                '| currentEquipmentOrg =', currentEquipmentOrg && currentEquipmentOrg.name,
                '| list length =', currentEquipmentList.length);

    const item = currentEquipmentList.find(x => String(x.id) === String(equipmentId));
    if (!item) { console.warn('⚠️ Не найдено:', equipmentId); return; }
    if (!currentEquipmentOrg) { alert('Откройте карточку организации'); return; }

    let modal = document.getElementById('writeoffFormModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'writeoffFormModal';
        modal.className = 'org-modal';
        modal.innerHTML = '<div class="org-modal-box" id="writeoffFormBox"></div>';
        modal.addEventListener('click', (e) => {
            if (e.target.id === 'writeoffFormModal') closeWriteOffForm();
        });
        document.body.appendChild(modal);
    }

    const today = new Date().toISOString().slice(0, 10);

    document.getElementById('writeoffFormBox').innerHTML = `
        <button class="org-modal-close" onclick="closeWriteOffForm()">
            <i class="fas fa-times"></i>
        </button>
        <div class="org-modal-header">
            <div class="org-modal-icon"><i class="fas fa-file-signature"></i></div>
            <div><h3>Акт о списании</h3><p>${item.name || '—'}</p></div>
        </div>
        <div style="padding:16px; display:grid; gap:12px; max-height:60vh; overflow-y:auto;">
            <label><span style="font-size:12px; color:#7d92ab;">Shahar</span>
                <input type="text" id="wfCity"
                       value="${(currentEquipmentOrg && currentEquipmentOrg.name) ? currentEquipmentOrg.name : ''}"
                       style="width:100%; padding:8px; margin-top:4px;"></label>
            <label><span style="font-size:12px; color:#7d92ab;">Tekshiruv sanasi</span>
                <input type="date" id="wfDate" value="${today}" style="width:100%; padding:8px; margin-top:4px;"></label>
            <label><span style="font-size:12px; color:#7d92ab;">Zavod raqami</span>
                <input type="text" id="wfFactory" value="${item.factory_number || ''}" style="width:100%; padding:8px; margin-top:4px;"></label>
            <label><span style="font-size:12px; color:#7d92ab;">Chiqarilgan yili</span>
                <input type="number" id="wfYear" value="${item.year_manufactured || ''}" style="width:100%; padding:8px; margin-top:4px;"></label>
        </div>
        <div class="org-modal-actions">
            <button class="org-action-btn primary" onclick='generateWriteOffDoc(${JSON.stringify(item.id)})'>
                <i class="fas fa-file-word"></i> Сформировать акт
            </button>
            <button class="org-action-btn" onclick="closeWriteOffForm()">Отмена</button>
        </div>
    `;
    modal.classList.add('show');
}

function closeWriteOffForm() {
    const m = document.getElementById('writeoffFormModal');
    if (m) m.classList.remove('show');
}

function formatUzDate(isoDate) {
    if (!isoDate) return '';
    const months = ['yanvar','fevral','mart','aprel','may','iyun',
                    'iyul','avgust','sentabr','oktabr','noyabr','dekabr'];
    const [y, m, d] = isoDate.split('-');
    return `${Number(d)} ${months[Number(m) - 1]} ${y}`;
}

async function generateWriteOffDoc(equipmentId) {
    const item = currentEquipmentList.find(x => String(x.id) === String(equipmentId));
    const org = currentEquipmentOrg;
    if (!item || !org) return;

    if (typeof window.docxtemplater !== 'function') {
        alert('Библиотека docxtemplater не загружена — проверьте lib/');
        return;
    }

    const data = {
        city: (document.getElementById('wfCity').value.trim()) || (org.name || ''),
        inspection_date:    formatUzDate(document.getElementById('wfDate').value),
        org_name:           org.name || '',
        org_stir:           org.stir || '',
        org_address:        org.address || '',
        org_head:           org.head_name || '',
        equipment_name:     item.name || '',
        equipment_model:    item.model || '',
        factory_number:     document.getElementById('wfFactory').value.trim() || '—',
        year_manufactured:  document.getElementById('wfYear').value || '—',
        inventory_number:   item.inventory_number || '',
        location_address:   org.address || org.name || '',
    };

    try {
        const templateUrl = `${window.SUPABASE_URL}/storage/v1/object/public/templates/writeoff_template.docx`;
        console.log('📥 Шаблон:', templateUrl);

        const res = await fetch(templateUrl);
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const buf = await res.arrayBuffer();

        const zip = new window.PizZip(buf);
        const doc = new window.docxtemplater(zip, { paragraphLoop: true, linebreaks: true });
        doc.render(data);

        const out = doc.getZip().generate({
            type: 'blob',
            mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        });

        const safeOrg = (org.name || 'org').replace(/[\\/:*?"<>|]/g, '_');
        const safeInv = String(item.inventory_number || item.id).replace(/[\\/:*?"<>|]/g, '_');
        const filename = `Akt_spisaniya_${safeInv}_${safeOrg}.docx`;

        await saveDocxFile(out, filename);
        console.log('✅ Акт сформирован:', filename);
        closeWriteOffForm();
    } catch (e) {
        console.error('❌ Ошибка:', e);
        alert('Не удалось: ' + e.message);
    }
}

async function saveDocxFile(blob, filename) {
    if (window.AndroidBridge && typeof window.AndroidBridge.saveBase64File === 'function') {
        const b64 = await blobToBase64(blob);
        window.AndroidBridge.saveBase64File(b64, filename);
        return;
    }
    console.warn('⚠️ saveBase64File недоступен, fallback');
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onloadend = () => resolve(r.result.substring(r.result.indexOf(',') + 1));
        r.onerror = reject;
        r.readAsDataURL(blob);
    });
}