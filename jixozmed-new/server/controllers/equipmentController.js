const pool = require('../db/pool');

// GET /api/equipment?organization_id=X
async function list(req, res) {
  try {
    const { organization_id } = req.query;
    let result;

    if (organization_id) {
      result = await pool.query(
        'SELECT * FROM equipment_items WHERE organization_id = $1 ORDER BY id DESC',
        [organization_id]
      );
    } else {
      result = await pool.query('SELECT * FROM equipment_items ORDER BY id DESC LIMIT 5000');
    }

    return res.json({ success: true, equipment: result.rows });
  } catch (err) {
    console.error('❌ /equipment list:', err);
    return res.status(500).json({ success: false, error: 'Внутренняя ошибка' });
  }
}

// GET /api/equipment/:id
async function getOne(req, res) {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM equipment_items WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Не найдено' });
    }
    return res.json({ success: true, equipment: result.rows[0] });
  } catch (err) {
    console.error('❌ /equipment get:', err);
    return res.status(500).json({ success: false, error: 'Внутренняя ошибка' });
  }
}

// GET /api/equipment/counts
async function counts(req, res) {
  try {
    const result = await pool.query(
      `SELECT organization_id, COUNT(*)::int AS count
       FROM equipment_items
       WHERE organization_id IS NOT NULL
       GROUP BY organization_id`
    );
    const map = {};
    result.rows.forEach((r) => { map[r.organization_id] = r.count; });
    return res.json({ success: true, counts: map });
  } catch (err) {
    console.error('❌ /equipment counts:', err);
    return res.status(500).json({ success: false, error: 'Внутренняя ошибка' });
  }
}

// POST /api/equipment
async function create(req, res) {
  try {
    const b = req.body;
    const result = await pool.query(
      `INSERT INTO equipment_items
       (organization_id, name, model, inventory_number, serial_number, factory_number,
        year_manufactured, condition, classification, classification_section,
        classification_point, created_date, uzasbo_number, uzasbo_name, price,
        region, district, responsible_person, organization_name,
        manufacturer, firm_country, country, photos, created_by_name)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24)
       RETURNING *`,
      [
        b.organization_id || null, b.name, b.model || null,
        b.inventory_number || null, b.serial_number || null,
        b.factory_number || null, b.year_manufactured || null,
        b.condition || null, b.classification || null,
        b.classification_section || null, b.classification_point || null,
        b.created_date || null, b.uzasbo_number || null,
        b.uzasbo_name || null, b.price || null, b.region || null,
        b.district || null, b.responsible_person || null,
        b.organization_name || null, b.manufacturer || null,
        b.firm_country || null, b.country || null,
        JSON.stringify(b.photos || []),
        req.user?.name || req.user?.login || null,
      ]
    );

    return res.status(201).json({ success: true, equipment: result.rows[0] });
  } catch (err) {
    console.error('❌ /equipment create:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

// PUT /api/equipment/:id
async function update(req, res) {
  try {
    const { id } = req.params;
    const b = req.body;
    const result = await pool.query(
      `UPDATE equipment_items SET
        organization_id = $1, name = $2, model = $3,
        inventory_number = $4, serial_number = $5, factory_number = $6,
        year_manufactured = $7, condition = $8, classification = $9,
        classification_section = $10, classification_point = $11,
        created_date = $12, uzasbo_number = $13, uzasbo_name = $14,
        price = $15, region = $16, district = $17, responsible_person = $18,
        organization_name = $19, manufacturer = $20, firm_country = $21,
        country = $22, photos = $23
       WHERE id = $24
       RETURNING *`,
      [
        b.organization_id || null, b.name, b.model || null,
        b.inventory_number || null, b.serial_number || null,
        b.factory_number || null, b.year_manufactured || null,
        b.condition || null, b.classification || null,
        b.classification_section || null, b.classification_point || null,
        b.created_date || null, b.uzasbo_number || null,
        b.uzasbo_name || null, b.price || null, b.region || null,
        b.district || null, b.responsible_person || null,
        b.organization_name || null, b.manufacturer || null,
        b.firm_country || null, b.country || null,
        JSON.stringify(b.photos || []),
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Не найдено' });
    }

    return res.json({ success: true, equipment: result.rows[0] });
  } catch (err) {
    console.error('❌ /equipment update:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}

// DELETE /api/equipment/:id
async function remove(req, res) {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM equipment_items WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Не найдено' });
    }
    return res.json({ success: true, deleted: result.rows[0].id });
  } catch (err) {
    console.error('❌ /equipment delete:', err);
    return res.status(500).json({ success: false, error: 'Внутренняя ошибка' });
  }
}

module.exports = { list, getOne, counts, create, update, remove };
