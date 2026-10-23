import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { refreshSupabaseStatus, type SupabaseServerStatus } from '../../lib/supabase/client';
import {
  Sparkles,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Building,
  ShoppingBag
} from 'lucide-react';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signInWithEmail, signUpWithEmail } = useAuth();

  // Modo inicial: login o registro
  const isRegisterInitial = location.pathname.includes('registro');
  const [isRegister, setIsRegister] = useState(isRegisterInitial);

  // Campos
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [accountRole, setAccountRole] = useState<'gerente' | 'cliente'>('gerente');
  const [showPassword, setShowPassword] = useState(false);

  // Estados de carga y mensajes
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [status, setStatus] = useState<SupabaseServerStatus | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadStatus = async () => {
      const serverStatus = await refreshSupabaseStatus();
      if (!isMounted) return;
      setStatus(serverStatus);
    };

    void loadStatus();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      setError('Por favor completa el correo y la contraseña.');
      return;
    }

    if (isRegister) {
      if (!fullName.trim()) {
        setError('Por favor introduce tu nombre completo.');
        return;
      }
      if (cleanPassword !== confirmPassword.trim()) {
        setError('Las contraseñas no coinciden.');
        return;
      }
      if (cleanPassword.length < 6) {
        setError('La contraseña debe tener al menos 6 caracteres.');
        return;
      }

      setLoading(true);
      try {
        const { error: signUpError } = await signUpWithEmail(
          cleanEmail,
          cleanPassword,
          fullName.trim(),
          accountRole
        );
        if (signUpError) {
          setError(signUpError.message || 'Error al crear la cuenta.');
        } else {
          // Si el usuario registrado es administrador/gerente, dirigir al dashboard
          if (accountRole === 'gerente') {
            navigate('/dashboard', { replace: true });
          } else {
            navigate('/', { replace: true });
          }
        }
      } catch (err: any) {
        setError(err?.message || 'Error inesperado durante el registro.');
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(true);
      try {
        const { error: signInError } = await signInWithEmail(cleanEmail, cleanPassword);
        if (signInError) {
          setError(signInError.message || 'Error al iniciar sesión. Verifica tu correo y contraseña.');
        } else {
          const storedRole = (localStorage.getItem('frenyer_user_role') || '').toLowerCase();
          const internalRoles = [
            'gerente',
            'administrador',
            'admin',
            'cajero',
            'ventas',
            'inventario',
            'almacenista',
            'contador',
            'superadmin',
            'soporte',
            'director',
            'propietario',
            'asociado',
            'personal'
          ];
          if (internalRoles.includes(storedRole)) {
            navigate('/dashboard', { replace: true });
          } else {
            navigate('/', { replace: true });
          }
        }
      } catch (err: any) {
        setError(err?.message || 'Error inesperado al iniciar sesión.');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <main className="auth-page">
      {/* Botón Volver al Catálogo */}
      <Link to="/" className="auth-back-link">
        <ArrowLeft className="w-4 h-4" />
        <span>Volver a la tienda</span>
      </Link>

      <section className="auth-container">
        {/* Cabecera */}
        <header className="auth-header">
          <div className="auth-logo-icon">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="auth-title">
            {isRegister ? 'Crear Cuenta' : 'Bienvenido a Frenyer'}
          </h2>
          <p className="auth-subtitle">
            {isRegister
              ? 'Genera tu usuario para acceder al sistema o comprar'
              : 'Accede a tu panel administrativo o portal de compras'}
          </p>
        </header>

        {/* Tarjeta de Autenticación */}
        <div className="auth-card" style={{ display: 'block' }}>
          {/* Mensajes de Alerta */}
          {error && (
            <div className="auth-alert-error">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="auth-alert-success">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* --- FORMULARIO CON CORREO / CONTRASEÑA --- */}
          <form className="auth-form" onSubmit={handleSubmit}>
                {isRegister && (
                  <>
                    <div className="auth-field">
                      <label>Nombre Completo</label>
                      <div className="auth-input-wrapper">
                        <User className="auth-input-icon" style={{ width: 16, height: 16 }} />
                        <input
                          type="text"
                          required
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="Ej. Juan Pérez"
                          className="auth-input"
                        />
                      </div>
                    </div>

                    <div className="auth-field">
                      <label>Tipo de acceso al sistema</label>
                      <div className="auth-role-select">
                        <button
                          type="button"
                          onClick={() => setAccountRole('gerente')}
                          className={`auth-role-option ${accountRole === 'gerente' ? 'selected' : ''}`}
                        >
                          <Building style={{ width: 14, height: 14, display: 'inline', marginRight: 4 }} />
                          Administrador / ERP
                        </button>
                        <button
                          type="button"
                          onClick={() => setAccountRole('cliente')}
                          className={`auth-role-option ${accountRole === 'cliente' ? 'selected' : ''}`}
                        >
                          <ShoppingBag style={{ width: 14, height: 14, display: 'inline', marginRight: 4 }} />
                          Cliente Tienda
                        </button>
                      </div>
                    </div>
                  </>
                )}

                <div className="auth-field">
                  <label>Correo Electrónico</label>
                  <div className="auth-input-wrapper">
                    <Mail className="auth-input-icon" style={{ width: 16, height: 16 }} />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tu@correo.com"
                      className="auth-input"
                    />
                  </div>
                </div>

                <div className="auth-field">
                  <label>Contraseña</label>
                  <div className="auth-input-wrapper">
                    <Lock className="auth-input-icon" style={{ width: 16, height: 16 }} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="auth-input has-toggle"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="auth-toggle-visibility"
                      title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                    >
                      {showPassword ? (
                        <EyeOff style={{ width: 16, height: 16 }} />
                      ) : (
                        <Eye style={{ width: 16, height: 16 }} />
                      )}
                    </button>
                  </div>
                </div>

                {isRegister && (
                  <div className="auth-field">
                    <label>Confirmar Contraseña</label>
                    <div className="auth-input-wrapper">
                      <Lock className="auth-input-icon" style={{ width: 16, height: 16 }} />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repite tu contraseña"
                        className="auth-input"
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="auth-submit-btn"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{isRegister ? 'Crear Cuenta e Ingresar' : 'Iniciar Sesión'}</span>
                </button>
            </form>

            {/* Alternar entre Login y Registro */}
            <div className="auth-footer">
              <span>{isRegister ? '¿Ya tienes una cuenta?' : '¿No tienes cuenta aún?'}</span>{' '}
              <button
                type="button"
                onClick={() => {
                  setIsRegister(!isRegister);
                  setError(null);
                  setSuccessMessage(null);
                }}
                className="auth-footer-btn"
              >
                {isRegister ? 'Inicia sesión aquí' : 'Genera tu usuario gratis'}
              </button>
            </div>
        </div>

        {status && (
          <p className="auth-status-note" style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: '#94a3b8' }}>
            Base de datos: {status.supabaseConnected ? 'Conectada (Supabase)' : 'Modo local activo'}
          </p>
        )}
      </section>
    </main>
  );
}
