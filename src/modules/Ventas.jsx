import React, { useState } from 'react';
import { Download, Calendar, DollarSign, TrendingUp, Search } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function VentasModule({ sales, orders }) {
  const [filterType, setFilterType] = useState('all');
  const [filterDate, setFilterDate] = useState('');
  const [search, setSearch] = useState('');

  // ── Date filter ──
  const matchDate = (dateStr) => {
    if (!filterDate || filterType === 'all') return true;
    const d = dateStr?.slice(0, 10) || '';
    if (filterType === 'day') return d === filterDate;
    if (filterType === 'month') return d.slice(0, 7) === filterDate.slice(0, 7);
    if (filterType === 'year') return d.slice(0, 4) === filterDate.slice(0, 4);
    return true;
  };

  const filtered = sales
    .filter(s => matchDate(s.date))
    .filter(s => !search || s.customer.toLowerCase().includes(search.toLowerCase()) || (s.recipeName || '').toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const totalRevenue = filtered.reduce((s, v) => s + Number(v.total || 0), 0);
  const totalAdvances = filtered.reduce((s, v) => s + Number(v.advance || 0), 0);
  const avgTicket = filtered.length > 0 ? totalRevenue / filtered.length : 0;

  // ── By product ──
  const byProduct = filtered.reduce((acc, s) => {
    const key = s.recipeName || 'Personalizado';
    if (!acc[key]) acc[key] = { count: 0, total: 0 };
    acc[key].count++;
    acc[key].total += Number(s.total || 0);
    return acc;
  }, {});

  // ── By payment method ──
  const byMethod = filtered.reduce((acc, s) => {
    const m = s.paymentMethod || 'No registrado';
    acc[m] = (acc[m] || 0) + Number(s.total || 0);
    return acc;
  }, {});

  // ── PDF ──
  const downloadPDF = () => {
    const doc = new jsPDF();
    const label = filterType === 'day' ? `Día: ${filterDate}` : filterType === 'month' ? `Mes: ${filterDate?.slice(0, 7)}` : filterType === 'year' ? `Año: ${filterDate?.slice(0, 4)}` : 'Todo el historial';

    // Header
    doc.setFillColor(139, 92, 246);
    doc.rect(0, 0, 210, 28, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('PASTELAPP — REPORTE DE VENTAS', 14, 12);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Período: ${label}`, 14, 21);
    doc.text(`Generado: ${new Date().toLocaleString('es-MX')}`, 196, 21, { align: 'right' });

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`Total ventas: ${filtered.length}  |  Ingresos: $${totalRevenue.toFixed(2)}  |  Ticket promedio: $${avgTicket.toFixed(2)}`, 14, 36);

    const rows = filtered.map(s => [
      new Date(s.date).toLocaleDateString('es-MX'),
      s.customer,
      s.recipeName || 'Personalizado',
      `$${Number(s.total).toFixed(2)}`,
      `$${Number(s.advance || 0).toFixed(2)}`,
      s.paymentMethod || '—'
    ]);

    autoTable(doc, {
      startY: 42,
      head: [['Fecha', 'Cliente', 'Producto', 'Total', 'Anticipo', 'Método']],
      body: rows,
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [139, 92, 246], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 240, 255] },
    });

    doc.save(`ventas_${filterDate || 'total'}.pdf`);
  };

  return (
    <div>
      {/* Filter toolbar */}
      <div className="glass-panel" style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-muted)' }}>Período:</span>
          {[['all', 'Todo'], ['day', 'Día'], ['month', 'Mes'], ['year', 'Año']].map(([k, label]) => (
            <button key={k} className={`btn btn-sm ${filterType === k ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => { setFilterType(k); if (k === 'all') setFilterDate(''); }}>
              {label}
            </button>
          ))}
          {filterType !== 'all' && (
            <input
              type={filterType === 'year' ? 'number' : filterType === 'month' ? 'month' : 'date'}
              value={filterDate}
              onChange={e => setFilterDate(e.target.value)}
              min={filterType === 'year' ? '2020' : undefined}
              max={filterType === 'year' ? '2099' : undefined}
              style={{ maxWidth: '180px' }}
            />
          )}
          <button className="btn btn-sm btn-accent" onClick={downloadPDF} style={{ marginLeft: 'auto' }}>
            <Download size={14} /> PDF
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="kpi-grid">
        <div className="glass-panel kpi-card" style={{ marginBottom: 0 }}>
          <div className="kpi-value" style={{ color: 'var(--success)' }}>${totalRevenue.toFixed(2)}</div>
          <div className="kpi-label">Ingresos Totales</div>
        </div>
        <div className="glass-panel kpi-card" style={{ marginBottom: 0 }}>
          <div className="kpi-value" style={{ color: 'var(--primary)' }}>{filtered.length}</div>
          <div className="kpi-label">Ventas</div>
        </div>
        <div className="glass-panel kpi-card" style={{ marginBottom: 0 }}>
          <div className="kpi-value" style={{ color: 'var(--accent)' }}>${avgTicket.toFixed(2)}</div>
          <div className="kpi-label">Ticket Promedio</div>
        </div>
        <div className="glass-panel kpi-card" style={{ marginBottom: 0 }}>
          <div className="kpi-value" style={{ color: 'var(--info)' }}>${totalAdvances.toFixed(2)}</div>
          <div className="kpi-label">En Anticipos</div>
        </div>
      </div>

      {/* Breakdown panels */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
        {/* By product */}
        <div className="glass-panel" style={{ marginBottom: 0 }}>
          <h3 style={{ marginBottom: '0.75rem', fontSize: '0.95rem' }}>Ventas por Producto</h3>
          {Object.entries(byProduct).length === 0 ? (
            <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>Sin datos</p>
          ) : (
            Object.entries(byProduct).sort((a, b) => b[1].total - a[1].total).map(([name, data]) => (
              <div key={name} style={{ marginBottom: '0.6rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.2rem' }}>
                  <span>{name}</span>
                  <span><strong>{data.count}</strong> — <span style={{ color: 'var(--success)' }}>${data.total.toFixed(2)}</span></span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${(data.total / totalRevenue) * 100}%`, background: 'var(--primary)' }} />
                </div>
              </div>
            ))
          )}
        </div>

        {/* By payment */}
        <div className="glass-panel" style={{ marginBottom: 0 }}>
          <h3 style={{ marginBottom: '0.75rem', fontSize: '0.95rem' }}>Por Método de Pago</h3>
          {Object.entries(byMethod).length === 0 ? (
            <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>Sin datos</p>
          ) : (
            Object.entries(byMethod).sort((a, b) => b[1] - a[1]).map(([method, total]) => (
              <div key={method} style={{ marginBottom: '0.6rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.2rem' }}>
                  <span>{method}</span>
                  <strong style={{ color: 'var(--success)' }}>${total.toFixed(2)}</strong>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${totalRevenue > 0 ? (total / totalRevenue) * 100 : 0}%`, background: 'var(--accent)' }} />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Search */}
      <div className="search-wrap">
        <Search size={18} className="search-icon" />
        <input type="text" placeholder="Buscar venta por cliente o producto..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Sales table */}
      <div className="glass-panel" style={{ overflow: 'auto', padding: '0.5rem' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Cliente</th>
              <th>Producto</th>
              <th style={{ textAlign: 'right' }}>Total</th>
              <th style={{ textAlign: 'right' }}>Anticipo</th>
              <th>Método</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-dim)' }}>Sin ventas registradas</td></tr>
            ) : (
              filtered.map(s => (
                <tr key={s.id}>
                  <td>{new Date(s.date).toLocaleDateString('es-MX')}</td>
                  <td style={{ fontWeight: 600 }}>{s.customer}</td>
                  <td>{s.recipeName || 'Personalizado'}</td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--success)' }}>${Number(s.total).toFixed(2)}</td>
                  <td style={{ textAlign: 'right', color: 'var(--info)' }}>{Number(s.advance) > 0 ? `$${Number(s.advance).toFixed(2)}` : '—'}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{s.paymentMethod || '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
