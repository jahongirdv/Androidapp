-- Разрешаем NULL для координат (организация может быть без точки на карте)
ALTER TABLE organizations ALTER COLUMN latitude  DROP NOT NULL;
ALTER TABLE organizations ALTER COLUMN longitude DROP NOT NULL;
