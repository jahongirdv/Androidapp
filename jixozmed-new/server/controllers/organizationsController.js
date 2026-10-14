const pool = require('../db/pool');

// ============================================================
// GET /api/organizations
// Список всех организаций
// ============================================================
async function list(req, res) {
  try {
    const result = await pool.query(
      'SELECT * FROM organizations ORDER BY district ASC NULLS LAST, name ASC'
    );
    return res.json({ success: true, organizations: result.rows });
  } catch (err) {
    console.error('❌ /organizations list:', err);
    return res.status(500).json({ success: false, error: 'Внутренняя ошибка' });
  }
}

// ============================================================
// POST /api/organizations  (защищён JWT)
// Создать организацию
// ============================================================
async function create(req, res) {
  try {
    const {
      name, district, region, type,
      latitude, longitude,
      stir, address, head_name,
    } = req.body;

    if (!name || latitude == null || longitude == null) {
      return res.status(400).json({
        success: false,
        error: 'Поля name, latitude, longitude обязательны',
      });
    }

    const result = await pool.query(
      `INSERT INTO organizations
       (name, district, region, type, latitude, longitude, stir, address, head_name, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING *`,
      [
        name.trim(),
        district || null,
        region || null,
        type || null,
        latitude,
        longitude,
        stir || null,
        address || null,
        head_name || null,
        req.user?.id || null,
      ]
    );

    return res.status(201).json({ success: true, organization: result.rows[0] });
  } catch (err) {
    console.error('❌ /organizations create:', err);
    return res.status(500).json({ success: false, error: 'Внутренняя ошибка' });
  }
}

// ============================================================
// DELETE /api/organizations/:id  (защищён JWT)
// ============================================================
async function remove(req, res) {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM organizations WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Организация не найдена' });
    }

    return res.json({ success: true, deleted: result.rows[0].id });
  } catch (err) {
    console.error('❌ /organizations delete:', err);
    return res.status(500).json({ success: false, error: 'Внутренняя ошибка' });
  }
}

module.exports = { list, create, remove };
