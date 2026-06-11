'use client';
import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import api from '@/lib/api';
import { formatCLP } from '@/lib/utils';

const METODOS_PAGO = ['efectivo', 'debito', 'credito', 'transferencia'];

export default function POSPage() {
  const [products, setProducts]   = useState([]);
  const [categories, setCategories] = useState([]);
  const [clients, setClients]     = useState([]);
  const [cart, setCart]           = useState([]);
  const [search, setSearch]       = useState('');
  const [selectedCat, setSelectedCat] = useState('');
  const [selectedClient, setSelectedClient] = useState('');
  const [metodoPago, setMetodoPago] = useState('efectivo');
  const [loading, setLoading]     = useState(false);
  const [success, setSuccess]     = useState('');

  const loadProducts = useCallback(() => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (selectedCat) params.set('categoria_id', selectedCat);
    api.get(`/products?${params}`).then((r) => setProducts(r.data)).catch(console.error);
  }, [search, selectedCat]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    api.get('/categories').then((r) => setCategories(r.data)).catch(console.error);
    api.get('/clients').then((r) => setClients(r.data)).catch(console.error);
  }, []);

  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.producto_id === product.id);
      if (existing) {
        if (existing.cantidad >= product.stock) return prev;
        return prev.map((i) => i.producto_id === product.id
          ? { ...i, cantidad: i.cantidad + 1, subtotal: (i.cantidad + 1) * i.precio_unitario }
          : i
        );
      }
      return [...prev, {
        producto_id: product.id,
        nombre: product.nombre,
        precio_unitario: product.precio,
        cantidad: 1,
        subtotal: product.precio,
        stock: product.stock,
      }];
    });
  };

  const updateQty = (producto_id, qty) => {
    if (qty < 1) return removeFromCart(producto_id);
    setCart((prev) => prev.map((i) =>
      i.producto_id === producto_id
        ? { ...i, cantidad: qty, subtotal: qty * i.precio_unitario }
        : i
    ));
  };

  const removeFromCart = (producto_id) =>
    setCart((prev) => prev.filter((i) => i.producto_id !== producto_id));

  const total = cart.reduce((acc, i) => acc + i.subtotal, 0);

  const handleCheckout = async () => {
    if (!cart.length) return;
    setLoading(true);
    setSuccess('');
    try {
      await api.post('/sales', {
        cliente_id: selectedClient || null,
        metodo_pago: metodoPago,
        items: cart.map(({ producto_id, cantidad, precio_unitario }) => ({
          producto_id, cantidad, precio_unitario,
        })),
      });
      setCart([]);
      setSelectedClient('');
      setMetodoPago('efectivo');
      setSuccess('¡Venta registrada exitosamente!');
      loadProducts(); // Actualizar stock
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      alert(err.response?.data?.error || 'Error al registrar la venta.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-6 h-[calc(100vh-3rem)]">
      {/* Panel izquierdo: productos */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center gap-2 mb-4">
          <h1 className="text-xl font-bold text-gray-900 mr-auto">Punto de Venta</h1>
        </div>

        {/* Filtros */}
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder="Buscar producto..."
            className="input flex-1"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="input w-44"
            value={selectedCat}
            onChange={(e) => setSelectedCat(e.target.value)}
          >
            <option value="">Todas las categorías</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
        </div>

        {/* Grid de productos */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 overflow-y-auto pb-2">
          {products.map((p) => (
            <button
              key={p.id}
              onClick={() => addToCart(p)}
              disabled={p.stock === 0}
              className="bg-white border border-gray-200 rounded-xl p-3 text-left hover:border-indigo-300 hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="w-full h-20 bg-gray-100 rounded-lg mb-2 overflow-hidden flex items-center justify-center relative">
                {p.imagen_url
                  ? <img src={p.imagen_url.split('?')[0]} alt={p.nombre} className="object-cover w-full h-full" />
                  : <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                }
              </div>
              <p className="text-xs font-semibold text-gray-900 truncate">{p.nombre}</p>
              <p className="text-sm font-bold text-indigo-600 mt-0.5">{formatCLP(p.precio)}</p>
              <p className={`text-xs mt-0.5 ${p.stock < 5 ? 'text-red-500' : 'text-gray-400'}`}>
                Stock: {p.stock}
              </p>
            </button>
          ))}
          {products.length === 0 && (
            <p className="col-span-full text-center text-gray-400 py-10">Sin productos</p>
          )}
        </div>
      </div>

      {/* Panel derecho: carrito */}
      <div className="w-80 flex flex-col bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Carrito</h2>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {cart.length === 0 && (
            <p className="text-center text-gray-400 text-sm py-8">Agrega productos al carrito</p>
          )}
          {cart.map((item) => (
            <div key={item.producto_id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-800 truncate">{item.nombre}</p>
                <p className="text-xs text-gray-500">{formatCLP(item.precio_unitario)} c/u</p>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => updateQty(item.producto_id, item.cantidad - 1)}
                  className="w-6 h-6 rounded bg-gray-200 hover:bg-gray-300 text-sm font-bold flex items-center justify-center">−</button>
                <span className="w-6 text-center text-sm font-semibold">{item.cantidad}</span>
                <button onClick={() => updateQty(item.producto_id, item.cantidad + 1)}
                  disabled={item.cantidad >= item.stock}
                  className="w-6 h-6 rounded bg-gray-200 hover:bg-gray-300 text-sm font-bold flex items-center justify-center disabled:opacity-40">+</button>
              </div>
              <p className="text-xs font-bold text-gray-900 w-16 text-right">{formatCLP(item.subtotal)}</p>
              <button onClick={() => removeFromCart(item.producto_id)}
                className="text-red-400 hover:text-red-600 ml-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          ))}
        </div>

        {/* Footer del carrito */}
        <div className="p-4 border-t border-gray-100 space-y-3">
          <select className="input text-sm" value={selectedClient} onChange={(e) => setSelectedClient(e.target.value)}>
            <option value="">Sin cliente (boleta)</option>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.nombre} ({c.rut})</option>)}
          </select>

          <select className="input text-sm" value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)}>
            {METODOS_PAGO.map((m) => <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>)}
          </select>

          <div className="flex justify-between items-center">
            <span className="font-semibold text-gray-700">Total</span>
            <span className="text-xl font-bold text-indigo-600">{formatCLP(total)}</span>
          </div>

          {success && <p className="text-green-600 text-sm text-center">{success}</p>}

          <button
            onClick={handleCheckout}
            disabled={!cart.length || loading}
            className="btn-primary w-full"
          >
            {loading ? 'Procesando...' : 'Cobrar'}
          </button>
          {cart.length > 0 && (
            <button onClick={() => setCart([])} className="btn-secondary w-full text-sm">
              Vaciar carrito
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
