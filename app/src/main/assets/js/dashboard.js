console.log('✅ Дашборд загружен');

// Аватар в сайдбаре
(function() {
    const name = localStorage.getItem('jixozmed_user_name') || localStorage.getItem('jixozmed_login') || '?';
    const initials = document.getElementById('sidebarUserInitials');
    if (initials) {
        const parts = name.trim().split(/\s+/);
        initials.textContent = parts.length >= 2
            ? parts[0][0].toUpperCase() + parts[1][0].toUpperCase()
            : name.substring(0, 2).toUpperCase();
    }
    const userBtn = document.getElementById('sidebarUser');
    if (userBtn) {
        const colors = ['#1e5ec9', '#9b59b6', '#e74c3c', '#2ecc71', '#f39c12'];
        let sum = 0;
        for (let i = 0; i < name.length; i++) sum += name.charCodeAt(i);
        userBtn.style.background = colors[sum % colors.length];
    }
})();

// ============================================================
// ИНТЕРАКТИВНЫЙ ДАШБОРД ОБОРУДОВАНИЯ
// ============================================================

let allDevices = [];
let activeConditionFilter = 'all'; // 'all', 'working', 'repair', 'broken'
let currentPage = 1;
const pageSize = 15;

document.addEventListener('DOMContentLoaded', function() {
    initDashboard();
});

async function initDashboard() {
    await loadDevicesData();
    setupEventListeners();
    populateInitialFilters();
    updateDashboard();
}

// Загрузка данных из Supabase / Кэша / CSV Fallback
async function loadDevicesData() {
    console.log('🔄 Загрузка данных оборудования для дашборда...');
    let loaded = [];

    if (window.SUPABASE_URL && window.SUPABASE_KEY) {
        try {
            const res = await fetch(`${window.SUPABASE_URL}/rest/v1/equipment_items?select=*&order=id.asc`, {
                headers: {
                    'apikey': window.SUPABASE_KEY,
                    'Authorization': `Bearer ${window.SUPABASE_KEY}`
                }
            });
            if (res.ok) {
                const data = await res.json();
                if (data && data.length > 0) {
                    loaded = data;
                    console.log('✅ Данные дашборда получены из Supabase:', loaded.length);
                    try {
                        localStorage.setItem('jixozmed_equipment_items_cache', JSON.stringify(loaded));
                    } catch (e) {
                        console.warn('Не удалось сохранить кэш:', e);
                    }
                }
            }
        } catch (e) {
            console.warn('⚠️ Запрос к Supabase не удался, используем кэш/локальные данные:', e);
        }
    }

    if (loaded.length === 0) {
        try {
            const cached = localStorage.getItem('jixozmed_equipment_items_cache');
            if (cached) {
                loaded = JSON.parse(cached);
                console.log('📦 Данные дашборда загружены из localStorage:', loaded.length);
            }
        } catch (e) {
            console.warn('Не удалось прочитать кэш:', e);
        }
    }

    if (loaded.length === 0 && window.EQUIPMENT_CSV_ROWS) {
        loaded = window.EQUIPMENT_CSV_ROWS;
        console.log('📄 Данные дашборда загружены из equipment_rows.js:', loaded.length);
    }

    allDevices = loaded || [];
}

function getConditionCategory(cond) {
    if (!cond) return 'working';
    const c = String(cond).toLowerCase();
    if (c.includes('ремонт') || c.includes('требует')) return 'repair';
    if (c.includes('непригод') || c.includes('списан') || c.includes('причина')) return 'broken';
    if (c.includes('исправен') || c.includes('рабоч')) return 'working';
    if (c.includes('неисправен')) return 'broken';
    return 'working';
}

function formatNumber(num) {
    return Number(num || 0).toLocaleString('ru-RU');
}

function populateSelectOptions(selectId, optionsSet, defaultText) {
    const select = document.getElementById(selectId);
    if (!select) return;

    const currentValue = select.value;
    select.innerHTML = `<option value="">${defaultText}</option>`;

    const sortedOptions = Array.from(optionsSet).filter(Boolean).sort((a, b) => String(a).localeCompare(String(b), 'ru'));
    sortedOptions.forEach(opt => {
        const optionEl = document.createElement('option');
        optionEl.value = opt;
        optionEl.textContent = opt;
        select.appendChild(optionEl);
    });

    if (currentValue && optionsSet.has(currentValue)) {
        select.value = currentValue;
    } else {
        select.value = "";
    }
}

