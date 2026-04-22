import React, { useState } from 'react';
import { Plus, Edit2, Trash2, X, Search, AlertTriangle, PackagePlus } from 'lucide-react';

export default function InsumosModule({ supplies, setSupplies }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [restockModal, setRestockModal] = useState(null);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [restockQty, setRestockQty] = useState('');
  const blank = { name: '', stock: '', unit: 'g', cost: '', minStock: '5', category: 'General' };
  const [form, setForm] = useState(blank);

  const UNITS = ['g', 'kg', 'ml', 'L', 'pz', 'oz', 'lb', 'taza', 'cda', 'cdita'];
  const CATEGORIES = ['General', 'Harinas', 'Lácteos', 'Azúcares', 'Frutas', 'Esencias', 'Decoración', 'Empaque', 'Otro'];

  const handleSave = (e) => {
    e.preventDefault();
    if (editing) {
      setSupplies(supplies.map(s => s.id === editing.id ? { ...s, ...form } : s));
    } else {
      setSupplies([...supplies, { ...form, id: Date.now().toString(), createdAt: new Date().toISOString() }]);
    }
    closeModal();
  };

  const closeModal = () => { setModalOpen(false); setEditing(null); setForm(blank); };
  const openEdit = (s) => { setEditing(s); setForm(s); setModalOpen(true); };
  const deleteItem = (id) => {
    if (window.confirm('¿Eliminar este insumo?')) setSupplies(supplies.filter(s => s.id !== id));
  };

  const handleRestock = (e) => {
    e.preventDefault();
    setSupplies(supplies.map(s => s.id === restockModal.id ? { ...s, stock: Number(s.stock) + Number(restockQty) } : s));
    setRestockModal(null);
    setRestockQty('');
  };

  const filtered = supplies
    .filter(s => !search || s.name.toLowerCase().includes(search.toLowerCase()) || (s.category || '').toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));

  const lowStockItems = supplies.filter(s => Number(s.stock) <= Number(s.minStock || 5));

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
          <Plus size={18} /> Nuevo Insumo
        </button>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{supplies.length} insumos registrados</span>
      </div>

      {/* Low stock alert */}
      {lowStockItems.length > 0 && (
        <div className="alert-banner alert-warning">
          <AlertTriangle size={18} />
          <span><strong>{lowStockItems.length}</strong> insumo(s) con stock bajo: {lowStockItems.map(s => s.name).join(', ')}</span>
        </div>
      )}

      {/* Search */}
      <div className="search-wrap">
        <Search size={18} className="search-icon" />
        <input type="text" placeholder="Buscar insumo o categoría..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Table view */}
      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📦</div>
          <p>No hay insumos registrados.</p>
        </div>
      ) : (
        <div className="glass-panel" style={{ overflow: 'auto', padding: '0.5rem' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Insumo</th>
                <th>Categoría</th>
                <th style={{ textAlign: 'center' }}>Stock</th>
                <th style={{ textAlign: 'center' }}>Unidad</th>
                <th style={{ textAlign: 'right' }}>Costo</th>
                <th style={{ textAlign: 'center' }}>Estado</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => {
                const isLow = Number(s.stock) <= Number(s.minStock || 5);
                return (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 600 }}>{s.name}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{s.category || 'General'}</td>
                    <td style={{ textAlign: 'center', fontWeight: 700, color: isLow ? 'var(--danger)' : 'var(--text-main)' }}>{s.stock}</td>
                    <td style={{ textAlign: 'center', color: 'var(--text-muted)' }}>{s.unit}</td>
                    <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>{s.cost ? `$${Number(s.cost).toFixed(2)}` : '—'}</td>
                    <td style={{ textAlign: 'center' }}>
                      {isLow ? <span className="badge badge-low">Bajo</span> : <span className="badge badge-ok">OK</span>}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.3rem', justifyContent: 'flex-end' }}>
                        <button className="btn btn-sm btn-ghost" title="Reabastecer" onClick={() => { setRestockModal(s); setRestockQty(''); }}>
                          <PackagePlus size={14} />
                        </button>
                        <button className="btn btn-sm btn-ghost" onClick={() => openEdit(s)}><Edit2 size={14} /></button>
                        <button className="btn btn-sm btn-ghost" style={{ color: 'var(--danger)' }} onClick={() => deleteItem(s.id)}><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── New/Edit Supply Modal ── */}
      {modalOpen && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3>{editing ? 'Editar Insumo' : 'Nuevo Insumo'}</h3>
              <button className="btn btn-icon btn-ghost" onClick={closeModal}><X size={20} /></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label>Nombre del insumo</label>
                <input required type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ej. Harina de trigo" />
              </div>
              <div className="form-group">
                <label>Categoría</label>
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Stock actual</label>
                  <input required type="number" min="0" step="0.01" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Unidad de medida</label>
                  <select value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })}>
                    {UNITS.map(u => <option key={u}>{u}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Costo unitario ($)</label>
                  <input type="number" min="0" step="0.01" value={form.cost} onChange={e => setForm({ ...form, cost: e.target.value })} placeholder="0.00" />
                </div>
                <div className="form-group">
                  <label>Stock mínimo (alerta)</label>
                  <input type="number" min="0" step="0.01" value={form.minStock} onChange={e => setForm({ ...form, minStock: e.target.value })} placeholder="5" />
                </div>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
                {editing ? 'Actualizar' : 'Guardar Insumo'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Restock Modal ── */}
      {restockModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setRestockModal(null)}>
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3>Reabastecer</h3>
              <button className="btn btn-icon btn-ghost" onClick={() => setRestockModal(null)}><X size={20} /></button>
            </div>
            <p style={{ color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
              <strong style={{ color: 'var(--text-main)' }}>{restockModal.name}</strong> — Stock actual: <strong>{restockModal.stock} {restockModal.unit}</strong>
            </p>
            <form onSubmit={handleRestock}>
              <div className="form-group">
                <label>Cantidad a agregar ({restockModal.unit})</label>
                <input required type="number" min="0.01" step="0.01" value={restockQty} onChange={e => setRestockQty(e.target.value)} autoFocus />
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--success)', marginBottom: '1rem' }}>
                Nuevo stock: <strong>{(Number(restockModal.stock) + Number(restockQty || 0)).toFixed(2)} {restockModal.unit}</strong>
              </p>
              <button type="submit" className="btn btn-success" style={{ width: '100%' }}>
                <PackagePlus size={18} /> Confirmar
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
