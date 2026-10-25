export function SalesFilters() {
  return (
    <div
      className="card"
      style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', padding: 16, marginBottom: 16 }}
    >
      <input
        type="text"
        placeholder="Buscar por cliente, documento, producto..."
        className="input"
        style={{ width: '100%', maxWidth: 280, minWidth: 0 }}
      />
      <select className="input">
        <option>Período (Este mes)</option>
        <option>Hoy</option>
        <option>Ayer</option>
        <option>Últimos 30 días</option>
      </select>
      <select className="input">
        <option>Tipo Doc</option>
        <option>Factura</option>
        <option>Nota de Entrega</option>
      </select>
      <select className="input">
        <option>Método de Pago</option>
        <option>Efectivo</option>
        <option>Transferencia</option>
      </select>
      <select className="input">
        <option>Estado</option>
        <option>Pagado</option>
        <option>Pendiente</option>
      </select>
    </div>
  );
}
