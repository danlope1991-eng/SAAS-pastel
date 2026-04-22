import React, { useState } from 'react';
import { Plus, Edit2, Trash2, X, Search, Copy } from 'lucide-react';

export default function RecetasModule({ recipes, setRecipes, supplies }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const blank = { name: '', description: '', category: 'Pastel', servings: '1', ingredients: [] };
  const [form, setForm] = useState(blank);

  const CATEGORIES = ['Pastel', 'Cupcake', 'Pan', 'Galleta', 'Postre', 'Betún/Relleno', 'Otro'];

  const handleSave = (e) => {
    e.preventDefault();
    if (form.ingredients.length === 0) {
      alert('Agrega al menos un ingrediente a la receta.');
      return;
    }
    if (editing) {
      setRecipes(recipes.map(r => r.id === editing.id ? { ...r, ...form } : r));
    } else {
      setRecipes([...recipes, { ...form, id: Date.now().toString(), createdAt: new Date().toISOString() }]);
    }
    closeModal();
  };

  const closeModal = () => { setModalOpen(false); setEditing(null); setForm(blank); };
  const openEdit = (r) => { setEditing(r); setForm({ ...r }); setModalOpen(true); };

  const deleteRecipe = (id) => {
    if (window.confirm('¿Eliminar esta receta?')) setRecipes(recipes.filter(r => r.id !== id));
  };

  const duplicateRecipe = (r) => {
    setRecipes([...recipes, { ...r, id: Date.now().toString(), name: r.name + ' (copia)', createdAt: new Date().toISOString() }]);
  };

  // ── Ingredient management ──
  const addIngredient = () => {
    setForm({ ...form, ingredients: [...form.ingredients, { supplyId: '', qty: '' }] });
  };
  const updateIngredient = (idx, field, val) => {
    const ings = [...form.ingredients];
    ings[idx] = { ...ings[idx], [field]: val };
    setForm({ ...form, ingredients: ings });
  };
  const removeIngredient = (idx) => {
    setForm({ ...form, ingredients: form.ingredients.filter((_, i) => i !== idx) });
  };

  // ── Cost estimation ──
  const getRecipeCost = (recipe) => {
    return recipe.ingredients.reduce((sum, ri) => {
      const sup = supplies.find(s => s.id === ri.supplyId);
      if (!sup || !sup.cost) return sum;
      return sum + (Number(sup.cost) * Number(ri.qty));
    }, 0);
  };

  // ── Stock check ──
  const canMakeRecipe = (recipe) => {
    return recipe.ingredients.every(ri => {
      const sup = supplies.find(s => s.id === ri.supplyId);
      return sup && Number(sup.stock) >= Number(ri.qty);
    });
  };

  const filtered = recipes
    .filter(r => !search || r.name.toLowerCase().includes(search.toLowerCase()) || (r.category || '').toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
          <Plus size={18} /> Nueva Receta
        </button>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{recipes.length} recetas</span>
      </div>

      {/* Search */}
      <div className="search-wrap">
        <Search size={18} className="search-icon" />
        <input type="text" placeholder="Buscar receta..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📖</div>
          <p>No hay recetas registradas.</p>
          <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>Las recetas definen qué insumos se usan para cada producto.</p>
        </div>
      ) : (
        filtered.map(recipe => {
          const cost = getRecipeCost(recipe);
          const canMake = canMakeRecipe(recipe);
          return (
            <div key={recipe.id} className="recipe-card animate-fade-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{recipe.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    {recipe.category} • {recipe.servings} porción(es)
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.3rem' }}>
                  {canMake
                    ? <span className="badge badge-ok">Disponible</span>
                    : <span className="badge badge-low">Sin stock</span>
                  }
                </div>
              </div>

              {recipe.description && (
                <p style={{ fontSize: '0.83rem', color: 'var(--text-muted)', marginBottom: '0.6rem', lineHeight: 1.4 }}>
                  {recipe.description}
                </p>
              )}

              {/* Ingredients chips */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginBottom: '0.6rem' }}>
                {recipe.ingredients.map((ri, i) => {
                  const sup = supplies.find(s => s.id === ri.supplyId);
                  const hasStock = sup && Number(sup.stock) >= Number(ri.qty);
                  return (
                    <span key={i} className="ingredient-chip" style={{ borderColor: hasStock ? 'var(--border)' : 'rgba(239,68,68,0.3)' }}>
                      {sup?.name || '?'}: {ri.qty} {sup?.unit || ''}
                      {!hasStock && <span style={{ color: 'var(--danger)', marginLeft: '0.2rem', fontSize: '0.7rem' }}>⚠</span>}
                    </span>
                  );
                })}
              </div>

              {/* Cost */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Costo estimado: <strong style={{ color: 'var(--accent)' }}>${cost.toFixed(2)}</strong>
                </span>
                <div style={{ display: 'flex', gap: '0.3rem' }}>
                  <button className="btn btn-sm btn-ghost" title="Duplicar" onClick={() => duplicateRecipe(recipe)}><Copy size={14} /></button>
                  <button className="btn btn-sm btn-ghost" onClick={() => openEdit(recipe)}><Edit2 size={14} /></button>
                  <button className="btn btn-sm btn-ghost" style={{ color: 'var(--danger)' }} onClick={() => deleteRecipe(recipe.id)}><Trash2 size={14} /></button>
                </div>
              </div>
            </div>
          );
        })
      )}

      {/* ── Recipe Modal ── */}
      {modalOpen && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3>{editing ? 'Editar Receta' : 'Nueva Receta'}</h3>
              <button className="btn btn-icon btn-ghost" onClick={closeModal}><X size={20} /></button>
            </div>

            {supplies.length === 0 && (
              <div className="alert-banner alert-warning" style={{ marginBottom: '1rem' }}>
                ⚠ No hay insumos registrados. Ve al módulo de Insumos primero.
              </div>
            )}

            <form onSubmit={handleSave}>
              <div className="form-group">
                <label>Nombre de la receta</label>
                <input required type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ej. Pastel de Chocolate 1kg" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Categoría</label>
                  <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Porciones</label>
                  <input type="number" min="1" value={form.servings} onChange={e => setForm({ ...form, servings: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label>Descripción (opcional)</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Notas sobre preparación, tamaño, etc." />
              </div>

              {/* Ingredients BOM */}
              <div style={{ marginTop: '0.5rem', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--primary)' }}>📦 Ingredientes (BOM)</label>
                  <button type="button" className="btn btn-sm btn-accent" onClick={addIngredient}><Plus size={14} /> Ingrediente</button>
                </div>

                {form.ingredients.length === 0 && (
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-dim)', padding: '1rem', textAlign: 'center', border: '1px dashed var(--border)', borderRadius: '10px' }}>
                    Agrega ingredientes para definir la lista de materiales (BOM).
                  </p>
                )}

                {form.ingredients.map((ing, idx) => {
                  const selectedSupply = supplies.find(s => s.id === ing.supplyId);
                  return (
                    <div key={idx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <select value={ing.supplyId} onChange={e => updateIngredient(idx, 'supplyId', e.target.value)} style={{ flex: 2 }} required>
                        <option value="">Seleccionar insumo</option>
                        {supplies.map(s => <option key={s.id} value={s.id}>{s.name} (stock: {s.stock} {s.unit})</option>)}
                      </select>
                      <input type="number" min="0.01" step="0.01" placeholder={selectedSupply ? selectedSupply.unit : 'Cant.'} value={ing.qty} onChange={e => updateIngredient(idx, 'qty', e.target.value)} style={{ flex: 1 }} required />
                      <button type="button" className="btn btn-icon btn-ghost" style={{ color: 'var(--danger)' }} onClick={() => removeIngredient(idx)}>
                        <X size={16} />
                      </button>
                    </div>
                  );
                })}

                {/* Live cost preview */}
                {form.ingredients.length > 0 && (
                  <div style={{ marginTop: '0.5rem', padding: '0.6rem', borderRadius: '8px', background: 'rgba(236,72,153,0.08)', fontSize: '0.85rem' }}>
                    Costo estimado: <strong style={{ color: 'var(--accent)' }}>
                      ${form.ingredients.reduce((sum, ri) => {
                        const sup = supplies.find(s => s.id === ri.supplyId);
                        return sum + (sup?.cost ? Number(sup.cost) * Number(ri.qty || 0) : 0);
                      }, 0).toFixed(2)}
                    </strong>
                  </div>
                )}
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                {editing ? 'Actualizar Receta' : 'Guardar Receta'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
