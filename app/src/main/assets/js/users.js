// ===== ДАННЫЕ ПОЛЬЗОВАТЕЛЕЙ =====
const usersData = [
    { id: 1,  name: 'DJAMURATOV BATI‘RBEK MURATBAEVICH', roles: ['Регион админ', 'Харидлар маркази'], region: "Qoraqalpog'iston Respublikasi", district: '-', organization: '-', createdAt: '17-08-2026 18:08', login: 'b.djamuratov', password: '1234', email: '', position: 'Регион админ' },
    { id: 2,  name: 'BARLIKOV NAURZBAY KAMALATDINOVICH', roles: ['Регион админ', 'Харидлар маркази'], region: "Qoraqalpog'iston Respublikasi", district: '-', organization: '-', createdAt: '17-08-2026 18:07', login: 'n.barlikov', password: '1234', email: '', position: 'Регион админ' },
    { id: 3,  name: 'ISAKOV QUUAT RUSTEMBAY ULÍ',        roles: ['Регион админ', 'Харидлар маркази'], region: "Qoraqalpog'iston Respublikasi", district: '-', organization: '-', createdAt: '17-08-2026 18:07', login: 'q.isakov', password: '1234', email: '', position: 'Регион админ' },
    { id: 4,  name: 'DOSHNIYAZOV SALAMAT ORINBAYEVICH',  roles: ['Регион админ', 'Харидлар маркази'], region: "Qoraqalpog'iston Respublikasi", district: '-', organization: '-', createdAt: '17-08-2026 18:07', login: 's.doshniyazov', password: '1234', email: '', position: 'Регион админ' },
    { id: 5,  name: 'ERIMBETOV BEKJAN NURJANOVICH',      roles: ['Регион админ', 'Харидлар маркази'], region: "Qoraqalpog'iston Respublikasi", district: '-', organization: '-', createdAt: '17-08-2026 18:06', login: 'b.erimbetov', password: '1234', email: '', position: 'Регион админ' },
    { id: 6,  name: 'ASANOV DAMIR KUANDIKOVICH',         roles: ['Регион админ', 'Харидлар маркази'], region: "Qoraqalpog'iston Respublikasi", district: '-', organization: '-', createdAt: '17-08-2026 18:06', login: 'd.asanov', password: '1234', email: '', position: 'Регион админ' },
    { id: 7,  name: 'RASULOV TIMUR VLADIMIROVICH',       roles: ['Регион админ', 'Харидлар маркази'], region: "Qoraqalpog'iston Respublikasi", district: '-', organization: '-', createdAt: '17-08-2026 18:06', login: 't.rasulov', password: '1234', email: '', position: 'Регион админ' },
    { id: 8,  name: 'UTEMISOV BAXRAM KEUNIMJAEVICH',     roles: ['Регион админ', 'Харидлар маркази'], region: "Qoraqalpog'iston Respublikasi", district: '-', organization: '-', createdAt: '17-08-2026 18:05', login: 'b.utemisov', password: '1234', email: '', position: 'Регион админ' },
    { id: 9,  name: 'JADIGEROV MANSUR TOKTARBAEVICH',    roles: ['Регион админ', 'Харидлар маркази'], region: "Qoraqalpog'iston Respublikasi", district: '-', organization: '-', createdAt: '17-08-2026 18:05', login: 'm.jadigerov', password: '1234', email: '', position: 'Регион админ' },
    { id: 10, name: 'ERJANOV MARAT SAGALATDINOVICH',     roles: ['Регион админ', 'Харидлар маркази'], region: "Qoraqalpog'iston Respublikasi", district: '-', organization: '-', createdAt: '17-08-2026 18:05', login: 'm.erjanov', password: '1234', email: '', position: 'Регион админ' },
    { id: 11, name: 'SOY SERGEY VYACHESLAVOVICH',        roles: ['Регион админ', 'Харидлар маркази'], region: "Qoraqalpog'iston Respublikasi", district: '-', organization: '-', createdAt: '17-08-2026 18:04', login: 's.soy', password: '1234', email: '', position: 'Регион админ' },
];

// ===== СОСТОЯНИЕ =====
let currentFilter = { search: '', region: '', role: '' };
let currentPage = 1;
const PER_PAGE = 10;

// ===== СОХРАНЕНИЕ / ЗАГРУЗКА ИЗ LOCALSTORAGE =====
function saveUsersToStorage() {
    try {
        localStorage.setItem('jixozmed_users', JSON.stringify(usersData));
    } catch (e) { console.warn('Не сохранили:', e); }
}

function loadUsersFromStorage() {
    try {
        const saved = localStorage.getItem('jixozmed_users');
        if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) {
                usersData.length = 0;
                parsed.forEach(u => usersData.push(u));
            }
        }
    } catch (e) { console.warn('Не загрузили:', e); }
}

