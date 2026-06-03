'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { formatCLP } from '@/lib/utils';

export default function SalesPage() {
  const [sales, setSales]   = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  
  const isAdmin = user?.rol === 'admin';

  const load = () => {
    setLoading(true);
    api.get('/sales').then((r) => setSales(r.data)).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleCancel = async (id) => {
    if (!confirm('¿Anular esta venta? Se repondrá el stock de los productos.')) return;
    try {
      await api.put(`/sales/${id}/cancel`);
      load();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al anular.');
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Historial de Ventas</h1>

      <div className="card p-0 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="table-header">N° Venta</th>
              <th className="table-header">Fecha</th>
              <th className="table-header">Cliente</th>
              <th className="table-header">Cajero</th>
              <th className="table-header">Método Pago</th>
              <th className="table-header">Total</th>
              <th className="table-header">Estado</th>
              <th className="table-header">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && (
              <tr><td colSpan={8} className="table-cell text-center text-gray-400 py-8">Cargando...</td></tr>
            )}
            {!loading && sales.length === 0 && (
              <tr><td colSpan={8} className="table-cell text-center text-gray-400 py-8">Sin ventas registradas</td></tr>
            )}
            {sales.map((v) => (
              <tr key={v.id} className="hover:bg-gray-50">
                <td className="table-cell font-mono text-gray-600">#{v.id}</td>
                <td className="table-cell text-sm text-gray-500">
                  {new Date(v.created_at).toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' })}
                </td>
                <td className="table-cell">{v.cliente_nombre || '—'}</td>
                <td className="table-cell text-gray-500">{v.cajero_nombre || '—'}</td>
                <td className="table-cell capitalize">{v.metodo_pago}</td>
                <td className="table-cell font-semibold">{formatCLP(v.total)}</td>
                <td className="table-cell">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${v.estado === 'completada' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                    {v.estado}
                  </span>
                </td>
                <td className="table-cell">
                  {v.estado === 'completada' && isAdmin && (
                    <button onClick={() => handleCancel(v.id)} className="text-red-500 hover:underline text-sm">Anular</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
