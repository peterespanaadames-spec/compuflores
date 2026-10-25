import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const data = [
  { name: 'Lun', sales: 4000 },
  { name: 'Mar', sales: 3000 },
  { name: 'Mié', sales: 2000 },
  { name: 'Jue', sales: 2780 },
  { name: 'Vie', sales: 1890 },
];

export function SalesCharts() {
  return (
    <div className="grid grid-2">
      <div className="card">
        <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 800, color: '#111827' }}>Tendencia de Ventas</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="sales" stroke="#8884d8" />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="card">
        <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 800, color: '#111827' }}>Mezcla por Canal</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie data={[{name: 'POS', value: 70}, {name: 'Web', value: 30}]} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="#8884d8">
                <Cell fill="#8884d8" />
                <Cell fill="#82ca9d" />
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