// ===== ЦВЕТА АВАТАРОВ =====
const avatarColors = ['#1e5ec9', '#9b59b6', '#e74c3c', '#2ecc71', '#f39c12', '#16a085', '#e67e22', '#3498db'];
function getAvatarColor(name) {
    let sum = 0;
    for (let i = 0; i < name.length; i++) sum += name.charCodeAt(i);
    return avatarColors[sum % avatarColors.length];
}
function getInitials(name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return parts[0][0].toUpperCase() + parts[1][0].toUpperCase();
    return name.substring(0, 2).toUpperCase();
}

// ===== ФИЛЬТРАЦИЯ =====
function getFilteredUsers() {
    const q = currentFilter.search.toLowerCase().trim();
    return usersData.filter(function (u) {
        if (q) {
            const haystack = (u.name + ' ' + u.login + ' ' + u.region + ' ' + u.roles.join(' ')).toLowerCase();
            if (!haystack.includes(q)) return false;
        }
        if (currentFilter.region && u.region !== currentFilter.region) return false;
        if (currentFilter.role && !u.roles.includes(currentFilter.role)) return false;
        return true;
    });
}

// ===== РЕНДЕР =====
function renderUsers() {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;

    const filtered = getFilteredUsers();
    const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));

    if (currentPage > totalPages) currentPage = totalPages;
    const startIdx = (currentPage - 1) * PER_PAGE;
    const pageItems = filtered.slice(startIdx, startIdx + PER_PAGE);

    // Счётчик
    const counter = document.getElementById('usersCount');
    if (counter) counter.textContent = filtered.length;

    tbody.innerHTML = '';

    if (pageItems.length === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = '<td colspan="7" class="users-empty">Пользователи не найдены</td>';
        tbody.appendChild(tr);
        renderPagination(0, 1);
        return;
    }

    pageItems.forEach(function (u) {
        const tr = document.createElement('tr');
        const rolesHtml = u.roles.map(function (r, i) {
            const cls = i === 0 ? 'badge-admin' : 'badge-user';
            return '<span class="badge ' + cls + '" style="margin-right:4px;">' + r + '</span>';
        }).join('');

        tr.innerHTML =
            '<td>' +
                '<div class="user-cell">' +
                    '<div class="user-avatar" style="background:' + getAvatarColor(u.name) + ';">' +
                        getInitials(u.name) +
                    '</div>' +
                    '<div class="user-name">' +
                        '<span class="user-fullname">' + u.name + '</span>' +
                    '</div>' +
                '</div>' +
            '</td>' +
            '<td>' + rolesHtml + '</td>' +
            '<td>' + u.region + '</td>' +
            '<td>' + u.district + '</td>' +
            '<td>' + u.organization + '</td>' +
            '<td>' + u.createdAt + '</td>' +
            '<td>' +
                '<div class="user-actions">' +
                    '<button class="user-action-btn" title="Войти как пользователь" onclick="loginAsUser(' + u.id + ')">' +
                        '<i class="fas fa-sign-in-alt"></i>' +
                    '</button>' +
                    '<button class="user-action-btn" title="Редактировать" onclick="editUser(' + u.id + ')">' +
                        '<i class="fas fa-pen"></i>' +
                    '</button>' +
                    '<button class="user-action-btn danger" title="Удалить" onclick="deleteUser(' + u.id + ')">' +
                        '<i class="fas fa-trash"></i>' +
                    '</button>' +
                '</div>' +
            '</td>';

        tbody.appendChild(tr);
    });

    renderPagination(filtered.length, totalPages);
}

// ===== ПАГИНАЦИЯ =====
function renderPagination(totalItems, totalPages) {
    const wrap = document.getElementById('usersPagination');
    if (!wrap) return;
    wrap.innerHTML = '';

    if (totalPages <= 1) return;

    // Кнопка "Назад"
    const prevBtn = document.createElement('button');
    prevBtn.className = 'page-btn';
    prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
    prevBtn.disabled = currentPage <= 1;
    prevBtn.onclick = function () { if (currentPage > 1) { currentPage--; renderUsers(); } };
    wrap.appendChild(prevBtn);

    // Страницы (не больше 5 кнопок)
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);
    if (endPage - startPage < 4) startPage = Math.max(1, endPage - 4);

    for (let i = startPage; i <= endPage; i++) {
        const btn = document.createElement('button');
        btn.className = 'page-btn' + (i === currentPage ? ' active' : '');
        btn.textContent = i;
        btn.onclick = function () { currentPage = i; renderUsers(); };
        wrap.appendChild(btn);
    }

    // Кнопка "Вперёд"
    const nextBtn = document.createElement('button');
    nextBtn.className = 'page-btn';
    nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
    nextBtn.disabled = currentPage >= totalPages;
    nextBtn.onclick = function () { if (currentPage < totalPages) { currentPage++; renderUsers(); } };
    wrap.appendChild(nextBtn);

    // Инфо
    const info = document.createElement('span');
    info.className = 'page-info';
    info.textContent = 'Стр. ' + currentPage + ' из ' + totalPages;
    wrap.appendChild(info);
}

