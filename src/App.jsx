import React, { useState } from 'react';
import { ArrowLeft, ShoppingBag, Package, BookOpen, BarChart3, ClipboardList } from 'lucide-react';
import useLocalStorage from './useLocalStorage';
import PedidosModule from './modules/Pedidos.jsx';
import InsumosModule from './modules/Insumos.jsx';
import RecetasModule from './modules/Recetas.jsx';
import VentasModule from './modules/Ventas.jsx';
import './index.css';

const MODULES = [
  { id: 'pedidos',    icon: '📋', title: 'Pedidos',    desc: 'Gestión de pedidos', lucide: ClipboardList },
  { id: 'insumos',    icon: '📦', title: 'Insumos',    desc: 'Materia prima',      lucide: Package },
  { id: 'recetas',    icon: '📖', title: 'Recetas',    desc: 'BOM de productos',   lucide: BookOpen },
  { id: 'ventas',     icon: '📊', title: 'Ventas',     desc: 'Historial y reportes', lucide: BarChart3 },
];

export default function App() {
  const [view, setView] = useState('home');

  // ── Shared Data Stores (localStorage) ──
  const [orders, setOrders]     = useLocalStorage('pastel_orders', []);
  const [supplies, setSupplies] = useLocalStorage('pastel_supplies', []);
  const [recipes, setRecipes]   = useLocalStorage('pastel_recipes', []);
  const [sales, setSales]       = useLocalStorage('pastel_sales', []);

  const goHome = () => setView('home');

  return (
    <div className="app-container">
      {/* ── HOME SCREEN ── */}
      {view === 'home' && (
        <div className="animate-fade-in">
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🎂</div>
            <h1 style={{ background: 'linear-gradient(135deg, var(--primary), var(--accent))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontSize: '1.8rem' }}>
              PastelApp
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.3rem' }}>
              Gestión de pedidos &amp; inventario
            </p>
          </div>

          {/* Quick KPIs */}
          <div className="kpi-grid">
            <div className="glass-panel kpi-card" style={{ marginBottom: 0 }}>
              <div className="kpi-value" style={{ color: 'var(--warning)' }}>{orders.filter(o => o.status === 'pending').length}</div>
              <div className="kpi-label">Pendientes</div>
            </div>
            <div className="glass-panel kpi-card" style={{ marginBottom: 0 }}>
              <div className="kpi-value" style={{ color: 'var(--success)' }}>{sales.length}</div>
              <div className="kpi-label">Ventas</div>
            </div>
            <div className="glass-panel kpi-card" style={{ marginBottom: 0 }}>
              <div className="kpi-value" style={{ color: 'var(--primary)' }}>{recipes.length}</div>
              <div className="kpi-label">Recetas</div>
            </div>
            <div className="glass-panel kpi-card" style={{ marginBottom: 0 }}>
              <div className="kpi-value" style={{ color: 'var(--danger)' }}>{supplies.filter(s => Number(s.stock) <= Number(s.minStock || 5)).length}</div>
              <div className="kpi-label">Stock Bajo</div>
            </div>
          </div>

          {/* Module Cards */}
          <div className="home-grid">
            {MODULES.map(m => (
              <div key={m.id} className="home-card" onClick={() => setView(m.id)}>
                <div className="home-card-icon">{m.icon}</div>
                <div className="home-card-title">{m.title}</div>
                <div className="home-card-desc">{m.desc}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── MODULE VIEWS ── */}
      {view !== 'home' && (
        <div className="animate-fade-in">
          <div className="top-bar">
            <button className="back-btn" onClick={goHome}>
              <ArrowLeft size={18} /> Inicio
            </button>
            <h2>{MODULES.find(m => m.id === view)?.title || ''}</h2>
            <div style={{ width: 70 }} />
          </div>

          {view === 'pedidos' && (
            <PedidosModule
              orders={orders} setOrders={setOrders}
              recipes={recipes} supplies={supplies} setSupplies={setSupplies}
              sales={sales} setSales={setSales}
            />
          )}
          {view === 'insumos' && (
            <InsumosModule supplies={supplies} setSupplies={setSupplies} />
          )}
          {view === 'recetas' && (
            <RecetasModule recipes={recipes} setRecipes={setRecipes} supplies={supplies} />
          )}
          {view === 'ventas' && (
            <VentasModule sales={sales} orders={orders} />
          )}
        </div>
      )}

      {/* ── Bottom Nav (mobile) ── */}
      <nav className="bottom-nav">
        <div className="bottom-nav-inner">
          <button className={`bottom-nav-btn ${view === 'home' ? 'active' : ''}`} onClick={goHome}>
            <ShoppingBag size={20} /> Inicio
          </button>
          {MODULES.map(m => (
            <button key={m.id} className={`bottom-nav-btn ${view === m.id ? 'active' : ''}`} onClick={() => setView(m.id)}>
              <m.lucide size={20} /> {m.title}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
