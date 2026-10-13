// ============================================================
// ССЫЛКИ НА ШАБЛОНЫ В SUPABASE STORAGE
// ============================================================
const TEMPLATE_URLS = {
    writeoff: 'https://wlkdqacnorodktuihgzs.supabase.co/storage/v1/object/public/templates/writeoff.docx'
    // repair:   '...',   // ← добавите позже, когда загрузите repair.docx
    // transfer: '...'    // ← и transfer.docx
};

const TEMPLATE_FILENAMES = {
    writeoff: 'Акт_списания.docx',
};


// ============================================================
// АВАТАР В САЙДБАРЕ
// ============================================================
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


// ============================================================
// ЗАГРУЗКА ОРГАНИЗАЦИЙ В SELECT
// Publishable-ключ идёт ТОЛЬКО в apikey, без Authorization: Bearer.
// ============================================================
async function loadOrganizationsIntoSelect() {
    const sel = document.getElementById('tplOrgSelect');
    if (!sel) return;

    try {
        const res = await fetch(
            `${window.SUPABASE_URL}/rest/v1/organizations?select=id,name,district,region&order=name.asc`,
            {
                headers: {
                    apikey: window.SUPABASE_KEY,
                    'Content-Type': 'application/json'
                }
            }
        );
        if (!res.ok) throw new Error('HTTP ' + res.status);

        const orgs = await res.json();
        console.log('✅ Организаций в списке шаблонов:', orgs.length);

        sel.innerHTML = '<option value="">— выберите из списка —</option>' +
            orgs.map(o => `<option value="${o.id}"
                                       data-name="${o.name}"
                                       data-district="${o.district || ''}"
                                       data-region="${o.region || ''}">
                            ${o.name}
                          </option>`).join('');
    } catch (e) {
        console.warn('❌ Не удалось загрузить организации:', e.message);
    }
}

function getSelectedOrg() {
    const sel = document.getElementById('tplOrgSelect');
    if (!sel || !sel.value) return null;
    const opt = sel.options[sel.selectedIndex];
    return {
        id: sel.value,
        name: opt.dataset.name || '',
        district: opt.dataset.district || '',
        region: opt.dataset.region || ''
    };
}

function getUserInput() {
    return {
        org: getSelectedOrg(),
        cityDate: (document.getElementById('tplCityDate')?.value || '').trim()
                  || 'г. Нукус, «___» ______________ 20___ г.',
        chairman: (document.getElementById('tplChairman')?.value || '').trim()
                  || '_________________________',
        members: (document.getElementById('tplMembers')?.value || '').trim()
                  || '_________________________'
    };
}


