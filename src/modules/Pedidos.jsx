import React, { useState } from 'react';
import { Plus, Edit2, Trash2, X, Check, Phone, MapPin, Clock, DollarSign, Search } from 'lucide-react';

export default function PedidosModule({ orders, setOrders, recipes, supplies, setSupplies, sales, setSales }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [deliverModal, setDeliverModal] = useState(null);
  const [editing, setEditing] = useState(null);
  const [filter, setFilter] = useState('pending');
  const [search, setSearch] = useState('');
  const blank = { customer: '', phone: '', details: '', location: '', date: '', time: '', recipeId: '', customIngredients: [], advanceAmount: '', totalPrice: '' };
  const [form, setForm] = useState(blank);
  const [deliverForm, setDeliverForm] = useState({ finalTotal: '', paymentMethod: 'Efectivo' });

  // ── Save order ──
  const handleSave = (e) => {
    e.preventDefault();
    if (editing) {
      setOrders(orders.map(o => o.id === editing.id ? { ...o, ...form } : o));
    } else {
      setOrders([...orders, { ...form, id: Date.now().toString(), status: 'pending', createdAt: new Date().toISOString() }]);
    }
    closeModal();
  };

  const closeModal = () => { setModalOpen(false); setEditing(null); setForm(blank); };
  const openEdit = (o) => { setEditing(o); setForm(o); setModalOpen(true); };

  // ── Cancel order ──
  const cancelOrder = (id) => {
    if (window.confirm('¿Cancelar este pedido?')) {
      setOrders(orders.map(o => o.id === id ? { ...o, status: 'cancelled' } : o));
    }
  };

  // ── Delete order ──
  const deleteOrder = (id) => {
    if (window.confirm('¿Eliminar este pedido permanentemente?')) {
      setOrders(orders.filter(o => o.id !== id));
    }
  };

  // ── Open deliver modal ──
  const openDeliver = (order) => {
    const recipe = recipes.find(r => r.id === order.recipeId);
    const estimatedTotal = Number(order.totalPrice || 0);
    setDeliverForm({ finalTotal: estimatedTotal || '', paymentMethod: 'Efectivo' });
    setDeliverModal(order);
  };

  // ── Deliver order → deduct BOM, register sale ──
  const handleDeliver = (e) => {
    e.preventDefault();
    const order = deliverModal;
    const recipe = recipes.find(r => r.id === order.recipeId);

    // Deduct supplies based on recipe BOM + custom ingredients
    let newSupplies = [...supplies];
    const ingredientsToDeduct = [];

    if (recipe) {
      recipe.ingredients.forEach(ri => ingredientsToDeduct.push({ supplyId: ri.supplyId, qty: Number(ri.qty) }));
    }
    if (order.customIngredients?.length) {
      order.customIngredients.forEach(ci => ingredientsToDeduct.push({ supplyId: ci.supplyId, qty: Number(ci.qty) }));
    }

    ingredientsToDeduct.forEach(({ supplyId, qty }) => {
      const idx = newSupplies.findIndex(s => s.id === supplyId);
      if (idx !== -1) {
        newSupplies[idx] = { ...newSupplies[idx], stock: Math.max(0, Number(newSupplies[idx].stock) - qty) };
      }
    });
    setSupplies(newSupplies);

    // Update order status
    const advance = Number(order.advanceAmount || 0);
    const finalTotal = Number(deliverForm.finalTotal || 0);
    const remaining = Math.max(0, finalTotal - advance);

    setOrders(orders.map(o => o.id === order.id ? {
      ...o,
      status: 'delivered',
      finalTotal,
      remaining,
      paymentMethod: deliverForm.paymentMethod,
      deliveredAt: new Date().toISOString()
    } : o));

    // Register sale
    setSales([...sales, {
      id: Date.now().toString(),
      orderId: order.id,
      customer: order.customer,
      recipeName: recipe?.name || 'Personalizado',
      total: finalTotal,
      advance,
      remaining,
      paymentMethod: deliverForm.paymentMethod,
      date: new Date().toISOString(),
      ingredientsUsed: ingredientsToDeduct
    }]);

    setDeliverModal(null);
  };

  // ── Filters ──
  const filtered = orders
    .filter(o => filter === 'all' || o.status === filter)
    .filter(o => !search || o.customer.toLowerCase().includes(search.toLowerCase()) || (o.details || '').toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (a.status === 'pending' && b.status !== 'pending') return -1;
      if (b.status === 'pending' && a.status !== 'pending') return 1;
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });

  const counts = { all: orders.length, pending: 0, delivered: 0, cancelled: 0 };
  orders.forEach(o => { if (counts[o.status] !== undefined) counts[o.status]++; });

  const getBadge = (status) => {
    if (status === 'delivered') return <span className="badge badge-delivered">Entregado</span>;
    if (status === 'cancelled') return <span className="badge badge-cancelled">Cancelado</span>;
    return <span className="badge badge-pending">Pendiente</span>;
  };

  // ── Custom ingredient management for form ──
  const addCustomIngredient = () => {
    setForm({ ...form, customIngredients: [...(form.customIngredients || []), { supplyId: '', qty: '' }] });
  };
  const updateCustomIngredient = (idx, field, val) => {
    const ci = [...(form.customIngredients || [])];
    ci[idx] = { ...ci[idx], [field]: val };
    setForm({ ...form, customIngredients: ci });
  };
  const removeCustomIngredient = (idx) => {
    setForm({ ...form, customIngredients: (form.customIngredients || []).filter((_, i) => i !== idx) });
  };

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
          <Plus size={18} /> Nuevo Pedido
        </button>
      </div>

      {/* Search */}
      <div className="search-wrap">
        <Search size={18} className="search-icon" />
        <input type="text" placeholder="Buscar por cliente o detalle..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Filter tabs */}
      <div className="tabs">
        {[['all', 'Todos'], ['pending', 'Pendientes'], ['delivered', 'Entregados'], ['cancelled', 'Cancelados']].map(([k, label]) => (
          <button key={k} className={`tab ${filter === k ? 'active' : ''}`} onClick={() => setFilter(k)}>
            {label} ({counts[k]})
          </button>
        ))}
      </div>

      {/* Orders list */}
      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <p>No hay pedidos {filter !== 'all' ? 'con este filtro' : 'registrados'}.</p>
        </div>
      ) : (
        filtered.map(order => {
          const recipe = recipes.find(r => r.id === order.recipeId);
          return (
            <div key={order.id} className="order-card animate-fade-in">
              <div className="order-header">
                <div>
                  <div className="order-name">{order.customer}</div>
                  <div className="order-meta">
                    {order.phone && <span><Phone size={13} style={{ verticalAlign: 'text-bottom' }} /> {order.phone}</span>}
                    {order.location && <span><MapPin size={13} style={{ verticalAlign: 'text-bottom' }} /> {order.location}</span>}
                    <span><Clock size={13} style={{ verticalAlign: 'text-bottom' }} /> {order.date} {order.time}</span>
                    {recipe && <span>📖 {recipe.name}</span>}
                  </div>
                </div>
                {getBadge(order.status)}
              </div>

              {order.details && (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', lineHeight: 1.4 }}>
                  {order.details}
                </p>
              )}

              {/* Financial info */}
              <div style={{ display: 'flex', gap: '1rem', fontSize: '0.82rem', flexWrap: 'wrap' }}>
                {order.totalPrice && <span style={{ color: 'var(--info)' }}><DollarSign size={13} style={{ verticalAlign: 'text-bottom' }} /> Precio: ${Number(order.totalPrice).toFixed(2)}</span>}
                {Number(order.advanceAmount) > 0 && <span className="badge badge-advance">Anticipo: ${Number(order.advanceAmount).toFixed(2)}</span>}
                {order.status === 'delivered' && <span style={{ color: 'var(--success)', fontWeight: 700 }}>Total Final: ${Number(order.finalTotal).toFixed(2)}</span>}
                {order.status === 'delivered' && Number(order.remaining) > 0 && <span style={{ color: 'var(--warning)' }}>Restante: ${Number(order.remaining).toFixed(2)}</span>}
              </div>

              {/* Actions */}
              {order.status === 'pending' && (
                <div className="order-actions">
                  <button className="btn btn-sm btn-ghost" onClick={() => openEdit(order)}><Edit2 size={14} /> Editar</button>
                  <button className="btn btn-sm btn-success" onClick={() => openDeliver(order)}><Check size={14} /> Entregar</button>
                  <button className="btn btn-sm btn-ghost" style={{ color: 'var(--warning)' }} onClick={() => cancelOrder(order.id)}><X size={14} /> Cancelar</button>
                  <button className="btn btn-sm btn-ghost" style={{ color: 'var(--danger)' }} onClick={() => deleteOrder(order.id)}><Trash2 size={14} /></button>
                </div>
              )}
            </div>
          );
        })
      )}

      {/* ── New/Edit Order Modal ── */}
      {modalOpen && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && closeModal()}>
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3>{editing ? 'Editar Pedido' : 'Nuevo Pedido'}</h3>
              <button className="btn btn-icon btn-ghost" onClick={closeModal}><X size={20} /></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label>Nombre del cliente</label>
                <input required type="text" value={form.customer} onChange={e => setForm({ ...form, customer: e.target.value })} placeholder="Nombre completo" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Teléfono</label>
                  <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="55 1234 5678" />
                </div>
                <div className="form-group">
                  <label>Ubicación / Dirección</label>
                  <input type="text" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="Colonia, calle..." />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Fecha de entrega</label>
                  <input required type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Hora de entrega</label>
                  <input required type="time" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label>Receta base</label>
                <select value={form.recipeId} onChange={e => setForm({ ...form, recipeId: e.target.value })}>
                  <option value="">— Sin receta (personalizado) —</option>
                  {recipes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Detalles del pedido</label>
                <textarea value={form.details} onChange={e => setForm({ ...form, details: e.target.value })} placeholder="Sabor, tamaño, decoración, texto, etc." />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Precio total ($)</label>
                  <input type="number" min="0" step="0.01" value={form.totalPrice} onChange={e => setForm({ ...form, totalPrice: e.target.value })} placeholder="0.00" />
                </div>
                <div className="form-group">
                  <label>Anticipo ($)</label>
                  <input type="number" min="0" step="0.01" value={form.advanceAmount} onChange={e => setForm({ ...form, advanceAmount: e.target.value })} placeholder="0.00" />
                </div>
              </div>

              {/* Custom ingredients per order */}
              <div style={{ marginTop: '0.5rem', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Ingredientes extra (personalización)</label>
                  <button type="button" className="btn btn-sm btn-ghost" onClick={addCustomIngredient}><Plus size={14} /> Agregar</button>
                </div>
                {(form.customIngredients || []).map((ci, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <select value={ci.supplyId} onChange={e => updateCustomIngredient(idx, 'supplyId', e.target.value)} style={{ flex: 2 }}>
                      <option value="">Seleccionar insumo</option>
                      {supplies.map(s => <option key={s.id} value={s.id}>{s.name} ({s.unit})</option>)}
                    </select>
                    <input type="number" min="0" step="0.01" placeholder="Cant." value={ci.qty} onChange={e => updateCustomIngredient(idx, 'qty', e.target.value)} style={{ flex: 1 }} />
                    <button type="button" className="btn btn-icon btn-ghost" style={{ color: 'var(--danger)' }} onClick={() => removeCustomIngredient(idx)}><X size={16} /></button>
                  </div>
                ))}
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                {editing ? 'Actualizar Pedido' : 'Crear Pedido'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Deliver Modal ── */}
      {deliverModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setDeliverModal(null)}>
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3>Entregar Pedido</h3>
              <button className="btn btn-icon btn-ghost" onClick={() => setDeliverModal(null)}><X size={20} /></button>
            </div>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Cliente: <strong style={{ color: 'var(--text-main)' }}>{deliverModal.customer}</strong>
            </p>

            {/* Recipe BOM preview */}
            {(() => {
              const recipe = recipes.find(r => r.id === deliverModal.recipeId);
              if (!recipe) return null;
              return (
                <div style={{ marginBottom: '1rem', padding: '0.8rem', borderRadius: '10px', background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.15)' }}>
                  <strong style={{ fontSize: '0.85rem' }}>📖 Receta: {recipe.name}</strong>
                  <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {recipe.ingredients.map((ri, i) => {
                      const sup = supplies.find(s => s.id === ri.supplyId);
                      return <div key={i}>{sup?.name || '?'}: {ri.qty} {sup?.unit || ''}</div>;
                    })}
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--warning)', marginTop: '0.4rem' }}>⚠ Se descontarán estos insumos al confirmar.</p>
                </div>
              );
            })()}

            {/* Custom ingredients preview */}
            {deliverModal.customIngredients?.length > 0 && (
              <div style={{ marginBottom: '1rem', padding: '0.8rem', borderRadius: '10px', background: 'rgba(236,72,153,0.08)', border: '1px solid rgba(236,72,153,0.15)' }}>
                <strong style={{ fontSize: '0.85rem' }}>🎨 Extras personalizados</strong>
                <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {deliverModal.customIngredients.map((ci, i) => {
                    const sup = supplies.find(s => s.id === ci.supplyId);
                    return <div key={i}>{sup?.name || '?'}: {ci.qty} {sup?.unit || ''}</div>;
                  })}
                </div>
              </div>
            )}

            <form onSubmit={handleDeliver}>
              <div className="form-group">
                <label>Total final cobrado ($)</label>
                <input required type="number" min="0" step="0.01" value={deliverForm.finalTotal} onChange={e => setDeliverForm({ ...deliverForm, finalTotal: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Método de pago</label>
                <select value={deliverForm.paymentMethod} onChange={e => setDeliverForm({ ...deliverForm, paymentMethod: e.target.value })}>
                  <option>Efectivo</option>
                  <option>Transferencia</option>
                  <option>Tarjeta</option>
                </select>
              </div>

              {Number(deliverModal.advanceAmount) > 0 && (
                <div className="total-strip" style={{ fontSize: '0.95rem', marginBottom: '0.75rem', background: 'rgba(59,130,246,0.15)', color: 'var(--info)' }}>
                  <span>Anticipo recibido</span>
                  <span>${Number(deliverModal.advanceAmount).toFixed(2)}</span>
                </div>
              )}

              <div className="total-strip">
                <span>Restante a cobrar</span>
                <span>${Math.max(0, Number(deliverForm.finalTotal || 0) - Number(deliverModal.advanceAmount || 0)).toFixed(2)}</span>
              </div>

              <button type="submit" className="btn btn-success" style={{ width: '100%', padding: '0.9rem', fontSize: '1rem', marginTop: '0.5rem' }}>
                <Check size={20} /> Confirmar Entrega y Registrar Venta
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