function populateInitialFilters() {
    const districts = new Set();
    const orgs = new Set();
    const classifications = new Set();
    const sections = new Set();
    const points = new Set();

    allDevices.forEach(d => {
        const district = d.district || d.region;
        const org = d.organization_name || d.organization;
        const cls = d.classification;
        const sec = d.classification_section || d.section;
        const pt = d.classification_point || d.point;

        if (district) districts.add(district);
        if (org) orgs.add(org);
        if (cls) classifications.add(cls);
        if (sec) sections.add(sec);
        if (pt) points.add(pt);
    });

    populateSelectOptions('filterDistrict', districts, 'Все районы');
    populateSelectOptions('filterOrganization', orgs, 'Все организации');
    populateSelectOptions('filterClassification', classifications, 'Вся классификация');
    populateSelectOptions('filterSection', sections, 'Все разделы');
    populateSelectOptions('filterPoint', points, 'Все пункты');
}

function updateDependentFilters(filteredList) {
    const selectedDistrict = document.getElementById('filterDistrict')?.value;
    const selectedOrg = document.getElementById('filterOrganization')?.value;
    const selectedCls = document.getElementById('filterClassification')?.value;
    const selectedSec = document.getElementById('filterSection')?.value;
    const selectedPt = document.getElementById('filterPoint')?.value;

    const districts = new Set();
    const orgs = new Set();
    const classifications = new Set();
    const sections = new Set();
    const points = new Set();

    filteredList.forEach(d => {
        const district = d.district || d.region;
        const org = d.organization_name || d.organization;
        const cls = d.classification;
        const sec = d.classification_section || d.section;
        const pt = d.classification_point || d.point;

        if (district) districts.add(district);
        if (org) orgs.add(org);
        if (cls) classifications.add(cls);
        if (sec) sections.add(sec);
        if (pt) points.add(pt);
    });

    if (!selectedDistrict) populateSelectOptions('filterDistrict', districts, 'Все районы');
    if (!selectedOrg) populateSelectOptions('filterOrganization', orgs, 'Все организации');
    if (!selectedCls) populateSelectOptions('filterClassification', classifications, 'Вся классификация');
    if (!selectedSec) populateSelectOptions('filterSection', sections, 'Все разделы');
    if (!selectedPt) populateSelectOptions('filterPoint', points, 'Все пункты');
}

