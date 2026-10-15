const pool = require('../db/pool');

// ============================================================
// GET /api/classifier/search?q=небул
// ============================================================
async function search(req, res) {
  try {
    const q = (req.query.q || '').trim().toLowerCase();
    if (q.length < 2) {
      return res.json({ success: true, results: [] });
    }

    const result = await pool.query(
      `SELECT id, keyword, section, point
       FROM classifier
       WHERE LOWER(keyword) LIKE $1
       ORDER BY
         CASE WHEN LOWER(keyword) = $2 THEN 0
              WHEN LOWER(keyword) LIKE $3 THEN 1
              ELSE 2 END,
         keyword ASC
       LIMIT 15`,
      [`%${q}%`, q, `${q}%`]
    );

    return res.json({ success: true, results: result.rows });
  } catch (err) {
    console.error('❌ /classifier/search:', err);
    return res.status(500).json({ success: false, error: 'Внутренняя ошибка' });
  }
}

// ============================================================
// GET /api/classifier/sections
// ============================================================
async function sections(req, res) {
  try {
    const result = await pool.query(
      `SELECT DISTINCT section FROM classifier ORDER BY section ASC`
    );
    return res.json({ success: true, sections: result.rows.map((r) => r.section) });
  } catch (err) {
    console.error('❌ /classifier/sections:', err);
    return res.status(500).json({ success: false, error: 'Внутренняя ошибка' });
  }
}

// ============================================================
// GET /api/classifier/points?section=X
// ============================================================
async function points(req, res) {
  try {
    const section = (req.query.section || '').trim();
    if (!section) return res.json({ success: true, points: [] });

    const result = await pool.query(
      `SELECT DISTINCT point FROM classifier
       WHERE section = $1
       ORDER BY point ASC`,
      [section]
    );
    return res.json({ success: true, points: result.rows.map((r) => r.point) });
  } catch (err) {
    console.error('❌ /classifier/points:', err);
    return res.status(500).json({ success: false, error: 'Внутренняя ошибка' });
  }
}

// ============================================================
// GET /api/classifier/names?section=X&point=Y
// ============================================================
async function names(req, res) {
  try {
    const { section, point } = req.query;
    if (!section || !point) return res.json({ success: true, names: [] });

    const result = await pool.query(
      `SELECT keyword FROM classifier
       WHERE section = $1 AND point = $2
       ORDER BY keyword ASC`,
      [section, point]
    );
    return res.json({ success: true, names: result.rows.map((r) => r.keyword) });
  } catch (err) {
    console.error('❌ /classifier/names:', err);
    return res.status(500).json({ success: false, error: 'Внутренняя ошибка' });
  }
}

// ============================================================
// GET /api/classifier/models?q=С856
// ============================================================
async function modelsSearch(req, res) {
  try {
    const q = (req.query.q || '').trim().toLowerCase();
    if (q.length < 2) {
      return res.json({ success: true, results: [] });
    }

    const result = await pool.query(
      `SELECT id, model, manufacturer, country, equipment
       FROM equipment_models
       WHERE LOWER(model) LIKE $1
       ORDER BY model ASC
       LIMIT 15`,
      [`%${q}%`]
    );

    return res.json({ success: true, results: result.rows });
  } catch (err) {
    console.error('❌ /models/search:', err);
    return res.status(500).json({ success: false, error: 'Внутренняя ошибка' });
  }
}

module.exports = { search, sections, points, names, modelsSearch };
