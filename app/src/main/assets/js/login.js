// ============================================================
// СПИСОК ПОЛЬЗОВАТЕЛЕЙ ДЛЯ ВХОДА
// Логин придуман по схеме: первая буква имени + точка + фамилия (маленькими)
// Пароль по умолчанию: 1234 (у всех)
// ============================================================
const USERS = [
    {
        login: 'jahondv',
        password: '1234',
        name: 'Администратор системы',
        role: 'Администратор',
        region: 'Минздрав РУз'
    },
    {
        login: 'b.djamuratov',
        password: '1234',
        name: 'DJAMURATOV BATI‘RBEK MURATBAEVICH',
        role: 'Регион админ',
        region: "Qoraqalpog'iston Respublikasi"
    },
    {
        login: 'n.barlikov',
        password: '1234',
        name: 'BARLIKOV NAURZBAY KAMALATDINOVICH',
        role: 'Регион админ',
        region: "Qoraqalpog'iston Respublikasi"
    },
    {
        login: 'q.isakov',
        password: '1234',
        name: 'ISAKOV QUUAT RUSTEMBAY ULÍ',
        role: 'Регион админ',
        region: "Qoraqalpog'iston Respublikasi"
    },
    {
        login: 's.doshniyazov',
        password: '1234',
        name: 'DOSHNIYAZOV SALAMAT ORINBAYEVICH',
        role: 'Регион админ',
        region: "Qoraqalpog'iston Respublikasi"
    },
    {
        login: 'b.erimbetov',
        password: '1234',
        name: 'ERIMBETOV BEKJAN NURJANOVICH',
        role: 'Регион админ',
        region: "Qoraqalpog'iston Respublikasi"
    },
    {
        login: 'd.asanov',
        password: '1234',
        name: 'ASANOV DAMIR KUANDIKOVICH',
        role: 'Регион админ',
        region: "Qoraqalpog'iston Respublikasi"
    },
    {
        login: 't.rasulov',
        password: '1234',
        name: 'RASULOV TIMUR VLADIMIROVICH',
        role: 'Регион админ',
        region: "Qoraqalpog'iston Respublikasi"
    },
    {
        login: 'b.utemisov',
        password: '1234',
        name: 'UTEMISOV BAXRAM KEUNIMJAEVICH',
        role: 'Регион админ',
        region: "Qoraqalpog'iston Respublikasi"
    },
    {
        login: 'm.jadigerov',
        password: '1234',
        name: 'JADIGEROV MANSUR TOKTARBAEVICH',
        role: 'Регион админ',
        region: "Qoraqalpog'iston Respublikasi"
    },
    {
        login: 'm.erjanov',
        password: '1234',
        name: 'ERJANOV MARAT SAGALATDINOVICH',
        role: 'Регион админ',
        region: "Qoraqalpog'iston Respublikasi"
    },
    {
        login: 's.soy',
        password: '1234',
        name: 'SOY SERGEY VYACHESLAVOVICH',
        role: 'Регион админ',
        region: "Qoraqalpog'iston Respublikasi"
    }
];

// Телефон для SMS (один для всех — для демо)
const TARGET_PHONE = '998777592055';

// ============================================================
// СОСТОЯНИЕ
// ============================================================
let generatedCode = '';
let resendInterval = null;
let currentUser = null;

// ============================================================
// ШАГ 1: ВХОД
// ============================================================
function submitLogin() {
    const login = document.getElementById('loginInput').value.trim();
    const password = document.getElementById('passwordInput').value.trim();
    const errorEl = document.getElementById('loginError');

    errorEl.style.color = '#ff8a80';
    errorEl.textContent = '';

    if (!login) { errorEl.textContent = 'Введите логин'; return; }
    if (!password) { errorEl.textContent = 'Введите пароль'; return; }

    console.log('🔐 Попытка входа:', login);

    // Ищем пользователя в списке
    const user = USERS.find(function (u) {
        return u.login.toLowerCase() === login.toLowerCase() && u.password === password;
    });

    if (!user) {
        errorEl.textContent = '❌ Неверный логин или пароль';
        console.log('❌ Пользователь не найден или пароль неверный');
        return;
    }

    // Запоминаем пользователя
    currentUser = user;

    // Генерируем код
    generatedCode = String(Math.floor(1000 + Math.random() * 9000));
    console.log('✅ Пользователь найден:', user.name);
    console.log('📱 SMS отправлен (демо). Код: ' + generatedCode);

    errorEl.style.color = '#4d94e8';
    errorEl.textContent = 'Отправка SMS...';

    sendSmsCode(TARGET_PHONE, generatedCode).then(function (result) {
        if (!result.success) {
            errorEl.style.color = '#ff8a80';
            errorEl.textContent = 'Ошибка: ' + (result.error || 'SMS не отправлено');
            return;
        }

        document.getElementById('step1').style.display = 'none';
        document.getElementById('step2').style.display = 'block';
        document.getElementById('smsInput').focus();
        startResendTimer(60);
    });
}