// ============================================================
// ГЕНЕРАЦИЯ .DOC В БРАУЗЕРЕ (Blob)
// ============================================================
function downloadTemplate(type) {
    const ctx = getUserInput();

    let html = '';
    let filename = '';

    if (type === 'repair') {
        html = buildRepairAct(ctx);
        filename = `Акт_ремонта_${ctx.org?.name || 'без_организации'}.doc`;
    } else if (type === 'writeoff') {
        html = buildWriteOffAct(ctx);
        filename = `Акт_списания_${ctx.org?.name || 'без_организации'}.doc`;
    } else if (type === 'transfer') {
        html = buildTransferAct(ctx);
        filename = `Акт_перемещения_${ctx.org?.name || 'без_организации'}.doc`;
    } else {
        return;
    }

    filename = filename.replace(/[\\/:*?"<>|]/g, '_');

    const fullHtml = `
<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
    <meta charset="utf-8">
    <title>${filename}</title>
    <style>
        @page { size: A4; margin: 2cm 1.5cm 2cm 2.5cm; }
        body { font-family: 'Times New Roman', serif; font-size: 12pt; color: #000; }
        h1 { text-align: center; font-size: 14pt; font-weight: bold; margin: 12pt 0; }
        h2 { text-align: center; font-size: 12pt; font-weight: normal; margin: 6pt 0 18pt 0; }
        p  { margin: 6pt 0; text-align: justify; line-height: 1.4; }
        table { border-collapse: collapse; width: 100%; margin: 12pt 0; }
        table th, table td { border: 1px solid #000; padding: 4pt 6pt; font-size: 11pt; vertical-align: top; }
        table th { background: #eee; text-align: center; font-weight: bold; }
        .center { text-align: center; }
        .small  { font-size: 10pt; color: #333; }
    </style>
</head>
<body>
${html}
</body>
</html>`;

    const blob = new Blob(['\ufeff', fullHtml], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);

    console.log('📄 Скачан шаблон:', filename);
}


// ============================================================
// ШАБЛОН 1 — АКТ ПРИЁМА-ПЕРЕДАЧИ В РЕМОНТ
// ============================================================
function buildRepairAct(ctx) {
    const org = ctx.org?.name || '____________________________________';
    const addr = ctx.org
        ? [ctx.org.region, ctx.org.district].filter(Boolean).join(', ')
        : '____________________________________';

    return `
<h1>АКТ<br>приёма-передачи медицинского оборудования в ремонт</h1>
<h2>№ ______ от ${ctx.cityDate}</h2>

<p><b>Организация:</b> ${org}</p>
<p><b>Адрес:</b> ${addr}</p>

<p>Настоящий акт составлен комиссией в составе:</p>
<p><b>Председатель комиссии:</b> ${ctx.chairman}</p>
<p><b>Члены комиссии:</b> ${ctx.members}</p>

<p>о том, что нижеперечисленное медицинское оборудование передано в ремонт
в связи с выявленными дефектами и необходимостью восстановления работоспособности.</p>

<table>
    <thead>
        <tr>
            <th style="width:5%">№</th>
            <th style="width:30%">Наименование</th>
            <th style="width:20%">Модель</th>
            <th style="width:15%">Инв. №</th>
            <th style="width:10%">Кол-во</th>
            <th style="width:20%">Выявленный дефект</th>
        </tr>
    </thead>
    <tbody>
        <tr><td class="center">1</td><td></td><td></td><td></td><td class="center"></td><td></td></tr>
        <tr><td class="center">2</td><td></td><td></td><td></td><td class="center"></td><td></td></tr>
        <tr><td class="center">3</td><td></td><td></td><td></td><td class="center"></td><td></td></tr>
        <tr><td class="center">4</td><td></td><td></td><td></td><td class="center"></td><td></td></tr>
        <tr><td class="center">5</td><td></td><td></td><td></td><td class="center"></td><td></td></tr>
    </tbody>
</table>

<p>Оборудование передано в ремонтную организацию:
<b>_____________________________________________</b>.</p>

<p>Ориентировочный срок ремонта: <b>______________</b> рабочих дней
с момента подписания настоящего акта.</p>

<p>Стоимость ремонта (предварительная): <b>______________</b> сум.</p>

<p style="margin-top: 24pt;"><b>Оборудование передал:</b>
   ____________________ / ____________________ /</p>
<p><b>Оборудование принял:</b>
   ____________________ / ____________________ /</p>

<p style="margin-top: 24pt;"><b>Председатель комиссии:</b>
   ____________________ / ${ctx.chairman} /</p>
<p><b>Члены комиссии:</b> ${ctx.members}</p>
<p>____________________ / ____________________ /</p>
<p>____________________ / ____________________ /</p>

<p class="small" style="margin-top: 30pt;">М.П.</p>
`;
}


// ============================================================
// ШАБЛОН 2 — АКТ СПИСАНИЯ
// ============================================================
function buildWriteOffAct(ctx) {
    const org = ctx.org?.name || '____________________________________';
    const addr = ctx.org
        ? [ctx.org.region, ctx.org.district].filter(Boolean).join(', ')
        : '____________________________________';

    return `
<h1>АКТ<br>о списании медицинского оборудования</h1>
<h2>№ ______ от ${ctx.cityDate}</h2>

<p><b>Организация:</b> ${org}</p>
<p><b>Адрес:</b> ${addr}</p>

<p>Комиссия в составе:</p>
<p><b>Председатель комиссии:</b> ${ctx.chairman}</p>
<p><b>Члены комиссии:</b> ${ctx.members}</p>

<p>произвела осмотр технического состояния нижеперечисленного медицинского
оборудования и установила, что оно пришло в негодность и дальнейшей
эксплуатации не подлежит.</p>

<table>
    <thead>
        <tr>
            <th style="width:5%">№</th>
            <th style="width:28%">Наименование</th>
            <th style="width:15%">Модель</th>
            <th style="width:14%">Инв. №</th>
            <th style="width:10%">Год вып.</th>
            <th style="width:12%">Кол-во</th>
            <th style="width:16%">Причина списания</th>
        </tr>
    </thead>
    <tbody>
        <tr><td class="center">1</td><td></td><td></td><td></td><td class="center"></td><td class="center"></td><td></td></tr>
        <tr><td class="center">2</td><td></td><td></td><td></td><td class="center"></td><td class="center"></td><td></td></tr>
        <tr><td class="center">3</td><td></td><td></td><td></td><td class="center"></td><td class="center"></td><td></td></tr>
        <tr><td class="center">4</td><td></td><td></td><td></td><td class="center"></td><td class="center"></td><td></td></tr>
        <tr><td class="center">5</td><td></td><td></td><td></td><td class="center"></td><td class="center"></td><td></td></tr>
    </tbody>
</table>

<p><b>Заключение комиссии:</b> указанное оборудование непригодно к дальнейшему
использованию по назначению, восстановлению не подлежит и подлежит списанию
и утилизации (разборке) в установленном порядке.</p>

<p>Остаточная стоимость на момент списания: <b>______________</b> сум.</p>
<p>Первоначальная стоимость: <b>______________</b> сум.</p>

<p style="margin-top: 24pt;"><b>Председатель комиссии:</b>
   ____________________ / ${ctx.chairman} /</p>
<p><b>Члены комиссии:</b> ${ctx.members}</p>
<p>____________________ / ____________________ /</p>
<p>____________________ / ____________________ /</p>

<p style="margin-top: 24pt;"><b>Главный бухгалтер:</b>
   ____________________ / ____________________ /</p>

<p style="margin-top: 24pt;"><b>Руководитель организации:</b>
   ____________________ / ____________________ /</p>

<p class="small" style="margin-top: 30pt;">М.П.</p>
`;
}


// ============================================================
// ШАБЛОН 3 — АКТ ВНУТРЕННЕГО ПЕРЕМЕЩЕНИЯ
// ============================================================
function buildTransferAct(ctx) {
    const org = ctx.org?.name || '____________________________________';

    return `
<h1>АКТ<br>внутреннего перемещения медицинского оборудования</h1>
<h2>№ ______ от ${ctx.cityDate}</h2>

<p><b>Организация:</b> ${org}</p>

<p>Комиссия в составе:</p>
<p><b>Председатель комиссии:</b> ${ctx.chairman}</p>
<p><b>Члены комиссии:</b> ${ctx.members}</p>

<p>произвела передачу нижеперечисленного медицинского оборудования
из одного подразделения в другое.</p>

<table>
    <thead>
        <tr>
            <th style="width:5%">№</th>
            <th style="width:30%">Наименование</th>
            <th style="width:18%">Модель</th>
            <th style="width:15%">Инв. №</th>
            <th style="width:10%">Кол-во</th>
            <th style="width:22%">Откуда → Куда</th>
        </tr>
    </thead>
    <tbody>
        <tr><td class="center">1</td><td></td><td></td><td></td><td class="center"></td><td></td></tr>
        <tr><td class="center">2</td><td></td><td></td><td></td><td class="center"></td><td></td></tr>
        <tr><td class="center">3</td><td></td><td></td><td></td><td class="center"></td><td></td></tr>
    </tbody>
</table>

<p style="margin-top: 24pt;"><b>Сдал:</b>
   ____________________ / ____________________ /</p>
<p><b>Принял:</b>
   ____________________ / ____________________ /</p>

<p class="small" style="margin-top: 30pt;">М.П.</p>
`;
}


// ============================================================
// СКАЧИВАНИЕ ГОТОВОГО .DOCX ИЗ SUPABASE STORAGE
//
// ВАЖНО: publishable-ключ не влияет на Storage public URL,
// но ?filename= ломает сигнатуру Storage → 400 Invalid signature.
// Имя файла задаётся через a.download / AndroidBridge, а НЕ через URL.
// ============================================================
function downloadDocxTemplate(type) {
    const url = TEMPLATE_URLS[type];
    const filename = TEMPLATE_FILENAMES[type] || 'Шаблон.docx';

    if (!url) {
        alert('Шаблон ещё не загружен в Supabase Storage.');
        return;
    }

    console.log('⬇️ Скачиваю шаблон:', filename);
    console.log('   URL:', url);
    console.log('🔎 AndroidBridge:', typeof window.AndroidBridge);
    console.log('🔎 downloadFile:', typeof (window.AndroidBridge && window.AndroidBridge.downloadFile));

    // Основной путь — через нативный мост
    if (window.AndroidBridge && typeof window.AndroidBridge.downloadFile === 'function') {
        window.AndroidBridge.downloadFile(url, filename);
        return;
    }

    // Fallback для браузера
    console.log('⚠️ AndroidBridge недоступен, использую fallback');
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
document.addEventListener('DOMContentLoaded', async () => {
    await loadOrganizationsIntoSelect();
});

console.log('✅ Страница шаблонов загружена');