function updateDashboard() {
    const selectedDistrict = document.getElementById('filterDistrict')?.value || '';
    const selectedOrg = document.getElementById('filterOrganization')?.value || '';
    const selectedCls = document.getElementById('filterClassification')?.value || '';
    const selectedSec = document.getElementById('filterSection')?.value || '';
    const selectedPt = document.getElementById('filterPoint')?.value || '';
    const searchQuery = (document.getElementById('dashSearchInput')?.value || '').toLowerCase().trim();

    // 1. Фильтрация данных по выпадающим спискам и поиску (для подсчёта всех карточек статистики)
    const filteredBase = allDevices.filter(d => {
        const district = d.district || d.region || '';
        const org = d.organization_name || d.organization || '';
        const cls = d.classification || '';
        const sec = d.classification_section || d.section || '';
        const pt = d.classification_point || d.point || '';

        if (selectedDistrict && district !== selectedDistrict) return false;
        if (selectedOrg && org !== selectedOrg) return false;
        if (selectedCls && cls !== selectedCls) return false;
        if (selectedSec && sec !== selectedSec) return false;
        if (selectedPt && pt !== selectedPt) return false;

        if (searchQuery) {
            const name = (d.name || d.equipment_name || '').toLowerCase();
            const inv = (d.inventory_number || d.inventory || d.id || '').toLowerCase();
            const model = (d.model || '').toLowerCase();
            if (!name.includes(searchQuery) && !inv.includes(searchQuery) && !model.includes(searchQuery)) {
                return false;
            }
        }

        return true;
    });

    // Подсчёт статистики для текущего набора фильтров
    let countTotal = filteredBase.length;
    let countWorking = 0;
    let countRepair = 0;
    let countBroken = 0;

    filteredBase.forEach(d => {
        const cat = getConditionCategory(d.condition);
        if (cat === 'working') countWorking++;
        else if (cat === 'repair') countRepair++;
        else if (cat === 'broken') countBroken++;
    });

    // Обновление цифр на карточках
    const totalEl = document.getElementById('statTotalNumber');
    const workingEl = document.getElementById('statWorkingNumber');
    const repairEl = document.getElementById('statRepairNumber');
    const brokenEl = document.getElementById('statBrokenNumber');

    if (totalEl) totalEl.textContent = formatNumber(countTotal);
    if (workingEl) workingEl.textContent = formatNumber(countWorking);
    if (repairEl) repairEl.textContent = formatNumber(countRepair);
    if (brokenEl) brokenEl.textContent = formatNumber(countBroken);

    // 2. Фильтрация списка для таблицы по активной карточке (если выбрана)
    let tableList = filteredBase;
    if (activeConditionFilter !== 'all') {
        tableList = filteredBase.filter(d => getConditionCategory(d.condition) === activeConditionFilter);
    }

    // Обновляем взаимозависимые фильтры
    updateDependentFilters(filteredBase);

    // Отрисовка таблицы
    renderDashboardTable(tableList);
}

