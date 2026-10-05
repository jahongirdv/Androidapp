const avatarColors = ['#1e5ec9', '#9b59b6', '#e74c3c', '#2ecc71', '#f39c12', '#16a085', '#e67e22', '#3498db'];

function getAvatarColor(name) {
    let sum = 0;
    for (let i = 0; i < name.length; i++) sum += name.charCodeAt(i);
    return avatarColors[sum % avatarColors.length];
}

function getInitials(name) {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return parts[0][0].toUpperCase() + parts[1][0].toUpperCase();
    return name.substring(0, 2).toUpperCase();
}

document.addEventListener('DOMContentLoaded', function () {
    const name = localStorage.getItem('jixozmed_user_name') || 'Пользователь';
    const login = localStorage.getItem('jixozmed_login') || '—';
    const role = localStorage.getItem('jixozmed_user_role') || '—';
    const region = localStorage.getItem('jixozmed_user_region') || '—';

    // Аватар большой
    const bigAvatar = document.getElementById('profileAvatarBig');
    if (bigAvatar) {
        bigAvatar.textContent = getInitials(name);
        bigAvatar.style.background = getAvatarColor(name);
        bigAvatar.style.borderColor = 'rgba(255,255,255,0.25)';
    }

    // Сайдбар аватар
    const sbInitials = document.getElementById('sidebarUserInitials');
    if (sbInitials) sbInitials.textContent = getInitials(name);
    const sbUser = document.getElementById('sidebarUser');
    if (sbUser) sbUser.style.background = getAvatarColor(name);

    // Значения
    document.getElementById('profileName').textContent = name;
    document.getElementById('profileRole').textContent = role;
    document.getElementById('profileRegion').textContent = region;

    document.getElementById('profileLogin').textContent = login;
    document.getElementById('profileFullName').textContent = name;
    document.getElementById('profileRole2').textContent = role;
    document.getElementById('profileRegion2').textContent = region;

    console.log('👤 Профиль загружен:', name);
});