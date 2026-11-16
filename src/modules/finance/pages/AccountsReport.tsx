import { Fragment, useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import {
  Search,
  CreditCard,
  RefreshCcw,
  FileDown,
  Eye,
  Printer,
  Landmark,
  ShoppingCart,
  ChevronUp
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { authenticatedFetch } from '../../../lib/supabase/api';
import { formatUSD, formatVES, getActiveExchangeRate } from '../../../lib/currency';
import { createWorksheetWithBusinessHeader } from '../../../lib/reportUtils';

// ---------------------------------------------------------------------------
// Reporte de Cuentas: tres pestañas internas (Cuentas Bancarias, Cuentas por
// Cobrar y Cuentas por Pagar). Cada pestaña trae sus tarjetas de resumen y su
// detalle consolidado; «Ver estado» despliega la cuenta individual debajo.
// ---------------------------------------------------------------------------

type ReportTab = 'bancos' | 'cxc' | 'cxp';

interface BankAccountLite {
  id: string;
  bank_name: string;
  account_number: string;
  account_type: string;
  currency: string;
  balance: number;
  status: string;
  created_at?: string;
}

interface BankMovementLite {
  id: string;
  bank_account_id: string;
  type: 'ENTRADA' | 'SALIDA';
  concept: string;
  reference: string;
  user_name: string;
  rate: number;
  commission: number;
  commission_type?: 'Fija' | 'Porcentual';
  amount: number;
  created_at: string;
}

interface ReceivableRow {
  id: string;
  customer_name: string;
  customer_doc?: string;
  customer_phone?: string;
  doc_number: string;
  total_usd: number;
  balance_usd: number;
  status: string;
  due_date?: string;
  created_at: string;
}

interface PayableRow {
  id: string;
  supplier_name: string;
  supplier_doc?: string;
  doc_number: string;
  total_usd: number;
  balance_usd: number;
  status: string;
  due_date?: string;
  created_at: string;
}

// Ficha de cronología bancaria con saldo corrido (débito/crédito).
// IMPORTANTE: el monto y el saldo de cada cuenta están en la MONEDA de la
// propia cuenta (bank_accounts.currency). El equivalente en la otra moneda
// se calcula con la tasa registrada en el propio movimiento (auditoría).
interface BankLedgerRow extends BankMovementLite {
  runningBalance: number;
  amountAcc: number;   // monto en la moneda de la cuenta (SALIDA sin comisión)
  commissionAcc: number; // comisión efectiva en la moneda de la cuenta
  equivOther: number;  // equivalente en la otra moneda a la tasa del movimiento
  effRate: number;
}

interface ClientConsolidated {
  key: string;
  name: string;
  doc: string;
  phone: string;
  invoices: ReceivableRow[];
  totalFacturado: number;
  saldoPendiente: number;
  isOverdue: boolean;
}

interface SupplierConsolidated {
  key: string;
  name: string;
  doc: string;
  invoices: PayableRow[];
  totalCompras: number;
  saldoPendiente: number;
  isOverdue: boolean;
}

const round2 = (n: number) => Math.round((Number(n) || 0) * 100) / 100;

export function AccountsReportPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ReportTab>('bancos');
  const [searchQuery, setSearchQuery] = useState('');

  // Pestaña 1: Cuentas Bancarias
  const [accounts, setAccounts] = useState<BankAccountLite[]>([]);
  const [movements, setMovements] = useState<BankMovementLite[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState('');

  // Pestañas 2 y 3
  const [receivables, setReceivables] = useState<ReceivableRow[]>([]);
  const [payables, setPayables] = useState<PayableRow[]>([]);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  const [exchangeRate, setExchangeRate] = useState(getActiveExchangeRate());

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [accRes, movRes, cxcRes, cxpRes, rateRes] = await Promise.all([
        authenticatedFetch('/api/bank-accounts'),
        authenticatedFetch('/api/bank-movements'),
        authenticatedFetch('/api/accounts-receivable'),
        authenticatedFetch('/api/accounts-payable'),
        fetch('/api/bcv/rates').then(r => r.json()).catch(() => null)
      ]);

      const accJson = await accRes.json().catch(() => null);
      const accList: BankAccountLite[] = Array.isArray(accJson?.data) ? accJson.data : [];
      setAccounts(accList);
      if (accList.length > 0) {
        setSelectedAccountId(prev => (prev && accList.some(a => a.id === prev) ? prev : accList[0].id));
      }

      const movJson = await movRes.json().catch(() => null);
      setMovements(Array.isArray(movJson?.data) ? movJson.data : []);

      const cxcJson = await cxcRes.json().catch(() => null);
      setReceivables(Array.isArray(cxcJson?.data) ? cxcJson.data : []);

      const cxpJson = await cxpRes.json().catch(() => null);
      setPayables(Array.isArray(cxpJson?.data) ? cxpJson.data : []);

      const rateVal = Number(rateRes?.appliedRate) || Number(rateRes?.usdRate) || Number(rateRes?.currentRate);
      if (rateVal && rateVal > 0) setExchangeRate(rateVal);
    } catch (err) {
      console.error('Error cargando reporte de cuentas:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Al cambiar de pestaña se cierra el detalle desplegado
  const switchTab = (tab: ReportTab) => {
    setActiveTab(tab);
    setExpandedKey(null);
  };

  // ===================== Pestaña 1: Cuentas Bancarias =====================
  const selectedAccount = accounts.find(a => a.id === selectedAccountId) || null;
  // Cada cuenta maneja SU propia moneda: el saldo y los movimientos están en ella
  const selectedCurrency: 'USD' | 'VES' = selectedAccount?.currency === 'USD' ? 'USD' : 'VES';
  const fmtAcc = (n: number) => (selectedCurrency === 'USD' ? formatUSD(round2(n), '$ ') : formatVES(round2(n)));
  const fmtOther = (n: number) => (selectedCurrency === 'USD' ? formatVES(round2(n)) : formatUSD(round2(n), '$ '));
  // Moneda de cualquier cuenta, para los chips del selector
  const fmtByCurrency = (cur: string | undefined, n: number) =>
    cur === 'USD' ? formatUSD(round2(n), '$ ') : formatVES(round2(n));

  const accountLedger: BankLedgerRow[] = (() => {
    if (!selectedAccount) return [];
    const allRows = movements
      .filter(m => m.bank_account_id === selectedAccount.id)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    const effectiveCommission = (m: BankMovementLite) => {
      const amt = round2(Number(m.amount) || 0);
      const comm = Number(m.commission) || 0;
      return m.commission_type === 'Porcentual' ? round2(amt * (comm / 100)) : round2(comm);
    };

    // Totales con TODOS los movimientos (el buscador solo filtra la vista)
    const totalIn = round2(allRows.filter(m => m.type === 'ENTRADA').reduce((s, m) => s + (Number(m.amount) || 0), 0));
    const totalOut = round2(allRows.filter(m => m.type === 'SALIDA').reduce((s, m) => s + (Number(m.amount) || 0) + effectiveCommission(m), 0));

    // Saldo inicial reconstruido: saldo actual menos el efecto neto de los movimientos
    let running = round2((Number(selectedAccount.balance) || 0) - (totalIn - totalOut));

    return allRows.map(m => {
      const amountAcc = round2(Number(m.amount) || 0);
      const commissionAcc = effectiveCommission(m);
      // Tasa del propio movimiento; si viene en 1 (no registrada) se usa la vigente
      const rawRate = Number(m.rate) || 0;
      const effRate = rawRate > 1 ? rawRate : exchangeRate;
      const equivOther = selectedCurrency === 'USD' ? round2(amountAcc * effRate) : round2(amountAcc / effRate);
      running = round2(running + (m.type === 'ENTRADA' ? amountAcc : -(amountAcc + commissionAcc)));
      return { ...m, runningBalance: running, amountAcc, commissionAcc, equivOther, effRate };
    }).reverse(); // Cronológico reciente primero
  })();

  const bankTotals = (() => {
    const rows = accountLedger;
    const ingresos = round2(rows.filter(m => m.type === 'ENTRADA').reduce((s, m) => s + m.amountAcc, 0));
    const egresos = round2(rows.filter(m => m.type === 'SALIDA').reduce((s, m) => s + m.amountAcc + m.commissionAcc, 0));
    const saldoCorte = round2(Number(selectedAccount?.balance) || 0);
    const saldoInicial = round2(saldoCorte - (ingresos - egresos));
    // Tasa de referencia para el equivalente del saldo (vigente)
    return { ingresos, egresos, saldoCorte, saldoInicial };
  })();

  const filteredLedger = accountLedger.filter(m => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (m.concept || '').toLowerCase().includes(q) ||
      (m.reference || '').toLowerCase().includes(q) ||
      (m.user_name || '').toLowerCase().includes(q);
  });

  // ===================== Pestaña 2: Cuentas por Cobrar =====================
  const activeReceivables = receivables.filter(r => r.status !== 'Pagada');
  const cxcTotals = (() => {
    const porCobrar = round2(activeReceivables.reduce((s, r) => s + (Number(r.balance_usd) || 0), 0));
    const facturado = round2(activeReceivables.reduce((s, r) => s + (Number(r.total_usd) || 0), 0));
    const cobrado = round2(receivables.reduce((s, r) => s + Math.max(0, (Number(r.total_usd) || 0) - (Number(r.balance_usd) || 0)), 0));
    const now = new Date();
    const vencida = round2(activeReceivables
      .filter(r => r.due_date && new Date(r.due_date) < now)
      .reduce((s, r) => s + (Number(r.balance_usd) || 0), 0));
    return { porCobrar, facturado, cobrado, vencida };
  })();

  const clientGroups: ClientConsolidated[] = (() => {
    const map = new Map<string, ClientConsolidated>();
    const now = new Date();
    activeReceivables.forEach(r => {
      const name = (r.customer_name || 'Cliente sin nombre').trim();
      const key = name.toLowerCase();
      let group = map.get(key);
      if (!group) {
        group = {
          key,
          name,
          doc: r.customer_doc || '',
          phone: r.customer_phone || '',
          invoices: [],
          totalFacturado: 0,
          saldoPendiente: 0,
          isOverdue: false
        };
        map.set(key, group);
      }
      group.invoices.push(r);
      group.totalFacturado = round2(group.totalFacturado + (Number(r.total_usd) || 0));
      group.saldoPendiente = round2(group.saldoPendiente + (Number(r.balance_usd) || 0));
      if (r.customer_doc && !group.doc) group.doc = r.customer_doc;
      if (r.customer_phone && !group.phone) group.phone = r.customer_phone;
      if (r.due_date && new Date(r.due_date) < now) group.isOverdue = true;
    });
    return Array.from(map.values()).sort((a, b) => b.saldoPendiente - a.saldoPendiente);
  })();

  const filteredClientGroups = clientGroups.filter(g => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return g.name.toLowerCase().includes(q) ||
      g.doc.toLowerCase().includes(q) ||
      g.phone.toLowerCase().includes(q) ||
      g.invoices.some(i => (i.doc_number || '').toLowerCase().includes(q));
  });

  // ===================== Pestaña 3: Cuentas por Pagar =====================
  const activePayables = payables.filter(p => p.status !== 'Pagada');
  const cxpTotals = (() => {
    const porPagar = round2(activePayables.reduce((s, p) => s + (Number(p.balance_usd) || 0), 0));
    const comprado = round2(activePayables.reduce((s, p) => s + (Number(p.total_usd) || 0), 0));
    const liquidado = round2(payables.reduce((s, p) => s + Math.max(0, (Number(p.total_usd) || 0) - (Number(p.balance_usd) || 0)), 0));
    const now = new Date();
    const vencida = round2(activePayables
      .filter(p => p.due_date && new Date(p.due_date) < now)
      .reduce((s, p) => s + (Number(p.balance_usd) || 0), 0));
    return { porPagar, comprado, liquidado, vencida };
  })();

  const supplierGroups: SupplierConsolidated[] = (() => {
    const map = new Map<string, SupplierConsolidated>();
    const now = new Date();
    activePayables.forEach(p => {
      const name = (p.supplier_name || 'Proveedor sin nombre').trim();
      const key = name.toLowerCase();
      let group = map.get(key);
      if (!group) {
        group = {
          key,
          name,
          doc: p.supplier_doc || '',
          invoices: [],
          totalCompras: 0,
          saldoPendiente: 0,
          isOverdue: false
        };
        map.set(key, group);
      }
      group.invoices.push(p);
      group.totalCompras = round2(group.totalCompras + (Number(p.total_usd) || 0));
      group.saldoPendiente = round2(group.saldoPendiente + (Number(p.balance_usd) || 0));
      if (p.supplier_doc && !group.doc) group.doc = p.supplier_doc;
      if (p.due_date && new Date(p.due_date) < now) group.isOverdue = true;
    });
    return Array.from(map.values()).sort((a, b) => b.saldoPendiente - a.saldoPendiente);
  })();

  const filteredSupplierGroups = supplierGroups.filter(g => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return g.name.toLowerCase().includes(q) ||
      g.doc.toLowerCase().includes(q) ||
      g.invoices.some(i => (i.doc_number || '').toLowerCase().includes(q));
  });

  // ===================== Exportación =====================
  const handleExportExcel = () => {
    let exportData: any[] = [];
    let sheetName = 'Cuentas Bancarias';
    let fileName = 'Reporte_Cuentas';

    if (activeTab === 'bancos') {
      sheetName = 'Cronologia Bancaria';
      fileName = `Cuentas_Bancarias_${selectedAccount?.bank_name || 'General'}`;
      const curLabel = selectedCurrency === 'USD' ? 'USD' : 'VES';
      const otherLabel = selectedCurrency === 'USD' ? 'VES' : 'USD';
      exportData = filteredLedger.map(m => {
        const row: any = {
          'Fecha': new Date(m.created_at).toLocaleString(),
          'Banco': selectedAccount?.bank_name || '',
          'Moneda de la cuenta': curLabel,
          'Referencia': m.reference || '',
          'Operación': m.type,
          'Concepto': m.concept || '',
          'Tasa del movimiento': m.effRate
        };
        row[`Débito (${curLabel})`] = m.type === 'SALIDA' ? round2(m.amountAcc + m.commissionAcc) : 0;
        row[`Crédito (${curLabel})`] = m.type === 'ENTRADA' ? m.amountAcc : 0;
        row[`Comisión (${curLabel})`] = m.type === 'SALIDA' ? m.commissionAcc : 0;
        row[`Saldo (${curLabel})`] = m.runningBalance;
        row[`Equiv. (${otherLabel})`] = m.equivOther;
        return row;
      });
    } else if (activeTab === 'cxc') {
      sheetName = 'Cuentas por Cobrar';
      fileName = 'Cuentas_por_Cobrar';
      exportData = filteredClientGroups.flatMap(g => g.invoices.map(i => ({
        'Cliente': g.name,
        'RIF/CI': i.customer_doc || g.doc,
        'Teléfono': i.customer_phone || g.phone,
        'Factura': i.doc_number,
        'Fecha': i.created_at ? new Date(i.created_at).toLocaleDateString() : '',
        'Vence': i.due_date ? new Date(i.due_date).toLocaleDateString() : '—',
        'Total factura (USD)': round2(Number(i.total_usd) || 0),
        'Saldo pendiente (USD)': round2(Number(i.balance_usd) || 0),
        'Saldo pendiente (VES)': round2((Number(i.balance_usd) || 0) * exchangeRate),
        'Estado': i.status
      })));
    } else {
      sheetName = 'Cuentas por Pagar';
      fileName = 'Cuentas_por_Pagar';
      exportData = filteredSupplierGroups.flatMap(g => g.invoices.map(i => ({
        'Proveedor': g.name,
        'RIF': i.supplier_doc || g.doc,
        'Factura': i.doc_number,
        'Fecha': i.created_at ? new Date(i.created_at).toLocaleDateString() : '',
        'Vence': i.due_date ? new Date(i.due_date).toLocaleDateString() : '—',
        'Total compra (USD)': round2(Number(i.total_usd) || 0),
        'Saldo por pagar (USD)': round2(Number(i.balance_usd) || 0),
        'Saldo por pagar (VES)': round2((Number(i.balance_usd) || 0) * exchangeRate),
        'Estado': i.status
      })));
    }

    if (exportData.length === 0) return;
    const ws = createWorksheetWithBusinessHeader(sheetName, exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, `${fileName}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const tabs: { id: ReportTab; label: string; icon: typeof Landmark }[] = [
    { id: 'bancos', label: 'Cuentas Bancarias', icon: Landmark },
    { id: 'cxc', label: 'Cuentas por Cobrar', icon: CreditCard },
    { id: 'cxp', label: 'Cuentas por Pagar', icon: ShoppingCart }
  ];

  const renderDetailToggle = (key: string, active: boolean) => (
    <Button
      variant={active ? 'secondary' : 'ghost'}
      onClick={() => setExpandedKey(active ? null : key)}
      style={{ height: 30, fontSize: 11, padding: '0 10px', gap: 4 }}
      title={active ? 'Cerrar estado de cuenta' : 'Ver estado de cuenta'}
    >
      {active ? <ChevronUp size={14} /> : <Eye size={14} />}
      {active ? 'Cerrar' : 'Ver estado'}
    </Button>
  );

  return (
    <div className="content rep-acc-root">
      {/* 1. Encabezado de Página */}
      <div className="page-head">
        <div>
          <h1>Reporte de Cuentas</h1>
          <p className="muted">
            Bancos, cobranzas y pagos del negocio: saldos, cronología y consolidados.
          </p>
        </div>
        <div className="actions rep-head-actions">
          <Button variant="secondary" onClick={loadData} title="Actualizar datos">
            <RefreshCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="rep-long">Actualizar</span>
            <span className="rep-short">Act.</span>
          </Button>
          <Button variant="secondary" onClick={handleExportExcel} title="Exportar a Excel">
            <FileDown className="w-4 h-4" />
            <span className="rep-long">Exportar Excel</span>
            <span className="rep-short">Excel</span>
          </Button>
          <Button variant="secondary" onClick={() => window.print()} title="Imprimir reporte">
            <Printer className="w-4 h-4" />
            <span className="rep-long">Imprimir</span>
            <span className="rep-short">Impr.</span>
          </Button>
        </div>
      </div>

      {/* 2. Pestañas internas */}
      <div className="rep-acc-tabs" role="tablist">
        {tabs.map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={activeTab === t.id}
              className={`rep-acc-tab ${activeTab === t.id ? 'active' : ''}`}
              onClick={() => switchTab(t.id)}
            >
              <Icon size={14} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* 3. Buscador del periodo activo */}
      <Card className="mb-6">
        <div className="acc-search-row">
          <Search className="w-4 h-4 text-muted shrink-0" />
          <input
            type="text"
            className="input acc-search-input"
            placeholder={
              activeTab === 'bancos' ? 'Buscar por concepto, referencia u operador...'
              : activeTab === 'cxc' ? 'Buscar por cliente, RIF, teléfono o factura...'
              : 'Buscar por proveedor, RIF o factura...'
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <Button variant="ghost" onClick={() => setSearchQuery('')} style={{ height: 30, fontSize: 11, padding: '0 8px' }}>
              Limpiar
            </Button>
          )}
        </div>
      </Card>

      {/* ==================== PESTAÑA: CUENTAS BANCARIAS ==================== */}
      {activeTab === 'bancos' && (
        <>
          {/* Selector de cuenta */}
          {accounts.length > 1 && (
            <div className="acc-bank-chips">
              {accounts.map(a => (
                <button
                  key={a.id}
                  type="button"
                  className={`acc-bank-chip ${a.id === selectedAccountId ? 'active' : ''}`}
                  onClick={() => { setSelectedAccountId(a.id); setExpandedKey(null); }}
                >
                  <b>{a.bank_name}</b>
                  <span>{a.account_type || a.currency || ''}</span>
                  <span className="acc-bank-chip-balance">{fmtByCurrency(a.currency, Number(a.balance) || 0)}</span>
                </button>
              ))}
            </div>
          )}

          {accounts.length === 0 ? (
            <Card>
              <div className="p-8 text-center muted small">
                No hay cuentas bancarias registradas. Regístralas en el módulo «Bancos».
              </div>
            </Card>
          ) : !selectedAccount ? (
            <Card>
              <div className="p-8 text-center muted small">Selecciona una cuenta bancaria.</div>
            </Card>
          ) : (
            <>
              {/* Tarjetas de resumen de la cuenta (en la moneda de la cuenta) */}
              <div className="grid grid-4 kpi-duo gap-4 mb-6">
                <Card>
                  <div className="kpi-label">SALDO INICIAL</div>
                  <div className="kpi-value text-text mt-1">{fmtAcc(bankTotals.saldoInicial)}</div>
                  <span className="muted small">Antes de los movimientos</span>
                </Card>
                <Card>
                  <div className="kpi-label">TOTAL DE INGRESOS</div>
                  <div className="kpi-value positive mt-1">{fmtAcc(bankTotals.ingresos)}</div>
                  <span className="muted small">Entradas registradas</span>
                </Card>
                <Card>
                  <div className="kpi-label">TOTAL DE EGRESOS</div>
                  <div className="kpi-value negative mt-1">{fmtAcc(bankTotals.egresos)}</div>
                  <span className="muted small">Salidas con comisiones</span>
                </Card>
                <Card>
                  <div className="kpi-label">SALDO AL CORTE</div>
                  <div className="kpi-value text-text mt-1">{fmtAcc(bankTotals.saldoCorte)}</div>
                  <span className="muted small">
                    {fmtOther(selectedCurrency === 'USD' ? bankTotals.saldoCorte * exchangeRate : bankTotals.saldoCorte / exchangeRate)}
                    {' '}· Tasa: {exchangeRate.toFixed(2)}
                  </span>
                </Card>
              </div>

              {/* Detalle cronológico */}
              <Card>
                <div className="section-head mb-4">
                  <h3>{selectedAccount.bank_name} — Detalle Cronológico</h3>
                  <span className="badge brand">{filteredLedger.length} movimientos</span>
                </div>

                {isLoading ? (
                  <div className="p-8 text-center muted small">Cargando movimientos...</div>
                ) : filteredLedger.length === 0 ? (
                  <div className="p-8 text-center muted small">
                    Esta cuenta no tiene movimientos registrados con el filtro actual.
                  </div>
                ) : (
                  <div className="table-wrap">
                    <table className="table acc-bank-table">
                      <thead>
                        <tr>
                          <th>Fecha</th>
                          <th>Referencia</th>
                          <th>Operación</th>
                          <th>Concepto</th>
                          <th className="num">{selectedCurrency === 'USD' ? 'Débito ($)' : 'Débito (Bs)'}</th>
                          <th className="num">{selectedCurrency === 'USD' ? 'Crédito ($)' : 'Crédito (Bs)'}</th>
                          <th className="num">{selectedCurrency === 'USD' ? 'Saldo ($)' : 'Saldo (Bs)'}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredLedger.map(m => (
                          <tr key={m.id}>
                            <td className="muted text-xs">{new Date(m.created_at).toLocaleDateString()}</td>
                            <td className="text-xs font-medium">{m.reference || '—'}</td>
                            <td>
                              <Badge tone={m.type === 'ENTRADA' ? 'success' : 'warning'}>
                                {m.type === 'ENTRADA' ? 'Ingreso' : 'Egreso'}
                              </Badge>
                            </td>
                            <td className="text-xs">{m.concept || '—'}</td>
                            <td className="num font-bold">
                              {m.type === 'SALIDA' ? (
                                <>
                                  -{fmtAcc(m.amountAcc + m.commissionAcc)}
                                  <div className="muted text-xs num">≈ {fmtOther(m.equivOther)}</div>
                                </>
                              ) : <span className="muted">—</span>}
                            </td>
                            <td className="num font-bold">
                              {m.type === 'ENTRADA' ? (
                                <>
                                  {fmtAcc(m.amountAcc)}
                                  <div className="muted text-xs num">≈ {fmtOther(m.equivOther)}</div>
                                </>
                              ) : <span className="muted">—</span>}
                            </td>
                            <td className="num font-bold">{fmtAcc(m.runningBalance)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            </>
          )}
        </>
      )}

      {/* ==================== PESTAÑA: CUENTAS POR COBRAR ==================== */}
      {activeTab === 'cxc' && (
        <>
          <div className="grid grid-4 kpi-duo gap-4 mb-6">
            <Card>
              <div className="kpi-label">TOTAL CUENTAS POR COBRAR</div>
              <div className="kpi-value text-text mt-1">{formatUSD(cxcTotals.porCobrar)}</div>
              <span className="muted small">{formatVES(round2(cxcTotals.porCobrar * exchangeRate))}</span>
            </Card>
            <Card>
              <div className="kpi-label">FACTURADO A CRÉDITO</div>
              <div className="kpi-value text-text mt-1">{formatUSD(cxcTotals.facturado)}</div>
              <span className="muted small">{clientGroups.length} clientes con deuda</span>
            </Card>
            <Card>
              <div className="kpi-label">CRÉDITO COBRADO</div>
              <div className="kpi-value positive mt-1">{formatUSD(cxcTotals.cobrado)}</div>
              <span className="muted small">Abonos y facturas liquidadas</span>
            </Card>
            <Card>
              <div className="kpi-label">CARTERA VENCIDA</div>
              <div className="kpi-value negative mt-1">{formatUSD(cxcTotals.vencida)}</div>
              <span className="muted small">Facturas fuera de fecha</span>
            </Card>
          </div>

          <Card>
            <div className="section-head mb-4">
              <h3>Historial Consolidado de la Cartera</h3>
              <span className="badge brand">{filteredClientGroups.length} clientes</span>
            </div>

            {isLoading ? (
              <div className="p-8 text-center muted small">Cargando cartera...</div>
            ) : filteredClientGroups.length === 0 ? (
              <div className="p-8 text-center muted small">
                No hay clientes con saldo pendiente en este periodo.
              </div>
            ) : (
              <div className="table-wrap">
                <table className="table acc-cxc-table">
                  <thead>
                    <tr>
                      <th>Cliente</th>
                      <th>Teléfono / RIF</th>
                      <th>Factura(s)</th>
                      <th className="num">Total Factura</th>
                      <th className="num">Pendiente ($)</th>
                      <th className="num">Pendiente (Bs)</th>
                      <th className="num">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredClientGroups.map(g => (
                      <Fragment key={g.key}>
                        <tr>
                          <td className="font-semibold text-xs">
                            {g.name}
                            {g.isOverdue && <span className="badge danger acc-mini-badge">Vencida</span>}
                          </td>
                          <td className="text-xs">
                            <div>{g.phone || '—'}</div>
                            <div className="muted">{g.doc || 'Sin RIF'}</div>
                          </td>
                          <td className="text-xs font-medium">{g.invoices.length > 1 ? `${g.invoices.length} facturas` : g.invoices[0]?.doc_number || '—'}</td>
                          <td className="num font-semibold">{formatUSD(g.totalFacturado)}</td>
                          <td className="num font-bold">{formatUSD(g.saldoPendiente)}</td>
                          <td className="num muted">{formatVES(round2(g.saldoPendiente * exchangeRate))}</td>
                          <td className="num">{renderDetailToggle(`cxc-${g.key}`, expandedKey === `cxc-${g.key}`)}</td>
                        </tr>
                        {expandedKey === `cxc-${g.key}` && (
                          <tr className="acc-detail-row">
                            <td colSpan={7}>
                              <div className="acc-detail-box">
                                <h4>Estado de cuenta de {g.name}</h4>
                                <div className="acc-detail-grid">
                                  {g.invoices.map(i => (
                                    <div key={i.id} className="acc-detail-item">
                                      <div className="acc-detail-line">
                                        <b>{i.doc_number || 'Sin número'}</b>
                                        <Badge tone={i.status === 'Pagada' ? 'success' : i.due_date && new Date(i.due_date) < new Date() ? 'danger' : 'brand'}>
                                          {i.status || 'PENDIENTE'}
                                        </Badge>
                                      </div>
                                      <div className="acc-detail-line muted">
                                        <span>Fecha: {i.created_at ? new Date(i.created_at).toLocaleDateString() : '—'}</span>
                                        <span>Vence: {i.due_date ? new Date(i.due_date).toLocaleDateString() : '—'}</span>
                                      </div>
                                      <div className="acc-detail-line">
                                        <span>Total: <b>{formatUSD(round2(Number(i.total_usd) || 0))}</b></span>
                                        <span className="negative">Pendiente: <b>{formatUSD(round2(Number(i.balance_usd) || 0))}</b></span>
                                      </div>
                                      <div className="acc-detail-line muted">
                                        <span>Pendiente Bs: {formatVES(round2((Number(i.balance_usd) || 0) * exchangeRate))}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}

      {/* ==================== PESTAÑA: CUENTAS POR PAGAR ==================== */}
      {activeTab === 'cxp' && (
        <>
          <div className="grid grid-4 kpi-duo gap-4 mb-6">
            <Card>
              <div className="kpi-label">TOTAL POR PAGAR</div>
              <div className="kpi-value text-text mt-1">{formatUSD(cxpTotals.porPagar)}</div>
              <span className="muted small">{formatVES(round2(cxpTotals.porPagar * exchangeRate))}</span>
            </Card>
            <Card>
              <div className="kpi-label">COMPRAS A CRÉDITO</div>
              <div className="kpi-value text-text mt-1">{formatUSD(cxpTotals.comprado)}</div>
              <span className="muted small">{supplierGroups.length} proveedores con deuda</span>
            </Card>
            <Card>
              <div className="kpi-label">TOTAL LIQUIDADO</div>
              <div className="kpi-value positive mt-1">{formatUSD(cxpTotals.liquidado)}</div>
              <span className="muted small">Pagos y compras saldadas</span>
            </Card>
            <Card>
              <div className="kpi-label">DEUDAS VENCIDAS</div>
              <div className="kpi-value negative mt-1">{formatUSD(cxpTotals.vencida)}</div>
              <span className="muted small">Facturas fuera de fecha</span>
            </Card>
          </div>

          <Card>
            <div className="section-head mb-4">
              <h3>Consolidado de Proveedores</h3>
              <span className="badge brand">{filteredSupplierGroups.length} proveedores</span>
            </div>

            {isLoading ? (
              <div className="p-8 text-center muted small">Cargando cuentas por pagar...</div>
            ) : filteredSupplierGroups.length === 0 ? (
              <div className="p-8 text-center muted small">
                No hay proveedores con saldo pendiente en este periodo.
              </div>
            ) : (
              <div className="table-wrap">
                <table className="table acc-cxp-table">
                  <thead>
                    <tr>
                      <th>Proveedor</th>
                      <th>RIF</th>
                      <th>Factura(s)</th>
                      <th className="num">Total Compras</th>
                      <th className="num">Por Pagar ($)</th>
                      <th className="num">Por Pagar (Bs)</th>
                      <th className="num">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSupplierGroups.map(g => (
                      <Fragment key={g.key}>
                        <tr>
                          <td className="font-semibold text-xs">
                            {g.name}
                            {g.isOverdue && <span className="badge danger acc-mini-badge">Vencida</span>}
                          </td>
                          <td className="text-xs">{g.doc || 'Sin RIF'}</td>
                          <td className="text-xs font-medium">{g.invoices.length > 1 ? `${g.invoices.length} facturas` : g.invoices[0]?.doc_number || '—'}</td>
                          <td className="num font-semibold">{formatUSD(g.totalCompras)}</td>
                          <td className="num font-bold">{formatUSD(g.saldoPendiente)}</td>
                          <td className="num muted">{formatVES(round2(g.saldoPendiente * exchangeRate))}</td>
                          <td className="num">{renderDetailToggle(`cxp-${g.key}`, expandedKey === `cxp-${g.key}`)}</td>
                        </tr>
                        {expandedKey === `cxp-${g.key}` && (
                          <tr className="acc-detail-row">
                            <td colSpan={7}>
                              <div className="acc-detail-box">
                                <h4>Estado de cuenta de {g.name}</h4>
                                <div className="acc-detail-grid">
                                  {g.invoices.map(i => (
                                    <div key={i.id} className="acc-detail-item">
                                      <div className="acc-detail-line">
                                        <b>{i.doc_number || 'Sin número'}</b>
                                        <Badge tone={i.status === 'Pagada' ? 'success' : i.due_date && new Date(i.due_date) < new Date() ? 'danger' : 'brand'}>
                                          {i.status || 'PENDIENTE'}
                                        </Badge>
                                      </div>
                                      <div className="acc-detail-line muted">
                                        <span>Fecha: {i.created_at ? new Date(i.created_at).toLocaleDateString() : '—'}</span>
                                        <span>Vence: {i.due_date ? new Date(i.due_date).toLocaleDateString() : '—'}</span>
                                      </div>
                                      <div className="acc-detail-line">
                                        <span>Total: <b>{formatUSD(round2(Number(i.total_usd) || 0))}</b></span>
                                        <span className="negative">Pendiente: <b>{formatUSD(round2(Number(i.balance_usd) || 0))}</b></span>
                                      </div>
                                      <div className="acc-detail-line muted">
                                        <span>Pendiente Bs: {formatVES(round2((Number(i.balance_usd) || 0) * exchangeRate))}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
