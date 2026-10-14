-- ============================================================
-- Таблица оборудования
-- ============================================================
CREATE TABLE IF NOT EXISTS equipment_items (
    id                     SERIAL PRIMARY KEY,
    organization_id        INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
    name                   VARCHAR(255) NOT NULL,
    model                  VARCHAR(255),
    inventory_number       VARCHAR(100),
    factory_number         VARCHAR(100),
    year_manufactured      INTEGER,
    condition              VARCHAR(50),
    classification         VARCHAR(255),
    classification_section VARCHAR(255),
    classification_point   VARCHAR(255),
    created_date           DATE,
    uzasbo_number          VARCHAR(100),
    price                  NUMERIC(15, 2),
    region                 VARCHAR(100),
    district               VARCHAR(100),
    responsible_person     VARCHAR(255),
    organization_name      VARCHAR(255),      -- на случай импорта из Excel
    created_at             TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at             TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_eq_org       ON equipment_items(organization_id);
CREATE INDEX IF NOT EXISTS idx_eq_inv       ON equipment_items(inventory_number);
CREATE INDEX IF NOT EXISTS idx_eq_name      ON equipment_items(name);

-- Триггер updated_at
DROP TRIGGER IF EXISTS trg_eq_updated_at ON equipment_items;
CREATE TRIGGER trg_eq_updated_at
    BEFORE UPDATE ON equipment_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
