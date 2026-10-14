-- ============================================================
-- Таблица организаций (карта)
-- ============================================================
CREATE TABLE IF NOT EXISTS organizations (
    id           SERIAL PRIMARY KEY,
    name         VARCHAR(255) NOT NULL,
    district     VARCHAR(100),
    region       VARCHAR(100),
    type         VARCHAR(100),
    latitude     NUMERIC(10, 7) NOT NULL,
    longitude    NUMERIC(10, 7) NOT NULL,
    stir         VARCHAR(50),
    address      VARCHAR(500),
    head_name    VARCHAR(255),
    created_by   INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at   TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orgs_region   ON organizations(region);
CREATE INDEX IF NOT EXISTS idx_orgs_district ON organizations(district);
CREATE INDEX IF NOT EXISTS idx_orgs_name     ON organizations(name);

-- Триггер updated_at
DROP TRIGGER IF EXISTS trg_orgs_updated_at ON organizations;
CREATE TRIGGER trg_orgs_updated_at
    BEFORE UPDATE ON organizations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column()
