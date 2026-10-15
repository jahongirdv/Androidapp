-- ============================================================
-- Добавить недостающие поля в equipment_items
-- ============================================================
ALTER TABLE equipment_items
    ADD COLUMN IF NOT EXISTS serial_number    VARCHAR(100),
    ADD COLUMN IF NOT EXISTS manufacturer     VARCHAR(255),
    ADD COLUMN IF NOT EXISTS firm_country     VARCHAR(100),
    ADD COLUMN IF NOT EXISTS country          VARCHAR(100),
    ADD COLUMN IF NOT EXISTS uzasbo_name      VARCHAR(255),
    ADD COLUMN IF NOT EXISTS photos           JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS created_by_name  VARCHAR(255);

-- Проверим, что price уже есть (из 004_equipment.sql)
-- Если нет — добавим:
ALTER TABLE equipment_items
    ADD COLUMN IF NOT EXISTS price NUMERIC(15, 2);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_eq_serial  ON equipment_items(serial_number);
CREATE INDEX IF NOT EXISTS idx_eq_uzasbo  ON equipment_items(uzasbo_number);
