import { useNavigate } from 'react-router-dom';
import { Bell, User, Wallet, RefreshCw } from 'lucide-react';
import { getBusinessProfile } from '../../lib/businessProfile';
import { getActiveExchangeRate } from '../../lib/currency';

export function MobileHeader() {
  const navigate = useNavigate();
  const profile = getBusinessProfile();
  const rate = getActiveExchangeRate();

  return (
    <header className="mobile-header">
      <div className="mobile-header__brand">
        {profile.logo ? (
          <img src={profile.logo} alt={profile.businessName} className="mobile-header__logo-img" />
        ) : (
          <span className="mobile-header__logo">Fren<span>y</span>er</span>
        )}
      </div>
      <div className="mobile-header__center">
        <button type="button" className="mobile-header__rate" onClick={() => navigate('/cuentas/caja')} title="Tasa de cambio">
          Bs. {rate.toFixed(2)}
        </button>
      </div>
      <div className="mobile-header__actions">
        <button type="button" className="mobile-header__icon" aria-label="Notificaciones">
          <Bell size={16} />
        </button>
        <button type="button" className="mobile-header__avatar" aria-label="Perfil" onClick={() => navigate('/configuracion')}>
          <User size={16} />
        </button>
      </div>
    </header>
  );
}
