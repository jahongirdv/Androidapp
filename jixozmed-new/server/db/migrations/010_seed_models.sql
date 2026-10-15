-- Сгенерировано автоматически 2026-10-14T09:24:03.282Z
-- Всего моделей: 6

TRUNCATE TABLE equipment_models RESTART IDENTITY;

INSERT INTO equipment_models (model, manufacturer, country, equipment) VALUES
('С856', 'United Products & Instruments, Inc', 'США', 'Лабораторная центрифуга'),
('MIL 3', 'PRO ACT', 'Великобритания', 'Ларингоскоп'),
('Drive Medical 18081', 'Drive Medical', 'Германия', 'Небулайзер'),
('Statim-5000S', 'Sci Can Ltd', 'Россия', 'Паровой стерилизатор'),
('ВК 75', 'ВК 75', 'Россия', 'Паровой стерилизатор'),
('Melag', 'Melag', 'Германия', 'Паровой стерилизатор')
ON CONFLICT (model) DO NOTHING;
