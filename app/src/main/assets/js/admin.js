// ===== АВАТАР В САЙДБАРЕ =====
(function () {
    const name = localStorage.getItem('jixozmed_user_name') ||
                 localStorage.getItem('jixozmed_login') || '?';
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

console.log('✅ Админ-панель загружена');