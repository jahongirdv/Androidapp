-- ============================================================
-- Справочник классификации оборудования
-- ============================================================
CREATE TABLE IF NOT EXISTS classifier (
    id         SERIAL PRIMARY KEY,
    keyword    VARCHAR(255) NOT NULL,       -- "небулайзер"
    section    VARCHAR(255) NOT NULL,       -- "Физиотерапевтические аппараты"
    point      VARCHAR(255) NOT NULL,       -- "Ингаляционная терапия"
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_classifier_keyword ON classifier(keyword);
CREATE INDEX IF NOT EXISTS idx_classifier_section ON classifier(section);
CREATE INDEX IF NOT EXISTS idx_classifier_point   ON classifier(point);

-- ============================================================
-- Справочник моделей оборудования
-- ============================================================
CREATE TABLE IF NOT EXISTS equipment_models (
    id           SERIAL PRIMARY KEY,
    model        VARCHAR(255) NOT NULL UNIQUE,  -- "С856"
    manufacturer VARCHAR(255),                   -- "United Products & Instruments, Inc"
    country      VARCHAR(100),                   -- "США"
    equipment    VARCHAR(255),                   -- "Лабораторная центрифуга"
    created_at   TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_models_model ON equipment_models(model);
