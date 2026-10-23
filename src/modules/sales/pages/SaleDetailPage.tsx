import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft,
  Printer, 
  RefreshCcw 
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { formatUSD, getActiveExchangeRate } from '../../../lib/currency';
import { getBusinessProfile } from '../../../lib/businessProfile';
import { authenticatedFetch } from '../../../lib/supabase/api';

interface SaleItemDetail {
  id: string;
  name: string;
  quantity: number;
  unit_price_usd: number;
  total_usd: number;
}

interface PaymentRecordDetail {
  method: string;
  amount_usd: number;
  amount_ves: number;
  bank_name?: string;
  account_number?: string;
}

interface SaleFullDetail {
  id: string;
  doc_type: string;
  doc_number: string;
  created_at: string;
  customer_name: string;
  customer_doc: string;
  customer_phone: string;
  customer_email?: string;
  status: string;
  payment_type: string;
  exchange_rate: number;
  subtotal_usd: number;
  discount_usd: number;
  tax_usd: number;
  igtf_usd: number;
  total_usd: number;
  total_ves: number;
  notes?: string;
  items: SaleItemDetail[];
  payments: PaymentRecordDetail[];
}

interface SaleDetailPageProps {
  saleId?: string;
  onBack?: () => void;
}

export function SaleDetailPage({ saleId: propSaleId, onBack }: SaleDetailPageProps) {
  const navigate = useNavigate();
  const { id: paramSaleId } = useParams<{ id: string }>();
  const activeId = propSaleId || paramSaleId;

  const [data, setData] = useState<SaleFullDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      window.history.length > 1 ? navigate(-1) : navigate('/ventas-flash/reporte');
    }
  };

  const loadSaleData = async () => {
    if (!activeId) return;
    setIsLoading(true);
    try {
      // Todo pasa por el servidor: nunca consultas directas a Supabase desde el cliente.
      const reportRes = await authenticatedFetch('/api/sales/report');
      if (reportRes.ok) {
        const report = await reportRes.json();
        const sales: any[] = Array.isArray(report?.sales) ? report.sales : [];
        const customers: any[] = Array.isArray(report?.customers) ? report.customers : [];
        const bankAccounts: any[] = Array.isArray(report?.bankAccounts) ? report.bankAccounts : [];
        const allPayments: any[] = Array.isArray(report?.payments) ? report.payments : [];
        const allItems: any[] = Array.isArray(report?.saleItems) ? report.saleItems : [];

        // 1. Buscar por id o por doc_number (con o sin prefijo FACT-/NE-)
        const saleData = sales.find(s => s.id === activeId) ||
          sales.find(s => s.doc_number === activeId) ||
          sales.find(s => ['FACT-', 'NE-', 'PED-', '#'].some(prefix => `${prefix}${s.doc_number}` === activeId));

        if (saleData) {
          // Datos del cliente
          let customerName = 'Consumidor Final';
          let customerDoc = 'N/A';
          let customerPhone = 'N/A';
          let customerEmail = 'N/A';

          if (saleData.customer_id) {
            const customerData = customers.find(c => c.id === saleData.customer_id);

            if (customerData) {
              customerName = customerData.name || customerName;
              customerDoc = customerData.doc_number ? `${customerData.doc_type ? customerData.doc_type + ' ' : ''}${customerData.doc_number}` : 'N/A';
              customerPhone = customerData.phone || 'N/A';
              customerEmail = customerData.email || 'N/A';
            }
          }

          // Artículos de la venta
          const items: SaleItemDetail[] = allItems
            .filter((it: any) => it.sale_id === saleData.id)
            .map((it: any) => ({
              id: it.id || `${saleData.id}-${it.sku || it.name || 'item'}`,
              name: it.name || 'Producto sin nombre',
              quantity: Number(it.quantity) || 1,
              unit_price_usd: Number(it.unit_price_usd) || 0,
              total_usd: Number(it.total_usd) || ((Number(it.quantity) || 1) * (Number(it.unit_price_usd) || 0))
            }));

          // Pagos y Cuentas Bancarias
          const bankMap = new Map(bankAccounts.map((b: any) => [b.id, b]));

          const payments: PaymentRecordDetail[] = allPayments
            .filter((p: any) => p.sale_id === saleData.id)
            .map((p: any) => {
              const bank = p.bank_account_id ? bankMap.get(p.bank_account_id) : null;
              return {
                method: p.method || 'Efectivo',
                amount_usd: Number(p.amount_usd) || 0,
                amount_ves: Number(p.amount_ves) || 0,
                bank_name: bank ? bank.bank_name : (p.method?.includes('Banesco') ? 'Banesco' : p.method?.includes('Venezuela') ? 'Banco de Venezuela' : p.method?.includes('Efectivo') ? 'Caja Efectivo' : undefined),
                account_number: bank?.account_number
              };
            });

        if (payments.length === 0) {
          payments.push({
            method: saleData.payment_type || 'Contado',
            amount_usd: Number(saleData.total_usd) || 0,
            amount_ves: Number(saleData.total_ves) || (Number(saleData.total_usd || 0) * Number(saleData.exchange_rate || 1))
          });
        }

        setData({
          id: saleData.id,
          doc_type: saleData.doc_type || 'FACTURA',
          doc_number: saleData.doc_number || saleData.id.slice(0, 8),
          created_at: saleData.created_at,
          customer_name: customerName,
          customer_doc: customerDoc,
          customer_phone: customerPhone,
          customer_email: customerEmail,
          status: saleData.status || 'COMPLETADA',
          payment_type: saleData.payment_type || 'CONTADO',
          exchange_rate: Number(saleData.exchange_rate) || 1,
          subtotal_usd: Number(saleData.subtotal_usd) || 0,
          discount_usd: Number(saleData.discount_usd) || 0,
          tax_usd: Number(saleData.tax_usd) || 0,
          igtf_usd: Number(saleData.igtf_usd) || 0,
          total_usd: Number(saleData.total_usd) || 0,
          total_ves: Number(saleData.total_ves) || (Number(saleData.total_usd || 0) * Number(saleData.exchange_rate || 1)),
          notes: saleData.notes || '',
          items,
          payments
        });
        setIsLoading(false);
        return;
      }
      }

      // 2. Si no es de sales, consultar /api/orders (pedidos web)
      const ordersRes = await fetch('/api/orders');
      if (ordersRes.ok) {
        const json = await ordersRes.json();
        if (json.success && Array.isArray(json.data)) {
          const foundOrder = json.data.find((o: any) => o.id === activeId || o.order_number === activeId);
          if (foundOrder) {
            const items: SaleItemDetail[] = (foundOrder.items || []).map((it: any, idx: number) => ({
              id: it.id || `ord-item-${idx}`,
              name: it.name || 'Producto',
              quantity: Number(it.quantity) || 1,
              unit_price_usd: Number(it.unit_price_usd) || 0,
              total_usd: Number(it.total_usd) || ((Number(it.quantity) || 1) * (Number(it.unit_price_usd) || 0))
            }));

            setData({
              id: foundOrder.id,
              doc_type: 'PEDIDO_WEB',
              doc_number: foundOrder.order_number || foundOrder.id.slice(0, 8),
              created_at: foundOrder.created_at,
              customer_name: foundOrder.customer_name || 'Cliente Web',
              customer_doc: foundOrder.customer_doc || 'N/A',
              customer_phone: foundOrder.customer_phone || 'N/A',
              customer_email: foundOrder.customer_email || 'N/A',
              status: foundOrder.delivery_status || foundOrder.status || 'ENTREGADO',
              payment_type: foundOrder.payment_method || 'CONTADO',
              exchange_rate: Number(foundOrder.exchange_rate) || 1,
              subtotal_usd: Number(foundOrder.subtotal_usd) || 0,
              discount_usd: Number(foundOrder.discount_usd) || 0,
              tax_usd: Number(foundOrder.tax_usd) || 0,
              igtf_usd: Number(foundOrder.igtf_usd) || 0,
              total_usd: Number(foundOrder.total_usd) || 0,
              total_ves: Number(foundOrder.total_ves) || (Number(foundOrder.total_usd || 0) * Number(foundOrder.exchange_rate || 1)),
              notes: foundOrder.notes || '',
              items,
              payments: [
                {
                  method: foundOrder.payment_method || 'Pago Móvil',
                  amount_usd: Number(foundOrder.total_usd) || 0,
                  amount_ves: Number(foundOrder.total_ves) || 0
                }
              ]
            });
            setIsLoading(false);
            return;
          }
        }
      }

      setData(null);
      setIsLoading(false);
    } catch (err) {
      console.error('Error cargando detalle de venta:', err);
      setData(null);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSaleData();
  }, [activeId]);

  const getDocTypeFormatted = (type: string) => {
    switch (type.toUpperCase()) {
      case 'FACTURA':
        return { label: 'FACTURA', prefix: 'FACT-', tone: 'success' as const };
      case 'NOTA':
        return { label: 'NOTA DE ENTREGA', prefix: 'NE-', tone: 'warning' as const };
      case 'PEDIDO':
      case 'PEDIDO_WEB':
      case 'PEDIDO ONLINE':
        return { label: 'PEDIDO WEB', prefix: 'PED-', tone: 'brand' as const };
      default:
        return { label: type, prefix: '#', tone: 'brand' as const };
    }
  };

  const docInfo = data ? getDocTypeFormatted(data.doc_type) : { label: 'VENTA', prefix: '#', tone: 'brand' as const };
  const displayDocNum = data ? (data.doc_number.startsWith('FACT-') || data.doc_number.startsWith('NE-') || data.doc_number.startsWith('PED-') || data.doc_number.startsWith('#') ? data.doc_number : `${docInfo.prefix}${data.doc_number}`) : '';

  // Montos abonados y saldo pendiente para la factura
  const paidUsd = data ? data.payments.reduce((acc, p) => acc + (Number(p.amount_usd) || 0), 0) : 0;
  const balanceUsd = data ? Math.max(0, Math.round((data.total_usd - paidUsd) * 100) / 100) : 0;
  const vesFmt = (n: number) => `Bs. ${n.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="content">
      {/* Cabecera de acciones: oculta al imprimir */}
      <div className="page-head flex items-center justify-between gap-4 no-print">
        <div>
          <Button variant="secondary" onClick={handleBack} className="mb-3">
            <ArrowLeft className="w-4 h-4" /> Volver al Reporte
          </Button>
          <h1>Comprobante y Detalle de Pago #{displayDocNum}</h1>
        </div>
        <div className="actions flex gap-2">
          <Button variant="secondary" onClick={loadSaleData}>
            <RefreshCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} /> Actualizar
          </Button>
          <Button variant="primary" onClick={() => window.print()}>
            <Printer className="w-4 h-4" /> Imprimir Comprobante
          </Button>
        </div>
      </div>

      {isLoading ? (
        <Card className="p-12 text-center no-print">
          <div className="inline-block w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="muted small">Cargando información completa del comprobante...</p>
        </Card>
      ) : data ? (
        /* Hoja del comprobante: neutra para pantalla y para impresión en carta */
        <div className="invoice-sheet">
          {(() => {
            const business = getBusinessProfile();
            return (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, borderBottom: '3px solid var(--brand-500)', paddingBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 19, fontWeight: 800, color: 'var(--brand-700)', lineHeight: 1.15 }}>{business.businessName}</div>
                  <div style={{ fontSize: 10.5, color: 'var(--muted)', marginTop: 3 }}>
                    RIF: {business.rif} • Tel: {business.phone}{business.email ? ` • ${business.email}` : ''}
                  </div>
                  {business.address && (
                    <div style={{ fontSize: 10.5, color: 'var(--muted)' }}>Dirección: {business.address}</div>
                  )}
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--brand-500)', letterSpacing: 1 }}>{docInfo.label}</div>
                  <div style={{ fontSize: 13.5, fontWeight: 800 }}>N° {displayDocNum}</div>
                  <div style={{ fontSize: 10.5, color: 'var(--muted)' }}>{data.created_at ? new Date(data.created_at).toLocaleString() : ''}</div>
                </div>
              </div>
            );
          })()}

          {/* Datos del cliente y del comprobante (compacto) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.45fr 1fr', gap: 14, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontSize: 11, lineHeight: 1.75 }}>
              <div>
                <span className="iv-label">Cliente</span>
                <strong style={{ fontSize: 12.5 }}>{data.customer_name}</strong>
              </div>
              <div><span className="iv-label">Identificación</span>{data.customer_doc}</div>
              <div>
                <span className="iv-label">Contacto</span>
                {data.customer_phone}{data.customer_email && data.customer_email !== 'N/A' ? ` • ${data.customer_email}` : ''}
              </div>
            </div>
            <div style={{ fontSize: 11, lineHeight: 1.75, borderLeft: '1px solid var(--border)', paddingLeft: 14 }}>
              <div><span className="iv-label">Condición</span>{data.payment_type === 'CREDITO' ? 'CRÉDITO' : 'CONTADO'}</div>
              <div>
                <span className="iv-label">Estado</span>
                <strong style={{ color: data.status === 'COMPLETADA' || data.status === 'ENTREGADO' || data.status === 'PAGADO' ? '#15803D' : '#D97706' }}>{data.status}</strong>
              </div>
              <div><span className="iv-label">Tasa BCV</span>{data.exchange_rate.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} VES/$</div>
            </div>
          </div>

          {data.notes && (
            <div style={{ fontSize: 10.5, color: 'var(--muted)', marginTop: 6 }}>
              <span className="iv-label">Notas</span>{data.notes}
            </div>
          )}

          {/* Detalle de artículos vendidos (compacto) */}
          <div style={{ marginTop: 10 }}>
            <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.6, color: 'var(--muted)', marginBottom: 4 }}>
              Detalle de artículos {docInfo.label === 'PEDIDO WEB' ? 'del pedido' : 'facturados'}
            </div>
            <table className="iv-table">
              <thead>
                <tr>
                  <th>Descripción</th>
                  <th className="num" style={{ width: 58 }}>Cant.</th>
                  <th className="num" style={{ width: 100 }}>P. Unit. ($)</th>
                  <th className="num" style={{ width: 96 }}>Total ($)</th>
                  <th className="num" style={{ width: 112 }}>Total (Bs)</th>
                </tr>
              </thead>
              <tbody>
                {data.items.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', color: 'var(--muted)', padding: '10px 8px' }}>
                      No hay productos detallados registrados en este comprobante.
                    </td>
                  </tr>
                ) : (
                  data.items.map((it, idx) => (
                    <tr key={it.id || idx}>
                      <td style={{ fontWeight: 600 }}>{it.name}</td>
                      <td className="num" style={{ fontWeight: 700 }}>{it.quantity}</td>
                      <td className="num">{formatUSD(it.unit_price_usd)}</td>
                      <td className="num" style={{ fontWeight: 700 }}>{formatUSD(it.total_usd)}</td>
                      <td className="num" style={{ color: 'var(--muted)' }}>{vesFmt(it.total_usd * data.exchange_rate)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagos y liquidación bimonetaria (compactos, en dos columnas) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 1fr', gap: 18, padding: '12px 0 4px' }}>
            {/* Formas de pago */}
            <div>
              <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.6, color: 'var(--muted)', marginBottom: 4 }}>
                Formas de pago y destino de fondos
              </div>
              <table className="iv-table">
                <thead>
                  <tr>
                    <th>Método / Banco</th>
                    <th className="num" style={{ width: 86 }}>Monto ($)</th>
                    <th className="num" style={{ width: 104 }}>Monto (Bs)</th>
                  </tr>
                </thead>
                <tbody>
                  {data.payments.map((p, idx) => (
                    <tr key={idx}>
                      <td>
                        <div style={{ fontWeight: 700 }}>{p.bank_name || p.method}</div>
                        <div style={{ fontSize: 10, color: 'var(--muted)' }}>
                          {p.account_number ? `Cta. ${p.account_number} • ` : ''}vía {p.method}
                        </div>
                      </td>
                      <td className="num" style={{ fontWeight: 700 }}>{formatUSD(p.amount_usd)}</td>
                      <td className="num" style={{ color: 'var(--muted)' }}>{vesFmt(p.amount_ves)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Liquidación */}
            <div>
              <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.6, color: 'var(--muted)', marginBottom: 4 }}>
                Liquidación bimonetaria
              </div>
              <div style={{ fontSize: 11, lineHeight: 1.6 }}>
                <div className="iv-row"><span>Subtotal</span><span>{formatUSD(data.subtotal_usd || data.total_usd)}</span></div>
                {data.discount_usd > 0 && (
                  <div className="iv-row"><span>Descuento</span><span>- {formatUSD(data.discount_usd)}</span></div>
                )}
                {data.tax_usd > 0 && (
                  <div className="iv-row"><span>IVA</span><span>{formatUSD(data.tax_usd)}</span></div>
                )}
                {data.igtf_usd > 0 && (
                  <div className="iv-row"><span>IGTF</span><span>{formatUSD(data.igtf_usd)}</span></div>
                )}
                <div className="iv-row iv-row-strong">
                  <span>Total factura</span>
                  <span style={{ fontSize: 13 }}>{formatUSD(data.total_usd)}</span>
                </div>
                <div className="iv-row"><span>Total en bolívares</span><span>{vesFmt(data.total_ves)}</span></div>
                <div className="iv-row"><span>Abonado</span><span>{formatUSD(paidUsd)}</span></div>
                {balanceUsd > 0.005 && (
                  <div className="iv-row iv-row-strong">
                    <span>Saldo pendiente</span>
                    <span style={{ color: '#D97706' }}>{formatUSD(balanceUsd)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Pie del comprobante */}
          <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px dashed var(--border)', display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 9.5, color: 'var(--muted)' }}>
            <span>Comprobante emitido por Frenyer ERP • Documento bimonetario (USD / VES)</span>
            <span>¡Gracias por su compra!</span>
          </div>
        </div>
      ) : (
        <Card className="empty no-print">
          <p className="font-bold">No se encontró información para el comprobante #{activeId}.</p>
          <Button variant="primary" onClick={handleBack} className="mt-4">
            <ArrowLeft className="w-4 h-4" /> Volver al Reporte
          </Button>
        </Card>
      )}
    </div>
  );
}
