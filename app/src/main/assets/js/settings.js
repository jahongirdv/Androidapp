// ============================================================
// JIXOZMED — НАСТРОЙКИ СИСТЕМЫ (SETTINGS.JS)
// ============================================================

console.log('⚙️ Раздел настроек загружен');

document.addEventListener('DOMContentLoaded', function () {
    initUserAvatar();
    initSupabaseConfigInputs();
    testSupabaseConnection();
});

function initUserAvatar() {
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
}

function getActiveSupabaseUrl() {
    return localStorage.getItem('jixozmed_supabase_url') || window.SUPABASE_URL || 'https://wlkdqacnorodktuihgzs.supabase.co';
}

function getActiveSupabaseKey() {
    return localStorage.getItem('jixozmed_supabase_key') || window.SUPABASE_KEY || 'sb_publishable_hMybap843BWo_9AX2ZUtRA_zvuYbdms';
}

function initSupabaseConfigInputs() {
    const urlInput = document.getElementById('supabaseUrlInput');
    const keyInput = document.getElementById('supabaseKeyInput');

    if (urlInput) urlInput.value = getActiveSupabaseUrl();
    if (keyInput) keyInput.value = getActiveSupabaseKey();
}

async function testSupabaseConnection() {
    const statusVal = document.getElementById('connectionStatusVal');
    const pingVal = document.getElementById('connectionPingVal');
    const syncVal = document.getElementById('lastSyncTimeVal');
    const logBox = document.getElementById('connectionLogBox');
    const testBtn = document.getElementById('testConnectionBtn');

    const url = (document.getElementById('supabaseUrlInput')?.value || getActiveSupabaseUrl()).trim();
    const key = (document.getElementById('supabaseKeyInput')?.value || getActiveSupabaseKey()).trim();

    if (statusVal) {
        statusVal.innerHTML = `<i class="fas fa-spinner fa-spin" style="color:#4d94e8;"></i> Проверка...`;
    }
    if (logBox) {
        logBox.style.display = 'block';
        logBox.className = 'settings-log-box';
        logBox.textContent = '🔄 Отправка контрольного запроса к базе Supabase...';
    }

    if (testBtn) {
        testBtn.disabled = true;
    }

    const startTime = performance.now();

    try {
        const res = await fetch(`${url}/rest/v1/equipment?select=id&limit=1`, {
            method: 'GET',
            headers: {
                'apikey': key,
                'Authorization': `Bearer ${key}`
            }
        });

        const endTime = performance.now();
        const pingMs = Math.round(endTime - startTime);
        const nowStr = new Date().toLocaleTimeString('ru-RU');

        if (res.ok) {
            if (statusVal) {
                statusVal.innerHTML = `<span class="status-badge-online"><i class="fas fa-check-circle"></i> Подключено (Онлайн)</span>`;
            }
            if (pingVal) {
                pingVal.textContent = `${pingMs} мс`;
                pingVal.style.color = pingMs < 300 ? '#2ecc71' : (pingMs < 800 ? '#f1c40f' : '#e74c3c');
            }
            if (syncVal) {
                syncVal.textContent = `Сегодня в ${nowStr}`;
            }
            if (logBox) {
                logBox.className = 'settings-log-box success';
                logBox.innerHTML = `✅ <b>Соединение успешно установлено!</b><br>` +
                    `• Сервер ответил с кодом HTTP 200 (OK)<br>` +
                    `• Скорость отклика: <b>${pingMs} мс</b><br>` +
                    `• База данных JixozMed активна и готова к работе.`;
            }
        } else {
            throw new Error(`Сервер вернул ошибку HTTP ${res.status}`);
        }
    } catch (e) {
        const nowStr = new Date().toLocaleTimeString('ru-RU');
        if (statusVal) {
            statusVal.innerHTML = `<span class="status-badge-offline"><i class="fas fa-times-circle"></i> Нет связи (Офлайн)</span>`;
        }
        if (pingVal) {
            pingVal.textContent = 'Таймаут';
            pingVal.style.color = '#e74c3c';
        }
        if (syncVal) {
            syncVal.textContent = `Сбой в ${nowStr}`;
        }
        if (logBox) {
            logBox.className = 'settings-log-box error';
            logBox.innerHTML = `❌ <b>Ошибка подключения к серверу:</b><br>` +
                `• Детали: ${e.message}<br>` +
                `• Проверьте подключение к интернету или корректность указанного URL/Ключа.`;
        }
    } finally {
        if (testBtn) testBtn.disabled = false;
    }
}

function saveSupabaseConfig() {
    const urlInput = document.getElementById('supabaseUrlInput');
    const keyInput = document.getElementById('supabaseKeyInput');

    const url = (urlInput?.value || '').trim();
    const key = (keyInput?.value || '').trim();

    if (!url || !key) {
        showToast('⚠️ Заполните URL и API Key');
        return;
    }

    localStorage.setItem('jixozmed_supabase_url', url);
    localStorage.setItem('jixozmed_supabase_key', key);

    window.SUPABASE_URL = url;
    window.SUPABASE_KEY = key;

    showToast('✅ Настройки сохранены!');
    testSupabaseConnection();
}

function resetSupabaseConfig() {
    localStorage.removeItem('jixozmed_supabase_url');
    localStorage.removeItem('jixozmed_supabase_key');

    window.SUPABASE_URL = 'https://wlkdqacnorodktuihgzs.supabase.co';
    window.SUPABASE_KEY = 'sb_publishable_hMybap843BWo_9AX2ZUtRA_zvuYbdms';

    initSupabaseConfigInputs();
    showToast('🔄 Восстановлены стандартные настройки');
    testSupabaseConnection();
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
