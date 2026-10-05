// ============================================================
// СОСТОЯНИЕ
// ============================================================
let allOrganizations = [];
let currentSearch = '';
let currentRegion = '';
let equipmentCounts = {};   // { orgId: count }

// Ссылка на шаблон акта списания в Supabase Storage
const TEMPLATE_WRITEOFF_URL =
    `${window.SUPABASE_URL}/storage/v1/object/public/templates/writeoff.docx`;

// Локальный fallback на случай ошибки Supabase
const LOCAL_FALLBACK = [
    { name: 'Amudaryo tuman tibbiyot birlashmasi',  district: 'Amudaryo',  region: "Qoraqalpog'iston", type: 'Tibbiyot birlashmasi' },
    { name: 'Beruniy tibbiyot birlashmasi',         district: 'Beruniy',   region: "Qoraqalpog'iston", type: 'Tibbiyot birlashmasi' },
    { name: "To'rtkul tuman tibbiyot birlashmasi",  district: "To'rtkul",  region: "Qoraqalpog'iston", type: 'Tibbiyot birlashmasi' },
    { name: 'Ellikkala tuman tibbiyot birlashmasi', district: 'Ellikkala', region: "Qoraqalpog'iston", type: 'Tibbiyot birlashmasi' },
    { name: 'Kegeyli tuman tibbiyot birlashmasi',   district: 'Kegeyli',   region: "Qoraqalpog'iston", type: 'Tibbiyot birlashmasi' },
    { name: 'Bozatov tuman tibbiyot birlashmasi',   district: 'Bozatov',   region: "Qoraqalpog'iston", type: 'Tibbiyot birlashmasi' },
    { name: 'Nukus tuman tibbiyot birlashmasi',     district: 'Nukus',     region: "Qoraqalpog'iston", type: 'Tibbiyot birlashmasi' },
    { name: 'Taxiatosh tuman tibbiyot birlashmasi', district: 'Taxiatosh', region: "Qoraqalpog'iston", type: 'Tibbiyot birlashmasi' },
    { name: "Xo'jayli tuman tibbiyot birlashmasi",  district: "Xo'jayli",  region: "Qoraqalpog'iston", type: 'Tibbiyot birlashmasi' }
];

