// ===== ЗАЩИТА СТРАНИЦ =====
(function () {
    const isLoginPage = window.location.pathname.indexOf('login.html') !== -1
                     || window.location.href.indexOf('login.html') !== -1;

    if (isLoginPage) return; // На странице входа не проверяем

    const loggedIn = localStorage.getItem('jixozmed_logged_in');
    if (loggedIn !== 'true') {
        window.location.href = 'login.html';
    }
})();

// ===== ФУНКЦИЯ ВЫХОДА =====
(function () {
    const isLoginPage = window.location.href.indexOf('login.html') !== -1;
    if (isLoginPage) return;

    const loggedIn = localStorage.getItem('jixozmed_logged_in');
    if (loggedIn !== 'true') {
        window.location.href = 'login.html';
    }
})();

function logout() {
    localStorage.removeItem('jixozmed_logged_in');
    localStorage.removeItem('jixozmed_login');
    localStorage.removeItem('jixozmed_user_name');
    localStorage.removeItem('jixozmed_user_role');
    localStorage.removeItem('jixozmed_user_region');
    window.location.href = 'login.html';
}