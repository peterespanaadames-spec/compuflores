import { Card } from '../../../components/ui/Card';

export function SalesKPIs() {
  const kpis = [
    { title: 'Órdenes', value: '145', tone: '' },
    { title: 'Ingresos Totales', value: '$12,450.00', tone: '' },
    { title: 'Utilidad Estimada', value: '$3,200.00', tone: 'positive' },
  ];

  return (
    <div className="grid grid-3">
      {kpis.map((kpi) => (
        <Card key={kpi.title}>
          <p className="kpi-label">{kpi.title}</p>
          <p className={`kpi-value ${kpi.tone}`}>{kpi.value}</p>
        </Card>
      ))}
    </div>
  );
}
