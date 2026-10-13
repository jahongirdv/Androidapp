// ============================================================
// СОСТОЯНИЕ
// ============================================================
let allEquipment = [];
let currentSearch = '';
let currentSection = '';

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

    allEquipment = await fetchEquipment();

    refreshBtn.classList.remove('loading');
    loadingBox.style.display = 'none';

    if (allEquipment.length === 0) {
        groupedBox.innerHTML = `
            <div class="classifier-empty">
                <i class="fas fa-database"></i>
                Не удалось загрузить справочник.<br>
                Проверьте интернет и нажмите «Обновить».
            </div>`;
        groupedBox.style.display = 'block';
        return;
    }

    // Заполняем фильтр по классификациям
    fillSectionFilter();

    // Отрисовываем
    renderStats();
    renderGroups();

    groupedBox.style.display = 'block';
    statsBox.style.display = 'grid';
}

// ============================================================
// ФИЛЬТР ПО КЛАССИФИКАЦИЯМ
// ============================================================
function fillSectionFilter() {
    const select = document.getElementById('sectionFilter');
    const sections = [...new Set(allEquipment.map(x => x.section))].sort();

    // Сохраняем выбранное, если было
    const currentValue = select.value;
    select.innerHTML = '<option value="">Все классификации</option>';
    sections.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s;
        opt.textContent = s;
        select.appendChild(opt);
    });
    if (currentValue) select.value = currentValue;
}

// ============================================================
// СТАТИСТИКА
// ============================================================
function renderStats() {
    const sectionsCount = new Set(allEquipment.map(x => x.section)).size;
    const pointsCount = new Set(allEquipment.map(x => x.point)).size;

    document.getElementById('statsBox').innerHTML = `
        <div class="stat-card">
            <div class="stat-number">${allEquipment.length}</div>
            <div class="stat-label">Всего записей</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${sectionsCount}</div>
            <div class="stat-label">Классификаций</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${pointsCount}</div>
            <div class="stat-label">Разделов</div>
        </div>
    `;
}

// ============================================================
// ОТРИСОВКА ГРУПП
// ============================================================
function renderGroups() {
    const q = currentSearch.toLowerCase().trim();

    // Фильтруем
    let filtered = allEquipment;
    if (currentSection) {
        filtered = filtered.filter(x => x.section === currentSection);
    }
    if (q) {
        filtered = filtered.filter(x =>
            x.key.toLowerCase().includes(q) ||
            x.point.toLowerCase().includes(q) ||
            x.section.toLowerCase().includes(q)
        );
    }

    if (filtered.length === 0) {
        document.getElementById('groupedBox').innerHTML = `
            <div class="classifier-empty">
                <i class="fas fa-search"></i>
                Ничего не найдено по запросу.
            </div>`;
        return;
    }

    // Группируем: section → point → [keys]
    const grouped = {};
    filtered.forEach(item => {
        if (!grouped[item.section]) grouped[item.section] = {};
        if (!grouped[item.section][item.point]) grouped[item.section][item.point] = [];
        grouped[item.section][item.point].push(item.key);
    });

    // Рисуем
    let html = '';
    Object.keys(grouped).sort().forEach(section => {
        const points = grouped[section];
        const totalKeys = Object.values(points).reduce((sum, arr) => sum + arr.length, 0);

        html += `
            <div class="group-card" onclick="toggleGroup(this)">
                <div class="group-header">
                    <div class="group-title">
                        <i class="fas fa-layer-group"></i>
                        ${section}
                    </div>
                    <div style="display:flex; align-items:center; gap:10px;">
                        <span class="group-count">${totalKeys}</span>
                        <i class="fas fa-chevron-down group-toggle"></i>
                    </div>
                </div>
                <div class="group-body">
        `;

        Object.keys(points).sort().forEach(point => {
            html += `
                <div class="point-item">
                    <div class="point-name">
                        <i class="fas fa-tag"></i> ${point}
                    </div>
                    <div class="point-keys">
                        ${points[point].map(k => `<span class="key-chip">${k}</span>`).join('')}
                    </div>
                </div>
            `;
        });

        html += `
                </div>
            </div>
        `;
    });

    document.getElementById('groupedBox').innerHTML = html;
}

// ============================================================
// РАСКРЫТИЕ ГРУППЫ
// ============================================================
function toggleGroup(el) {
    el.classList.toggle('open');
}

