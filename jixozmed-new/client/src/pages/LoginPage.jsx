import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { login as apiLogin, verifySms } from '../api/auth';
import './LoginPage.css';

export default function LoginPage() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [loginValue, setLoginValue] = useState('');
  const [password, setPassword] = useState('');
  const [smsCode, setSmsCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  async function handleLogin(e) {
    if (e) e.preventDefault();
    setError('');
    setInfo('');

    if (!loginValue) return setError('Введите логин');
    if (!password) return setError('Введите пароль');

    setLoading(true);
    try {
      const res = await apiLogin(loginValue, password);
      if (!res.success) {
        setError('❌ ' + (res.error || 'Ошибка входа'));
        return;
      }
      setPhone(res.phone || '');
      setStep(2);
      setResendTimer(60);
      if (res.dev_code) console.log('🔑 Демо-код:', res.dev_code);
    } catch (err) {
      setError('❌ ' + (err.response?.data?.error || 'Ошибка соединения с сервером'));
    } finally {
      setLoading(false);
    }
  }

  async function handleSms(e) {
    if (e) e.preventDefault();
    setError('');
    setInfo('');

    if (smsCode.length !== 4) return setError('Введите 4-значный код');

    setLoading(true);
    try {
      const res = await verifySms(loginValue, smsCode);
      if (!res.success) {
        setError('❌ ' + (res.error || 'Неверный код'));
        return;
      }
      localStorage.setItem('jixozmed_token', res.token);
      localStorage.setItem('jixozmed_user', JSON.stringify(res.user));
      setInfo('✅ Вход выполнен!');
      setTimeout(() => navigate('/dashboard'), 500);
    } catch (err) {
      setError('❌ ' + (err.response?.data?.error || 'Ошибка соединения'));
    } finally {
      setLoading(false);
    }
  }

  function backToStep1() {
    setStep(1);
    setSmsCode('');
    setError('');
    setInfo('');
    setResendTimer(0);
  }

  return (
    <div className="login-page">
      <div className="login-wrap">
        <div className="login-logo">
          <i className="fas fa-cube"></i>
        </div>
        <h1 className="login-title">JixozMed</h1>
        <p className="login-subtitle">Система учёта медицинского оборудования</p>

        {step === 1 && (
          <form className="login-card" onSubmit={handleLogin}>
            <h2>Вход в систему</h2>

            <div className="login-field">
              <label>Логин</label>
              <div className="login-input-wrap">
                <i className="fas fa-user"></i>
                <input
                  type="text"
                  placeholder="Введите логин"
                  value={loginValue}
                  onChange={(e) => setLoginValue(e.target.value)}
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="login-field">
              <label>Пароль</label>
              <div className="login-input-wrap">
                <i className="fas fa-lock"></i>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Введите пароль"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="login-eye"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <i className={showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'}></i>
                </button>
              </div>
            </div>

            <button className="login-btn" type="submit" disabled={loading}>
              <i className="fas fa-sign-in-alt"></i> {loading ? 'Проверка...' : 'Войти'}
            </button>

            <div
              className="login-error"
              style={{ color: error ? '#ff8a80' : info ? '#2ecc71' : 'transparent' }}
            >
              {error || info || '.'}
            </div>
          </form>
        )}

        {step === 2 && (
          <form className="login-card" onSubmit={handleSms}>
            <h2>Подтверждение входа</h2>
            <p className="login-hint">
              Мы отправили код на номер <strong>{phone}</strong>
            </p>

            <div className="login-field">
              <label>Код из SMS</label>
              <div className="login-input-wrap">
                <i className="fas fa-sms"></i>
                <input
                  type="tel"
                  maxLength={4}
                  inputMode="numeric"
                  placeholder="Введите 4-значный код"
                  value={smsCode}
                  onChange={(e) => setSmsCode(e.target.value.replace(/\D/g, ''))}
                  autoComplete="one-time-code"
                />
              </div>
            </div>

            <button className="login-btn" type="submit" disabled={loading}>
              <i className="fas fa-check"></i> {loading ? 'Проверка...' : 'Подтвердить'}
            </button>

            <div
              className="login-error"
              style={{ color: error ? '#ff8a80' : info ? '#2ecc71' : 'transparent' }}
            >
              {error || info || '.'}
            </div>

            <div className="login-resend">
              <button
                type="button"
                className="login-link"
                disabled={resendTimer > 0}
                onClick={handleLogin}
              >
                Отправить код повторно
              </button>
              {resendTimer > 0 && (
                <span className="resend-timer">Повторно через {resendTimer} сек</span>
              )}
            </div>

            <button type="button" className="login-back" onClick={backToStep1}>
              <i className="fas fa-arrow-left"></i> Назад
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