// ============================================================
// ЗАГРУЗКА ИЗ SUPABASE
// ============================================================
async function fetchOrganizations() {
    try {
        const url = `${SUPABASE_URL}/rest/v1/organizations?select=*&order=district.asc`;
        const res = await fetch(url, {
            headers: {
                apikey: SUPABASE_ANON_KEY,
                Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        if (!res.ok) {
            const text = await res.text();
            console.error('❌ Supabase error:', res.status, text);
            throw new Error(`HTTP ${res.status}`);
        }

        const data = await res.json();
        console.log('✅ Загружено организаций:', data.length);
        return data;

    } catch (e) {
        console.warn('⚠️ Fallback на локальный справочник:', e.message);
        return LOCAL_FALLBACK;
    }
}

async function fetchEquipmentCounts() {
    try {
        const res = await fetch(
            `${SUPABASE_URL}/rest/v1/rpc/equipment_count_by_org`,
            {
                method: 'POST',
                headers: {
                    apikey: SUPABASE_ANON_KEY,
                    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: '{}'
            }
        );
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const rows = await res.json();
        const map = {};
        rows.forEach(r => { map[r.organization_id] = Number(r.cnt); });
        console.log('📦 Счётчики загружены:', Object.keys(map).length);
        return map;
    } catch (e) {
        console.warn('⚠️ Счётчики не загрузились:', e.message);
        return {};
    }
}

// ============================================================
// ЗАГРУЗКА И ОТРИСОВКА
// ============================================================
async function loadAndRender() {
    const refreshBtn = document.getElementById('refreshBtn');
    const loadingBox = document.getElementById('loadingBox');
    const groupedBox = document.getElementById('groupedBox');
    const statsBox = document.getElementById('statsBox');

    refreshBtn.classList.add('loading');
    loadingBox.style.display = 'block';
    groupedBox.style.display = 'none';
    statsBox.style.display = 'none';

    allOrganizations = await fetchOrganizations();
    equipmentCounts = await fetchEquipmentCounts();

    console.log('📊 Загружено в allOrganizations:', allOrganizations.length);
    if (allOrganizations.length > 0) {
        console.log('📋 Пример первой записи:', JSON.stringify(allOrganizations[0]));
    }

    refreshBtn.classList.remove('loading');
    loadingBox.style.display = 'none';

    if (allOrganizations.length === 0) {
        groupedBox.innerHTML = `
            <div class="classifier-empty">
                <i class="fas fa-database"></i>
                Не удалось загрузить справочник.<br>
                Проверьте интернет и нажмите «Обновить».
            </div>`;
        groupedBox.style.display = 'block';
        return;
    }

    fillRegionFilter();
    renderStats();
    renderGroups();

    groupedBox.style.display = 'block';
    statsBox.style.display = 'grid';
}

// ============================================================
// ФИЛЬТР ПО РЕГИОНАМ
// ============================================================
function fillRegionFilter() {
    const select = document.getElementById('regionFilter');
    const regions = [...new Set(allOrganizations.map(x => x.region).filter(Boolean))].sort();

    select.innerHTML = '<option value="">Все регионы</option>';
    regions.forEach(r => {
        const opt = document.createElement('option');
        opt.value = r;
        opt.textContent = r;
        select.appendChild(opt);
    });
}

// ============================================================
// СТАТИСТИКА
// ============================================================
function renderStats() {
    const regionsCount = new Set(allOrganizations.map(x => x.region).filter(Boolean)).size;
    const districtsCount = new Set(allOrganizations.map(x => x.district).filter(Boolean)).size;
    const totalEquipment = Object.values(equipmentCounts).reduce((a, b) => a + b, 0);

    document.getElementById('statsBox').innerHTML = `
        <div class="stat-card">
            <div class="stat-number">${allOrganizations.length}</div>
            <div class="stat-label">Всего организаций</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${regionsCount}</div>
            <div class="stat-label">Регионов</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${districtsCount}</div>
            <div class="stat-label">Районов</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${totalEquipment}</div>
            <div class="stat-label">Единиц оборудования</div>
        </div>
    `;
}

// ============================================================
// ОТРИСОВКА ГРУПП
// ============================================================
function renderGroups() {
    const q = (currentSearch || '').toLowerCase().trim();
    console.log('🔍 Поиск:', q, '| Регион:', currentRegion, '| Всего:', allOrganizations.length);

    let filtered = allOrganizations;

    if (currentRegion) {
        filtered = filtered.filter(x => x.region === currentRegion);
    }

    if (q) {
        filtered = filtered.filter(x => {
            const n = (x.name || '').toLowerCase();
            const d = (x.district || '').toLowerCase();
            const r = (x.region || '').toLowerCase();
            const t = (x.type || '').toLowerCase();
            return n.includes(q) || d.includes(q) || r.includes(q) || t.includes(q);
        });
    }

    console.log('✅ После фильтрации:', filtered.length);

    if (filtered.length === 0) {
        document.getElementById('groupedBox').innerHTML = `
            <div class="classifier-empty">
                <i class="fas fa-search"></i>
                Ничего не найдено по запросу.
            </div>`;
        return;
    }

    const grouped = {};
    filtered.forEach(item => {
        const r = item.region || 'Без региона';
        if (!grouped[r]) grouped[r] = [];
        grouped[r].push(item);
    });

    let html = '';
    Object.keys(grouped).sort().forEach(region => {
        const list = grouped[region];
        const openClass = q ? ' open' : '';

        html += `
            <div class="group-card${openClass}" onclick="toggleGroup(event, this)">
                <div class="group-header">
                    <div class="group-title">
                        <i class="fas fa-map-marker-alt"></i>
                        ${region}
                    </div>
                    <div style="display:flex; align-items:center; gap:10px;">
                        <span class="group-count">${list.length}</span>
                        <i class="fas fa-chevron-down group-toggle"></i>
                    </div>
                </div>
                <div class="group-body">
        `;

        list.sort((a, b) => (a.district || '').localeCompare(b.district || '')).forEach(item => {
            const eqCount = equipmentCounts[item.id] || 0;
            html += `
                <div class="point-item org-clickable" onclick="openOrgCard(${item.id}); event.stopPropagation();">
                    <div class="point-name">
                        <i class="fas fa-building"></i> ${item.name}
                    </div>
                    <div class="point-keys">
                        <span class="key-chip">${item.district || ''}</span>
                        ${item.type ? `<span class="key-chip">${item.type}</span>` : ''}
                        <span class="key-chip key-chip-eq">${eqCount} шт.</span>
                    </div>
                    <i class="fas fa-chevron-right org-item-arrow"></i>
                </div>
            `;
        });

        html += `</div></div>`;
    });

    document.getElementById('groupedBox').innerHTML = html;
}

// ============================================================
// РАСКРЫТИЕ ГРУППЫ
// ============================================================
function toggleGroup(event, el) {
    // Не сворачиваем группу, если клик был по организации
    if (event && event.target.closest('.org-clickable')) return;
    el.classList.toggle('open');
}

// ============================================================
// КАРТОЧКА ОРГАНИЗАЦИИ — МОДАЛКА
// ============================================================
function openOrgCard(id) {
    const org = allOrganizations.find(o => o.id === id);
    if (!org) {
        console.warn('⚠️ Организация не найдена:', id);
        return;
    }

    const eqCount = equipmentCounts[org.id] || 0;

    // Модалка создаётся один раз
    let modal = document.getElementById('orgCardModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'orgCardModal';
        modal.className = 'org-modal';
        modal.innerHTML = '<div class="org-modal-box" id="orgCardBox"></div>';
        modal.addEventListener('click', (e) => {
            if (e.target.id === 'orgCardModal') closeOrgCard();
        });
        document.body.appendChild(modal);
    }

    const box = document.getElementById('orgCardBox');
    box.innerHTML = `
        <button class="org-modal-close" onclick="closeOrgCard()">
            <i class="fas fa-times"></i>
        </button>

        <div class="org-modal-header">
            <div class="org-modal-icon">
                <i class="fas fa-hospital"></i>
            </div>
            <div>
                <h3>${org.name || '—'}</h3>
                <p>${org.type || '—'}</p>
            </div>
        </div>

        <div class="org-modal-grid">
            <div class="org-info-row">
                <span class="org-info-label">Район</span>
                <span class="org-info-value">${org.district || '—'}</span>
            </div>
            <div class="org-info-row">
                <span class="org-info-label">Регион</span>
                <span class="org-info-value">${org.region || '—'}</span>
            </div>
            <div class="org-info-row">
                <span class="org-info-label">Тип</span>
                <span class="org-info-value">${org.type || '—'}</span>
            </div>
            <div class="org-info-row">
                <span class="org-info-label">ID</span>
                <span class="org-info-value mono">${org.id}</span>
            </div>
            <div class="org-info-row">
                <span class="org-info-label">Координаты</span>
                <span class="org-info-value mono">
                    ${org.latitude && org.longitude
                        ? Number(org.latitude).toFixed(6) + ', ' + Number(org.longitude).toFixed(6)
                        : '—'}
                </span>
            </div>
            <div class="org-info-row">
                <span class="org-info-label">Оборудование</span>
                <span class="org-info-value accent">${eqCount} шт.</span>
            </div>
        </div>

        <div class="org-modal-actions">
            <button class="org-action-btn primary" onclick="downloadWriteoffForOrg(${org.id})">
                <i class="fas fa-file-word"></i> Скачать акт списания
            </button>
            <button class="org-action-btn" onclick="closeOrgCard()">Закрыть</button>
        </div>
    `;

    modal.classList.add('show');
}

function closeOrgCard() {
    const modal = document.getElementById('orgCardModal');
    if (modal) modal.classList.remove('show');
}

// ============================================================
// СКАЧИВАНИЕ ШАБЛОНА ДЛЯ КОНКРЕТНОЙ ОРГАНИЗАЦИИ
// ============================================================
function downloadWriteoffForOrg(orgId) {
    const org = allOrganizations.find(o => o.id === orgId);
    if (!org) return;

    const safeName = (org.name || 'без_организации').replace(/[\\/:*?"<>|]/g, '_');
    const filename = `Акт_списания_${safeName}.docx`;
    const url = TEMPLATE_WRITEOFF_URL;   // ← БЕЗ ?filename=

    console.log('⬇️ Скачиваю шаблон для', org.name);
    console.log('   URL:', url);
    console.log('   Сохранить как:', filename);


    console.log('🔎 AndroidBridge:', typeof window.AndroidBridge);
    console.log('🔎 downloadFile:', typeof (window.AndroidBridge && window.AndroidBridge.downloadFile));

    // Через нативный мост — без WebView-навигации, без Invalid signature
    if (window.AndroidBridge && window.AndroidBridge.downloadFile) {
        window.AndroidBridge.downloadFile(url, filename);
        return;
    }

    // Fallback для браузера
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

// ============================================================
// ИНИЦИАЛИЗАЦИЯ
// ============================================================
document.addEventListener('DOMContentLoaded', function () {
    console.log('✅ Организации загружены');

    const name = localStorage.getItem('jixozmed_user_name') ||
                 localStorage.getItem('jixozmed_login') || '?';
    const initials = document.getElementById('sidebarUserInitials');
    if (initials) {
        const parts = name.trim().split(/\s+/);
        initials.textContent = parts.length >= 2
            ? parts[0][0].toUpperCase() + parts[1][0].toUpperCase()
            : name.substring(0, 2).toUpperCase();
    }

    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        let timer;
        searchInput.addEventListener('input', function () {
            clearTimeout(timer);
            timer = setTimeout(() => {
                currentSearch = this.value;
                renderGroups();
            }, 200);
        });
        console.log('✅ Поиск подключён');
    }

    const regionFilter = document.getElementById('regionFilter');
    if (regionFilter) {
        regionFilter.addEventListener('change', function () {
            currentRegion = this.value;
            renderGroups();
        });
    }

    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) refreshBtn.addEventListener('click', loadAndRender);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeOrgCard();
    });

    loadAndRender();
});