function renderDashboardTable(list) {
    const countEl = document.getElementById('dashTableCount');
    if (countEl) countEl.textContent = formatNumber(list.length);

    const tbody = document.getElementById('dashTableBody');
    if (!tbody) return;

    if (list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="padding: 24px; text-align: center; color: #7d92ab;">Оборудование не найдено</td></tr>`;
        const pag = document.getElementById('dashPagination');
        if (pag) pag.innerHTML = '';
        return;
    }

    const totalPages = Math.ceil(list.length / pageSize);
    if (currentPage > totalPages) currentPage = 1;

    const startIdx = (currentPage - 1) * pageSize;
    const endIdx = Math.min(startIdx + pageSize, list.length);
    const pageItems = list.slice(startIdx, endIdx);

    let html = '';
    pageItems.forEach(item => {
        const inv = item.inventory_number || item.inventory || item.id || '—';
        const name = item.name || item.equipment_name || '—';
        const model = item.model || '—';
        const org = item.organization_name || item.organization || '—';
        const district = item.district || item.region || '—';
        const condition = item.condition || 'Исправен (в рабочем состоянии)';
        const cat = getConditionCategory(condition);

        let badgeStyle = '';
        if (cat === 'working') {
            badgeStyle = 'background: rgba(46, 204, 113, 0.15); color: #2ecc71; border: 1px solid rgba(46, 204, 113, 0.3);';
        } else if (cat === 'repair') {
            badgeStyle = 'background: rgba(241, 196, 15, 0.15); color: #f1c40f; border: 1px solid rgba(241, 196, 15, 0.3);';
        } else {
            badgeStyle = 'background: rgba(231, 76, 60, 0.15); color: #e74c3c; border: 1px solid rgba(231, 76, 60, 0.3);';
        }

        html += `
            <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.05); transition: 0.15s;" onmouseover="this.style.background='rgba(255,255,255,0.03)'" onmouseout="this.style.background='transparent'">
                <td style="padding: 12px 10px; font-weight: 600; color: #4d94e8;">${inv}</td>
                <td style="padding: 12px 10px; max-width: 280px; font-weight: 500;">${name}</td>
                <td style="padding: 12px 10px; color: #94a9c2;">${model}</td>
                <td style="padding: 12px 10px; max-width: 220px; color: #d0dbe7;">${org}</td>
                <td style="padding: 12px 10px; color: #94a9c2;">${district}</td>
                <td style="padding: 12px 10px;">
                    <span style="display: inline-block; padding: 4px 10px; border-radius: 8px; font-size: 12px; font-weight: 600; ${badgeStyle}">
                        ${condition}
                    </span>
                </td>
            </tr>
        `;
    });

    tbody.innerHTML = html;

    // Пагинация
    const pag = document.getElementById('dashPagination');
    if (pag) {
        pag.innerHTML = `
            <div>Показано ${startIdx + 1}–${endIdx} из ${list.length}</div>
            <div style="display: flex; gap: 6px;">
                <button id="dashPrevBtn" ${currentPage <= 1 ? 'disabled style="opacity:0.4; cursor:not-allowed;"' : 'style="cursor:pointer;"'} class="dash-page-btn">
                    <i class="fas fa-chevron-left"></i> Назад
                </button>
                <span style="padding: 6px 12px; align-self: center;">Страница ${currentPage} из ${totalPages}</span>
                <button id="dashNextBtn" ${currentPage >= totalPages ? 'disabled style="opacity:0.4; cursor:not-allowed;"' : 'style="cursor:pointer;"'} class="dash-page-btn">
                    Вперёд <i class="fas fa-chevron-right"></i>
                </button>
            </div>
        `;

        document.getElementById('dashPrevBtn')?.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                renderDashboardTable(list);
            }
        });

        document.getElementById('dashNextBtn')?.addEventListener('click', () => {
            if (currentPage < totalPages) {
                currentPage++;
                renderDashboardTable(list);
            }
        });
    }
}

function highlightActiveCard() {
    ['cardTotal', 'cardWorking', 'cardRepair', 'cardBroken'].forEach(id => {
        const card = document.getElementById(id);
        if (card) {
            card.style.outline = 'none';
            card.style.boxShadow = 'none';
        }
    });

    let activeCardId = 'cardTotal';
    if (activeConditionFilter === 'working') activeCardId = 'cardWorking';
    else if (activeConditionFilter === 'repair') activeCardId = 'cardRepair';
    else if (activeConditionFilter === 'broken') activeCardId = 'cardBroken';

    const activeCard = document.getElementById(activeCardId);
    if (activeCard) {
        activeCard.style.outline = '2px solid #4d94e8';
        activeCard.style.boxShadow = '0 0 15px rgba(77, 148, 232, 0.3)';
    }
}

function setupEventListeners() {
    ['filterDistrict', 'filterOrganization', 'filterClassification', 'filterSection', 'filterPoint'].forEach(id => {
        const select = document.getElementById(id);
        if (select) {
            select.addEventListener('change', () => {
                currentPage = 1;
                updateDashboard();
            });
        }
    });

    const searchInput = document.getElementById('dashSearchInput');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            currentPage = 1;
            updateDashboard();
        });
    }

    const resetBtn = document.getElementById('dashResetFilters');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            ['filterDistrict', 'filterOrganization', 'filterClassification', 'filterSection', 'filterPoint'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.value = '';
            });
            const searchInput = document.getElementById('dashSearchInput');
            if (searchInput) searchInput.value = '';
            activeConditionFilter = 'all';
            currentPage = 1;
            highlightActiveCard();
            populateInitialFilters();
            updateDashboard();
        });
    }

    // Клик по карточкам статистики для фильтрации
    document.getElementById('cardTotal')?.addEventListener('click', () => {
        activeConditionFilter = 'all';
        currentPage = 1;
        highlightActiveCard();
        updateDashboard();
    });

    document.getElementById('cardWorking')?.addEventListener('click', () => {
        activeConditionFilter = activeConditionFilter === 'working' ? 'all' : 'working';
        currentPage = 1;
        highlightActiveCard();
        updateDashboard();
    });

    document.getElementById('cardRepair')?.addEventListener('click', () => {
        activeConditionFilter = activeConditionFilter === 'repair' ? 'all' : 'repair';
        currentPage = 1;
        highlightActiveCard();
        updateDashboard();
    });

    document.getElementById('cardBroken')?.addEventListener('click', () => {
        activeConditionFilter = activeConditionFilter === 'broken' ? 'all' : 'broken';
        currentPage = 1;
        highlightActiveCard();
        updateDashboard();
    });

    highlightActiveCard();
}
