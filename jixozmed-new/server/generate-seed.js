const bcrypt = require('bcrypt');
const fs = require('fs');

const users = [
  { login: 'jahondv',       name: 'Администратор системы',                 role: 'Администратор', region: 'Минздрав РУз',                  phone: '998777592055' },
  { login: 'b.djamuratov',  name: 'DJAMURATOV BATIRBEK MURATBAEVICH',     role: 'Регион админ',  region: "Qoraqalpog'iston Respublikasi", phone: null },
  { login: 'n.barlikov',    name: 'BARLIKOV NAURZBAY KAMALATDINOVICH',   role: 'Регион админ',  region: "Qoraqalpog'iston Respublikasi", phone: null },
  { login: 'q.isakov',      name: 'ISAKOV QUWAT RUSTEMBAY ULI',           role: 'Регион админ',  region: "Qoraqalpog'iston Respublikasi", phone: null },
  { login: 's.doshniyazov', name: 'DOSHNIYAZOV SALAMAT ORINBAYEVICH',    role: 'Регион админ',  region: "Qoraqalpog'iston Respublikasi", phone: null },
  { login: 'b.erimbetov',   name: 'ERIMBETOV BEKJAN NURJANOVICH',        role: 'Регион админ',  region: "Qoraqalpog'iston Respublikasi", phone: null },
  { login: 'd.asanov',      name: 'ASANOV DAMIR KUANDIKOVICH',            role: 'Регион админ',  region: "Qoraqalpog'iston Respublikasi", phone: null },
  { login: 't.rasulov',     name: 'RASULOV TIMUR VLADIMIROVICH',          role: 'Регион админ',  region: "Qoraqalpog'iston Respublikasi", phone: null },
  { login: 'b.utemisov',    name: 'UTEMISOV BAXRAM KEUNIMJAEVICH',        role: 'Регион админ',  region: "Qoraqalpog'iston Respublikasi", phone: null },
  { login: 'm.jadigerov',   name: 'JADIGEROV MANSUR TOKTARBAEVICH',       role: 'Регион админ',  region: "Qoraqalpog'iston Respublikasi", phone: null },
  { login: 'm.erjanov',     name: 'ERJANOV MARAT SAGALATDINOVICH',        role: 'Регион админ',  region: "Qoraqalpog'iston Respublikasi", phone: null },
  { login: 's.soy',         name: 'SOY SERGEY VYACHESLAVOVICH',           role: 'Регион админ',  region: "Qoraqalpog'iston Respublikasi", phone: null }
];

const esc = (v) => v === null ? 'NULL' : `'${v.replace(/'/g, "''")}'`;

const lines = users.map(u => {
  const hash = bcrypt.hashSync('1234', 10);
  return `(${esc(u.login)}, '${hash}', ${esc(u.name)}, ${esc(u.role)}, ${esc(u.region)}, ${esc(u.phone)})`;
});

const sql = `-- Сгенерировано автоматически ${new Date().toISOString()}
INSERT INTO users (login, password_hash, name, role, region, phone) VALUES
${lines.join(',\n')}
ON CONFLICT (login) DO NOTHING;
`;

fs.writeFileSync('db/migrations/002_seed_users.sql', sql);
console.log('✅ Создан db/migrations/002_seed_users.sql');
console.log(`   ${users.length} пользователей`);
