const pool = require('../db/pool');

// ============================================================
// GET /api/equipment?organization_id=X
// Список оборудования организации
// ============================================================
async function list(req, res) {
  try {
    const { organization_id } = req.query;

    let result;
    if (organization_id) {
      result = await pool.query(
        'SELECT * FROM equipment_items WHERE organization_id = $1 ORDER BY id ASC',
        [organization_id]
      );
    } else {
      result = await pool.query('SELECT * FROM equipment_items ORDER BY id ASC LIMIT 1000');
    }

    return res.json({ success: true, equipment: result.rows });
  } catch (err) {
    console.error('❌ /equipment list:', err);
    return res.status(500).json({ success: false, error: 'Внутренняя ошибка' });
  }
}

// ============================================================
// GET /api/equipment/counts
// Счётчики по организациям: { org_id: count, ... }
// ============================================================
async function counts(req, res) {
  try {
    const result = await pool.query(
      `SELECT organization_id, COUNT(*)::int AS count
       FROM equipment_items
       WHERE organization_id IS NOT NULL
       GROUP BY organization_id`
    );
    const map = {};
    result.rows.forEach((r) => {
      map[r.organization_id] = r.count;
    });
    return res.json({ success: true, counts: map });
  } catch (err) {
    console.error('❌ /equipment counts:', err);
    return res.status(500).json({ success: false, error: 'Внутренняя ошибка' });
  }
}

// ============================================================
// POST /api/equipment
// ============================================================
async function create(req, res) {
  try {
    const {
      organization_id, name, model, inventory_number, factory_number,
      year_manufactured, condition, classification, classification_section,
      classification_point, created_date, uzasbo_number, price,
      region, district, responsible_person, organization_name,
    } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, error: 'Поле name обязательно' });
    }

    const result = await pool.query(
      `INSERT INTO equipment_items
       (organization_id, name, model, inventory_number, factory_number,
        year_manufactured, condition, classification, classification_section,
        classification_point, created_date, uzasbo_number, price,
        region, district, responsible_person, organization_name)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
       RETURNING *`,
      [
        organization_id || null, name, model || null, inventory_number || null,
        factory_number || null, year_manufactured || null, condition || null,
        classification || null, classification_section || null,
        classification_point || null, created_date || null,
        uzasbo_number || null, price || null, region || null,
        district || null, responsible_person || null, organization_name || null,
      ]
    );

    return res.status(201).json({ success: true, equipment: result.rows[0] });
  } catch (err) {
    console.error('❌ /equipment create:', err);
    return res.status(500).json({ success: false, error: 'Внутренняя ошибка' });
  }
}

// ============================================================
// DELETE /api/equipment/:id
// ============================================================
async function remove(req, res) {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM equipment_items WHERE id = $1 RETURNING id',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Оборудование не найдено' });
    }
    return res.json({ success: true, deleted: result.rows[0].id });
  } catch (err) {
    console.error('❌ /equipment delete:', err);
    return res.status(500).json({ success: false, error: 'Внутренняя ошибка' });
  }
}

module.exports = { list, counts, create, remove };