// ============================================================
// ИНИЦИАЛИЗАЦИЯ
// ============================================================
document.addEventListener('DOMContentLoaded', function () {
    console.log('✅ Классификатор загружен');

    // Аватар в сайдбаре
    const name = localStorage.getItem('jixozmed_user_name') || localStorage.getItem('jixozmed_login') || '?';
    const initials = document.getElementById('sidebarUserInitials');
    if (initials) {
        const parts = name.trim().split(/\s+/);
        initials.textContent = parts.length >= 2
            ? parts[0][0].toUpperCase() + parts[1][0].toUpperCase()
            : name.substring(0, 2).toUpperCase();
    }

    // Поиск
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        let timer;
        searchInput.addEventListener('input', function () {
            clearTimeout(timer);
            timer = setTimeout(() => {
                currentSearch = this.value;
                renderGroups();
            }, 250);
        });
    }

    // Фильтр по классификации
    const sectionFilter = document.getElementById('sectionFilter');
    if (sectionFilter) {
        sectionFilter.addEventListener('change', function () {
            currentSection = this.value;
            renderGroups();
        });
    }

    // Загружаем справочник
    loadAndRender();
});

// ============================================================
// ДОБАВЛЕНИЕ НОВОЙ ЗАПИСИ В КЛАССИФИКАТОР
// ============================================================
function openAddClassifierModal() {
    const modal = document.getElementById('addClassifierModal');
    const secInput = document.getElementById('newClassifierSection');
    const ptInput = document.getElementById('newClassifierPoint');
    const keyInput = document.getElementById('newClassifierKey');
    const errBox = document.getElementById('addClassifierError');

    if (secInput) secInput.value = '';
    if (ptInput) ptInput.value = '';
    if (keyInput) keyInput.value = '';
    if (errBox) {
        errBox.style.display = 'none';
        errBox.textContent = '';
    }

    // Заполняем подсказки существующими разделами и пунктами
    const secList = document.getElementById('existingSectionsList');
    const ptList = document.getElementById('existingPointsList');

    if (secList) {
        const sections = [...new Set(allEquipment.map(x => x.section).filter(Boolean))].sort();
        secList.innerHTML = sections.map(s => `<option value="${s}"></option>`).join('');
    }

    if (ptList) {
        const points = [...new Set(allEquipment.map(x => x.point).filter(Boolean))].sort();
        ptList.innerHTML = points.map(p => `<option value="${p}"></option>`).join('');
    }

    if (modal) modal.style.display = 'flex';
}

function closeAddClassifierModal() {
    const modal = document.getElementById('addClassifierModal');
    if (modal) modal.style.display = 'none';
}

async function saveNewClassifierItem() {
    const secInput = document.getElementById('newClassifierSection');
    const ptInput = document.getElementById('newClassifierPoint');
    const keyInput = document.getElementById('newClassifierKey');
    const errBox = document.getElementById('addClassifierError');
    const saveBtn = document.getElementById('saveClassifierBtn');

    const section = (secInput?.value || '').trim();
    const point = (ptInput?.value || '').trim();
    const key = (keyInput?.value || '').trim();

    if (!section || !point || !key) {
        if (errBox) {
            errBox.textContent = 'Пожалуйста, заполните все обязательные поля';
            errBox.style.display = 'block';
        }
        return;
    }

    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Сохранение...';
    }

    const newItem = { section, point, key };

    // Сохранение в Supabase
    if (window.SUPABASE_URL && window.SUPABASE_KEY) {
        try {
            const res = await fetch(`${window.SUPABASE_URL}/rest/v1/equipment`, {
                method: 'POST',
                headers: {
                    'apikey': window.SUPABASE_KEY,
                    'Authorization': `Bearer ${window.SUPABASE_KEY}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify(newItem)
            });

            if (!res.ok) {
                throw new Error('HTTP ' + res.status);
            }
        } catch (e) {
            console.warn('⚠️ Ошибка сохранения в Supabase:', e);
        }
    }

    // Обновляем локальный список
    allEquipment.push(newItem);
    try {
        localStorage.setItem('jixozmed_equipment_cache', JSON.stringify(allEquipment));
    } catch (e) {
        console.warn('Не удалось обновить кэш:', e);
    }

    if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<i class="fas fa-check"></i> Сохранить';
    }

    closeAddClassifierModal();
    showToast('✅ Новая классификация успешно добавлена!');

    // Перерисовываем интерфейс
    fillSectionFilter();
    renderStats();
    renderGroups();
}

function showToast(msg) {
    let toast = document.getElementById('appToastNotice');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'appToastNotice';
        toast.style.cssText = 'position:fixed; bottom:24px; right:24px; background:#1e5ec9; color:#fff; padding:14px 22px; border-radius:12px; font-size:15px; font-weight:500; z-index:999999; box-shadow:0 8px 30px rgba(0,0,0,0.5); transition:opacity 0.3s ease;';
        document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.style.opacity = '1';
    toast.style.display = 'block';
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => { toast.style.display = 'none'; }, 300);
    }, 2800);
}