// ============================================================
// ОТПРАВКА SMS (пока демо — показывает код через alert)
// ============================================================
async function sendSmsCode(phone, code) {
    // Демо: показываем код через alert
    alert('ДЕМО-РЕЖИМ\n\nКод подтверждения: ' + code + '\n\nНомер: +' + phone);
    return { success: true };
}

// ============================================================
// ШАГ 2: ПРОВЕРКА КОДА
// ============================================================
function submitSms() {
    const inputCode = document.getElementById('smsInput').value.trim();
    const errorEl = document.getElementById('smsError');
    errorEl.style.color = '#ff8a80';
    errorEl.textContent = '';

    console.log('📝 Введён код:', inputCode, ', ожидался:', generatedCode);

    if (inputCode.length !== 4) {
        errorEl.textContent = 'Введите 4-значный код';
        return;
    }

    if (inputCode !== generatedCode) {
        errorEl.textContent = '❌ Неверный код';
        return;
    }

    if (!currentUser) {
        errorEl.textContent = '❌ Сессия потеряна. Войдите заново.';
        return;
    }

    errorEl.style.color = '#2ecc71';
    errorEl.textContent = '✅ Вход выполнен!';

    // Сохраняем данные вошедшего пользователя
    localStorage.setItem('jixozmed_logged_in', 'true');
    localStorage.setItem('jixozmed_login', currentUser.login);
    localStorage.setItem('jixozmed_user_name', currentUser.name);
    localStorage.setItem('jixozmed_user_role', currentUser.role);
    localStorage.setItem('jixozmed_user_region', currentUser.region);

    console.log('💾 Сессия сохранена для:', currentUser.name);
    console.log('🚀 Переход на дашборд...');

    setTimeout(function () {
        window.location.href = 'dashboard.html';
    }, 700);
}

// ============================================================
// ТАЙМЕР ПОВТОРНОЙ ОТПРАВКИ
// ============================================================
function startResendTimer(seconds) {
    const btn = document.getElementById('resendBtn');
    const timer = document.getElementById('resendTimer');
    if (!btn || !timer) return;

    btn.disabled = true;
    let remaining = seconds;
    if (resendInterval) clearInterval(resendInterval);
    timer.textContent = 'Повторно через ' + remaining + ' сек';

    resendInterval = setInterval(function () {
        remaining--;
        if (remaining <= 0) {
            clearInterval(resendInterval);
            btn.disabled = false;
            timer.textContent = '';
        } else {
            timer.textContent = 'Повторно через ' + remaining + ' сек';
        }
    }, 1000);
}

function resendSms() {
    generatedCode = String(Math.floor(1000 + Math.random() * 9000));
    console.log('📱 Новый код:', generatedCode);

    sendSmsCode(TARGET_PHONE, generatedCode).then(function (result) {
        const errorEl = document.getElementById('smsError');
        if (result.success) {
            errorEl.style.color = '#4d94e8';
            errorEl.textContent = 'Код отправлен повторно';
            startResendTimer(60);
            setTimeout(function () { errorEl.textContent = ''; }, 2000);
        } else {
            errorEl.style.color = '#ff8a80';
            errorEl.textContent = 'Ошибка: ' + (result.error || '');
        }
    });
}

// ============================================================
// ПРОЧИЕ ФУНКЦИИ
// ============================================================
function togglePassword() {
    const input = document.getElementById('passwordInput');
    const icon = document.getElementById('eyeIcon');
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

function backToStep1() {
    document.getElementById('step2').style.display = 'none';
    document.getElementById('step1').style.display = 'block';
    document.getElementById('smsInput').value = '';
    document.getElementById('smsError').textContent = '';
    if (resendInterval) clearInterval(resendInterval);
}

// ============================================================
// ИНИЦИАЛИЗАЦИЯ
// ============================================================
document.addEventListener('DOMContentLoaded', function () {
    const passInput = document.getElementById('passwordInput');
    const smsInput = document.getElementById('smsInput');

    if (passInput) passInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') submitLogin();
    });
    if (smsInput) smsInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') submitSms();
    });

    console.log('✅ Экран входа загружен');
});