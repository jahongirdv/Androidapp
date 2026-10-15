const fs = require('fs');
const path = require('path');

// Читаем type.js из старого проекта
const typeJsPath = path.join(
  process.env.HOME,
  'AndroidStudioProjects/Androidapp/app/src/main/assets/js/type.js'
);

const content = fs.readFileSync(typeJsPath, 'utf8');

// Извлекаем equipmentDatabase через eval в песочнице
const match = content.match(/const equipmentDatabase\s*=\s*(\{[\s\S]*?\n\};)/);
if (!match) {
  console.error('❌ Не найден equipmentDatabase в type.js');
  process.exit(1);
}

// Выполняем объект
const equipmentDatabase = eval('(' + match[1].replace(/;$/, '') + ')');

console.log(`📦 Классификаций: ${Object.keys(equipmentDatabase).length}`);

// Экранирование одинарных кавычек
const esc = (v) => v == null ? 'NULL' : `'${String(v).replace(/'/g, "''")}'`;

const lines = Object.entries(equipmentDatabase).map(([keyword, data]) => {
  return `(${esc(keyword)}, ${esc(data.section)}, ${esc(data.point)})`;
});

const sql = `-- Сгенерировано автоматически ${new Date().toISOString()}
-- Всего классификаций: ${Object.keys(equipmentDatabase).length}

TRUNCATE TABLE classifier RESTART IDENTITY;

INSERT INTO classifier (keyword, section, point) VALUES
${lines.join(',\n')}
ON CONFLICT DO NOTHING;
`;

fs.writeFileSync(
  path.join(__dirname, 'db/migrations/009_seed_classifier.sql'),
  sql
);

console.log(`✅ Создан db/migrations/009_seed_classifier.sql`);

// То же для моделей
const modelsMatch = content.match(/const modelsDatabase\s*=\s*(\[[\s\S]*?\n\]);/);
if (modelsMatch) {
  const modelsDatabase = eval('(' + modelsMatch[1].replace(/;$/, '') + ')');
  console.log(`📦 Моделей: ${modelsDatabase.length}`);

  const modelLines = modelsDatabase.map((m) => {
    return `(${esc(m.model)}, ${esc(m.manufacturer)}, ${esc(m.country)}, ${esc(m.equipment)})`;
  });

  const modelsSql = `-- Сгенерировано автоматически ${new Date().toISOString()}
-- Всего моделей: ${modelsDatabase.length}

TRUNCATE TABLE equipment_models RESTART IDENTITY;

INSERT INTO equipment_models (model, manufacturer, country, equipment) VALUES
${modelLines.join(',\n')}
ON CONFLICT (model) DO NOTHING;
`;

  fs.writeFileSync(
    path.join(__dirname, 'db/migrations/010_seed_models.sql'),
    modelsSql
  );
  console.log(`✅ Создан db/migrations/010_seed_models.sql`);
}
