import { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { formatUSD, getActiveExchangeRate } from '../lib/currency';
import { authenticatedFetch } from '../lib/supabase/api';

interface Product {
  id: string;
  sku: string;
  name: string;
  stock: number;
  min_stock: number;
  cost_usd: number;
  price_usd: number;
}

interface TopProduct {
  name: string;
  totalQuantity: number;
}

interface DashboardSummary {
  salesUsd: number;
  monthlyProfit: number;
  receivableDueUsd: number;
  receivableDueCount: number;
  payableDueUsd: number;
  payableDueCount: number;
  stockUnits: number;
  lowStockProductsCount: number;
  receivables: any[];
  payables: any[];
  topProducts: TopProduct[];
  lowStockProductsList: Product[];
}

const EMPTY_SUMMARY: DashboardSummary = {
  salesUsd: 0,
  monthlyProfit: 0,
  receivableDueUsd: 0,
  receivableDueCount: 0,
  payableDueUsd: 0,
  payableDueCount: 0,
  stockUnits: 0,
  lowStockProductsCount: 0,
  topProducts: [],
  lowStockProductsList: [],
  receivables: [],
  payables: []
};

export function Dashboard() {
  const [summary, setSummary] = useState(EMPTY_SUMMARY);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    const loadSummary = async () => {
      setIsLoading(true);
      setLoadError('');

      try {
        const activeRate = getActiveExchangeRate();
        const res = await authenticatedFetch(
          `/api/dashboard/summary?rate=${encodeURIComponent(String(activeRate || 1))}`
        );

        if (res.status === 401 || res.status === 403) {
          setLoadError('Tu sesión expiró o no es válida. Cierra sesión y vuelve a iniciar sesión para ver tus datos.');
          setSummary(EMPTY_SUMMARY);
          return;
        }

        if (!res.ok) {
          throw new Error('No se pudieron cargar los indicadores.');
        }

        const json = await res.json();
        if (json?.success && json?.data) {
          setSummary({ ...EMPTY_SUMMARY, ...json.data });
        } else {
          setSummary(EMPTY_SUMMARY);
        }
      } catch (error) {
        setSummary(EMPTY_SUMMARY);
        setLoadError(error instanceof Error ? error.message : 'No se pudieron cargar los indicadores.');
      } finally {
        setIsLoading(false);
      }
    };

    void loadSummary();

    const handleReconfig = () => {
      void loadSummary();
    };
    window.addEventListener('frenyer:supabase-configured', handleReconfig);
    return () => window.removeEventListener('frenyer:supabase-configured', handleReconfig);
  }, []);

  return (
    <div className="content m-root dash-root">
      <div className="page-head">
        <div>
          <h1>Resumen operativo</h1>
          <p>Indicadores clave de tu organización.</p>
        </div>
      </div>

      {loadError ? (
        <EmptyState title="No se pudieron cargar los indicadores" description={loadError} />
      ) : (
        <>
          <div className="grid grid-4 kpi-duo">
            <Card>
              <div className="kpi-label">Ventas Totales (7 días)</div>
              <div className="kpi-value positive">{isLoading ? '—' : formatUSD(summary.salesUsd)}</div>
              <div style={{ fontSize: 12, color: '#6B7280' }}>Recibes por ventas</div>
            </Card>
            <Card>
              <div className="kpi-label">Utilidad Mensual</div>
              <div className="kpi-value" style={{ color: summary.monthlyProfit >= 0 ? '#15803D' : '#DC2626' }}>
                {isLoading ? '—' : formatUSD(summary.monthlyProfit)}
              </div>
              <div style={{ fontSize: 12, color: '#6B7280' }}>Resultado neto acumulado</div>
            </Card>
            <Card>
              <div className="kpi-label">Inventario (Unidades)</div>
              <div className="kpi-value">{isLoading ? '—' : summary.stockUnits.toLocaleString('es-VE')}</div>
              <div style={{ fontSize: 12, color: '#6B7280' }}>En almacén activo</div>
            </Card>
            <Card>
              <div className="kpi-label">Productos bajo mínimo</div>
              <div className="kpi-value" style={{ color: summary.lowStockProductsCount > 0 ? '#DC2626' : '#1F2937' }}>
                {isLoading ? '—' : summary.lowStockProductsCount}
              </div>
              <div style={{ fontSize: 12, color: '#6B7280' }}>Requieren reposición</div>
            </Card>
          </div>

          <div className="grid grid-2" style={{ marginTop: 16 }}>
            <Card>
              <h3>Top 5 productos más vendidos</h3>
              {summary.topProducts.length === 0 && !isLoading ? (
                <p className="muted">No hay ventas registradas.</p>
              ) : (
                summary.topProducts.map((p, i) => (
                  <div
                    key={i}
                    style={{
                      padding: '12px 0',
                      borderBottom: i === summary.topProducts.length - 1 ? 'none' : '1px solid #E5E7EB',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <span style={{ fontSize: 13.5, fontWeight: 600, color: '#1F2937' }}>
                      {p.name}
                    </span>
                    <Badge tone="dark">
                      {p.totalQuantity} {p.totalQuantity === 1 ? 'ud.' : 'uds.'}
                    </Badge>
                  </div>
                ))
              )}
            </Card>

            <Card>
              <h3>Productos con bajo stock</h3>
              {summary.lowStockProductsList.length === 0 && !isLoading ? (
                <p className="muted">No hay productos bajo stock.</p>
              ) : (
                summary.lowStockProductsList.map((p, i) => (
                  <div
                    key={p.id}
                    style={{
                      padding: '12px 0',
                      borderBottom: i === summary.lowStockProductsList.length - 1 ? 'none' : '1px solid #E5E7EB',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <span style={{ fontSize: 13.5, fontWeight: 600, color: '#1F2937' }}>
                      {p.name}
                    </span>
                    <Badge tone="danger">Stock: {p.stock}</Badge>
                  </div>
                ))
              )}
            </Card>
          </div>

          <div className="grid grid-2" style={{ marginTop: 16 }}>
            <Card>
              <h3>Cuentas por Cobrar a Vencer</h3>
              <div className="kpi-value positive">{isLoading ? '—' : formatUSD(summary.receivableDueUsd)}</div>
              <div className="muted small" style={{ fontSize: 13, marginTop: 4 }}>
                {isLoading
                  ? 'Cargando pendientes...'
                  : summary.receivableDueCount === 0
                  ? 'Sin cobros en los próximos 21 días o del mes'
                  : `${summary.receivableDueCount} ${summary.receivableDueCount === 1 ? 'cuenta por cobrar' : 'cuentas por cobrar'} a recibir`}
              </div>
            </Card>
            <Card>
              <h3>Cuentas por Pagar a Vencer</h3>
              <div className="kpi-value negative">{isLoading ? '—' : formatUSD(summary.payableDueUsd)}</div>
              <div className="muted small" style={{ fontSize: 13, marginTop: 4 }}>
                {isLoading
                  ? 'Cargando obligaciones...'
                  : summary.payableDueCount === 0
                  ? 'Sin pagos en los próximos 21 días o del mes'
                  : `${summary.payableDueCount} ${summary.payableDueCount === 1 ? 'compromiso pendiente' : 'compromisos pendientes'}`}
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
