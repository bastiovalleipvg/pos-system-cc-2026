'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { formatCLP } from '@/lib/utils';

function StatCard({ title, value, sub, color, icon }) {
  return (
    <div className="card flex items-start gap-4">
      <div className={`p-3 rounded-xl ${color}`}>{icon}</div>
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [summary, setSummary] = useState(null);
  const [topProducts, setTopProducts] = useState([]);
  const [recentSales, setRecentSales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/reports/summary'),
      api.get('/reports/top-products?limit=5'),
      api.get('/sales'),
    ]).then(([s, tp, sales]) => {
      setSummary(s.data);
      setTopProducts(tp.data);
      setRecentSales(sales.data.slice(0, 8));
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-20 text-gray-400">Cargando...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Ventas hoy"
          value={summary ? formatCLP(summary.ventas_hoy.monto) : '-'}
          sub={summary ? `${summary.ventas_hoy.cantidad} transacciones` : 'Sin datos'}
          color="bg-indigo-100"
          icon={<svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <StatCard
          title="Ventas del mes"
          value={summary ? formatCLP(summary.ventas_mes.monto) : '-'}
          sub={summary ? `${summary.ventas_mes.cantidad} transacciones` : 'Sin datos'}
          color="bg-green-100"
          icon={<svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
        />
        <StatCard
          title="Productos activos"
          value={summary?.total_productos ?? '-'}
          color="bg-yellow-100"
          icon={<svg className="w-6 h-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>}
        />
        <StatCard
          title="Clientes registrados"
          value={summary?.total_clientes ?? '-'}
          color="bg-purple-100"
          icon={<svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Últimas ventas */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Últimas ventas</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="table-header">N°</th>
                  <th className="table-header">Cliente</th>
                  <th className="table-header">Total</th>
                  <th className="table-header">Estado</th>
                </tr>
              </thead>
              <tbody>
                {recentSales.length === 0 && (
                  <tr><td colSpan={4} className="table-cell text-center text-gray-400">Sin ventas aún</td></tr>
                )}
                {recentSales.map((v) => (
                  <tr key={v.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="table-cell font-mono text-gray-500">#{v.id}</td>
                    <td className="table-cell">{v.cliente_nombre || 'Sin cliente'}</td>
                    <td className="table-cell font-semibold">{formatCLP(v.total)}</td>
                    <td className="table-cell">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${v.estado === 'completada' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {v.estado}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top productos */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Productos más vendidos</h2>
          {topProducts.length === 0 && <p className="text-gray-400 text-sm text-center py-4">Sin datos aún</p>}
          <div className="space-y-3">
            {topProducts.map((p, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-gray-400 w-5">#{i + 1}</span>
                  <span className="text-sm text-gray-800">{p.nombre}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">{formatCLP(p.ingreso_total)}</p>
                  <p className="text-xs text-gray-400">{p.unidades_vendidas} uds.</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
