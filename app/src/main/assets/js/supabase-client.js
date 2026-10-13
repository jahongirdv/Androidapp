// ============================================================
// SUPABASE CLIENT — подключение к базе JixozMed
// ============================================================

const SUPABASE_URL = 'https://wlkdqacnorodktuihgzs.supabase.co';
const SUPABASE_KEY = 'sb_publishable_hMybap843BWo_9AX2ZUtRA_zvuYbdms'; // ← ВСТАВЬТЕ ВАШ КЛЮЧ ЦЕЛИКОМ



window.SUPABASE_URL = SUPABASE_URL;
window.SUPABASE_KEY = SUPABASE_KEY;
window.SUPABASE_ANON_KEY = SUPABASE_KEY;



// ============================================================
// ЗАГРУЗКА ВСЕХ ЗАПИСЕЙ ИЗ СПРАВОЧНИКА
// ============================================================
async function fetchEquipment() {
    console.log('🔄 Загрузка справочника из Supabase...');

    try {
        const res = await fetch(
            `${SUPABASE_URL}/rest/v1/equipment?select=*&order=section,point,key`,
            {
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`
                }
            }
        );

        if (!res.ok) throw new Error('HTTP ' + res.status);

        const data = await res.json();
        console.log('✅ Загружено записей:', data.length);

        // Кэшируем для офлайн-режима
        try {
            localStorage.setItem('jixozmed_equipment_cache', JSON.stringify(data));
            localStorage.setItem('jixozmed_equipment_cache_time', Date.now());
        } catch (e) {
            console.warn('Кэш не сохранился:', e);
        }

        return data;
    } catch (e) {
        console.warn('❌ Supabase не ответил:', e);
        // Пробуем взять из кэша
        const cached = localStorage.getItem('jixozmed_equipment_cache');
        if (cached) {
            const data = JSON.parse(cached);
            console.log('📦 Взято из кэша:', data.length);
            return data;
        }
        return [];
    }
}

// ============================================================
// ПОИСК ПО СПРАВОЧНИКУ
// ============================================================
async function searchEquipment(query) {
    if (!query || !query.trim()) return [];
    const q = query.trim().toLowerCase();

    // Простой поиск по кэшу (без запроса в Supabase)
    const cached = localStorage.getItem('jixozmed_equipment_cache');
    if (cached) {
        const data = JSON.parse(cached);
        return data.filter(item =>
            item.key.toLowerCase().includes(q) ||
            item.section.toLowerCase().includes(q) ||
            item.point.toLowerCase().includes(q)
        );
    }

    // Если кэша нет — тянем с сервера
    const res = await fetch(
        `${SUPABASE_URL}/rest/v1/equipment?select=*&key=ilike.*${encodeURIComponent(q)}*`,
        {
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`
            }
        }
    );
    if (!res.ok) return [];
    return await res.json();
}


// ============================================================
// ОРГАНИЗАЦИИ
// ============================================================
async function fetchOrganizationsFromSupabase() {
    try {
        const res = await fetch(
            `${SUPABASE_URL}/rest/v1/organizations?select=*&order=region,district,name`,
            {
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`
                }
            }
        );
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const data = await res.json();
        console.log('✅ Организации загружены:', data.length);

        try {
            localStorage.setItem('jixozmed_orgs_cache', JSON.stringify(data));
            localStorage.setItem('jixozmed_orgs_cache_time', Date.now());
        } catch (e) {
            console.warn('Кэш организаций не сохранился:', e);
        }
        return data;
    } catch (e) {
        console.warn('❌ Организации не загрузились:', e);
        const cached = localStorage.getItem('jixozmed_orgs_cache');
        if (cached) {
            const data = JSON.parse(cached);
            console.log('📦 Организации из кэша:', data.length);
            return data;
        }
        return [];
    }
}

// ============================================================
// ОБОРУДОВАНИЕ КОНКРЕТНОЙ ОРГАНИЗАЦИИ
// ============================================================
async function fetchEquipmentByOrgFromSupabase(orgId) {
    const res = await fetch(
        `${SUPABASE_URL}/rest/v1/equipment_items?organization_id=eq.${orgId}&select=*&order=id.asc`,
        {
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`
            }
        }
    );
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return await res.json();
}

// ============================================================
// СЧЁТЧИКИ ОБОРУДОВАНИЯ ПО ОРГАНИЗАЦИЯМ
// ============================================================
async function fetchEquipmentCountsFromSupabase() {
    try {
        const res = await fetch(
            `${SUPABASE_URL}/rest/v1/rpc/equipment_count_by_org`,
            {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: '{}'
            }
        );
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const rows = await res.json();
        const map = {};
        rows.forEach(r => { map[r.organization_id] = Number(r.cnt); });
        return map;
    } catch (e) {
        console.warn('❌ Счётчики не загрузились:', e);
        return {};
    }
}