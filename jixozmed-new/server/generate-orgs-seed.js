const fs = require('fs');

const raw = fs.readFileSync('./organizations_rows.json', 'utf8');
const orgs = JSON.parse(raw);

console.log(`📦 Всего организаций в JSON: ${orgs.length}`);

const esc = (v) => v == null ? 'NULL' : `'${String(v).replace(/'/g, "''")}'`;
const num = (v) => v == null ? 'NULL' : Number(v);

const lines = orgs.map((o) =>
  `(${esc(o.name)}, ${esc(o.district)}, ${esc(o.region)}, ${esc(o.type)}, ${num(o.latitude)}, ${num(o.longitude)}, 1)`
);

const sql = `-- Сгенерировано автоматически ${new Date().toISOString()}
-- Всего организаций: ${orgs.length}

-- Удаляем существующие организации и сбрасываем ID
TRUNCATE TABLE organizations RESTART IDENTITY CASCADE;

INSERT INTO organizations (name, district, region, type, latitude, longitude, created_by) VALUES
${lines.join(',\n')};
`;

fs.writeFileSync('./db/migrations/005_seed_organizations.sql', sql);

const withCoords = orgs.filter(o => o.latitude != null && o.longitude != null).length;
const withoutCoords = orgs.length - withCoords;

console.log(`✅ Создан db/migrations/005_seed_organizations.sql`);
console.log(`   Организаций: ${orgs.length}`);
console.log(`   С координатами: ${withCoords}`);
console.log(`   Без координат: ${withoutCoords}`);
