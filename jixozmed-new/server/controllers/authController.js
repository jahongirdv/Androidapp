const bcrypt = require('bcrypt');
const pool = require('../db/pool');

// ============================================================
// POST /api/auth/login
// Тело: { login, password }
// Ответ: { success, phone, message, dev_code? }
// ============================================================
async function login(req, res) {
  try {
    const { login, password } = req.body;

    if (!login || !password) {
      return res.status(400).json({ success: false, error: 'Логин и пароль обязательны' });
    }

    const result = await pool.query(
      'SELECT id, login, password_hash, name, role, region, phone, is_active FROM users WHERE login = $1',
      [login.toLowerCase().trim()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, error: 'Неверный логин или пароль' });
    }

    const user = result.rows[0];

    if (!user.is_active) {
      return res.status(403).json({ success: false, error: 'Аккаунт заблокирован' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ success: false, error: 'Неверный логин или пароль' });
    }

    const code = String(Math.floor(1000 + Math.random() * 9000));
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await pool.query('DELETE FROM sms_codes WHERE user_id = $1 AND used = FALSE', [user.id]);
    await pool.query(
      'INSERT INTO sms_codes (user_id, code, expires_at) VALUES ($1, $2, $3)',
      [user.id, code, expiresAt]
    );

    console.log(`📱 SMS-код для ${user.login}: ${code} (действует до ${expiresAt.toLocaleTimeString()})`);

    const phone = user.phone
      ? '+' + user.phone.slice(0, 3) + ' ** *** ' + user.phone.slice(-2)
      : '+998 ** *** ** **';

    return res.json({
      success: true,
      phone,
      message: 'Код отправлен',
      ...(process.env.NODE_ENV === 'development' && { dev_code: code }),
    });
  } catch (err) {
    console.error('❌ Ошибка в /login:', err);
    return res.status(500).json({ success: false, error: 'Внутренняя ошибка сервера' });
  }
}

// ============================================================
// POST /api/auth/verify-sms
// Тело: { login, code }
// Ответ: { success, token, user: { id, login, name, role, region } }
// ============================================================
async function verifySms(req, res) {
  try {
    const { login, code } = req.body;

    if (!login || !code) {
      return res.status(400).json({ success: false, error: 'Логин и код обязательны' });
    }

    const userResult = await pool.query(
      'SELECT id, login, name, role, region, phone FROM users WHERE login = $1',
      [login.toLowerCase().trim()]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ success: false, error: 'Пользователь не найден' });
    }

    const user = userResult.rows[0];

    const codeResult = await pool.query(
      `SELECT id, code, expires_at, used
       FROM sms_codes
       WHERE user_id = $1 AND used = FALSE
       ORDER BY id DESC LIMIT 1`,
      [user.id]
    );

    if (codeResult.rows.length === 0) {
      return res.status(401).json({ success: false, error: 'Код не найден. Запросите новый.' });
    }

    const sms = codeResult.rows[0];

    if (new Date(sms.expires_at) < new Date()) {
      return res.status(401).json({ success: false, error: 'Код истёк. Запросите новый.' });
    }

    if (sms.code !== String(code)) {
      return res.status(401).json({ success: false, error: 'Неверный код' });
    }

    await pool.query('UPDATE sms_codes SET used = TRUE WHERE id = $1', [sms.id]);

    const { signToken } = require('../utils/jwt');
    const token = signToken(user);

    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        login: user.login,
        name: user.name,
        role: user.role,
        region: user.region,
      },
    });
  } catch (err) {
    console.error('❌ Ошибка в /verify-sms:', err);
    return res.status(500).json({ success: false, error: 'Внутренняя ошибка сервера' });
  }
}

// ============================================================
// GET /api/auth/me  (защищённый роут)
// ============================================================
async function me(req, res) {
  try {
    const result = await pool.query(
      'SELECT id, login, name, role, region, phone FROM users WHERE id = $1',
      [req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Пользователь не найден' });
    }
    return res.json({ success: true, user: result.rows[0] });
  } catch (err) {
    console.error('❌ Ошибка в /me:', err);
    return res.status(500).json({ success: false, error: 'Внутренняя ошибка сервера' });
  }
}

module.exports = { login, verifySms, me };