// ===== ДЕЙСТВИЯ =====
function loginAsUser(id) {
    const u = usersData.find(x => x.id === id);
    if (!u) return;

    // Сохраняем «текущего» пользователя
    localStorage.setItem('jixozmed_logged_in', 'true');
    localStorage.setItem('jixozmed_login', u.login);
    localStorage.setItem('jixozmed_user_name', u.name);
    localStorage.setItem('jixozmed_user_role', u.roles[0] || '');
    localStorage.setItem('jixozmed_user_region', u.region || '');

    console.log('🔐 Вход как:', u.name);
    window.location.href = 'dashboard.html';
}

function editUser(id) {
    const u = usersData.find(x => x.id === id);
    if (u) alert('Редактирование:\n\n' + u.name + '\nЛогин: ' + u.login);
}

function deleteUser(id) {
    const u = usersData.find(x => x.id === id);
    if (u && confirm('Удалить пользователя?\n\n' + u.name)) {
        const i = usersData.findIndex(x => x.id === id);
        if (i >= 0) usersData.splice(i, 1);
        saveUsersToStorage();
        renderUsers();
    }
}

// ===== МОДАЛЬНОЕ ОКНО =====
function openAddUserModal() {
    document.getElementById('addUserModal').style.display = 'flex';
    document.getElementById('addUserError').textContent = '';
    ['newName', 'newLogin', 'newPassword', 'newEmail', 'newOrganization'].forEach(function (id) {
        document.getElementById(id).value = '';
    });
    document.getElementById('newRegion').value = '';
    document.getElementById('newRole').value = 'Регион админ';
}

function closeAddUserModal() {
    document.getElementById('addUserModal').style.display = 'none';
}

function saveNewUser() {
    const name = document.getElementById('newName').value.trim();
    const login = document.getElementById('newLogin').value.trim();
    const password = document.getElementById('newPassword').value.trim();
    const email = document.getElementById('newEmail').value.trim();
    const region = document.getElementById('newRegion').value;
    const role = document.getElementById('newRole').value;
    const organization = document.getElementById('newOrganization').value.trim();
    const errEl = document.getElementById('addUserError');

    errEl.textContent = '';

    if (!name) { errEl.textContent = 'Введите Ф.И.О.'; return; }
    if (!login) { errEl.textContent = 'Введите логин'; return; }
    if (!password) { errEl.textContent = 'Введите пароль'; return; }

    // Проверка уникальности логина
    if (usersData.some(u => u.login === login)) {
        errEl.textContent = 'Такой логин уже существует';
        return;
    }

    // Формируем дату
    const now = new Date();
    const pad = n => String(n).padStart(2, '0');
    const createdAt = pad(now.getDate()) + '-' + pad(now.getMonth() + 1) + '-' +
                     now.getFullYear() + ' ' + pad(now.getHours()) + ':' + pad(now.getMinutes());

    const newUser = {
        id: usersData.length > 0 ? Math.max(...usersData.map(u => u.id)) + 1 : 1,
        name: name,
        roles: [role, 'Харидлар маркази'],
        region: region || '-',
        district: '-',
        organization: organization || '-',
        createdAt: createdAt,
        login: login,
        password: password,
        email: email,
        position: role
    };

    usersData.unshift(newUser);
    saveUsersToStorage();
    closeAddUserModal();
    currentPage = 1;
    renderUsers();
}

// ===== ИНИЦИАЛИЗАЦИЯ =====
document.addEventListener('DOMContentLoaded', function () {
    console.log('✅ Страница пользователей загружена');
    loadUsersFromStorage();
    renderUsers();

    // Поиск
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function () {
            currentFilter.search = this.value;
            currentPage = 1;
            renderUsers();
        });
    }

    // Фильтр по региону
    const filterRegion = document.getElementById('filterRegion');
    if (filterRegion) {
        filterRegion.addEventListener('change', function () {
            currentFilter.region = this.value;
            currentPage = 1;
            renderUsers();
        });
    }

    // Фильтр по роли
    const filterRole = document.getElementById('filterRole');
    if (filterRole) {
        filterRole.addEventListener('change', function () {
            currentFilter.role = this.value;
            currentPage = 1;
            renderUsers();
        });
    }

    // Аватар в сайдбаре
    const initials = document.getElementById('sidebarUserInitials');
    if (initials) {
        const userName = localStorage.getItem('jixozmed_user_name') || localStorage.getItem('jixozmed_login') || '?';
        initials.textContent = getInitials(userName);
        const userBtn = document.getElementById('sidebarUser');
        if (userBtn) userBtn.style.background = getAvatarColor(userName);
    }
});