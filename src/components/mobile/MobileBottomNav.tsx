import { useLocation, useNavigate } from 'react-router-dom';
import { Home, ShoppingCart, Package, FileBarChart2, MoreHorizontal } from 'lucide-react';

const ITEMS = [
  { key: 'inicio', label: 'Inicio', icon: Home, to: '/dashboard' },
  { key: 'ventas', label: 'Ventas', icon: ShoppingCart, to: '/ventas-flash/ventas' },
  { key: 'inventario', label: 'Inventario', icon: Package, to: '/inventarios/productos' },
  { key: 'reportes', label: 'Reportes', icon: FileBarChart2, to: '/ventas-flash/reporte' },
  { key: 'mas', label: 'Más', icon: MoreHorizontal, to: null },
];

export function MobileBottomNav({ onMore }: { onMore: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (to: string | null) => {
    if (!to) return false;
    return location.pathname === to || location.pathname.startsWith(to.split('/').slice(0, 2).join('/'));
  };

  return (
    <nav className="mobile-bottom-nav" aria-label="Navegación principal">
      {ITEMS.map((item) => {
        const Icon = item.icon;
        const active = item.to ? isActive(item.to) : false;
        return (
          <button
            key={item.key}
            type="button"
            className={`mobile-bottom-nav__item ${active ? 'is-active' : ''}`}
            onClick={() => (item.to ? navigate(item.to) : onMore())}
            aria-current={active ? 'page' : undefined}
          >
            <Icon size={20} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
