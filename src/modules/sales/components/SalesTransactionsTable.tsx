import { Eye } from 'lucide-react';

export function SalesTransactionsTable() {
  const transactions = [
    { id: '001', date: '2026-10-10 10:00', doc: 'FAC-001', client: 'Juan Perez', method: 'Efectivo', rate: '1', usd: '100', ves: '100', status: 'Pagado' },
    { id: '002', date: '2026-10-10 12:00', doc: 'NE-002', client: 'Maria Lopez', method: 'Transferencia', rate: '36.5', usd: '250', ves: '9125', status: 'Pendiente' },
  ];

  return (
    <div className="card" style={{ padding: 16 }}>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Fecha/Hora</th>
              <th># Doc</th>
              <th>Cliente</th>
              <th>Método</th>
              <th className="num">Tasa</th>
              <th className="num">USD</th>
              <th className="num">VES</th>
              <th>Estado</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((t) => (
              <tr key={t.id}>
                <td>{t.date}</td>
                <td>{t.doc}</td>
                <td>{t.client}</td>
                <td>{t.method}</td>
                <td className="num">{t.rate}</td>
                <td className="num">{t.usd}</td>
                <td className="num">{t.ves}</td>
                <td>
                  <span className={`badge ${t.status === 'Pagado' ? 'success' : 'warning'}`}>{t.status}</span>
                </td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <button
                    type="button"
                    title="Ver detalle de la transacción"
                    style={{
                      border: 'none',
                      background: 'transparent',
                      color: 'var(--brand-500)',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: 4,
                      borderRadius: 8
                    }}
                  >
                    <Eye size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
